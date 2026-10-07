import type { Metadata } from "next";

import { ShopView } from "@/components/store/shop-view";

export const metadata: Metadata = {
    title: "Shop",
    description: "Everything at Polaris: clothing, accessories and things for the home from independent sellers.",
};

export default function ShopPage({ searchParams }: PageProps<"/shop">) {
    return <ShopView searchParams={searchParams} />;
}
