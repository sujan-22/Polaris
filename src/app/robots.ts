import type { MetadataRoute } from "next";

import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: [
                "/account",
                "/studio",
                "/cart",
                "/api",
                "/sign-in",
                "/sign-up",
                // Filtered and sorted shop views multiply into thousands of URLs that
                // crawlers walk one by one; /shop and each department stay open.
                "/shop?",
                "/shop/*?",
            ],
        },
        sitemap: `${site.url}/sitemap.xml`,
    };
}
