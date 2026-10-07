import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { FulfillmentActions } from "@/components/studio/fulfillment-actions";
import { Badge, StudioFallback, StudioHeader } from "@/components/studio/studio-header";
import { asAddress, FULFILLMENT_LABEL } from "@/lib/orders";
import { formatPrice } from "@/lib/money";
import { requireSeller } from "@/lib/session";
import { cn, formatDate } from "@/lib/utils";
import { getFulfillmentCounts, getStudioOrders, type OrderFilter } from "@/server/studio";

export const metadata: Metadata = { title: "Orders" };

const FILTERS: { key: OrderFilter; label: string }[] = [
    { key: "to-ship", label: "To ship" },
    { key: "shipped", label: "Shipped" },
    { key: "delivered", label: "Delivered" },
    { key: "all", label: "All" },
];

export default function OrdersPage({ searchParams }: PageProps<"/studio/orders">) {
    return (
        <Suspense fallback={<StudioFallback />}>
            <Orders searchParams={searchParams} />
        </Suspense>
    );
}

async function Orders({ searchParams }: Pick<PageProps<"/studio/orders">, "searchParams">) {
    const user = await requireSeller();
    const raw = (await searchParams).filter;
    const filter = FILTERS.find((f) => f.key === raw)?.key ?? "to-ship";
    const admin = user.role === "admin";
    const [orders, counts] = await Promise.all([getStudioOrders(user, filter), getFulfillmentCounts(user)]);

    return (
        <>
            <StudioHeader
                eyebrow={admin ? "Every seller" : (user.storeName ?? "Your shop")}
                title="Orders"
                description={admin ? "Each seller ships their own lines; you can step in on any of them." : "Only your items are shown. Ship them, then mark them delivered."}
            />

            <nav aria-label="Filter orders" className="mt-6 flex gap-6 border-b border-rule">
                {FILTERS.map((f) => (
                    <Link
                        key={f.key}
                        href={f.key === "to-ship" ? "/studio/orders" : `/studio/orders?filter=${f.key}`}
                        aria-current={filter === f.key ? "page" : undefined}
                        className={cn("-mb-px flex items-center gap-1.5 border-b-2 py-3 text-sm", filter === f.key ? "border-ink" : "border-transparent text-ink-soft hover:text-ink")}
                    >
                        {f.label}
                        <span className="tabular text-xs text-ink-faint">{counts[f.key]}</span>
                    </Link>
                ))}
            </nav>

            {orders.length === 0 ? (
                <p className="py-16 text-ink-soft">{filter === "to-ship" ? "Nothing waiting to ship. Nice." : "No orders here yet."}</p>
            ) : (
                <ul className="mt-2">
                    {orders.map((order) => {
                        const address = asAddress(order.shippingAddress);
                        const waiting = order.items.filter((i) => i.fulfillment === "unfulfilled").map((i) => i.id);
                        const sellerTotal = order.items.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0);
                        return (
                            <li key={order.id} className="border-b border-rule py-6">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <p className="tabular font-medium">{order.number}</p>
                                        <p className="mt-1 text-sm text-ink-soft">
                                            {formatDate(order.createdAt)} · {address?.name ?? order.user.name}
                                            {address ? ` · ${address.city}, ${address.state}` : ""}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="tabular text-sm text-ink-soft">{formatPrice(sellerTotal)}</span>
                                        {waiting.length > 1 ? <FulfillmentActions itemIds={waiting} current="unfulfilled" all /> : null}
                                    </div>
                                </div>
                                <ul className="mt-4 grid gap-3">
                                    {order.items.map((item) => (
                                        <li key={item.id} className="grid grid-cols-[auto_1fr] items-center gap-4 sm:grid-cols-[auto_1fr_auto_auto]">
                                            <div className="studio relative aspect-[4/5] w-12 overflow-hidden">
                                                {item.image ? <Image src={item.image} alt="" fill sizes="48px" className="object-cover" /> : null}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate text-[0.9375rem]">
                                                    {item.name} <span className="text-ink-faint">× {item.quantity}</span>
                                                </p>
                                                <p className="truncate text-sm text-ink-faint">
                                                    {item.color} · {item.size}
                                                    {admin && item.seller ? ` · ${item.seller.storeName ?? item.seller.name}` : ""}
                                                </p>
                                            </div>
                                            <div className="col-start-2 sm:col-start-auto">
                                                <Badge tone={item.fulfillment}>{FULFILLMENT_LABEL[item.fulfillment]}</Badge>
                                            </div>
                                            <div className="col-start-2 sm:col-start-auto">
                                                <FulfillmentActions itemIds={[item.id]} current={item.fulfillment} />
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </li>
                        );
                    })}
                </ul>
            )}
        </>
    );
}
