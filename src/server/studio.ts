import "server-only";

import type { Fulfillment, Prisma, ProductStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { CurrentUser } from "@/lib/session";

/*
 * Reads for the studio. Sellers see only their own products and order lines;
 * admins see the whole store. Nothing here is cached: it's per-user and the
 * numbers should be live.
 */

const DAY = 24 * 60 * 60 * 1000;

function scope(user: CurrentUser): { sellerId?: string } {
    return user.role === "admin" ? {} : { sellerId: user.id };
}

export interface Overview {
    window: { revenueCents: number; orders: number; units: number; averageCents: number };
    previous: { revenueCents: number; orders: number; units: number; averageCents: number };
    daily: { date: string; revenueCents: number; orders: number }[];
    toShip: number;
    lowStock: { productId: string; name: string; color: string; size: string; stock: number }[];
    topProducts: { productId: string | null; name: string; slug: string; image: string | null; units: number; revenueCents: number }[];
    pendingRequests: number;
}

export async function getOverview(user: CurrentUser, days = 30): Promise<Overview> {
    const now = Date.now();
    const chartStart = new Date(now - 89 * DAY);
    chartStart.setHours(0, 0, 0, 0);
    const windowStart = now - days * DAY;
    const previousStart = now - 2 * days * DAY;
    const since = new Date(Math.min(previousStart, chartStart.getTime()));

    const [items, toShip, lowStock, pendingRequests] = await Promise.all([
        prisma.orderItem.findMany({
            where: { ...scope(user), order: { status: "paid", createdAt: { gte: since } } },
            select: {
                orderId: true,
                productId: true,
                name: true,
                slug: true,
                image: true,
                unitPriceCents: true,
                quantity: true,
                order: { select: { createdAt: true } },
            },
        }),
        prisma.orderItem.count({ where: { ...scope(user), fulfillment: "unfulfilled", order: { status: "paid" } } }),
        prisma.variant.findMany({
            where: { stock: { lte: 3 }, product: { status: "active", ...scope(user) } },
            select: { productId: true, color: true, size: true, stock: true, product: { select: { name: true } } },
            orderBy: [{ stock: "asc" }, { product: { name: "asc" } }],
            take: 8,
        }),
        user.role === "admin" ? prisma.sellerRequest.count({ where: { status: "pending" } }) : Promise.resolve(0),
    ]);

    const summarise = (from: number, to: number) => {
        const slice = items.filter((i) => i.order.createdAt.getTime() >= from && i.order.createdAt.getTime() < to);
        const revenueCents = slice.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0);
        const orders = new Set(slice.map((i) => i.orderId)).size;
        return {
            revenueCents,
            orders,
            units: slice.reduce((sum, i) => sum + i.quantity, 0),
            averageCents: orders ? Math.round(revenueCents / orders) : 0,
        };
    };

    const byDay = new Map<string, { revenueCents: number; orders: Set<string> }>();
    for (let d = 0; d < 90; d++) {
        const date = new Date(chartStart.getTime() + d * DAY);
        byDay.set(dayKey(date), { revenueCents: 0, orders: new Set() });
    }
    for (const item of items) {
        const bucket = byDay.get(dayKey(item.order.createdAt));
        if (!bucket) continue;
        bucket.revenueCents += item.unitPriceCents * item.quantity;
        bucket.orders.add(item.orderId);
    }

    const top = new Map<string, Overview["topProducts"][number]>();
    for (const item of items) {
        if (item.order.createdAt.getTime() < windowStart) continue;
        const key = item.productId ?? item.slug;
        const entry = top.get(key) ?? { productId: item.productId, name: item.name, slug: item.slug, image: item.image, units: 0, revenueCents: 0 };
        entry.units += item.quantity;
        entry.revenueCents += item.unitPriceCents * item.quantity;
        top.set(key, entry);
    }

    return {
        window: summarise(windowStart, now + 1),
        previous: summarise(previousStart, windowStart),
        daily: [...byDay].map(([date, v]) => ({ date, revenueCents: v.revenueCents, orders: v.orders.size })),
        toShip,
        lowStock: lowStock.map((v) => ({ productId: v.productId, name: v.product.name, color: v.color, size: v.size, stock: v.stock })),
        topProducts: [...top.values()].sort((a, b) => b.revenueCents - a.revenueCents).slice(0, 5),
        pendingRequests,
    };
}

function dayKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

export interface StudioProductRow {
    id: string;
    slug: string;
    name: string;
    status: ProductStatus;
    category: string;
    priceCents: number;
    compareAtCents: number | null;
    image: string | null;
    stock: number;
    variants: number;
    soldOutVariants: number;
    seller: string;
    updatedAt: Date;
}

