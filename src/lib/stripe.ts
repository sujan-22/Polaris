import "server-only";

import Stripe from "stripe";

let client: Stripe | undefined;

/*
 * Created on first use rather than at import, so pages that never touch
 * payments still build and render when STRIPE_SECRET_KEY is missing.
 * The API version is the one this SDK release pins.
 */
export function stripe(): Stripe {
    if (!client) {
        const key = process.env.STRIPE_SECRET_KEY;
        if (!key) throw new Error("STRIPE_SECRET_KEY is not set. See .env.example.");
        client = new Stripe(key, { appInfo: { name: "Polaris" } });
    }
    return client;
}

export function isTestMode(): boolean {
    return !process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_");
}
