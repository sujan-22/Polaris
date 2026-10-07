"use client";

import { ArrowLeft, Inbox, LayoutGrid, Menu as MenuIcon, Package, Shirt, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Wordmark } from "@/components/logo";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { closeOnLinkClick, cn } from "@/lib/utils";

const SELLER = [
    { href: "/studio", label: "Overview", icon: LayoutGrid },
    { href: "/studio/products", label: "Products", icon: Shirt },
    { href: "/studio/orders", label: "Orders", icon: Package },
];

const ADMIN = [
    { href: "/studio/customers", label: "Customers", icon: Users },
    { href: "/studio/sellers", label: "Seller requests", icon: Inbox },
];

interface NavProps {
    admin: boolean;
    pendingRequests?: number;
    storeName?: string | null;
}

export function StudioNav(props: NavProps) {
    return <StudioNavLinks {...props} pathname={usePathname()} />;
}

/** Hook-free so it doubles as the Suspense fallback. */
export function StudioNavLinks({ admin, pendingRequests = 0, storeName, pathname }: NavProps & { pathname: string | null }) {
    const isActive = (href: string) => pathname !== null && (href === "/studio" ? pathname === href : pathname.startsWith(href));
    const item = (link: (typeof SELLER)[number], badge?: number) => (
        <li key={link.href}>
            <Link
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={cn(
                    "flex h-10 items-center gap-3 px-3 text-[0.9375rem] transition-colors [&_svg]:size-4",
                    isActive(link.href) ? "bg-paper text-ink shadow-[inset_2px_0_0_var(--ink)]" : "text-ink-soft hover:text-ink",
                )}
            >
                <link.icon aria-hidden />
                {link.label}
                {badge ? <span className="label ml-auto bg-ink px-1.5 py-1 text-paper">{badge}</span> : null}
            </Link>
        </li>
    );

    return (
        <nav aria-label="Studio" className="grid gap-8">
            <div>
                <p className="label px-3 pb-3 text-ink-faint">{storeName ?? "Your shop"}</p>
                <ul className="grid gap-0.5">{SELLER.map((link) => item(link))}</ul>
            </div>
            {admin ? (
                <div>
                    <p className="label px-3 pb-3 text-ink-faint">Store admin</p>
                    <ul className="grid gap-0.5">{ADMIN.map((link) => item(link, link.href === "/studio/sellers" ? pendingRequests : undefined))}</ul>
                </div>
            ) : null}
        </nav>
    );
}

export function StudioMobileBar({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-rule bg-paper/95 px-[var(--gutter)] backdrop-blur lg:hidden">
            <Link href="/studio" className="flex items-center gap-3 text-[0.8125rem]">
                <Wordmark />
                <span className="label text-ink-faint">Studio</span>
            </Link>
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger className="-mr-2 inline-flex size-10 items-center justify-center">
                    <MenuIcon className="size-5" aria-hidden />
                    <span className="sr-only">Studio menu</span>
                </SheetTrigger>
                <SheetContent side="left" className="bg-paper-2" onClick={closeOnLinkClick(() => setOpen(false))}>
                    <SheetHeader>
                        <SheetTitle className="label">Studio</SheetTitle>
                    </SheetHeader>
                    <SheetDescription className="sr-only">Studio navigation</SheetDescription>
                    <div className="flex-1 overflow-y-auto p-3">{children}</div>
                    <Link href="/" className="flex items-center gap-2 border-t border-rule px-6 py-4 text-sm text-ink-soft">
                        <ArrowLeft className="size-4" aria-hidden /> Back to the store
                    </Link>
                </SheetContent>
            </Sheet>
        </div>
    );
}
