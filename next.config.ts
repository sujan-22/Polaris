import type { NextConfig } from "next";

const bucket = process.env.AWS_S3_BUCKET_NAME;
const region = process.env.AWS_S3_REGION;

const nextConfig: NextConfig = {
    // Catalogue pages prerender into a static shell; the bag, the account
    // menu and anything else read from the request streams in behind
    // Suspense.
    cacheComponents: true,
    partialPrefetching: true,

    images: {
        formats: ["image/avif", "image/webp"],
        qualities: [75, 90],
        // Seller uploads live in S3. Seeded catalogue images are local.
        remotePatterns:
            bucket && region
                ? [
                      {
                          protocol: "https",
                          hostname: `${bucket}.s3.${region}.amazonaws.com`,
                          pathname: "/**",
                      },
                  ]
                : [],
    },

    experimental: {
        // Lets the data access layer call forbidden() for a proper 403.
        authInterrupts: true,
        serverActions: {
            // Images are resized in the browser before upload, one per
            // request, so this stays under Vercel's 4.5 MB request limit.
            bodySizeLimit: "4mb",
        },
    },

    // The previous version of the site used these routes.
    async redirects() {
        return [
            { source: "/products/category/all", destination: "/shop", permanent: true },
            { source: "/products/category/:category", destination: "/shop/:category", permanent: true },
            { source: "/dashboard/:path*", destination: "/studio", permanent: true },
            { source: "/seller-dashboard/:path*", destination: "/studio", permanent: true },
            { source: "/order-confirmation", destination: "/account/orders", permanent: false },
            { source: "/order-details", destination: "/account/orders", permanent: false },
        ];
    },
};

export default nextConfig;
