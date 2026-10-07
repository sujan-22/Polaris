"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { CATEGORIES, DEPARTMENTS } from "@/lib/catalog";
import { closeOnLinkClick, cn } from "@/lib/utils";

/*
 * The shop menu: a full-width panel under the header listing every
 * department and category, with one product photo per department. Opens
 * on hover for pointers and on click or Enter for everyone else.
 */
export function ShopMenu({ covers }: { covers: Record<string, string> }) {
    const [open, setOpen] = useState(false);
    const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
    const panelId = "shop-menu-panel";

    useEffect(() => {
        if (!open) return;
        const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open]);

    const show = () => {
        clearTimeout(closeTimer.current);
        setOpen(true);
    };
    const hide = () => {
        closeTimer.current = setTimeout(() => setOpen(false), 120);
    };

    return (
        <div onPointerEnter={(e) => e.pointerType === "mouse" && show()} onPointerLeave={(e) => e.pointerType === "mouse" && hide()}>
            <button
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpen((v) => !v)}
                className={cn("inline-flex h-10 items-center px-3 text-sm hover:underline hover:underline-offset-4", open && "underline underline-offset-4")}
            >
                Shop
            </button>

            <div
                id={panelId}
                hidden={!open}
                onClick={closeOnLinkClick(() => setOpen(false))}
                className="absolute inset-x-0 top-full border-b border-rule bg-paper shadow-[0_24px_48px_-32px_rgb(18_18_18/0.35)]"
            >
                <div className="shell grid grid-cols-12 gap-x-6 py-10">
                    <div className="col-span-3 flex flex-col gap-3 border-r border-rule pr-6">
                        <p className="label mb-2 text-ink-faint">Shelves</p>
                        <MenuLink href="/shop" big>
                            Shop everything
                        </MenuLink>
                        <MenuLink href="/shop?shelf=new" big>
                            New arrivals
                        </MenuLink>
                        <MenuLink href="/shop?shelf=picks" big>
                            Weekly picks
                        </MenuLink>
                        <MenuLink href="/shop?shelf=sale" big>
                            <span className="text-signal">Sale</span>
                        </MenuLink>
                    </div>
                    {DEPARTMENTS.map((department) => {
                        const categories = CATEGORIES.filter((c) => c.department === department.slug);
                        const cover = covers[categories[0]?.slug ?? ""];
                        return (
                            <div key={department.slug} className="col-span-3 grid grid-cols-[1fr_auto] gap-4">
                                <div className="flex flex-col gap-3">
                                    <p className="label mb-2 text-ink-faint">{department.name}</p>
                                    {categories.map((category) => (
                                        <MenuLink key={category.slug} href={`/shop/${category.slug}`}>
                                            {category.name}
                                        </MenuLink>
                                    ))}
                                </div>
                                {cover ? (
                                    <Link
                                        href={`/shop/${categories[0]!.slug}`}
                                        tabIndex={-1}
                                        aria-hidden
                                        className="studio relative hidden aspect-[4/5] w-24 overflow-hidden xl:block"
                                    >
                                        <Image src={cover} alt="" fill sizes="96px" className="object-cover" />
                                    </Link>
                                ) : null}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function MenuLink({ href, children, big = false }: { href: string; children: React.ReactNode; big?: boolean }) {
    return (
        <Link href={href} className={cn("w-fit hover:underline hover:underline-offset-4", big ? "text-[1.0625rem] font-medium tracking-tight" : "text-[0.9375rem]")}>
            {children}
        </Link>
    );
}
