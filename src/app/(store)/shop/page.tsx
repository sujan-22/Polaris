import type { Metadata } from "next";

import { ShopView } from "@/components/store/shop-view";
import { filteredViewMetadata } from "@/lib/shop-params";

export async function generateMetadata({ searchParams }: PageProps<"/shop">): Promise<Metadata> {
    return {
        title: "Shop",
        description: "Everything at Polaris: clothing, accessories and things for the home from independent sellers.",
        ...filteredViewMetadata("/shop", await searchParams),
    };
}

export default function ShopPage({ searchParams }: PageProps<"/shop">) {
    return <ShopView searchParams={searchParams} />;
}
