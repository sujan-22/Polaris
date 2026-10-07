import "server-only";

import { headers } from "next/headers";

import { site } from "@/lib/site";

/*
 * The origin of the current request, for links that leave the site (Stripe
 * redirects, product images on the Stripe page). The old store read this
 * from NEXT_PUBLIC_APP_URL, which was set to localhost in production, so
 * every customer who paid was sent back to localhost.
 */
export async function requestOrigin(): Promise<string> {
    const list = await headers();
    const origin = list.get("origin");
    if (origin) return origin;
    const host = list.get("x-forwarded-host") ?? list.get("host");
    const proto = list.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
    return host ? `${proto}://${host}` : site.url;
}
