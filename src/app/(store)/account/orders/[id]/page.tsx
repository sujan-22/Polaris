import { Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { OrderDetail } from "@/components/account/order-views";
import { PageFallback } from "@/components/account/page-title";
import { requireUser } from "@/lib/session";
import { formatDate } from "@/lib/utils";
import { getCustomerOrder } from "@/server/orders";

export const metadata: Metadata = { title: "Order", robots: { index: false } };

export default function OrderPage({ params, searchParams }: PageProps<"/account/orders/[id]">) {
    return (
        <Suspense fallback={<PageFallback />}>
            <Order params={params} searchParams={searchParams} />
        </Suspense>
    );
}

/*
 * Also the page shoppers land on after paying: /api/checkout/complete
 * finishes the order and redirects here with ?placed=1.
 */
async function Order({ params, searchParams }: PageProps<"/account/orders/[id]">) {
    const [{ id }, query] = await Promise.all([params, searchParams]);
    const user = await requireUser(`/account/orders/${id}`);
    const order = await getCustomerOrder(user.id, id);
    if (!order) notFound();
    const justPaid = query.placed === "1";

    return (
        <>
            {justPaid && order.status === "paid" ? (
                <div className="mb-10 flex items-start gap-4 bg-ink p-6 text-on-ink sm:p-8">
                    <span className="grid size-8 shrink-0 place-items-center bg-on-ink text-ink">
                        <Check className="size-4" strokeWidth={2.5} aria-hidden />
                    </span>
                    <div>
                        <p className="type-subheading">Thank you. Your order is in.</p>
                        <p className="mt-2 text-on-ink-soft">
                            It&apos;s in each seller&apos;s queue now. They ship their own items, so you can follow each one below.
                        </p>
                    </div>
                </div>
            ) : null}

            <header className="border-b border-ink pb-8">
                <Link href="/account/orders" className="label text-ink-faint hover:text-ink">
                    ← Orders
                </Link>
                <h1 className="type-title tabular mt-6">{order.number}</h1>
                <p className="mt-4 text-ink-soft">
                    Placed {formatDate(order.createdAt)}
                    {order.status === "pending" ? " · Awaiting payment" : order.status === "cancelled" ? " · Cancelled" : ""}
                </p>
            </header>
            <div className="mt-10">
                <OrderDetail order={order} />
            </div>
        </>
    );
}