export async function getStudioProducts(user: CurrentUser, filter: { status?: ProductStatus; q?: string }): Promise<StudioProductRow[]> {
    const rows = await prisma.product.findMany({
        where: {
            ...scope(user),
            ...(filter.status ? { status: filter.status } : {}),
            ...(filter.q ? { name: { contains: filter.q, mode: "insensitive" } } : {}),
        },
        include: {
            images: { orderBy: { position: "asc" }, take: 1, select: { url: true } },
            variants: { select: { stock: true } },
            seller: { select: { storeName: true, name: true } },
        },
        orderBy: { updatedAt: "desc" },
    });
    return rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        status: row.status,
        category: row.category,
        priceCents: row.priceCents,
        compareAtCents: row.compareAtCents,
        image: row.images[0]?.url ?? null,
        stock: row.variants.reduce((sum, v) => sum + v.stock, 0),
        variants: row.variants.length,
        soldOutVariants: row.variants.filter((v) => v.stock <= 0).length,
        seller: row.seller.storeName ?? row.seller.name,
        updatedAt: row.updatedAt,
    }));
}

export async function getStatusCounts(user: CurrentUser): Promise<Record<ProductStatus | "all", number>> {
    const groups = await prisma.product.groupBy({ by: ["status"], where: scope(user), _count: { _all: true } });
    const counts = { all: 0, active: 0, draft: 0, archived: 0 };
    for (const g of groups) {
        counts[g.status] = g._count._all;
        counts.all += g._count._all;
    }
    return counts;
}

const editorInclude = {
    images: { orderBy: { position: "asc" } },
    variants: true,
    seller: { select: { storeName: true, name: true } },
} satisfies Prisma.ProductInclude;

export type EditorProductRow = Prisma.ProductGetPayload<{ include: typeof editorInclude }>;

/** A product the user may edit, or null. */
export async function getEditableProduct(user: CurrentUser, id: string): Promise<EditorProductRow | null> {
    return prisma.product.findFirst({ where: { id, ...scope(user) }, include: editorInclude });
}

export type OrderFilter = "to-ship" | "shipped" | "delivered" | "all";

const FILTER_FULFILLMENT: Record<Exclude<OrderFilter, "all">, Fulfillment> = {
    "to-ship": "unfulfilled",
    shipped: "shipped",
    delivered: "delivered",
};

export async function getStudioOrders(user: CurrentUser, filter: OrderFilter, take = 60) {
    const lineWhere: Prisma.OrderItemWhereInput = {
        ...scope(user),
        ...(filter !== "all" ? { fulfillment: FILTER_FULFILLMENT[filter] } : {}),
    };
    const orders = await prisma.order.findMany({
        where: { status: "paid", items: { some: lineWhere } },
        include: {
            items: { where: scope(user), orderBy: { name: "asc" }, include: { seller: { select: { storeName: true, name: true } } } },
            user: { select: { name: true } },
        },
        // Oldest first when there's work to do, newest first otherwise.
        orderBy: { createdAt: filter === "to-ship" ? "asc" : "desc" },
        take,
    });
    return orders;
}

export type StudioOrder = Awaited<ReturnType<typeof getStudioOrders>>[number];

export async function getFulfillmentCounts(user: CurrentUser): Promise<Record<OrderFilter, number>> {
    const base = { ...scope(user), order: { status: "paid" as const } };
    const [toShip, shipped, delivered, all] = await Promise.all(
        [
            { fulfillment: "unfulfilled" as const },
            { fulfillment: "shipped" as const },
            { fulfillment: "delivered" as const },
            {},
        ].map((extra) => prisma.order.count({ where: { status: "paid", items: { some: { ...base, ...extra } } } })),
    );
    return { "to-ship": toShip!, shipped: shipped!, delivered: delivered!, all: all! };
}

export async function getCustomers(q?: string) {
    const users = await prisma.user.findMany({
        where: q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } : {},
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            banned: true,
            storeName: true,
            createdAt: true,
            orders: { where: { status: "paid" }, select: { totalCents: true } },
            _count: { select: { products: true } },
        },
        orderBy: { createdAt: "desc" },
    });
    return users.map(({ orders, _count, ...user }) => ({
        ...user,
        orderCount: orders.length,
        spentCents: orders.reduce((sum, o) => sum + o.totalCents, 0),
        productCount: _count.products,
    }));
}

export type CustomerRow = Awaited<ReturnType<typeof getCustomers>>[number];

export async function getSellerRequests() {
    return prisma.sellerRequest.findMany({
        include: { user: { select: { name: true, email: true, createdAt: true } } },
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });
}

export type SellerRequestRow = Awaited<ReturnType<typeof getSellerRequests>>[number];
