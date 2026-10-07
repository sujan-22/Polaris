"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const LINKS = [
    { href: "/account", label: "Overview" },
    { href: "/account/orders", label: "Orders" },
    { href: "/account/profile", label: "Profile" },
    { href: "/account/selling", label: "Selling" },
];

export function AccountNav() {
    return <AccountNavLinks pathname={usePathname()} />;
}

/** Hook-free, so it can also be the Suspense fallback (no active item). */
export function AccountNavLinks({ pathname }: { pathname: string | null }) {
    return (
        <nav aria-label="Account">
            <p className="label hidden border-b border-ink pb-4 text-ink-faint lg:block">Your account</p>
            <ul className="rail -mx-[var(--gutter)] auto-cols-max gap-6 border-b border-rule px-[var(--gutter)] lg:mx-0 lg:mt-4 lg:flex lg:flex-col lg:gap-1 lg:border-0 lg:px-0">
                {LINKS.map((link) => {
                    const active = pathname !== null && (link.href === "/account" ? pathname === link.href : pathname.startsWith(link.href));
                    return (
                        <li key={link.href}>
                            <Link
                                href={link.href}
                                aria-current={active ? "page" : undefined}
                                className={cn(
                                    "-mb-px block border-b-2 py-3.5 text-[0.9375rem] lg:mb-0 lg:border-b-0 lg:border-l-2 lg:py-2 lg:pl-4",
                                    active ? "border-ink text-ink" : "border-transparent text-ink-soft hover:text-ink",
                                )}
                            >
                                {link.label}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
