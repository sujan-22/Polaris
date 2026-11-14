import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ShopView } from "@/components/store/shop-view";
import { CATEGORIES, getCategory } from "@/lib/catalog";
import { filteredViewMetadata } from "@/lib/shop-params";

export function generateStaticParams() {
    return CATEGORIES.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({ params, searchParams }: PageProps<"/shop/[category]">): Promise<Metadata> {
    const category = getCategory((await params).category);
    if (!category) return {};
    return {
        title: category.name,
        description: category.blurb,
        ...filteredViewMetadata(`/shop/${category.slug}`, await searchParams),
    };
}

export default function CategoryPage({ params, searchParams }: PageProps<"/shop/[category]">) {
    const category = params.then(({ category }) => {
        if (!getCategory(category)) notFound();
        return category;
    });
    return <ShopView category={category} searchParams={searchParams} />;
}
