import { ArrowRight, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Reveal } from "@/components/motion";
import { ProductCard } from "@/components/store/product-card";
import { SectionHead } from "@/components/store/section-head";
import { Button } from "@/components/ui/button";
import { CATEGORIES, DEPARTMENTS, getCategory } from "@/lib/catalog";
import { formatPrice } from "@/lib/money";
import { pluralize } from "@/lib/utils";
import {
    getCategoryCounts,
    getCategoryCovers,
    getProduct,
    getSellerDirectory,
    getShelf,
    type ProductCard as Card,
} from "@/server/catalog";

/*
 * Three looks for the opening spread. Each names the photo to use, so the
 * hero can show the pink tee rather than whichever colour is listed first.
 */
const LOOKS = [
    { slug: "bomber-jacket", image: "/products/bomber-jacket-army.webp" },
    { slug: "everyday-tee", image: "/products/t-shirt-color-pink.webp" },
    { slug: "western-hat", image: "/products/cowboy-hat-tan-1.webp" },
];

export default async function HomePage() {
    const [looks, fresh, picks, sale, counts, covers, sellers] = await Promise.all([
        Promise.all(LOOKS.map(async (look) => ({ ...look, product: await getProduct(look.slug) }))),
        getShelf("new", 8),
        getShelf("picks", 5),
        getShelf("sale", 10),
        getCategoryCounts(),
        getCategoryCovers(),
        getSellerDirectory(),
    ]);
    const total = Object.values(counts).reduce((a, b) => a + b, 0);

    return (
        <>
            {/* ---------------------------------------------------- hero */}
            <section className="shell pt-6 pb-20 sm:pt-8 lg:pb-28">
                <div className="label flex justify-between border-b border-rule pb-4 text-ink-faint">
                    <span>Autumn edit · 2026</span>
                    <span className="hidden sm:inline">
                        {pluralize(total, "good")} from {pluralize(sellers.length, "seller")}
                    </span>
                    <span>No. 001–{String(total).padStart(3, "0")}</span>
                </div>

                <div className="grid gap-8 pt-10 sm:pt-14 lg:grid-cols-12 lg:gap-6 lg:pt-16">
                    <h1 className="type-display text-balance lg:col-span-8">
                        Things to <span className="accent">come back</span> to.
                    </h1>
                    <div className="flex flex-col justify-end gap-7 lg:col-span-4 lg:pb-3">
                        <p className="type-lead max-w-md text-pretty text-ink-soft">
                            Everyday clothing, accessories and things for the home, from independent sellers we review by hand. Fewer
                            things, chosen well.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <Button asChild size="lg">
                                <Link href="/shop">Shop everything</Link>
                            </Button>
                            <Button asChild size="lg" variant="outline">
                                <Link href="/shop?shelf=new">New in</Link>
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="rail mt-12 auto-cols-[78%] gap-3 sm:auto-cols-[46%] lg:mt-16 lg:grid-flow-row lg:grid-cols-12 lg:gap-6 lg:overflow-visible">
                    {looks.map(({ slug, image, product }, i) =>
                        product ? (
                            <Link
                                key={slug}
                                href={`/products/${slug}`}
                                className={`group block ${["lg:col-span-5", "lg:col-span-4 lg:mt-24", "lg:col-span-3 lg:mt-48"][i]}`}
                            >
                                <div className="studio relative aspect-[4/5] overflow-hidden">
                                    <Image
                                        src={image}
                                        alt={product.name}
                                        fill
                                        priority={i === 0}
                                        sizes="(min-width: 1024px) 40vw, 80vw"
                                        className="object-cover transition-transform duration-1000 ease-[var(--ease-out-expo)] group-hover:scale-[1.03]"
                                    />
                                </div>
                                <div className="label mt-3.5 flex justify-between gap-4 text-ink-soft">
                                    <span>
                                        {String(i + 1).padStart(3, "0")} · {product.name}
                                    </span>
                                    <span className="tabular">{formatPrice(product.priceCents)}</span>
                                </div>
                            </Link>
                        ) : null,
                    )}
                </div>
            </section>

            {/* ---------------------------------------------------- index */}
            <section className="shell pb-24 lg:pb-32" aria-labelledby="index-title">
                <SectionHead eyebrow="Index" index={`${CATEGORIES.length} departments`} title={<span id="index-title">Browse by department</span>} />
                <ol className="mt-10 grid lg:grid-cols-2 lg:gap-x-6">
                    {CATEGORIES.map((category, i) => (
                        <li key={category.slug} className="border-b border-rule">
                            <Link
                                href={`/shop/${category.slug}`}
                                className="group grid grid-cols-[2.5rem_1fr_auto] items-center gap-4 py-5 sm:grid-cols-[3rem_9rem_1fr_auto] sm:py-6"
                            >
                                <span className="label text-ink-faint">{String(i + 1).padStart(2, "0")}</span>
                                <span className="type-subheading group-hover:underline group-hover:underline-offset-4">{category.name}</span>
                                <span className="hidden truncate text-sm text-ink-soft sm:block">{category.blurb}</span>
                                <span className="flex items-center gap-3 text-sm text-ink-faint">
                                    <span className="tabular">{counts[category.slug] ?? 0}</span>
                                    <ArrowRight className="size-4 text-ink transition-transform group-hover:translate-x-1" aria-hidden />
                                </span>
                            </Link>
                        </li>
                    ))}
                </ol>
            </section>

            {/* ---------------------------------------------------- new */}
            <Shelf index="Shelf 01" title="New arrivals" href="/shop?shelf=new" products={fresh} />

            {/* ---------------------------------------------------- sellers */}
            <section className="bg-ink text-on-ink">
                <div className="shell grid gap-14 py-24 lg:grid-cols-12 lg:gap-6 lg:py-32">
                    <div className="lg:col-span-5">
                        <p className="label text-on-ink-faint">How Polaris works</p>
                        <h2 className="type-title mt-8 max-w-[12ch] text-balance">
                            Made by people, <span className="accent">not</span> warehouses.
                        </h2>
                        <p className="type-lead mt-8 max-w-md text-on-ink-soft">
                            Every shelf here belongs to an independent seller. They apply, we review their goods by hand, and they ship
                            straight to you. One bag, one checkout, a handful of makers.
                        </p>
                        <Button asChild variant="inverse-outline" size="lg" className="mt-10">
                            <Link href="/sell">Sell with us</Link>
                        </Button>
                    </div>
                    <div className="lg:col-span-6 lg:col-start-7">
                        <div className="label flex justify-between border-b border-white/15 pb-4 text-on-ink-faint">
                            <span>Seller</span>
                            <span>Goods</span>
                        </div>
                        <ul>
                            {sellers.map((seller) => (
                                <li key={seller.id} className="flex items-baseline justify-between gap-6 border-b border-white/15 py-5">
                                    <div className="min-w-0">
                                        <p className="type-subheading truncate">{seller.storeName}</p>
                                        <p className="mt-1.5 truncate text-sm text-on-ink-faint">
                                            {seller.categories.map((c) => getCategory(c)?.name ?? c).join(", ")}
                                        </p>
                                    </div>
                                    <span className="tabular text-on-ink-soft">{String(seller.products).padStart(2, "0")}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* ---------------------------------------------------- picks */}
            <section className="shell py-24 lg:py-32">
                <SectionHead index="Shelf 02" eyebrow="Chosen this week" title="Weekly picks" href="/shop?shelf=picks" />
                <div className="mt-10 grid gap-x-3 gap-y-10 sm:gap-x-6 lg:mt-14 lg:grid-cols-12">
                    {picks[0] ? (
                        <Reveal className="lg:col-span-6">
                            <ProductCard product={picks[0]} index={1} sizes="(min-width: 1024px) 50vw, 100vw" />
                        </Reveal>
                    ) : null}
                    <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-6 lg:col-span-6">
                        {picks.slice(1, 5).map((product, i) => (
                            <Reveal key={product.id} delay={0.06 * i}>
                                <ProductCard product={product} index={i + 2} sizes="(min-width: 1024px) 25vw, 50vw" />
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ---------------------------------------------------- sale */}
            {sale.length > 0 ? (
                <section className="bg-paper-2 py-24 lg:py-32">
                    <div className="shell">
                        <SectionHead
                            index="Shelf 03"
                            eyebrow="While stock lasts"
                            title={
                                <>
                                    Marked <span className="accent text-signal">down</span>
                                </>
                            }
                            href="/shop?shelf=sale"
                            linkLabel="Shop the sale"
                        />
                    </div>
                    <div className="mt-10 lg:mt-14">
                        <div className="rail shell auto-cols-[62%] gap-3 sm:auto-cols-[38%] sm:gap-6 lg:auto-cols-[calc((100%-5*1.5rem)/5)]">
                            {sale.map((product) => (
                                <ProductCard key={product.id} product={product} sizes="(min-width: 1024px) 20vw, 60vw" />
                            ))}
                        </div>
                    </div>
                </section>
            ) : null}

            {/* ---------------------------------------------------- departments */}
            <section className="shell py-24 lg:py-32">
                <div className="grid gap-x-6 gap-y-14 md:grid-cols-3">
                    {DEPARTMENTS.map((department, i) => {
                        const categories = CATEGORIES.filter((c) => c.department === department.slug);
                        const cover = covers[categories[i === 2 ? 1 : 0]?.slug ?? ""];
                        return (
                            <Reveal key={department.slug} delay={0.08 * i}>
                                <Link href={`/shop/${categories[0]?.slug}`} className="group block">
                                    <div className="studio relative aspect-[4/5] overflow-hidden">
                                        {cover ? (
                                            <Image
                                                src={cover}
                                                alt=""
                                                fill
                                                sizes="(min-width: 768px) 33vw, 100vw"
                                                className="object-cover transition-transform duration-1000 ease-[var(--ease-out-expo)] group-hover:scale-[1.03]"
                                            />
                                        ) : null}
                                        <span className="label absolute top-4 left-4 text-ink-faint">{String(i + 1).padStart(2, "0")}</span>
                                    </div>
                                </Link>
                                <div className="mt-5 flex items-baseline justify-between gap-4">
                                    <h3 className="type-heading">{department.name}</h3>
                                    <ArrowUpRight className="size-5 text-ink-soft" aria-hidden />
                                </div>
                                <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                                    {categories.map((category) => (
                                        <li key={category.slug}>
                                            <Link href={`/shop/${category.slug}`} className="text-[0.9375rem] text-ink-soft link-underline hover:text-ink">
                                                {category.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </Reveal>
                        );
                    })}
                </div>
            </section>

            {/* ---------------------------------------------------- promises */}
            <section className="border-t border-rule">
                <ul className="shell grid sm:grid-cols-2 lg:grid-cols-4">
                    {[
                        ["Free shipping", "On every order over $100 in Canada. Otherwise a flat $9."],
                        ["30-day returns", "Changed your mind? Send it back within a month of delivery."],
                        ["Checkout by Stripe", "Card details go straight to Stripe and never touch our servers."],
                        ["Reviewed by hand", "No seller lists anything here until we've said yes."],
                    ].map(([title, body], i) => (
                        <li
                            key={title}
                            className="border-rule py-10 sm:px-6 sm:first:pl-0 sm:[&:nth-child(2n)]:border-l lg:border-l lg:first:border-l-0 lg:py-14"
                        >
                            <p className="label text-ink-faint">{String(i + 1).padStart(2, "0")}</p>
                            <p className="mt-5 text-lg font-medium tracking-tight">{title}</p>
                            <p className="mt-2 max-w-xs text-[0.9375rem] leading-relaxed text-ink-soft">{body}</p>
                        </li>
                    ))}
                </ul>
            </section>
        </>
    );
}

function Shelf({ index, title, href, products }: { index: string; title: string; href: string; products: Card[] }) {
    return (
        <section className="pb-24 lg:pb-32">
            <div className="shell">
                <SectionHead index={index} eyebrow="Just in" title={title} href={href} />
            </div>
            <div className="mt-10 lg:mt-14">
                <div className="rail shell auto-cols-[62%] gap-3 sm:auto-cols-[38%] sm:gap-6 lg:grid-flow-row lg:grid-cols-4 lg:gap-y-12 lg:overflow-visible">
                    {products.map((product, i) => (
                        <ProductCard key={product.id} product={product} index={i + 1} />
                    ))}
                </div>
            </div>
        </section>
    );
}
