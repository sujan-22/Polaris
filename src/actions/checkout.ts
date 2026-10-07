"use server";

import { redirect } from "next/navigation";

import { CURRENCY } from "@/lib/money";
import { computeTotals, TAX_RATE } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { stripe } from "@/lib/stripe";
import { orderNumber } from "@/lib/utils";
import { getCart } from "@/server/cart";
import { requestOrigin } from "@/server/request";

export interface CheckoutResult {
    message?: string;
}

/*
 * Creates a pending order from the bag and hands off to Stripe Checkout.
 * Every price comes from the database; nothing from the browser is trusted
 * except the decision to check out. The bag is emptied only once Stripe
 * confirms payment (see server/checkout.ts).
 */
export async function checkout(): Promise<CheckoutResult> {
    const user = await requireUser("/cart");
    const cart = await getCart();

    if (cart.lines.length === 0) return { message: "Your bag is empty." };
    const unavailable = cart.lines.find((line) => !line.available);
    if (unavailable) {
        return {
            message: unavailable.withdrawn
                ? `${unavailable.name} is no longer available. Remove it to continue.`
                : unavailable.stock > 0
                    ? `Only ${unavailable.stock} of ${unavailable.name} (${unavailable.color}, ${unavailable.size}) left. Update your bag to continue.`
                    : `${unavailable.name} (${unavailable.color}, ${unavailable.size}) sold out. Remove it to continue.`,
        };
    }

    const totals = computeTotals(cart.lines);
    const origin = await requestOrigin();
    const absolute = (url: string | null) => (url ? (url.startsWith("http") ? url : origin + url) : undefined);

    const order = await prisma.order.create({
        data: {
            number: orderNumber(),
            userId: user.id,
            email: user.email,
            ...totals,
            items: {
                create: cart.lines.map((line) => ({
                    productId: line.productId,
                    variantId: line.variantId,
                    sellerId: line.sellerId,
                    name: line.name,
                    slug: line.slug,
                    image: line.image,
                    color: line.color,
                    size: line.size,
                    unitPriceCents: line.unitPriceCents,
                    quantity: line.quantity,
                })),
            },
        },
    });

    let url: string | null;
    try {
        const session = await stripe().checkout.sessions.create({
            mode: "payment",
            customer_email: user.email,
            client_reference_id: order.id,
            metadata: { orderId: order.id, orderNumber: order.number },
            payment_intent_data: { metadata: { orderId: order.id }, description: `Polaris order ${order.number}` },
            success_url: `${origin}/api/checkout/complete?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/cart`,
            // Stripe's minimum. Long enough to find a card, short enough that
            // abandoned orders clear out of the queue the same afternoon.
            expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
            shipping_address_collection: { allowed_countries: ["CA"] },
            phone_number_collection: { enabled: true },
            shipping_options: [
                {
                    shipping_rate_data: {
                        type: "fixed_amount",
                        display_name: totals.shippingCents === 0 ? "Free standard shipping" : "Standard shipping",
                        fixed_amount: { amount: totals.shippingCents, currency: CURRENCY },
                        delivery_estimate: {
                            minimum: { unit: "business_day", value: 3 },
                            maximum: { unit: "business_day", value: 7 },
                        },
                    },
                },
            ],
            line_items: [
                ...cart.lines.map((line) => ({
                    quantity: line.quantity,
                    price_data: {
                        currency: CURRENCY,
                        unit_amount: line.unitPriceCents,
                        product_data: {
                            name: line.name,
                            description: `${line.color} · ${line.size} · sold by ${line.seller}`,
                            images: [absolute(line.image)].filter((u): u is string => Boolean(u)),
                        },
                    },
                })),
                // Tax as its own line keeps Stripe's total identical to ours.
                {
                    quantity: 1,
                    price_data: {
                        currency: CURRENCY,
                        unit_amount: totals.taxCents,
                        product_data: { name: `HST (${Math.round(TAX_RATE * 100)}%)` },
                    },
                },
            ],
        });
        url = session.url;
        await prisma.order.update({ where: { id: order.id }, data: { stripeSessionId: session.id } });
    } catch (error) {
        console.error("Could not start Stripe Checkout", error);
        await prisma.order.update({ where: { id: order.id }, data: { status: "cancelled" } });
        return { message: "We couldn't reach the payment page. Please try again in a moment." };
    }

    if (!url) return { message: "We couldn't reach the payment page. Please try again in a moment." };
    redirect(url);
}
