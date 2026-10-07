import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { BagLineItem, CheckoutButton, ShippingMeter } from "@/components/store/bag";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/money";
import { TAX_RATE } from "@/lib/pricing";
import { getCurrentUser } from "@/lib/session";
import { isTestMode } from "@/lib/stripe";
import { pluralize } from "@/lib/utils";
import { getCart } from "@/server/cart";

export const metadata: Metadata = { title: "Your bag", robots: { index: false } };

export default function CartPage() {
    return (
        <div className="shell pt-8 pb-24 lg:pt-12 lg:pb-32">
            <h1 className="type-title border-b border-ink pb-8">Your bag</h1>
            <Suspense fallback={<div className="h-96" aria-busy />}>
                <Cart />
            </Suspense>
        </div>
    );
}

async function Cart() {
    const [cart, user] = await Promise.all([getCart(), getCurrentUser()]);

    if (cart.lines.length === 0) {
        return (
            <div className="grid place-items-start gap-6 py-20">
                <p className="type-heading">There&apos;s nothing in here yet.</p>
                <p className="max-w-md text-ink-soft">Your bag is saved to this browser, and to your account once you sign in.</p>
                <Button asChild size="lg">
                    <Link href="/shop">Start shopping</Link>
                </Button>
            </div>
        );
    }

    const { totals } = cart;
    return (
        <div className="grid gap-12 pt-4 lg:grid-cols-12 lg:gap-10">
            <section className="lg:col-span-7" aria-label="Items">
                <p className="label py-4 text-ink-faint">{pluralize(cart.count, "item")}</p>
                <ul className="divide-y divide-rule border-y border-rule">
                    {cart.lines.map((line) => (
                        <li key={line.id}>
                            <BagLineItem line={line} />
                        </li>
                    ))}
                </ul>
            </section>

            <aside className="lg:col-span-5 lg:col-start-8">
                <div className="grid gap-6 bg-paper-2 p-6 sm:p-8 lg:sticky lg:top-[calc(var(--header-height)+2rem)]">
                    <p className="label text-ink-faint">Summary</p>
                    <dl className="tabular grid gap-3 text-[0.9375rem]">
                        <Row label="Subtotal" value={formatPrice(totals.subtotalCents)} />
                        <Row label="Shipping" value={totals.shippingCents === 0 ? "Free" : formatPrice(totals.shippingCents)} />
                        <Row label={`HST (${Math.round(TAX_RATE * 100)}%)`} value={formatPrice(totals.taxCents)} />
                        <div className="mt-2 flex items-baseline justify-between border-t border-rule-strong pt-4">
                            <dt className="font-medium">Total</dt>
                            <dd className="text-2xl font-medium tracking-tight">{formatPrice(totals.totalCents)}</dd>
                        </div>
                    </dl>
                    <ShippingMeter subtotalCents={totals.subtotalCents} />
                    <div className="grid gap-3">
                        <CheckoutButton signedIn={Boolean(user)} size="lg" label="Check out securely" />
                    </div>
                    {isTestMode() ? (
                        <p className="border-l-2 border-ink pl-3 text-sm leading-relaxed text-ink-soft">
                            This store runs in Stripe test mode. Pay with card <span className="tabular text-ink">4242 4242 4242 4242</span>, any
                            future expiry and any CVC. Nothing is charged.
                        </p>
                    ) : null}
                </div>
            </aside>
        </div>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-baseline justify-between">
            <dt className="text-ink-soft">{label}</dt>
            <dd>{value}</dd>
        </div>
    );
}
