import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { OrderRow } from "@/components/account/order-views";
import { PageFallback, PageTitle } from "@/components/account/page-title";
import { requireUser } from "@/lib/session";
import { pluralize } from "@/lib/utils";
import { getCustomerOrders } from "@/server/orders";

export const metadata: Metadata = { title: "Orders", robots: { index: false } };

export default function OrdersPage() {
    return (
        <Suspense fallback={<PageFallback />}>
            <Orders />
        </Suspense>
    );
}

async function Orders() {
    const user = await requireUser("/account/orders");
    const orders = await getCustomerOrders(user.id);
    return (
        <>
            <PageTitle eyebrow="Orders" title="Your orders">
                {orders.length ? pluralize(orders.length, "order") : null}
            </PageTitle>
            {orders.length ? (
                <div>
                    {orders.map((order) => (
                        <OrderRow key={order.id} order={order} />
                    ))}
                </div>
            ) : (
                <p className="py-12 text-ink-soft">
                    Nothing here yet.{" "}
                    <Link href="/shop" className="text-ink link-underline">
                        Find something worth keeping
                    </Link>
                    .
                </p>
            )}
        </>
    );
}
