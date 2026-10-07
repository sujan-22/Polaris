import "server-only";

import { headers } from "next/headers";
import { forbidden, redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";

import { auth } from "@/lib/auth";

/*
 * The data access layer for "who is this?". Every page, action and route
 * that needs a user goes through these helpers. The old app checked roles
 * only in middleware, so its server actions (delete a user, approve a
 * seller) were callable by anyone.
 */

export type Role = "user" | "seller" | "admin";

export interface CurrentUser {
    id: string;
    name: string;
    email: string;
    role: Role;
    storeName: string | null;
}

function toCurrentUser(user: Session["user"]): CurrentUser {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: (user.role as Role | undefined) ?? "user",
        storeName: (user.storeName as string | null | undefined) ?? null,
    };
}

type Session = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

/** The signed-in user, or null. Uses the short-lived cookie cache. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
    // A session check is always about this request (and Better Auth reads the
    // clock), so tell Next it can't be part of any prerender.
    await connection();
    const session = await auth.api.getSession({ headers: await headers() });
    return session ? toCurrentUser(session.user) : null;
});

/*
 * Reads the session straight from the database. Used wherever a role
 * decides access, so an approval, a demotion or a ban applies on the very
 * next request rather than when the cookie cache expires. The sign-in pages
 * use it too: a revoked session can outlive its cookie cache by minutes, and
 * trusting the cache there bounced people between sign-in and /account.
 */
export const getFreshUser = cache(async (): Promise<CurrentUser | null> => {
    await connection();
    const session = await auth.api.getSession({
        headers: await headers(),
        query: { disableCookieCache: true },
    });
    if (!session || session.user.banned) return null;
    return toCurrentUser(session.user);
});

export async function requireUser(next = "/account"): Promise<CurrentUser> {
    const user = await getFreshUser();
    if (!user) redirect(`/sign-in?next=${encodeURIComponent(next)}`);
    return user;
}

/** Sellers manage their own products and orders; admins can see everything. */
export async function requireSeller(): Promise<CurrentUser> {
    const user = await requireUser("/studio");
    if (user.role !== "seller" && user.role !== "admin") forbidden();
    return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
    const user = await requireUser("/studio");
    if (user.role !== "admin") forbidden();
    return user;
}

export function isStaff(user: Pick<CurrentUser, "role"> | null | undefined): boolean {
    return user?.role === "seller" || user?.role === "admin";
}
