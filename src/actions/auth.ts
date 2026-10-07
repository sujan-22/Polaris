"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { adoptGuestCart } from "@/server/cart";

export interface AuthState {
    message?: string;
    errors?: Partial<Record<"name" | "email" | "password", string[]>>;
    values?: { name?: string; email?: string };
}

/* Only same-site paths: never let ?next= send someone to another origin. */
function safeNext(value: FormDataEntryValue | null, fallback = "/"): string {
    const next = typeof value === "string" ? value : "";
    return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : fallback;
}

const email = z.email("Enter a valid email address.").trim().toLowerCase();

const signInSchema = z.object({
    email,
    password: z.string().min(1, "Enter your password."),
});

const signUpSchema = z.object({
    name: z.string().trim().min(2, "Tell us what to call you.").max(60),
    email,
    password: z.string().min(8, "Use at least 8 characters.").max(128),
});

function authMessage(error: unknown): string {
    if (error instanceof APIError) {
        const code = (error.body as { code?: string } | undefined)?.code;
        if (code === "INVALID_EMAIL_OR_PASSWORD") return "That email and password don't match an account.";
        if (code === "USER_ALREADY_EXISTS" || code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
            return "There's already an account with that email. Try signing in.";
        }
        if (code === "BANNED_USER") return "This account has been suspended.";
        if (error.status === "TOO_MANY_REQUESTS") return "Too many attempts. Wait a minute and try again.";
        return error.message || "Something went wrong. Please try again.";
    }
    throw error;
}

export async function signIn(_: AuthState, form: FormData): Promise<AuthState> {
    const values = { email: String(form.get("email") ?? "") };
    const parsed = signInSchema.safeParse({ email: form.get("email"), password: form.get("password") });
    if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, values };

    try {
        const result = await auth.api.signInEmail({ body: parsed.data, headers: await headers() });
        await adoptGuestCart(result.user.id);
    } catch (error) {
        return { message: authMessage(error), values };
    }
    redirect(safeNext(form.get("next")));
}

export async function signUp(_: AuthState, form: FormData): Promise<AuthState> {
    const values = { name: String(form.get("name") ?? ""), email: String(form.get("email") ?? "") };
    const parsed = signUpSchema.safeParse({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
    });
    if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, values };

    try {
        const result = await auth.api.signUpEmail({ body: parsed.data, headers: await headers() });
        await adoptGuestCart(result.user.id);
    } catch (error) {
        return { message: authMessage(error), values };
    }
    redirect(safeNext(form.get("next")));
}

export async function signOut(): Promise<void> {
    await auth.api.signOut({ headers: await headers() });
    redirect("/");
}
