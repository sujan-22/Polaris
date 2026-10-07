import type Stripe from "stripe";

import { stripe } from "@/lib/stripe";
import { completeCheckout, expireCheckout } from "@/server/checkout";

/*
 * Stripe webhook. The path stays /api/webhooks because that's where the
 * endpoint registered in the Stripe dashboard already points. The
 * confirmation page completes orders too, so a missed or delayed event
 * never leaves a paid order stuck as pending.
 */
export async function POST(request: Request) {
    const signature = request.headers.get("stripe-signature");
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!signature || !secret) {
        return new Response("Webhook is not configured", { status: 400 });
    }

    let event: Stripe.Event;
    try {
        event = stripe().webhooks.constructEvent(await request.text(), signature, secret);
    } catch {
        return new Response("Invalid signature", { status: 400 });
    }

    try {
        switch (event.type) {
            case "checkout.session.completed":
            case "checkout.session.async_payment_succeeded":
                await completeCheckout(event.data.object.id);
                break;
            case "checkout.session.expired":
            case "checkout.session.async_payment_failed":
                await expireCheckout(event.data.object.id);
                break;
        }
    } catch (error) {
        console.error(`Webhook ${event.type} failed`, error);
        // A 500 makes Stripe retry, which is safe because both handlers are idempotent.
        return new Response("Handler failed", { status: 500 });
    }

    return Response.json({ received: true });
}
