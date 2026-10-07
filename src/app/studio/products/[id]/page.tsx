import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ProductEditor } from "@/components/studio/product-editor";
import { StudioFallback } from "@/components/studio/studio-header";
import { requireSeller } from "@/lib/session";
import { storageConfigured } from "@/lib/storage";
import { getEditableProduct } from "@/server/studio";

export const metadata: Metadata = { title: "Edit product" };

export default function EditProductPage({ params }: PageProps<"/studio/products/[id]">) {
    return (
        <Suspense fallback={<StudioFallback />}>
            <EditProduct params={params} />
        </Suspense>
    );
}

async function EditProduct({ params }: Pick<PageProps<"/studio/products/[id]">, "params">) {
    const [user, { id }] = await Promise.all([requireSeller(), params]);
    const product = await getEditableProduct(user, id);
    if (!product) notFound();

    return (
        <ProductEditor
            // Remount after a save so the form starts from what was stored.
            key={product.updatedAt.toISOString()}
            uploadsEnabled={storageConfigured()}
            product={{
                id: product.id,
                slug: product.slug,
                name: product.name,
                description: product.description,
                details: product.details,
                category: product.category,
                collection: product.collection,
                status: product.status,
                priceCents: product.priceCents,
                compareAtCents: product.compareAtCents,
                images: product.images.map((i) => ({ url: i.url, color: i.color })),
                variants: product.variants.map((v) => ({ color: v.color, size: v.size, stock: v.stock })),
            }}
        />
    );
}
