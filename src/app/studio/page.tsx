import { ArrowDownRight, ArrowRight, ArrowUpRight, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { RevenueChart, type WeekPoint } from "@/components/studio/revenue-chart";
import { StudioFallback, StudioHeader } from "@/components/studio/studio-header";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/money";
import { requireSeller } from "@/lib/session";
import { cn, pluralize } from "@/lib/utils";
import { getOverview, type Overview } from "@/server/studio";

export default function StudioOverviewPage() {
    return (
        <Suspense fallback={<StudioFallback />}>
            <StudioOverview />
        </Suspense>
    );
}

async function StudioOverview() {
    const user = await requireSeller();
    const overview = await getOverview(user);
    const admin = user.role === "admin";
    const { window: now, previous } = overview;
    const weeks = toWeeks(overview.daily);

    return (
        <>
            <StudioHeader
                eyebrow={admin ? "Whole store · last 30 days" : `${user.storeName ?? "Your shop"} · last 30 days`}
                title={admin ? "Store overview" : `Good to see you, ${user.name.split(" ")[0]}.`}
                actions={
                    <Button asChild>
                        <Link href="/studio/products/new">
                            <Plus aria-hidden /> New product
                        </Link>
                    </Button>
                }
            />

            {admin && overview.pendingRequests > 0 ? (
                <Link
                    href="/studio/sellers"
                    className="group mt-8 flex items-center justify-between gap-4 bg-ink px-5 py-4 text-on-ink"
                >
                    <span>
                        {pluralize(overview.pendingRequests, "seller application")} waiting for review
                    </span>
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
                </Link>
            ) : null}

            {/* One hero figure, three supporting tiles. */}
            <section aria-label="Last 30 days" className="mt-10 grid gap-px border border-rule bg-rule sm:grid-cols-2 xl:grid-cols-4">
                <div className="bg-paper p-6 sm:col-span-2 xl:col-span-1">
                    <p className="text-sm text-ink-soft">Revenue</p>
                    <p className="mt-3 text-5xl font-medium tracking-tight">{formatPrice(now.revenueCents)}</p>
                    <Delta now={now.revenueCents} before={previous.revenueCents} />
                </div>
                <Tile label="Orders" value={now.orders.toLocaleString("en-CA")} now={now.orders} before={previous.orders} />
                <Tile label="Units sold" value={now.units.toLocaleString("en-CA")} now={now.units} before={previous.units} />
                <Tile label="Average order" value={formatPrice(now.averageCents)} now={now.averageCents} before={previous.averageCents} />
            </section>

            <section className="mt-12">
                <div className="flex items-baseline justify-between border-b border-rule pb-3">
                    <h2 className="font-medium">Revenue by week</h2>
                    <p className="text-sm text-ink-faint">
                        Last {weeks.length} weeks{admin ? ", all sellers" : ""}
                    </p>
                </div>
                <div className="mt-6">
                    <RevenueChart weeks={weeks} />
                </div>
            </section>

            <div className="mt-14 grid gap-12 lg:grid-cols-2">
                <section>
                    <div className="flex items-baseline justify-between border-b border-rule pb-3">
                        <h2 className="font-medium">To ship</h2>
                        <Link href="/studio/orders" className="text-sm link-underline">
                            Open orders
                        </Link>
                    </div>
                    <p className="mt-6 flex items-baseline gap-3">
                        <span className="text-4xl font-medium tracking-tight">{overview.toShip}</span>
                        <span className="text-ink-soft">{overview.toShip === 1 ? "line is" : "lines are"} waiting to go out</span>
                    </p>

                    <div className="mt-10 flex items-baseline justify-between border-b border-rule pb-3">
                        <h2 className="font-medium">Running low</h2>
                        <Link href="/studio/products" className="text-sm link-underline">
                            Products
                        </Link>
                    </div>
                    {overview.lowStock.length ? (
                        <ul className="divide-y divide-rule">
                            {overview.lowStock.map((v) => (
                                <li key={`${v.productId}-${v.color}-${v.size}`} className="flex items-center justify-between gap-4 py-3 text-[0.9375rem]">
                                    <Link href={`/studio/products/${v.productId}`} className="min-w-0 truncate hover:underline hover:underline-offset-4">
                                        {v.name} <span className="text-ink-faint">· {v.color} · {v.size}</span>
                                    </Link>
                                    <span className={cn("tabular shrink-0 text-sm", v.stock === 0 ? "text-signal" : "text-ink-soft")}>
                                        {v.stock === 0 ? "Sold out" : `${v.stock} left`}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="py-4 text-ink-soft">Everything is well stocked.</p>
                    )}
                </section>

                <section>
                    <div className="flex items-baseline justify-between border-b border-rule pb-3">
                        <h2 className="font-medium">Best sellers</h2>
                        <p className="text-sm text-ink-faint">Last 30 days</p>
                    </div>
                    {overview.topProducts.length ? (
                        <ol className="divide-y divide-rule">
                            {overview.topProducts.map((p, i) => (
                                <li key={p.slug} className="grid grid-cols-[1.5rem_auto_1fr_auto] items-center gap-4 py-3">
                                    <span className="label text-ink-faint">{String(i + 1).padStart(2, "0")}</span>
                                    <div className="studio relative aspect-[4/5] w-10 overflow-hidden">
                                        {p.image ? <Image src={p.image} alt="" fill sizes="40px" className="object-cover" /> : null}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-[0.9375rem]">{p.name}</p>
                                        <p className="text-sm text-ink-faint">{pluralize(p.units, "unit")}</p>
                                    </div>
                                    <span className="tabular text-[0.9375rem]">{formatPrice(p.revenueCents)}</span>
                                </li>
                            ))}
                        </ol>
                    ) : (
                        <p className="py-4 text-ink-soft">No sales in the last 30 days yet.</p>
                    )}
                </section>
            </div>
        </>
    );
}

function Tile({ label, value, now, before }: { label: string; value: string; now: number; before: number }) {
    return (
        <div className="bg-paper p-6">
            <p className="text-sm text-ink-soft">{label}</p>
            <p className="mt-3 text-3xl font-medium tracking-tight">{value}</p>
            <Delta now={now} before={before} />
        </div>
    );
}

/* Change against the previous 30 days, as a signed figure with an arrow, never colour alone. */
function Delta({ now, before }: { now: number; before: number }) {
    if (before === 0) return <p className="mt-3 text-sm text-ink-faint">No earlier data</p>;
    const change = (now - before) / before;
    const pct = Math.round(change * 100);
    const Icon = pct >= 0 ? ArrowUpRight : ArrowDownRight;
    return (
        <p className={cn("mt-3 flex items-center gap-1 text-sm", pct > 0 ? "text-success" : pct < 0 ? "text-signal" : "text-ink-soft")}>
            <Icon className="size-4" aria-hidden />
            <span className="tabular">
                {pct > 0 ? "+" : ""}
                {pct}%
            </span>
            <span className="text-ink-faint">vs previous 30 days</span>
        </p>
    );
}

/* Whole seven-day weeks ending today, from the 90 daily buckets. */
function toWeeks(daily: Overview["daily"]): WeekPoint[] {
    const days = daily;
    const weeks: WeekPoint[] = [];
    for (let i = days.length % 7; i < days.length; i += 7) {
        const slice = days.slice(i, i + 7);
        if (!slice[0]) continue;
        weeks.push({
            start: slice[0].date,
            revenueCents: slice.reduce((sum, d) => sum + d.revenueCents, 0),
            orders: slice.reduce((sum, d) => sum + d.orders, 0),
        });
    }
    return weeks;
}
