import type { MetadataRoute } from "next";

import { CATEGORIES } from "@/lib/catalog";
import { site } from "@/lib/site";
import { getActiveSlugs } from "@/server/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const products = await getActiveSlugs();
    return [
        { url: site.url, changeFrequency: "daily", priority: 1 },
        { url: `${site.url}/shop`, changeFrequency: "daily", priority: 0.9 },
        ...CATEGORIES.map((c) => ({ url: `${site.url}/shop/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
        ...products.map((p) => ({ url: `${site.url}/products/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
        { url: `${site.url}/sell`, changeFrequency: "monthly", priority: 0.4 },
        { url: `${site.url}/help`, changeFrequency: "monthly", priority: 0.3 },
    ];
}
