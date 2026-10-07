import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { completeCheckout } from "@/server/checkout";

/*
 * Stripe's success_url. Completing the order here rather than in the order
 * page matters: invalidating the catalogue cache (stock just changed) is only
 * allowed from route handlers and actions, never during a render. It's safe
 * to call with any session id: Stripe is the source of truth for payment and
 * completeCheckout is idempotent. The order page itself checks ownership.
 */
export async function GET(request: NextRequest) {
    const sessionId = request.nextUrl.searchParams.get("session_id");
    if (!sessionId?.startsWith("cs_")) redirect("/account/orders");

    try {
        await completeCheckout(sessionId);
    } catch (error) {
        // The webhook will finish the job; the order page shows its state.
        console.error("Could not complete checkout on return", error);
    }

    const order = await prisma.order.findUnique({ where: { stripeSessionId: sessionId }, select: { id: true } });
    redirect(order ? `/account/orders/${order.id}?placed=1` : "/account/orders");
}
