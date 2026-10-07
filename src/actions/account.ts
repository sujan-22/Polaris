"use server";

import { APIError } from "better-auth/api";
import { refresh } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export interface FormState {
    ok?: boolean;
    message?: string;
    errors?: Record<string, string[] | undefined>;
}

function failure(error: unknown, fallback: string): FormState {
    if (error instanceof APIError) {
        const code = (error.body as { code?: string } | undefined)?.code;
        if (code === "INVALID_PASSWORD") return { errors: { currentPassword: ["That isn't your current password."] } };
        return { message: error.message || fallback };
    }
    throw error;
}

export async function updateName(_: FormState, form: FormData): Promise<FormState> {
    await requireUser("/account/profile");
    const parsed = z.object({ name: z.string().trim().min(2, "At least 2 characters.").max(60) }).safeParse({ name: form.get("name") });
    if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };
    try {
        await auth.api.updateUser({ body: { name: parsed.data.name }, headers: await headers() });
    } catch (error) {
        return failure(error, "Couldn't save your name.");
    }
    refresh();
    return { ok: true, message: "Saved." };
}

export async function changePassword(_: FormState, form: FormData): Promise<FormState> {
    await requireUser("/account/profile");
    const parsed = z
        .object({
            currentPassword: z.string().min(1, "Enter your current password."),
            newPassword: z.string().min(8, "Use at least 8 characters.").max(128),
        })
        .safeParse({ currentPassword: form.get("currentPassword"), newPassword: form.get("newPassword") });
    if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };
    try {
        const requestHeaders = await headers();
        // Better Auth's own revokeOtherSessions replaces the current session
        // too, and this request's re-render still carries the old cookie, so
        // the page would bounce through sign-in. Keep this session and sign
        // out only the others.
        await auth.api.changePassword({ body: { ...parsed.data, revokeOtherSessions: false }, headers: requestHeaders });
        await auth.api.revokeOtherSessions({ headers: requestHeaders });
    } catch (error) {
        return failure(error, "Couldn't change your password.");
    }
    return { ok: true, message: "Password changed. Other devices have been signed out." };
}

export async function deleteAccount(_: FormState, form: FormData): Promise<FormState> {
    const user = await requireUser("/account/profile");
    if (user.role === "admin") return { message: "Admin accounts can't be deleted from here." };
    const password = String(form.get("password") ?? "");
    if (!password) return { errors: { password: ["Enter your password to confirm."] } };
    try {
        await auth.api.deleteUser({ body: { password }, headers: await headers() });
    } catch (error) {
        return failure(error, "Couldn't delete your account.");
    }
    redirect("/");
}

const applicationSchema = z.object({
    storeName: z.string().trim().min(2, "At least 2 characters.").max(40, "Keep it under 40 characters."),
    pitch: z.string().trim().min(20, "Tell us a little more (20 characters or so).").max(600, "Keep it under 600 characters."),
});

export async function applyToSell(_: FormState, form: FormData): Promise<FormState> {
    const user = await requireUser("/account/selling");
    if (user.role !== "user") return { message: "You can already sell on Polaris." };

    const parsed = applicationSchema.safeParse({ storeName: form.get("storeName"), pitch: form.get("pitch") });
    if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

    const existing = await prisma.sellerRequest.findUnique({ where: { userId: user.id } });
    if (existing?.status === "pending") return { message: "Your application is already with us." };

    // A denied applicant can apply again; the request goes back in the queue.
    await prisma.sellerRequest.upsert({
        where: { userId: user.id },
        create: { userId: user.id, ...parsed.data },
        update: { ...parsed.data, status: "pending", note: null, reviewedAt: null },
    });
    refresh();
    return { ok: true, message: "Application sent. We'll review it shortly." };
}
