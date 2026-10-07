"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { currentCartId, ensureCartId } from "@/server/cart";

export interface CartResult {
    ok: boolean;
    message?: string;
}

const addSchema = z.object({
    variantId: z.string().min(1),
    quantity: z.number().int().min(1).max(20).default(1),
});

export async function addToCart(input: { variantId: string; quantity?: number }): Promise<CartResult> {
    const parsed = addSchema.safeParse(input);
    if (!parsed.success) return { ok: false, message: "Choose a size and colour first." };
    const { variantId, quantity } = parsed.data;

    const variant = await prisma.variant.findUnique({
        where: { id: variantId },
        select: { stock: true, product: { select: { status: true, seller: { select: { banned: true } } } } },
    });
    if (!variant || variant.product.status !== "active" || variant.product.seller.banned) {
        return { ok: false, message: "That item is no longer available." };
    }
    if (variant.stock <= 0) return { ok: false, message: "That size just sold out." };

    const cartId = await ensureCartId();
    const existing = await prisma.cartItem.findUnique({
        where: { cartId_variantId: { cartId, variantId } },
        select: { quantity: true },
    });
    const wanted = (existing?.quantity ?? 0) + quantity;
    const next = Math.min(wanted, variant.stock);

    await prisma.cartItem.upsert({
        where: { cartId_variantId: { cartId, variantId } },
        create: { cartId, variantId, quantity: next },
        update: { quantity: next },
    });

    refresh();
    if (next < wanted) {
        return { ok: true, message: `Only ${variant.stock} left, so that's how many are in your bag.` };
    }
    return { ok: true };
}

/* Only ever touches an item in the caller's own cart. */
async function ownItem(itemId: string) {
    const cartId = await currentCartId();
    if (!cartId) return null;
    return prisma.cartItem.findFirst({
        where: { id: itemId, cartId },
        select: { id: true, variant: { select: { stock: true } } },
    });
}

export async function setQuantity(itemId: string, quantity: number): Promise<CartResult> {
    const item = await ownItem(itemId);
    if (!item) return { ok: false, message: "That item isn't in your bag any more." };

    if (!Number.isInteger(quantity) || quantity <= 0) {
        await prisma.cartItem.delete({ where: { id: item.id } });
    } else {
        const capped = Math.min(quantity, item.variant.stock, 20);
        if (capped <= 0) await prisma.cartItem.delete({ where: { id: item.id } });
        else await prisma.cartItem.update({ where: { id: item.id }, data: { quantity: capped } });
        if (capped < quantity) {
            refresh();
            return { ok: true, message: `Only ${item.variant.stock} available.` };
        }
    }
    refresh();
    return { ok: true };
}

export async function removeFromCart(itemId: string): Promise<CartResult> {
    return setQuantity(itemId, 0);
}
