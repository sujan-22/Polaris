import Link from "next/link";

import { Mark } from "@/components/logo";
import { CATEGORIES } from "@/lib/catalog";

const COLUMNS = [
    {
        title: "Shop",
        links: [
            ["/shop", "Everything"],
            ["/shop?shelf=new", "New arrivals"],
            ["/shop?shelf=picks", "Weekly picks"],
            ["/shop?shelf=sale", "Sale"],
        ],
    },
    {
        title: "Departments",
        links: CATEGORIES.map((c) => [`/shop/${c.slug}`, c.name]),
    },
    {
        title: "Polaris",
        links: [
            ["/sell", "Sell with us"],
            ["/help", "Shipping and returns"],
            ["/help#test-mode", "About this store"],
            ["/account", "Your account"],
        ],
    },
] as const;

export function SiteFooter() {
    return (
        <footer className="bg-ink text-on-ink">
            <div className="shell grid gap-14 pt-20 pb-10 lg:grid-cols-12 lg:gap-6 lg:pt-28">
                <div className="lg:col-span-5">
                    <Mark className="w-12 text-on-ink" />
                    <p className="type-heading mt-8 max-w-[14ch] text-balance">
                        Things to <span className="accent">come back</span> to.
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:col-span-7">
                    {COLUMNS.map((column) => (
                        <div key={column.title}>
                            <p className="label text-on-ink-faint">{column.title}</p>
                            <ul className="mt-5 grid gap-2.5">
                                {column.links.map(([href, label]) => (
                                    <li key={href}>
                                        <Link href={href} className="text-[0.9375rem] text-on-ink-soft transition-colors hover:text-on-ink">
                                            {label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
            <div className="shell flex flex-col gap-3 border-t border-white/10 py-6 text-sm text-on-ink-faint sm:flex-row sm:items-center sm:justify-between">
                <p>© 2026 Polaris</p>
                <p>A demo store. Payments run in Stripe test mode, so nothing is charged or shipped.</p>
            </div>
        </footer>
    );
}

export function AnnouncementBar() {
    return (
        <div className="bg-ink text-on-ink">
            <div className="shell label flex h-9 items-center justify-center gap-8 text-on-ink-soft">
                <span>Free shipping in Canada over $100</span>
                <span className="hidden sm:inline">30-day returns</span>
                <span className="hidden md:inline">Every seller reviewed by hand</span>
            </div>
        </div>
    );
}
