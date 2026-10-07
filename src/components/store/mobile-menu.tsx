"use client";

import { Menu as MenuIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CATEGORIES, DEPARTMENTS } from "@/lib/catalog";
import { closeOnLinkClick } from "@/lib/utils";

export function MobileMenu() {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="-ml-2 inline-flex size-10 items-center justify-center hover:bg-paper-2 lg:hidden">
                <MenuIcon className="size-5" aria-hidden />
                <span className="sr-only">Menu</span>
            </SheetTrigger>
            <SheetContent side="left" aria-describedby={undefined} onClick={closeOnLinkClick(() => setOpen(false))}>
                <SheetHeader>
                    <SheetTitle className="label">Menu</SheetTitle>
                </SheetHeader>
                <SheetDescription className="sr-only">Site navigation</SheetDescription>
                <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-5 py-6">
                    <ul className="grid gap-1">
                        {[
                            ["/shop", "Shop everything"],
                            ["/shop?shelf=new", "New arrivals"],
                            ["/shop?shelf=picks", "Weekly picks"],
                            ["/shop?shelf=sale", "Sale"],
                        ].map(([href, label]) => (
                            <li key={href}>
                                <Link href={href!} className="type-subheading block py-1.5">
                                    {label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                    {DEPARTMENTS.map((department) => (
                        <div key={department.slug} className="mt-8 border-t border-rule pt-5">
                            <p className="label mb-3 text-ink-faint">{department.name}</p>
                            <ul className="grid grid-cols-2 gap-y-2.5">
                                {CATEGORIES.filter((c) => c.department === department.slug).map((category) => (
                                    <li key={category.slug}>
                                        <Link href={`/shop/${category.slug}`} className="text-[0.9375rem]">
                                            {category.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </nav>
                <div className="grid grid-cols-2 gap-px border-t border-rule bg-rule pb-[env(safe-area-inset-bottom)]">
                    <Link href="/account" className="bg-paper px-5 py-4 text-sm">
                        Account
                    </Link>
                    <Link href="/sell" className="bg-paper px-5 py-4 text-sm">
                        Sell with us
                    </Link>
                </div>
            </SheetContent>
        </Sheet>
    );
}
