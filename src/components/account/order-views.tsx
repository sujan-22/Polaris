import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { asAddress, FULFILLMENT_LABEL, orderProgress, PROGRESS_LABEL, PROGRESS_STEP } from "@/lib/orders";
import { formatPrice } from "@/lib/money";
import { cn, formatDate, pluralize } from "@/lib/utils";
import type { OrderWithItems } from "@/server/orders";

/* One order in a list: thumbnails, reference, date, status, total. */
export function OrderRow({ order }: { order: OrderWithItems }) {
    const progress = orderProgress(order.status, order.items);
    const count = order.items.reduce((n, i) => n + i.quantity, 0);
    return (
        <Link href={`/account/orders/${order.id}`} className="group grid gap-5 border-b border-rule py-6 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-8">
            <div className="flex -space-x-3">
                {order.items.slice(0, 3).map((item) => (
                    <div key={item.id} className="studio relative aspect-[4/5] w-14 overflow-hidden ring-2 ring-paper">
                        {item.image ? <Image src={item.image} alt="" fill sizes="56px" className="object-cover" /> : null}
                    </div>
                ))}
            </div>
            <div className="min-w-0">
                <p className="label text-ink-faint">
                    {order.number} · {formatDate(order.createdAt)}
                </p>
                <p className="mt-2 truncate font-medium group-hover:underline group-hover:underline-offset-4">
                    {order.items.map((i) => i.name).join(", ")}
                </p>
                <p className="mt-1 text-sm text-ink-soft">
                    {pluralize(count, "item")} · <StatusText progress={progress} />
                </p>
            </div>
            <div className="flex items-center justify-between gap-6 sm:justify-end">
                <span className="tabular">{formatPrice(order.totalCents)}</span>
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
            </div>
        </Link>
    );
}

function StatusText({ progress }: { progress: ReturnType<typeof orderProgress> }) {
    return (
        <span className={cn(progress === "delivered" ? "text-success" : progress === "cancelled" ? "text-signal" : "text-ink")}>
            {PROGRESS_LABEL[progress]}
        </span>
    );
}

const STEPS = ["Ordered", "Shipped", "Delivered"];

/* The full order: progress track, lines, address and totals. */
export function OrderDetail({ order }: { order: OrderWithItems }) {
    const progress = orderProgress(order.status, order.items);
    const step = PROGRESS_STEP[progress];
    const address = asAddress(order.shippingAddress);

    return (
        <div className="grid gap-12">
            {order.status === "paid" ? (
                <ol className="grid grid-cols-3" aria-label={`Status: ${PROGRESS_LABEL[progress]}`}>
                    {STEPS.map((label, i) => (
                        <li key={label} className={cn("border-t-2 pt-3", i <= step ? "border-ink" : "border-rule")}>
                            <span className={cn("label", i <= step ? "text-ink" : "text-ink-faint")}>{label}</span>
                        </li>
                    ))}
                </ol>
            ) : null}

            <section aria-label="Items">
                <ul className="divide-y divide-rule border-y border-rule">
                    {order.items.map((item) => (
                        <li key={item.id} className="grid grid-cols-[auto_1fr_auto] gap-5 py-5">
                            <Link href={`/products/${item.slug}`} className="studio relative block aspect-[4/5] w-20 overflow-hidden">
                                {item.image ? <Image src={item.image} alt="" fill sizes="80px" className="object-cover" /> : null}
                            </Link>
                            <div className="min-w-0">
                                <Link href={`/products/${item.slug}`} className="font-medium hover:underline hover:underline-offset-4">
                                    {item.name}
                                </Link>
                                <p className="mt-1 text-sm text-ink-soft">
                                    {item.color} · {item.size} · Qty {item.quantity}
                                </p>
                                {order.status === "paid" ? (
                                    <p className="label mt-3 text-ink-faint">{FULFILLMENT_LABEL[item.fulfillment]}</p>
                                ) : null}
                            </div>
                            <p className="tabular">{formatPrice(item.unitPriceCents * item.quantity)}</p>
                        </li>
                    ))}
                </ul>
            </section>

            <div className="grid gap-10 sm:grid-cols-2">
                <section>
                    <p className="label border-b border-rule pb-3 text-ink-faint">Shipping to</p>
                    {address ? (
                        <address className="mt-4 leading-relaxed not-italic">
                            {address.name}
                            <br />
                            {address.line1}
                            {address.line2 ? (
                                <>
                                    <br />
                                    {address.line2}
                                </>
                            ) : null}
                            <br />
                            {address.city}, {address.state} {address.postalCode}
                        </address>
                    ) : (
                        <p className="mt-4 text-ink-soft">Collected at checkout.</p>
                    )}
                    <p className="mt-4 text-sm text-ink-soft">Contact: {order.email}</p>
                </section>
                <section>
                    <p className="label border-b border-rule pb-3 text-ink-faint">Payment</p>
                    <dl className="tabular mt-4 grid gap-2.5 text-[0.9375rem]">
                        <Line label="Subtotal" value={formatPrice(order.subtotalCents)} />
                        <Line label="Shipping" value={order.shippingCents === 0 ? "Free" : formatPrice(order.shippingCents)} />
                        <Line label="HST" value={formatPrice(order.taxCents)} />
                        <div className="mt-1 flex justify-between border-t border-rule pt-3 font-medium">
                            <dt>Total</dt>
                            <dd>{formatPrice(order.totalCents)}</dd>
                        </div>
                    </dl>
                </section>
            </div>
        </div>
    );
}

function Line({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between">
            <dt className="text-ink-soft">{label}</dt>
            <dd>{value}</dd>
        </div>
    );
}
