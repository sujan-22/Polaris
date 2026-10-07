import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { OrderRow } from "@/components/account/order-views";
import { PageFallback, PageTitle } from "@/components/account/page-title";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getCustomerOrders } from "@/server/orders";

export const metadata: Metadata = { title: "Your account", robots: { index: false } };

export default function AccountPage() {
    return (
        <Suspense fallback={<PageFallback />}>
            <Overview />
        </Suspense>
    );
}

async function Overview() {
    const user = await requireUser("/account");
    const [orders, request] = await Promise.all([
        getCustomerOrders(user.id, 3),
        prisma.sellerRequest.findUnique({ where: { userId: user.id }, select: { status: true, storeName: true } }),
    ]);
    const first = user.name.split(" ")[0];

    return (
        <>
            <PageTitle eyebrow="Overview" title={<>Hello, {first}.</>}>
                Signed in as {user.email}.
            </PageTitle>

            <section className="mt-12">
                <div className="flex items-baseline justify-between">
                    <h2 className="type-subheading">Recent orders</h2>
                    {orders.length ? (
                        <Link href="/account/orders" className="text-sm link-underline">
                            All orders
                        </Link>
                    ) : null}
                </div>
                {orders.length ? (
                    <div className="mt-4 border-t border-rule">
                        {orders.map((order) => (
                            <OrderRow key={order.id} order={order} />
                        ))}
                    </div>
                ) : (
                    <div className="mt-4 grid place-items-start gap-5 border-t border-rule py-10">
                        <p className="text-ink-soft">No orders yet. When you buy something it shows up here.</p>
                        <Button asChild variant="outline">
                            <Link href="/shop">Start shopping</Link>
                        </Button>
                    </div>
                )}
            </section>

            <section className="mt-16 grid gap-px border border-rule bg-rule sm:grid-cols-2">
                <div className="bg-paper p-6 sm:p-8">
                    <p className="label text-ink-faint">Profile</p>
                    <p className="mt-4 text-ink-soft">Change your name or password, or close your account.</p>
                    <Link href="/account/profile" className="mt-6 inline-block text-sm font-medium link-underline">
                        Edit profile
                    </Link>
                </div>
                <div className="bg-paper p-6 sm:p-8">
                    <p className="label text-ink-faint">Selling</p>
                    <p className="mt-4 text-ink-soft">
                        {user.role !== "user"
                            ? `You sell on Polaris${user.storeName ? ` as ${user.storeName}` : ""}.`
                            : request?.status === "pending"
                              ? `Your application for ${request.storeName} is being reviewed.`
                              : "Make things worth coming back to? Apply to open a shelf."}
                    </p>
                    <Link href={user.role !== "user" ? "/studio" : "/account/selling"} className="mt-6 inline-block text-sm font-medium link-underline">
                        {user.role !== "user" ? "Open the studio" : request ? "View application" : "Apply to sell"}
                    </Link>
                </div>
            </section>
        </>
    );
}
