import type { Metadata } from "next";
import Link from "next/link";

import { formatPrice } from "@/lib/money";
import { FLAT_SHIPPING_CENTS, FREE_SHIPPING_THRESHOLD_CENTS, TAX_RATE } from "@/lib/pricing";

export const metadata: Metadata = {
    title: "Shipping and returns",
    description: "How shipping, returns and payment work at Polaris.",
};

const SECTIONS = [
    {
        id: "shipping",
        title: "Shipping",
        body: [
            `Every order ships within Canada. Shipping is free on orders over ${formatPrice(FREE_SHIPPING_THRESHOLD_CENTS)} and a flat ${formatPrice(FLAT_SHIPPING_CENTS)} otherwise.`,
            "Each seller ships their own items, usually within two business days, so a bag with goods from two sellers may arrive in two parcels. Delivery takes three to seven business days. You can follow every item from your orders page.",
        ],
    },
    {
        id: "returns",
        title: "Returns",
        body: [
            "Changed your mind? Return anything unworn and unused within 30 days of delivery. Baby items and anything that touches skin must be unopened.",
        ],
    },
    {
        id: "payment",
        title: "Payment and tax",
        body: [
            `Checkout runs on Stripe, so your card details go straight to them and never touch our servers. Prices are in Canadian dollars; Ontario HST (${Math.round(TAX_RATE * 100)}%) is added at checkout, on shipping too.`,
        ],
    },
    {
        id: "test-mode",
        title: "About this store",
        body: [
            "Polaris is a demo store, built as a portfolio project. The goods, sellers and order history are made up, and payments run in Stripe's test mode: pay with card 4242 4242 4242 4242, any future expiry and any CVC. Nothing is charged and nothing ships.",
        ],
    },
];

export default function HelpPage() {
    return (
        <div className="shell grid gap-12 pt-10 pb-24 lg:grid-cols-12 lg:gap-6 lg:pt-16 lg:pb-32">
            <div className="lg:col-span-4">
                <p className="label text-ink-faint">Help</p>
                <h1 className="type-title mt-8">Shipping, returns and the rest.</h1>
                <nav aria-label="On this page" className="mt-10 hidden lg:block">
                    <ul className="grid gap-2">
                        {SECTIONS.map((s) => (
                            <li key={s.id}>
                                <a href={`#${s.id}`} className="text-ink-soft hover:text-ink">
                                    {s.title}
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
                {SECTIONS.map((section) => (
                    <section key={section.id} id={section.id} className="border-t border-ink py-10 first:pt-6">
                        <h2 className="type-subheading">{section.title}</h2>
                        {section.body.map((p) => (
                            <p key={p} className="mt-4 max-w-2xl leading-relaxed text-ink-soft">
                                {p}
                            </p>
                        ))}
                    </section>
                ))}
                <p className="border-t border-rule pt-8 text-ink-soft">
                    Still stuck?{" "}
                    <Link href="/account/orders" className="text-ink link-underline">
                        Check your orders
                    </Link>{" "}
                    or start again from the{" "}
                    <Link href="/shop" className="text-ink link-underline">
                        shop
                    </Link>
                    .
                </p>
            </div>
        </div>
    );
}
