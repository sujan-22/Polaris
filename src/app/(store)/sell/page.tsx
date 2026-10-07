import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Reveal } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { FLAT_SHIPPING_CENTS, FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/pricing";
import { formatPrice } from "@/lib/money";

export const metadata: Metadata = {
    title: "Sell with us",
    description: "Open a shelf on Polaris: apply, get reviewed by a person, list your goods and ship them yourself.",
};

const STEPS = [
    ["Apply", "Tell us your shop's name and what you make. It takes two minutes from your account."],
    ["Get reviewed", "A person reads every application. We look for goods that are made well and built to last."],
    ["List", "Add photos, colours, sizes and stock in the studio. Tag a photo with a colour and shoppers see it when they pick that colour."],
    ["Ship", "Orders land in your studio queue with only your items in them. Mark them shipped, then delivered."],
];

export default function SellPage() {
    return (
        <>
            <section className="shell grid gap-12 pt-10 pb-20 lg:grid-cols-12 lg:gap-6 lg:pt-16 lg:pb-28">
                <div className="lg:col-span-7">
                    <p className="label text-ink-faint">Sell with us</p>
                    <h1 className="type-display mt-8 text-balance">
                        Open a <span className="accent">shelf</span>.
                    </h1>
                    <p className="type-lead mt-8 max-w-lg text-ink-soft">
                        Polaris is a small store made of independent sellers. You keep your shop name, set your own prices and ship
                        your own orders. We handle the storefront, the bag and the checkout.
                    </p>
                    <div className="mt-10 flex flex-wrap gap-2">
                        <Button asChild size="lg">
                            <Link href="/account/selling">Apply to sell</Link>
                        </Button>
                        <Button asChild size="lg" variant="outline">
                            <Link href="/studio">Open the studio</Link>
                        </Button>
                    </div>
                </div>
                <div className="studio relative aspect-[4/5] overflow-hidden lg:col-span-4 lg:col-start-9">
                    <Image src="/products/hat-3.webp" alt="" fill priority sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" />
                </div>
            </section>

            <section className="bg-ink text-on-ink">
                <ol className="shell grid gap-px py-20 sm:grid-cols-2 lg:grid-cols-4 lg:py-28">
                    {STEPS.map(([title, body], i) => (
                        <Reveal as="li" key={title} delay={0.06 * i} className="border-t border-white/15 pt-6 pr-6 pb-10">
                            <p className="label text-on-ink-faint">{String(i + 1).padStart(2, "0")}</p>
                            <p className="type-subheading mt-6">{title}</p>
                            <p className="mt-3 leading-relaxed text-on-ink-soft">{body}</p>
                        </Reveal>
                    ))}
                </ol>
            </section>

            <section className="shell grid gap-10 py-20 lg:grid-cols-12 lg:gap-6 lg:py-28">
                <h2 className="type-title lg:col-span-5">The fine print, short.</h2>
                <dl className="grid gap-px border-t border-ink lg:col-span-6 lg:col-start-7">
                    {[
                        ["Fees", "None while Polaris is a demo. Payments run in Stripe test mode."],
                        ["Shipping", `Customers pay ${formatPrice(FLAT_SHIPPING_CENTS)} or nothing over ${formatPrice(FREE_SHIPPING_THRESHOLD_CENTS)}. You ship from wherever you are.`],
                        ["Returns", "Thirty days from delivery, for anything unworn."],
                        ["Leaving", "Archive your products whenever you like. Order history stays with your customers."],
                    ].map(([term, detail]) => (
                        <div key={term} className="grid gap-2 border-b border-rule py-6 sm:grid-cols-[10rem_1fr]">
                            <dt className="font-medium">{term}</dt>
                            <dd className="text-ink-soft">{detail}</dd>
                        </div>
                    ))}
                </dl>
            </section>
        </>
    );
}
