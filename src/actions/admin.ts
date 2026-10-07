"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { CATALOG } from "@/server/catalog";

export interface AdminResult {
    ok: boolean;
    message?: string;
}

const reviewSchema = z.object({
    requestId: z.string(),
    decision: z.enum(["approved", "denied"]),
    note: z.string().trim().max(300).optional(),
});

/** Approving a request makes the applicant a seller under their chosen shop name. */
export async function reviewSellerRequest(input: z.input<typeof reviewSchema>): Promise<AdminResult> {
    await requireAdmin();
    const parsed = reviewSchema.safeParse(input);
    if (!parsed.success) return { ok: false, message: "Invalid review." };
    const { requestId, decision, note } = parsed.data;

    const request = await prisma.sellerRequest.findUnique({ where: { id: requestId }, include: { user: { select: { role: true } } } });
    if (!request) return { ok: false, message: "That application no longer exists." };

    await prisma.$transaction([
        prisma.sellerRequest.update({
            where: { id: requestId },
            data: { status: decision, note: decision === "denied" ? note || null : null, reviewedAt: new Date() },
        }),
        ...(decision === "approved" && request.user.role === "user"
            ? [prisma.user.update({ where: { id: request.userId }, data: { role: "seller", storeName: request.storeName } })]
            : []),
    ]);
    refresh();
    return { ok: true, message: decision === "approved" ? `${request.storeName} can start selling.` : "Application declined." };
}

const roleSchema = z.object({ userId: z.string(), role: z.enum(["user", "seller"]) });

/*
 * Promote a customer to seller or take selling away. Admin rights are only
 * ever granted from the command line (npm run make-admin), never from the UI.
 */
export async function setRole(input: z.input<typeof roleSchema>): Promise<AdminResult> {
    const admin = await requireAdmin();
    const parsed = roleSchema.safeParse(input);
    if (!parsed.success) return { ok: false, message: "Invalid role." };
    const { userId, role } = parsed.data;
    if (userId === admin.id) return { ok: false, message: "You can't change your own role." };

    const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, name: true } });
    if (!target || target.role === "admin") return { ok: false, message: "That account can't be changed here." };

    await prisma.user.update({
        where: { id: userId },
        data: { role, storeName: role === "seller" ? undefined : null },
    });
    if (role === "user") {
        // A former seller's products come off the shelves but stay in their records.
        await prisma.product.updateMany({ where: { sellerId: userId, status: "active" }, data: { status: "archived" } });
        updateTag(CATALOG);
    }
    refresh();
    return { ok: true, message: role === "seller" ? `${target.name} can now sell.` : `${target.name} is a customer again.` };
}

const banSchema = z.object({ userId: z.string(), banned: z.boolean(), reason: z.string().trim().max(200).optional() });

export async function setBanned(input: z.input<typeof banSchema>): Promise<AdminResult> {
    const admin = await requireAdmin();
    const parsed = banSchema.safeParse(input);
    if (!parsed.success) return { ok: false, message: "Invalid request." };
    const { userId, banned, reason } = parsed.data;
    if (userId === admin.id) return { ok: false, message: "You can't suspend yourself." };

    const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, name: true } });
    if (!target || target.role === "admin") return { ok: false, message: "That account can't be suspended." };

    await prisma.$transaction([
        prisma.user.update({ where: { id: userId }, data: { banned, banReason: banned ? reason || "Suspended by an admin" : null } }),
        // Signing them out everywhere makes the suspension immediate.
        ...(banned ? [prisma.session.deleteMany({ where: { userId } })] : []),
    ]);
    // A suspended seller's products leave the shelves (see LIVE in server/catalog.ts).
    if (target.role === "seller") updateTag(CATALOG);
    refresh();
    return { ok: true, message: banned ? `${target.name} is suspended.` : `${target.name} is reinstated.` };
}
