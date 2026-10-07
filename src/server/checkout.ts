import "server-only";

import { revalidateTag } from "next/cache";
import type Stripe from "stripe";

import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { CATALOG } from "@/server/catalog";

/*
 * Turns a completed Stripe Checkout Session into a paid order. It runs from
 * two places, the webhook and the confirmation page, whichever arrives
 * first, so it has to be idempotent: the status flip from pending to paid is
 * a conditional update, and only the call that wins it touches stock.
 *
 * The old version emptied the cart before the customer had paid, never
 * reduced stock, and relied on the webhook alone.
 */
export async function completeCheckout(sessionId: string): Promise<"paid" | "unpaid" | "unknown"> {
    const session = await stripe().checkout.sessions.retrieve(sessionId);
    const orderId = session.metadata?.orderId ?? session.client_reference_id;
    if (!orderId) return "unknown";

    if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
        return "unpaid";
    }

    const shipping = session.collected_information?.shipping_details;
    const address = shipping?.address;

    const won = await prisma.$transaction(async (tx) => {
        const flipped = await tx.order.updateMany({
            where: { id: orderId, stripeSessionId: sessionId, status: "pending" },
            data: {
                status: "paid",
                paidAt: new Date(),
                stripePaymentIntentId: paymentIntentId(session),
                email: session.customer_details?.email ?? undefined,
                shippingAddress: address
                    ? {
                          name: shipping?.name ?? session.customer_details?.name ?? "",
                          line1: address.line1 ?? "",
                          line2: address.line2 ?? "",
                          city: address.city ?? "",
                          state: address.state ?? "",
                          postalCode: address.postal_code ?? "",
                          country: address.country ?? "",
                          phone: session.customer_details?.phone ?? "",
                      }
                    : undefined,
            },
        });
        if (flipped.count === 0) return false;

        const order = await tx.order.findUniqueOrThrow({
            where: { id: orderId },
            include: { items: { select: { variantId: true, quantity: true } } },
        });

        for (const item of order.items) {
            if (!item.variantId) continue;
            // Never go below zero; the bag already checked stock at checkout.
            const taken = await tx.variant.updateMany({
                where: { id: item.variantId, stock: { gte: item.quantity } },
                data: { stock: { decrement: item.quantity } },
            });
            if (taken.count === 0) {
                await tx.variant.updateMany({ where: { id: item.variantId }, data: { stock: 0 } });
            }
        }

        // Clear what was bought from the bag, leaving anything added since.
        await tx.cartItem.deleteMany({
            where: {
                cart: { userId: order.userId },
                variantId: { in: order.items.flatMap((i) => (i.variantId ? [i.variantId] : [])) },
            },
        });
        return true;
    });

    if (won) revalidateTag(CATALOG, "max");
    return "paid";
}

/** Marks an abandoned checkout as cancelled so it drops out of the queue. */
export async function expireCheckout(sessionId: string): Promise<void> {
    await prisma.order.updateMany({
        where: { stripeSessionId: sessionId, status: "pending" },
        data: { status: "cancelled" },
    });
}

function paymentIntentId(session: Stripe.Checkout.Session): string | null {
    const intent = session.payment_intent;
    if (!intent) return null;
    return typeof intent === "string" ? intent : intent.id;
}
