"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";

import { COLOR_NAMES, CATEGORY_SLUGS } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { requireSeller, type CurrentUser } from "@/lib/session";
import { deleteImage, putImage, storageConfigured } from "@/lib/storage";
import { slugify } from "@/lib/utils";
import { CATALOG } from "@/server/catalog";

/*
 * Seller actions. Each one checks the role itself and scopes every write to
 * the caller's own products and order lines (admins may touch anything). In
 * the old app these lived behind middleware only, and the middleware matched
 * exact paths, so /dashboard/orders was open to anyone.
 */

function canEdit(user: CurrentUser, sellerId: string) {
    return user.role === "admin" || user.id === sellerId;
}

const S3_PREFIX = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/`;
const imageUrl = z.string().refine((url) => url.startsWith("/products/") || url.startsWith(S3_PREFIX), "Upload images through the studio.");

const productSchema = z
    .object({
        id: z.string().optional(),
        name: z.string().trim().min(2, "Give it a name.").max(80),
        description: z.string().trim().min(20, "A sentence or two, at least 20 characters.").max(1000),
        details: z.array(z.string().trim().min(1).max(80)).max(8, "Eight details at most."),
        category: z.enum(CATEGORY_SLUGS, { error: "Choose a department." }),
        collection: z.enum(["new_arrivals", "weekly_picks"]).nullable(),
        status: z.enum(["draft", "active", "archived"]),
        priceCents: z.number().int().min(100, "At least $1.00.").max(1_000_000, "That's a little much."),
        compareAtCents: z.number().int().positive().nullable(),
        images: z.array(z.object({ url: imageUrl, color: z.string().nullable() })).max(12, "Twelve photos at most."),
        variants: z
            .array(
                z.object({
                    color: z.string().refine((c) => COLOR_NAMES.includes(c), "Unknown colour."),
                    size: z.string().trim().min(1).max(12),
                    stock: z.number().int().min(0).max(9999),
                }),
            )
            .min(1, "Add at least one colour and size.")
            .max(80),
    })
    .refine((p) => p.status !== "active" || p.images.length > 0, { path: ["images"], message: "Add a photo before publishing." })
    .refine((p) => p.compareAtCents === null || p.compareAtCents > p.priceCents, {
        path: ["compareAtCents"],
        message: "The original price should be higher than the price.",
    });

export type ProductInput = z.input<typeof productSchema>;

export interface SaveResult {
    ok: boolean;
    id?: string;
    slug?: string;
    message?: string;
    errors?: Record<string, string[] | undefined>;
}

async function uniqueSlug(name: string, excludeId?: string): Promise<string> {
    const base = slugify(name) || "product";
    for (let n = 1; ; n++) {
        const slug = n === 1 ? base : `${base}-${n}`;
        const clash = await prisma.product.findFirst({ where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) }, select: { id: true } });
        if (!clash) return slug;
    }
}

export async function saveProduct(input: ProductInput): Promise<SaveResult> {
    const user = await requireSeller();
    const parsed = productSchema.safeParse(input);
    if (!parsed.success) {
        return { ok: false, errors: z.flattenError(parsed.error).fieldErrors, message: "Check the highlighted fields." };
    }
    const data = parsed.data;

    // Same colour and size twice would break the variant's unique key.
    const keys = new Set(data.variants.map((v) => `${v.color}|${v.size}`));
    if (keys.size !== data.variants.length) return { ok: false, message: "Each colour and size combination can only appear once." };

    const existing = data.id
        ? await prisma.product.findUnique({ where: { id: data.id }, select: { id: true, sellerId: true, images: { select: { url: true } } } })
        : null;
    if (data.id && (!existing || !canEdit(user, existing.sellerId))) return { ok: false, message: "You can't edit that product." };

    const slug = await uniqueSlug(data.name, data.id);
    const fields = {
        slug,
        name: data.name,
        description: data.description,
        details: data.details,
        category: data.category,
        collection: data.collection,
        status: data.status,
        priceCents: data.priceCents,
        compareAtCents: data.compareAtCents,
    };

    const product = await prisma.$transaction(async (tx) => {
        const saved = existing
            ? await tx.product.update({ where: { id: existing.id }, data: fields })
            : await tx.product.create({ data: { ...fields, sellerId: user.id } });

        await tx.productImage.deleteMany({ where: { productId: saved.id } });
        await tx.productImage.createMany({
            data: data.images.map((image, position) => ({ productId: saved.id, url: image.url, color: image.color, position })),
        });

        // Variants are upserted, not replaced, so their ids (and any bags
        // holding them) survive a stock edit. Removed combinations go.
        for (const variant of data.variants) {
            await tx.variant.upsert({
                where: { productId_color_size: { productId: saved.id, color: variant.color, size: variant.size } },
                create: { productId: saved.id, ...variant },
                update: { stock: variant.stock },
            });
        }
        await tx.variant.deleteMany({
            where: { productId: saved.id, NOT: data.variants.map((v) => ({ color: v.color, size: v.size })) },
        });
        return saved;
    });

    // Tidy uploads that were removed from the product.
    const kept = new Set(data.images.map((i) => i.url));
    for (const old of existing?.images ?? []) {
        if (!kept.has(old.url)) await deleteImage(old.url).catch(() => undefined);
    }

    updateTag(CATALOG);
    return { ok: true, id: product.id, slug: product.slug };
}

export async function deleteProduct(id: string): Promise<SaveResult> {
    const user = await requireSeller();
    const product = await prisma.product.findUnique({ where: { id }, select: { sellerId: true, images: { select: { url: true } } } });
    if (!product || !canEdit(user, product.sellerId)) return { ok: false, message: "You can't delete that product." };

    // Order lines keep their own copy of the name, photo and price.
    await prisma.product.delete({ where: { id } });
    for (const image of product.images) await deleteImage(image.url).catch(() => undefined);
    updateTag(CATALOG);
    return { ok: true };
}

const MAX_UPLOAD = 4 * 1024 * 1024;
const UPLOAD_TYPES = ["image/webp", "image/jpeg", "image/png", "image/avif"];

export async function uploadProductImage(form: FormData): Promise<{ url?: string; message?: string }> {
    const user = await requireSeller();
    if (!storageConfigured()) return { message: "Image uploads aren't configured on this deployment." };

    const file = form.get("file");
    if (!(file instanceof File)) return { message: "No file received." };
    if (!UPLOAD_TYPES.includes(file.type)) return { message: "Use a JPEG, PNG, WebP or AVIF image." };
    if (file.size > MAX_UPLOAD) return { message: "That image is over 4 MB." };

    try {
        const url = await putImage(new Uint8Array(await file.arrayBuffer()), file.type, `products/${user.id}`);
        return { url };
    } catch (error) {
        console.error("Upload failed", error);
        return { message: "The upload failed. Try again in a moment." };
    }
}

const fulfillmentSchema = z.object({
    itemIds: z.array(z.string()).min(1).max(50),
    fulfillment: z.enum(["unfulfilled", "shipped", "delivered"]),
});

export async function setFulfillment(input: z.input<typeof fulfillmentSchema>): Promise<{ ok: boolean; message?: string }> {
    const user = await requireSeller();
    const parsed = fulfillmentSchema.safeParse(input);
    if (!parsed.success) return { ok: false, message: "Nothing to update." };
    const { itemIds, fulfillment } = parsed.data;
    const now = new Date();

    const result = await prisma.orderItem.updateMany({
        where: {
            id: { in: itemIds },
            order: { status: "paid" },
            ...(user.role === "admin" ? {} : { sellerId: user.id }),
        },
        data: {
            fulfillment,
            shippedAt: fulfillment === "unfulfilled" ? null : now,
            deliveredAt: fulfillment === "delivered" ? now : null,
        },
    });
    refresh();
    return result.count ? { ok: true } : { ok: false, message: "Those items aren't yours to update." };
}
