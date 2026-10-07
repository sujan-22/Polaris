import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";

import { prisma } from "@/lib/prisma";

/*
 * Preview deployments get their own hostname, so trust it alongside the
 * production URL or sign-in fails on every preview.
 */
const trustedOrigins = [
    process.env.BETTER_AUTH_URL,
    process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`,
    process.env.VERCEL_BRANCH_URL && `https://${process.env.VERCEL_BRANCH_URL}`,
    process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`,
].filter((origin): origin is string => Boolean(origin));

export const auth = betterAuth({
    database: prismaAdapter(prisma, { provider: "postgresql" }),
    trustedOrigins,
    emailAndPassword: {
        enabled: true,
        minPasswordLength: 8,
        autoSignIn: true,
    },
    session: {
        expiresIn: 60 * 60 * 24 * 30,
        updateAge: 60 * 60 * 24,
        // Saves a database round trip on most page loads. Anything that
        // gates on role reads the session fresh instead (see session.ts).
        cookieCache: { enabled: true, maxAge: 5 * 60 },
    },
    user: {
        additionalFields: {
            // Set by an admin when a seller request is approved, never by the user.
            storeName: { type: "string", required: false, input: false },
        },
        deleteUser: { enabled: true },
    },
    rateLimit: {
        enabled: true,
        storage: "database",
        modelName: "rateLimit",
        customRules: {
            "/sign-in/email": { window: 60, max: 5 },
            "/sign-up/email": { window: 60, max: 3 },
        },
    },
    advanced: {
        database: { generateId: () => crypto.randomUUID() },
    },
    plugins: [admin({ defaultRole: "user", adminRoles: ["admin"] }), nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
