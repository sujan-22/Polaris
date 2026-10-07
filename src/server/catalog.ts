import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import type { Collection, Prisma } from "@/generated/prisma/client";
import { CATEGORIES, sortSizes, type SortKey } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";

/*
 * Catalogue reads. Everything here is shared by every visitor, so it's all
 * cached under one tag: a seller saving a product calls updateTag(CATALOG)
 * and the next request rebuilds. Stock changes from checkout use
 * revalidateTag(CATALOG, "max"), which serves the old page while the new
 * one renders; the bag and checkout re-check stock against the database, so
 * a slightly stale "in stock" can't oversell.
 */
export const CATALOG = "catalog";

const cardInclude = {
    images: { orderBy: { position: "asc" }, take: 2, select: { url: true } },
    variants: { select: { color: true, stock: true } },
    seller: { select: { storeName: true, name: true } },
} satisfies Prisma.ProductInclude;

type CardRow = Prisma.ProductGetPayload<{ include: typeof cardInclude }>;

export interface ProductCard {
    id: string;
    slug: string;
    name: string;
    category: string;
    collection: Collection | null;
    priceCents: number;
    compareAtCents: number | null;
    images: string[];
    colors: string[];
    soldOut: boolean;
    seller: string;
    createdAt: Date;
}

function toCard(row: CardRow): ProductCard {
    return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        category: row.category,
        collection: row.collection,
        priceCents: row.priceCents,
        compareAtCents: row.compareAtCents,
        images: row.images.map((image) => image.url),
        colors: [...new Set(row.variants.map((v) => v.color))],
        soldOut: row.variants.every((v) => v.stock <= 0),
        seller: row.seller.storeName ?? row.seller.name,
        createdAt: row.createdAt,
    };
}

/** On the shelves: published, and from a seller who isn't suspended. */
const LIVE = { status: "active", seller: { banned: false } } satisfies Prisma.ProductWhereInput;

const onSale = (): Prisma.ProductWhereInput => ({
    compareAtCents: { gt: prisma.product.fields.priceCents },
});

export type ShelfKey = "new" | "picks" | "sale";

const SHELF_COLLECTION: Record<Exclude<ShelfKey, "sale">, Collection> = {
    new: "new_arrivals",
    picks: "weekly_picks",
};

export interface ShopFilters {
    category?: string;
    shelf?: ShelfKey;
    colors?: string[];
    sizes?: string[];
    q?: string;
    sort?: SortKey;
}

function orderFor(sort: SortKey | undefined): Prisma.ProductOrderByWithRelationInput[] {
    switch (sort) {
        case "newest":
            return [{ createdAt: "desc" }];
        case "price-asc":
            return [{ priceCents: "asc" }, { createdAt: "desc" }];
        case "price-desc":
            return [{ priceCents: "desc" }, { createdAt: "desc" }];
        default:
            // Featured: merchandised shelves first, then newest.
            return [{ collection: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }];
    }
}

