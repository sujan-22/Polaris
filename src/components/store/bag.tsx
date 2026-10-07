"use client";

import { Minus, Plus, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { createContext, use, useActionState, useOptimistic, useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";

import { setQuantity } from "@/actions/cart";
import { checkout } from "@/actions/checkout";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/field";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { formatPrice } from "@/lib/money";
import { FREE_SHIPPING_THRESHOLD_CENTS, untilFreeShipping } from "@/lib/pricing";
import { cn, pluralize } from "@/lib/utils";
import type { CartLine, CartView } from "@/server/cart";

/* Open state lives above the bag so "Add to bag" can open it. */
const BagContext = createContext<{ open: boolean; setOpen: (open: boolean) => void } | null>(null);

export function BagProvider({ children }: { children: ReactNode }) {
    const [open, setOpen] = useState(false);
    return <BagContext value={{ open, setOpen }}>{children}</BagContext>;
}

export function useBag() {
    const context = use(BagContext);
    if (!context) throw new Error("useBag must be used inside <BagProvider>");
    return context;
}

/** Placeholder while the bag streams in: same footprint, no count yet. */
export function BagButtonFallback() {
    return (
        <span className="inline-flex h-10 items-center gap-1.5 px-2 text-sm text-ink-soft">
            Bag <span className="tabular inline-block w-4" />
        </span>
    );
}

export function BagButton({ cart, signedIn }: { cart: CartView; signedIn: boolean }) {
    const { open, setOpen } = useBag();
    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="inline-flex h-10 items-center gap-1.5 px-2 text-sm hover:underline hover:underline-offset-4">
                Bag
                <span className="tabular" aria-label={pluralize(cart.count, "item")}>
                    ({cart.count})
                </span>
            </SheetTrigger>
            <SheetContent aria-describedby="bag-description">
                <SheetHeader>
                    <SheetTitle className="label">Your bag · {cart.count}</SheetTitle>
                </SheetHeader>
                <SheetDescription id="bag-description" className="sr-only">
                    Items in your bag and your order total.
                </SheetDescription>
                {cart.lines.length === 0 ? (
                    <div className="grid flex-1 place-content-center gap-6 px-8 text-center">
                        <p className="type-subheading">Your bag is empty.</p>
                        <p className="text-ink-soft">Have a look around. Everything ships free over $100.</p>
                        <Button asChild variant="outline" onClick={() => setOpen(false)}>
                            <Link href="/shop">Start shopping</Link>
                        </Button>
                    </div>
                ) : (
                    <>
                        <ul className="flex-1 divide-y divide-rule overflow-y-auto px-5">
                            {cart.lines.map((line) => (
                                <li key={line.id}>
                                    <BagLineItem line={line} compact onNavigate={() => setOpen(false)} />
                                </li>
                            ))}
                        </ul>
                        <div className="grid gap-4 border-t border-rule bg-paper px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                            <ShippingMeter subtotalCents={cart.totals.subtotalCents} />
                            <div className="flex items-baseline justify-between">
                                <span className="text-sm text-ink-soft">Subtotal</span>
                                <span className="tabular text-lg font-medium">{formatPrice(cart.totals.subtotalCents)}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <Button asChild variant="outline" onClick={() => setOpen(false)}>
                                    <Link href="/cart">View bag</Link>
                                </Button>
                                <CheckoutButton signedIn={signedIn} label="Check out" />
                            </div>
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}

export function ShippingMeter({ subtotalCents }: { subtotalCents: number }) {
    const remaining = untilFreeShipping(subtotalCents);
    const progress = Math.min(1, subtotalCents / FREE_SHIPPING_THRESHOLD_CENTS);
    return (
        <div className="grid gap-2.5">
            <p className="text-sm">
                {remaining === 0 ? (
                    "Your order ships free."
                ) : (
                    <>
                        <span className="tabular font-medium">{formatPrice(remaining)}</span> away from free shipping.
                    </>
                )}
            </p>
            <div className="h-px w-full bg-rule" aria-hidden>
                <div className="h-px bg-ink transition-[width] duration-500 ease-[var(--ease-out-expo)]" style={{ width: `${progress * 100}%` }} />
            </div>
        </div>
    );
}

export function CheckoutButton({ signedIn, label = "Check out", size = "md" }: { signedIn: boolean; label?: string; size?: "md" | "lg" }) {
    const [state, action, pending] = useActionState(checkout, {});
    if (!signedIn) {
        return (
            <Button asChild size={size}>
                <Link href="/sign-in?next=/cart">Sign in to check out</Link>
            </Button>
        );
    }
    return (
        <form action={action} className="contents">
            <Button type="submit" size={size} disabled={pending}>
                {pending ? "Opening checkout…" : label}
            </Button>
            {state.message ? (
                <div className="col-span-full">
                    <FormMessage>{state.message}</FormMessage>
                </div>
            ) : null}
        </form>
    );
}

/*
 * One bag line, used in the side sheet and on the bag page. Quantity
 * changes show immediately and settle when the server confirms.
 */
export function BagLineItem({ line, compact = false, onNavigate }: { line: CartLine; compact?: boolean; onNavigate?: () => void }) {
    const [quantity, setOptimisticQuantity] = useOptimistic(line.quantity);
    const [pending, startTransition] = useTransition();

    const change = (next: number) =>
        startTransition(async () => {
            setOptimisticQuantity(next);
            const result = await setQuantity(line.id, next);
            if (result.message) toast(result.message);
        });

    const short = !line.available;

    return (
        <div className={cn("grid grid-cols-[auto_1fr] gap-4 py-5", pending && "opacity-70")}>
            <Link href={`/products/${line.slug}`} onClick={onNavigate} className="studio relative block aspect-[4/5] w-20 overflow-hidden sm:w-24">
                {line.image ? <Image src={line.image} alt="" fill sizes="96px" className="object-cover" /> : null}
            </Link>
            <div className="flex min-w-0 flex-col">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <Link href={`/products/${line.slug}`} onClick={onNavigate} className="block truncate font-medium hover:underline hover:underline-offset-4">
                            {line.name}
                        </Link>
                        <p className="mt-1 text-sm text-ink-soft">
                            {line.color} · {line.size}
                        </p>
                        {!compact ? <p className="mt-1 text-sm text-ink-faint">Sold by {line.seller}</p> : null}
                    </div>
                    <p className="tabular shrink-0 text-right">
                        {formatPrice(line.unitPriceCents * quantity)}
                        {line.compareAtCents && line.compareAtCents > line.unitPriceCents ? (
                            <span className="block text-sm text-ink-faint line-through">{formatPrice(line.compareAtCents * quantity)}</span>
                        ) : null}
                    </p>
                </div>
                {short ? (
                    <p className="mt-2 text-sm text-signal">
                        {line.withdrawn
                            ? "No longer available. Remove it to check out."
                            : line.stock > 0
                              ? `Only ${line.stock} left. Lower the quantity to check out.`
                              : "Sold out. Remove it to check out."}
                    </p>
                ) : null}
                <div className="mt-auto flex items-center justify-between pt-3">
                    <div className="inline-flex h-9 items-center border border-rule">
                        <button
                            type="button"
                            onClick={() => change(quantity - 1)}
                            disabled={pending}
                            className="inline-flex size-9 items-center justify-center hover:bg-paper-2 disabled:opacity-40"
                            aria-label={`One fewer ${line.name}`}
                        >
                            <Minus className="size-3.5" aria-hidden />
                        </button>
                        <span className="tabular w-8 text-center text-sm" aria-live="polite">
                            {quantity}
                        </span>
                        <button
                            type="button"
                            onClick={() => change(quantity + 1)}
                            disabled={pending || quantity >= line.stock}
                            className="inline-flex size-9 items-center justify-center hover:bg-paper-2 disabled:opacity-40"
                            aria-label={`One more ${line.name}`}
                        >
                            <Plus className="size-3.5" aria-hidden />
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={() => change(0)}
                        disabled={pending}
                        className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink"
                    >
                        <X className="size-3.5" aria-hidden />
                        Remove
                    </button>
                </div>
            </div>
        </div>
    );
}
