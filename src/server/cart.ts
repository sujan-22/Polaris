import "server-only";

import { cookies } from "next/headers";

import type { Prisma } from "@/generated/prisma/client";
import { computeTotals, type Totals } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

/*
 * The bag lives in the database for everyone. Signed-in shoppers are found
 * by user id; guests by a random token in an httpOnly cookie. The old store
 * kept guest carts in localStorage and signed-in carts on the server, then
 * let the browser tell the server whose cart to edit.
 */

const CART_COOKIE = "polaris_cart";
const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 60;

const lineInclude = {
    variant: {
        include: {
            product: {
                include: {
                    images: { orderBy: { position: "asc" }, select: { url: true, color: true } },
                    seller: { select: { storeName: true, name: true, banned: true } },
                },
            },
        },
    },
} satisfies Prisma.CartItemInclude;

type LineRow = Prisma.CartItemGetPayload<{ include: typeof lineInclude }>;

export interface CartLine {
    id: string;
    variantId: string;
    quantity: number;
    color: string;
    size: string;
    stock: number;
    productId: string;
    slug: string;
    name: string;
    image: string | null;
    seller: string;
    sellerId: string;
    unitPriceCents: number;
    compareAtCents: number | null;
    lineTotalCents: number;
    /** The product was unpublished, or its seller suspended. */
    withdrawn: boolean;
    /** False when withdrawn or there isn't enough stock. */
    available: boolean;
}

export interface CartView {
    id: string | null;
    lines: CartLine[];
    count: number;
    totals: Totals;
}

export const EMPTY_CART: CartView = {
    id: null,
    lines: [],
    count: 0,
    totals: computeTotals([]),
};

function toLine(row: LineRow): CartLine {
    const { product } = row.variant;
    const image = product.images.find((i) => i.color === row.variant.color) ?? product.images[0];
    return {
        id: row.id,
        variantId: row.variantId,
        quantity: row.quantity,
        color: row.variant.color,
        size: row.variant.size,
        stock: row.variant.stock,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: image?.url ?? null,
        seller: product.seller.storeName ?? product.seller.name,
        sellerId: product.sellerId,
        unitPriceCents: product.priceCents,
        compareAtCents: product.compareAtCents,
        lineTotalCents: product.priceCents * row.quantity,
        withdrawn: product.status !== "active" || product.seller.banned,
        available: product.status === "active" && !product.seller.banned && row.variant.stock >= row.quantity,
    };
}

async function cartWhere(): Promise<Prisma.CartWhereUniqueInput | null> {
    const user = await getCurrentUser();
    if (user) return { userId: user.id };
    const token = (await cookies()).get(CART_COOKIE)?.value;
    return token ? { token } : null;
}

export async function getCart(): Promise<CartView> {
    const where = await cartWhere();
    if (!where) return EMPTY_CART;
    const cart = await prisma.cart.findUnique({
        where,
        include: { items: { include: lineInclude, orderBy: { createdAt: "asc" } } },
    });
    if (!cart) return EMPTY_CART;
    const lines = cart.items.map(toLine);
    return {
        id: cart.id,
        lines,
        count: lines.reduce((sum, line) => sum + line.quantity, 0),
        totals: computeTotals(lines.filter((l) => l.available)),
    };
}

/** The current cart's id, creating the cart (and guest cookie) if needed. */
export async function ensureCartId(): Promise<string> {
    const user = await getCurrentUser();
    if (user) {
        const cart = await prisma.cart.upsert({
            where: { userId: user.id },
            create: { userId: user.id },
            update: {},
            select: { id: true },
        });
        return cart.id;
    }

    const jar = await cookies();
    const token = jar.get(CART_COOKIE)?.value;
    if (token) {
        const cart = await prisma.cart.findUnique({ where: { token }, select: { id: true } });
        if (cart) return cart.id;
    }
    const fresh = crypto.randomUUID();
    const cart = await prisma.cart.create({ data: { token: fresh }, select: { id: true } });
    jar.set(CART_COOKIE, fresh, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: CART_COOKIE_MAX_AGE,
        path: "/",
    });
    return cart.id;
}

/** The id of the current cart if there is one; never creates anything. */
export async function currentCartId(): Promise<string | null> {
    const where = await cartWhere();
    if (!where) return null;
    const cart = await prisma.cart.findUnique({ where, select: { id: true } });
    return cart?.id ?? null;
}

/*
 * Called right after sign-in or sign-up: moves anything the shopper added
 * as a guest into their account's bag, capping quantities at stock.
 */
export async function adoptGuestCart(userId: string): Promise<void> {
    const jar = await cookies();
    const token = jar.get(CART_COOKIE)?.value;
    if (!token) return;
    jar.delete(CART_COOKIE);

    const guest = await prisma.cart.findUnique({
        where: { token },
        include: { items: { include: { variant: { select: { stock: true } } } } },
    });
    if (!guest) return;

    await prisma.$transaction(async (tx) => {
        const cart = await tx.cart.upsert({
            where: { userId },
            create: { userId },
            update: {},
            include: { items: true },
        });
        for (const item of guest.items) {
            const existing = cart.items.find((i) => i.variantId === item.variantId);
            const quantity = Math.min(item.variant.stock, (existing?.quantity ?? 0) + item.quantity);
            if (quantity <= 0) continue;
            await tx.cartItem.upsert({
                where: { cartId_variantId: { cartId: cart.id, variantId: item.variantId } },
                create: { cartId: cart.id, variantId: item.variantId, quantity },
                update: { quantity },
            });
        }
        await tx.cart.delete({ where: { id: guest.id } });
    });
}
