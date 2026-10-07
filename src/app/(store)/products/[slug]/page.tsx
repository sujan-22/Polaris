import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ProductCard } from "@/components/store/product-card";
import { ProductView } from "@/components/store/product-view";
import { SectionHead } from "@/components/store/section-head";
import { getCategory } from "@/lib/catalog";
import { site } from "@/lib/site";
import { getActiveSlugs, getProduct, getRelated } from "@/server/catalog";

export async function generateStaticParams() {
    const products = await getActiveSlugs();
    return products.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
    const product = await getProduct((await params).slug);
    if (!product) return {};
    return {
        title: product.name,
        description: product.description,
        openGraph: { title: product.name, description: product.description, images: product.images.slice(0, 1).map((i) => i.url) },
    };
}

export default function ProductPage({ params }: PageProps<"/products/[slug]">) {
    return (
        <Suspense fallback={<ProductSkeleton />}>
            <Product params={params} />
        </Suspense>
    );
}

async function Product({ params }: Pick<PageProps<"/products/[slug]">, "params">) {
    const { slug } = await params;
    const product = await getProduct(slug);
    if (!product) notFound();
    const related = await getRelated(product.category, product.id);
    const seller = product.seller.storeName ?? product.seller.name;
    const inStock = product.variants.some((v) => v.stock > 0);

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.description,
        image: product.images.map((i) => (i.url.startsWith("http") ? i.url : site.url + i.url)),
        category: getCategory(product.category)?.name,
        brand: { "@type": "Brand", name: seller },
        offers: {
            "@type": "Offer",
            price: (product.priceCents / 100).toFixed(2),
            priceCurrency: "CAD",
            availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            url: `${site.url}/products/${product.slug}`,
        },
    };

    return (
        <>
            <div className="shell pt-6 pb-24 lg:pt-10 lg:pb-32">
                <ProductView
                    product={{
                        id: product.id,
                        slug: product.slug,
                        name: product.name,
                        description: product.description,
                        details: product.details,
                        category: product.category,
                        priceCents: product.priceCents,
                        compareAtCents: product.compareAtCents,
                        seller,
                        images: product.images.map((i) => ({ id: i.id, url: i.url, color: i.color })),
                        variants: product.variants.map((v) => ({ id: v.id, color: v.color, size: v.size, stock: v.stock })),
                    }}
                />
            </div>

            {related.length ? (
                <section className="shell pb-24 lg:pb-32">
                    <SectionHead eyebrow="Keep looking" index={getCategory(product.category)?.name} title="You might also like" href={`/shop/${product.category}`} />
                    <ul className="mt-10 grid grid-cols-2 gap-x-3 gap-y-12 sm:gap-x-6 lg:mt-14 lg:grid-cols-4">
                        {related.map((item) => (
                            <li key={item.id}>
                                <ProductCard product={item} />
                            </li>
                        ))}
                    </ul>
                </section>
            ) : null}

            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
        </>
    );
}

function ProductSkeleton() {
    return (
        <div className="shell grid gap-10 pt-6 pb-24 lg:grid-cols-12 lg:pt-10" aria-busy>
            <div className="studio aspect-[4/5] animate-pulse lg:col-span-7" />
            <div className="lg:col-span-5">
                <div className="h-3 w-32 bg-paper-2" />
                <div className="mt-6 h-14 w-3/4 bg-paper-2" />
                <div className="mt-5 h-6 w-24 bg-paper-2" />
                <div className="mt-10 h-24 w-full bg-paper-2" />
                <div className="mt-10 h-14 w-full bg-paper-2" />
            </div>
        </div>
    );
}
