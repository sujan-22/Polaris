import { Check, X } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { ProductCard, ProductCardSkeleton } from "@/components/store/product-card";
import { FilterSheet, SortMenu } from "@/components/store/shop-controls";
import { CATEGORIES, COLORS, getCategory } from "@/lib/catalog";
import { parseShopParams, SHELF_NAMES, shopHref, toggle, type ShopParams } from "@/lib/shop-params";
import { cn, pluralize } from "@/lib/utils";
import { getCategoryCounts, getFacets, getProducts } from "@/server/catalog";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

interface ShopViewProps {
    category?: Promise<string>;
    searchParams: SearchParams;
}

/*
 * The shop for every department and for "everything". The URL decides what
 * shows, so the whole view sits behind one Suspense boundary; the fallback
 * is a grid of empty studio tiles the same size as the real thing.
 */
export function ShopView({ category, searchParams }: ShopViewProps) {
    return (
        <Suspense fallback={<ShopSkeleton />}>
            <Shop category={category} searchParams={searchParams} />
        </Suspense>
    );
}

async function Shop({ category: categoryPromise, searchParams }: ShopViewProps) {
    const [slug, raw] = await Promise.all([categoryPromise, searchParams]);
    const category = slug ? getCategory(slug) : undefined;
    const params = parseShopParams(raw);
    const base = category ? `/shop/${category.slug}` : "/shop";

    const [products, facets, counts] = await Promise.all([
        getProducts({ category: category?.slug, shelf: params.shelf, colors: params.colors, sizes: params.sizes, q: params.q, sort: params.sort }),
        getFacets(category?.slug),
        getCategoryCounts(),
    ]);
    const total = Object.values(counts).reduce((a, b) => a + b, 0);

    const title = params.q ? (
        <>
            Results for <span className="accent">“{params.q}”</span>
        </>
    ) : params.shelf ? (
        SHELF_NAMES[params.shelf]
    ) : (
        (category?.name ?? "Everything")
    );
    const activeCount = params.colors.length + params.sizes.length + (params.shelf ? 1 : 0);
    const filters = <FilterPanel base={base} params={params} facets={facets} />;

    return (
        <div className="shell pt-8 pb-24 lg:pt-12 lg:pb-32">
            <header className="border-b border-ink pb-8 lg:pb-10">
                <nav aria-label="Breadcrumb" className="label flex gap-2 text-ink-faint">
                    <Link href="/" className="hover:text-ink">
                        Polaris
                    </Link>
                    <span aria-hidden>/</span>
                    <Link href="/shop" className="hover:text-ink">
                        Shop
                    </Link>
                    {category ? (
                        <>
                            <span aria-hidden>/</span>
                            <span className="text-ink">{category.name}</span>
                        </>
                    ) : null}
                </nav>
                <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
                    <h1 className="type-title text-balance">{title}</h1>
                    <p className="max-w-sm text-ink-soft">
                        {category && !params.q ? category.blurb : `${pluralize(products.length, "good")}${params.q ? " found" : ""}`}
                    </p>
                </div>
            </header>

            {/* Department tabs. They keep the shelf and sort, and drop filters that may not apply. */}
            <nav aria-label="Departments" className="rail -mx-[var(--gutter)] auto-cols-max gap-7 border-b border-rule px-[var(--gutter)]">
                {[{ slug: "", name: "All", count: total }, ...CATEGORIES.map((c) => ({ slug: c.slug, name: c.name, count: counts[c.slug] ?? 0 }))].map(
                    (tab) => {
                        const active = (category?.slug ?? "") === tab.slug;
                        return (
                            <Link
                                key={tab.slug || "all"}
                                href={shopHref(tab.slug ? `/shop/${tab.slug}` : "/shop", { ...params, colors: [], sizes: [] })}
                                aria-current={active ? "page" : undefined}
                                className={cn(
                                    "-mb-px flex items-center gap-1.5 border-b-2 py-4 text-sm whitespace-nowrap transition-colors",
                                    active ? "border-ink text-ink" : "border-transparent text-ink-soft hover:text-ink",
                                )}
                            >
                                {tab.name}
                                <span className="tabular text-xs text-ink-faint">{tab.count}</span>
                            </Link>
                        );
                    },
                )}
            </nav>

            <div className="mt-6 grid gap-x-10 lg:mt-10 lg:grid-cols-[13rem_1fr]">
                <aside className="hidden lg:block" aria-label="Filters">
                    <div className="sticky top-[calc(var(--header-height)+1.5rem)]">{filters}</div>
                </aside>

                <div>
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 lg:hidden">
                            <FilterSheet activeCount={activeCount}>{filters}</FilterSheet>
                        </div>
                        <p className="tabular hidden text-sm text-ink-soft lg:block">{pluralize(products.length, "good")}</p>
                        <SortMenu
                            current={params.sort}
                            options={(["featured", "newest", "price-asc", "price-desc"] as const).map((sort) => ({
                                sort,
                                href: shopHref(base, params, { sort }),
                            }))}
                        />
                    </div>

                    {activeCount > 0 ? <ActiveFilters base={base} params={params} /> : null}

                    {products.length > 0 ? (
                        <ul className="mt-6 grid grid-cols-2 gap-x-3 gap-y-12 sm:gap-x-6 xl:grid-cols-3">
                            {products.map((product, i) => (
                                <li key={product.id}>
                                    <ProductCard product={product} index={i + 1} priority={i < 3} sizes="(min-width: 1280px) 27vw, (min-width: 1024px) 38vw, 50vw" />
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="mt-6 grid place-items-start gap-5 border-t border-rule py-20">
                            <p className="type-heading">Nothing matches that.</p>
                            <p className="max-w-md text-ink-soft">
                                {params.q ? "Try a broader word, or browse a department instead." : "Loosen a filter or two and try again."}
                            </p>
                            <Link href={params.q ? "/shop" : base} className="text-sm font-medium link-underline">
                                {params.q ? "Browse everything" : "Clear all filters"}
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function FilterPanel({ base, params, facets }: { base: string; params: ShopParams; facets: { colors: string[]; sizes: string[] } }) {
    return (
        <div className="grid gap-10">
            <FilterGroup title="Shelf">
                <ul className="grid gap-1">
                    {([undefined, "new", "picks", "sale"] as const).map((shelf) => {
                        const active = params.shelf === shelf;
                        return (
                            <li key={shelf ?? "all"}>
                                <Link
                                    href={shopHref(base, params, { shelf })}
                                    aria-current={active ? "true" : undefined}
                                    rel="nofollow"
                                    className={cn("flex items-center gap-2.5 py-1 text-[0.9375rem]", active ? "text-ink" : "text-ink-soft hover:text-ink")}
                                >
                                    <span className={cn("size-1.5", active ? "bg-ink" : "bg-transparent")} aria-hidden />
                                    {shelf ? SHELF_NAMES[shelf] : "All goods"}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </FilterGroup>

            {facets.colors.length > 1 ? (
                <FilterGroup title="Colour">
                    <ul className="grid grid-cols-2 gap-x-3 gap-y-1 lg:grid-cols-1">
                        {facets.colors.map((color) => {
                            const active = params.colors.includes(color);
                            return (
                                <li key={color}>
                                    <Link
                                        href={shopHref(base, params, { colors: toggle(params.colors, color) })}
                                        aria-current={active ? "true" : undefined}
                                        rel="nofollow"
                                        className={cn("flex items-center gap-2.5 py-1 text-[0.9375rem]", active ? "text-ink" : "text-ink-soft hover:text-ink")}
                                    >
                                        <span
                                            className="grid size-4 place-items-center rounded-full shadow-[inset_0_0_0_1px_rgb(18_18_18/0.2)]"
                                            style={{ background: COLORS[color] }}
                                            aria-hidden
                                        >
                                            {active ? <Check className={cn("size-3", color === "White" || color === "Beige" || color === "Tan" ? "text-ink" : "text-white")} strokeWidth={3} /> : null}
                                        </span>
                                        {color}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </FilterGroup>
            ) : null}

            {facets.sizes.length > 1 ? (
                <FilterGroup title="Size">
                    <ul className="flex flex-wrap gap-1.5">
                        {facets.sizes.map((size) => {
                            const active = params.sizes.includes(size);
                            return (
                                <li key={size}>
                                    <Link
                                        href={shopHref(base, params, { sizes: toggle(params.sizes, size) })}
                                        aria-current={active ? "true" : undefined}
                                        rel="nofollow"
                                        className={cn(
                                            "tabular inline-flex h-9 min-w-10 items-center justify-center border px-2.5 text-sm transition-colors",
                                            active ? "border-ink bg-ink text-paper" : "border-rule text-ink hover:border-ink",
                                        )}
                                    >
                                        {size}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </FilterGroup>
            ) : null}
        </div>
    );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <p className="label border-b border-rule pb-3 text-ink-faint">{title}</p>
            <div className="mt-4">{children}</div>
        </div>
    );
}

function ActiveFilters({ base, params }: { base: string; params: ShopParams }) {
    const chips = [
        ...(params.shelf ? [{ label: SHELF_NAMES[params.shelf], href: shopHref(base, params, { shelf: undefined }) }] : []),
        ...params.colors.map((color) => ({ label: color, href: shopHref(base, params, { colors: toggle(params.colors, color) }) })),
        ...params.sizes.map((size) => ({ label: `Size ${size}`, href: shopHref(base, params, { sizes: toggle(params.sizes, size) }) })),
    ];
    return (
        <div className="mt-5 flex flex-wrap items-center gap-2">
            {chips.map((chip) => (
                <Link key={chip.label} href={chip.href} rel="nofollow" className="inline-flex h-8 items-center gap-1.5 bg-paper-2 pr-2 pl-3 text-sm hover:bg-rule">
                    {chip.label}
                    <X className="size-3.5" aria-label="Remove" />
                </Link>
            ))}
            <Link href={shopHref(base, { ...params, shelf: undefined, colors: [], sizes: [] })} className="ml-1 text-sm text-ink-soft link-underline">
                Clear all
            </Link>
        </div>
    );
}

function ShopSkeleton() {
    return (
        <div className="shell pt-8 pb-24 lg:pt-12" aria-busy>
            <div className="border-b border-ink pb-10">
                <div className="h-3 w-40 bg-paper-2" />
                <div className="mt-8 h-14 w-72 bg-paper-2" />
            </div>
            <div className="mt-24 grid grid-cols-2 gap-x-3 gap-y-12 sm:gap-x-6 lg:ml-[calc(13rem+2.5rem)] xl:grid-cols-3">
                {Array.from({ length: 6 }, (_, i) => (
                    <ProductCardSkeleton key={i} />
                ))}
            </div>
        </div>
    );
}
