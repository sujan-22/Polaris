"use client";

import { Check, ChevronDown, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/menu";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SORTS, type SortKey } from "@/lib/catalog";
import { closeOnLinkClick } from "@/lib/utils";

/* On small screens the filter panel lives in a sheet; it closes once a filter is applied. */
export function FilterSheet({ activeCount, children }: { activeCount: number; children: ReactNode }) {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="quiet" size="sm">
                    <SlidersHorizontal aria-hidden />
                    Filter{activeCount ? ` · ${activeCount}` : ""}
                </Button>
            </SheetTrigger>
            <SheetContent side="left" onClick={closeOnLinkClick(() => setOpen(false))}>
                <SheetHeader>
                    <SheetTitle className="label">Filter</SheetTitle>
                </SheetHeader>
                <SheetDescription className="sr-only">Narrow the goods shown by shelf, colour and size.</SheetDescription>
                <div className="flex-1 overflow-y-auto px-5 py-6">{children}</div>
            </SheetContent>
        </Sheet>
    );
}

export function SortMenu({ current, options }: { current: SortKey; options: { sort: SortKey; href: string }[] }) {
    return (
        <Menu>
            <MenuTrigger className="inline-flex h-9 items-center gap-1.5 text-sm outline-none">
                <span className="text-ink-soft">Sort:</span> {SORTS[current]}
                <ChevronDown className="size-4 text-ink-soft" aria-hidden />
            </MenuTrigger>
            <MenuContent align="end">
                {options.map((option) => (
                    <MenuItem key={option.sort} asChild>
                        <Link href={option.href} scroll={false} rel="nofollow">
                            <span className="w-4">{option.sort === current ? <Check aria-hidden /> : null}</span>
                            {SORTS[option.sort]}
                        </Link>
                    </MenuItem>
                ))}
            </MenuContent>
        </Menu>
    );
}
