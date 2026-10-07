import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

/*
 * An optimistic check only: no session cookie means no point rendering a
 * protected page. Real authorisation happens in the data access layer
 * (src/lib/session.ts), which every protected page and action calls.
 */
export function proxy(request: NextRequest) {
    if (!getSessionCookie(request)) {
        const url = new URL("/sign-in", request.url);
        url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
        return NextResponse.redirect(url);
    }
    return NextResponse.next();
}

export const config = {
    matcher: ["/account/:path*", "/studio/:path*", "/checkout/:path*"],
};
