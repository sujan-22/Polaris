import type { Metadata } from "next";
import { Suspense } from "react";

import { ProductEditor } from "@/components/studio/product-editor";
import { StudioFallback } from "@/components/studio/studio-header";
import { requireSeller } from "@/lib/session";
import { storageConfigured } from "@/lib/storage";

export const metadata: Metadata = { title: "New product" };

export default function NewProductPage() {
    return (
        <Suspense fallback={<StudioFallback />}>
            <NewProduct />
        </Suspense>
    );
}

async function NewProduct() {
    await requireSeller();
    return <ProductEditor uploadsEnabled={storageConfigured()} />;
}
