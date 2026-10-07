import { Plus, Search } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { Badge, StudioFallback, StudioHeader } from "@/components/studio/studio-header";
import { Button } from "@/components/ui/button";
import type { ProductStatus } from "@/generated/prisma/enums";
import { getCategory } from "@/lib/catalog";
import { formatPrice } from "@/lib/money";
import { requireSeller } from "@/lib/session";
import { cn, formatDate } from "@/lib/utils";
import { getStatusCounts, getStudioProducts } from "@/server/studio";

export const metadata: Metadata = { title: "Products" };

const TABS = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "draft", label: "Drafts" },
    { key: "archived", label: "Archived" },
] as const;

export default function ProductsPage({ searchParams }: PageProps<"/studio/products">) {
    return (
        <Suspense fallback={<StudioFallback />}>
            <Products searchParams={searchParams} />
        </Suspense>
    );
}

async function Products({ searchParams }: Pick<PageProps<"/studio/products">, "searchParams">) {
    const user = await requireSeller();
    const query = await searchParams;
    const status = TABS.find((t) => t.key === query.status && t.key !== "all")?.key as ProductStatus | undefined;
    const q = typeof query.q === "string" ? query.q.trim().slice(0, 60) : "";
    const admin = user.role === "admin";
    const [products, counts] = await Promise.all([getStudioProducts(user, { status, q: q || undefined }), getStatusCounts(user)]);

    const href = (next: { status?: string; q?: string }) => {
        const params = new URLSearchParams();
        const s = "status" in next ? next.status : status;
        const text = "q" in next ? next.q : q;
        if (s && s !== "all") params.set("status", s);
        if (text) params.set("q", text);
        const string = params.toString();
        return string ? `/studio/products?${string}` : "/studio/products";
    };

    return (
        <>
            <StudioHeader
                eyebrow={admin ? "Every seller" : (user.storeName ?? "Your shop")}
                title="Products"
                actions={
                    <Button asChild>
                        <Link href="/studio/products/new">
                            <Plus aria-hidden /> New product
                        </Link>
                    </Button>
                }
            />

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                <nav aria-label="Status" className="flex gap-6">
                    {TABS.map((tab) => {
                        const active = (status ?? "all") === tab.key;
                        return (
                            <Link
                                key={tab.key}
                                href={href({ status: tab.key })}
                                aria-current={active ? "page" : undefined}
                                className={cn("flex items-center gap-1.5 border-b-2 py-2 text-sm", active ? "border-ink" : "border-transparent text-ink-soft hover:text-ink")}
                            >
                                {tab.label}
                                <span className="tabular text-xs text-ink-faint">{counts[tab.key]}</span>
                            </Link>
                        );
                    })}
                </nav>
                <form action="/studio/products" className="relative w-full sm:w-64">
                    {status ? <input type="hidden" name="status" value={status} /> : null}
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-faint" aria-hidden />
                    <input
                        name="q"
                        defaultValue={q}
                        placeholder="Search products"
                        aria-label="Search products"
                        className="h-10 w-full border border-rule bg-paper pr-3 pl-9 text-sm outline-none focus:border-ink"
                    />
                </form>
            </div>

            {products.length ? (
                <div className="mt-6 overflow-x-auto">
                    <table className="w-full min-w-[42rem] text-left text-[0.9375rem]">
                        <thead>
                            <tr className="label border-b border-ink text-ink-faint">
                                <th scope="col" className="py-3 pr-4 font-medium">Product</th>
                                <th scope="col" className="py-3 pr-4 font-medium">Status</th>
                                <th scope="col" className="py-3 pr-4 text-right font-medium">Price</th>
                                <th scope="col" className="py-3 pr-4 text-right font-medium">Stock</th>
                                <th scope="col" className="py-3 text-right font-medium">Updated</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-rule">
                            {products.map((p) => (
                                <tr key={p.id} className="group">
                                    <td className="py-3 pr-4">
                                        <Link href={`/studio/products/${p.id}`} className="flex items-center gap-4">
                                            <span className="studio relative aspect-[4/5] w-11 shrink-0 overflow-hidden">
                                                {p.image ? <Image src={p.image} alt="" fill sizes="44px" className="object-cover" /> : null}
                                            </span>
                                            <span className="min-w-0">
                                                <span className="block truncate font-medium group-hover:underline group-hover:underline-offset-4">{p.name}</span>
                                                <span className="block truncate text-sm text-ink-faint">
                                                    {getCategory(p.category)?.name ?? p.category}
                                                    {admin ? ` · ${p.seller}` : ""}
                                                </span>
                                            </span>
                                        </Link>
                                    </td>
                                    <td className="py-3 pr-4">
                                        <Badge tone={p.status}>{p.status}</Badge>
                                    </td>
                                    <td className="tabular py-3 pr-4 text-right">
                                        {formatPrice(p.priceCents)}
                                        {p.compareAtCents ? <span className="block text-sm text-ink-faint line-through">{formatPrice(p.compareAtCents)}</span> : null}
                                    </td>
                                    <td className="tabular py-3 pr-4 text-right">
                                        <span className={cn(p.stock === 0 && "text-signal")}>{p.stock}</span>
                                        {p.soldOutVariants ? (
                                            <span className="block text-sm text-ink-faint">
                                                {p.soldOutVariants} of {p.variants} sold out
                                            </span>
                                        ) : null}
                                    </td>
                                    <td className="py-3 text-right text-sm text-ink-soft">{formatDate(p.updatedAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="mt-6 grid place-items-start gap-5 border-t border-rule py-16">
                    <p className="type-subheading">{q || status ? "No products match." : "No products yet."}</p>
                    <p className="max-w-md text-ink-soft">
                        {q || status ? "Try another search or status." : "Add your first product: photos, a price, and the colours and sizes you stock."}
                    </p>
                    <Button asChild variant="outline">
                        <Link href={q || status ? "/studio/products" : "/studio/products/new"}>{q || status ? "Show all" : "Add a product"}</Link>
                    </Button>
                </div>
            )}
        </>
    );
}