export async function getProducts(filters: ShopFilters = {}): Promise<ProductCard[]> {
    "use cache";
    cacheLife("hours");
    cacheTag(CATALOG);

    const and: Prisma.ProductWhereInput[] = [LIVE];
    if (filters.category) and.push({ category: filters.category });
    if (filters.shelf === "sale") and.push(onSale());
    else if (filters.shelf) and.push({ collection: SHELF_COLLECTION[filters.shelf] });
    if (filters.colors?.length || filters.sizes?.length) {
        and.push({
            variants: {
                some: {
                    ...(filters.colors?.length ? { color: { in: filters.colors } } : {}),
                    ...(filters.sizes?.length ? { size: { in: filters.sizes } } : {}),
                },
            },
        });
    }
    const q = filters.q?.trim();
    if (q) {
        and.push({
            OR: [
                { name: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
                { category: { contains: q.toLowerCase() } },
                { seller: { storeName: { contains: q, mode: "insensitive" } } },
            ],
        });
    }

    const rows = await prisma.product.findMany({
        where: { AND: and },
        include: cardInclude,
        orderBy: orderFor(filters.sort),
    });
    return rows.map(toCard);
}

export async function getShelf(shelf: ShelfKey, take = 8): Promise<ProductCard[]> {
    "use cache";
    cacheLife("hours");
    cacheTag(CATALOG);

    const rows = await prisma.product.findMany({
        where: { ...LIVE, ...(shelf === "sale" ? onSale() : { collection: SHELF_COLLECTION[shelf] }) },
        include: cardInclude,
        orderBy: { createdAt: "desc" },
        take,
    });
    return rows.map(toCard);
}

/** Colours and sizes that exist in a category, for the shop's filters. */
export async function getFacets(category?: string): Promise<{ colors: string[]; sizes: string[] }> {
    "use cache";
    cacheLife("hours");
    cacheTag(CATALOG);

    const variants = await prisma.variant.findMany({
        where: { product: { ...LIVE, ...(category ? { category } : {}) } },
        select: { color: true, size: true },
        distinct: ["color", "size"],
    });
    return {
        colors: [...new Set(variants.map((v) => v.color))].sort(),
        sizes: sortSizes(variants.map((v) => v.size)),
    };
}

export async function getCategoryCounts(): Promise<Record<string, number>> {
    "use cache";
    cacheLife("hours");
    cacheTag(CATALOG);

    const groups = await prisma.product.groupBy({
        by: ["category"],
        where: LIVE,
        _count: { _all: true },
    });
    return Object.fromEntries(groups.map((g) => [g.category, g._count._all]));
}

/** The first image of a product in each category, for department tiles. */
export async function getCategoryCovers(): Promise<Record<string, string>> {
    "use cache";
    cacheLife("hours");
    cacheTag(CATALOG);

    const covers: Record<string, string> = {};
    const rows = await prisma.product.findMany({
        where: LIVE,
        select: { category: true, images: { orderBy: { position: "asc" }, take: 1, select: { url: true } } },
        orderBy: [{ collection: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
    });
    for (const row of rows) {
        if (!covers[row.category] && row.images[0]) covers[row.category] = row.images[0].url;
    }
    return covers;
}

const productInclude = {
    images: { orderBy: { position: "asc" } },
    variants: { orderBy: [{ color: "asc" }] },
    seller: { select: { id: true, storeName: true, name: true } },
} satisfies Prisma.ProductInclude;

export type ProductDetail = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

export async function getProduct(slug: string): Promise<ProductDetail | null> {
    "use cache";
    cacheLife("hours");
    cacheTag(CATALOG);

    return prisma.product.findFirst({
        where: { slug, ...LIVE },
        include: productInclude,
    });
}

export async function getRelated(category: string, excludeId: string, take = 4): Promise<ProductCard[]> {
    "use cache";
    cacheLife("hours");
    cacheTag(CATALOG);

    const rows = await prisma.product.findMany({
        where: { ...LIVE, category, id: { not: excludeId } },
        include: cardInclude,
        orderBy: { createdAt: "desc" },
        take,
    });
    if (rows.length >= take) return rows.map(toCard);
    // Thin category: top up with the newest from anywhere else.
    const extra = await prisma.product.findMany({
        where: { ...LIVE, id: { notIn: [excludeId, ...rows.map((r) => r.id)] } },
        include: cardInclude,
        orderBy: { createdAt: "desc" },
        take: take - rows.length,
    });
    return [...rows, ...extra].map(toCard);
}

export async function getActiveSlugs(): Promise<{ slug: string; updatedAt: Date }[]> {
    "use cache";
    cacheLife("hours");
    cacheTag(CATALOG);

    return prisma.product.findMany({
        where: LIVE,
        select: { slug: true, updatedAt: true },
    });
}

export interface SellerSummary {
    id: string;
    storeName: string;
    products: number;
    categories: string[];
}

/** The people behind the shelves, for the home page. */
export async function getSellerDirectory(): Promise<SellerSummary[]> {
    "use cache";
    cacheLife("hours");
    cacheTag(CATALOG);

    const sellers = await prisma.user.findMany({
        where: { banned: false, products: { some: { status: "active" } } },
        select: {
            id: true,
            name: true,
            storeName: true,
            products: { where: { status: "active" }, select: { category: true } },
        },
    });
    const order = CATEGORIES.map((c) => c.slug as string);
    return sellers
        .map((s) => ({
            id: s.id,
            storeName: s.storeName ?? s.name,
            products: s.products.length,
            categories: [...new Set(s.products.map((p) => p.category))].sort((a, b) => order.indexOf(a) - order.indexOf(b)),
        }))
        .sort((a, b) => b.products - a.products || a.storeName.localeCompare(b.storeName));
}
