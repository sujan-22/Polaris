"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { addToCart } from "@/actions/cart";
import { useBag } from "@/components/store/bag";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/menu";
import { COLORS, getCategory, sortSizes } from "@/lib/catalog";
import { formatPrice, percentOff } from "@/lib/money";
import { FLAT_SHIPPING_CENTS, FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/pricing";
import { cn } from "@/lib/utils";

export interface ProductViewData {
    id: string;
    slug: string;
    name: string;
    description: string;
    details: string[];
    category: string;
    priceCents: number;
    compareAtCents: number | null;
    seller: string;
    images: { id: string; url: string; color: string | null }[];
    variants: { id: string; color: string; size: string; stock: number }[];
}

/*
 * The buying half of the product page. Picking a colour moves the gallery to
 * that colour's photos; sizes that are out of stock in the chosen colour are
 * struck through rather than hidden, so nobody wonders whether XL exists.
 */
export function ProductView({ product }: { product: ProductViewData }) {
    const colors = useMemo(() => [...new Set(product.variants.map((v) => v.color))], [product.variants]);
    const sizes = useMemo(() => sortSizes(product.variants.map((v) => v.size)), [product.variants]);
    const inStock = (color: string) => product.variants.some((v) => v.color === color && v.stock > 0);

    const [color, setColor] = useState(() => colors.find(inStock) ?? colors[0] ?? "");
    const [size, setSize] = useState<string | null>(sizes.length === 1 ? sizes[0]! : null);
    const [pending, startTransition] = useTransition();
    const [hint, setHint] = useState(false);
    const { setOpen } = useBag();
    const galleryRef = useRef<HTMLDivElement>(null);

    const variant = size ? product.variants.find((v) => v.color === color && v.size === size) : undefined;
    const soldOut = product.variants.every((v) => v.stock <= 0);
    const off = percentOff(product.priceCents, product.compareAtCents);
    const category = getCategory(product.category);

    const images = useMemo(() => {
        const matching = product.images.filter((i) => i.color === color);
        const shared = product.images.filter((i) => !i.color);
        const list = matching.length ? [...matching, ...shared] : product.images;
        return list.length ? list : product.images;
    }, [product.images, color]);

    const pickColor = (next: string) => {
        setColor(next);
        galleryRef.current?.scrollTo({ left: 0, behavior: "smooth" });
        const still = product.variants.find((v) => v.color === next && v.size === size);
        if (size && sizes.length > 1 && (!still || still.stock <= 0)) setSize(null);
    };

    const add = () => {
        if (!variant) {
            setHint(true);
            return;
        }
        startTransition(async () => {
            const result = await addToCart({ variantId: variant.id });
            if (!result.ok) {
                toast(result.message ?? "Couldn't add that to your bag.");
                return;
            }
            if (result.message) toast(result.message);
            setOpen(true);
        });
    };

    const label = soldOut
        ? "Sold out"
        : pending
          ? "Adding…"
          : variant && variant.stock <= 0
            ? "Sold out in this size"
            : !variant
              ? "Add to bag"
              : `Add to bag · ${formatPrice(product.priceCents)}`;

    return (
        <div className="grid gap-x-10 gap-y-8 lg:grid-cols-12">
            {/* Gallery: a swipeable rail on phones, a stacked sheet on desktop. */}
            <div className="-mx-[var(--gutter)] lg:col-span-7 lg:mx-0">
                <div ref={galleryRef} className="rail auto-cols-[88%] gap-2 px-[var(--gutter)] sm:auto-cols-[60%] lg:grid-flow-row lg:auto-cols-auto lg:grid-cols-2 lg:gap-3 lg:overflow-visible lg:px-0">
                    {images.map((image, i) => (
                        <div
                            key={image.id}
                            className={cn(
                                "studio relative aspect-[4/5] overflow-hidden",
                                // Lead photo full width; an odd one out at the end too.
                                (i === 0 || (i === images.length - 1 && images.length % 2 === 0)) && "lg:col-span-2",
                            )}
                        >
                            <Image
                                src={image.url}
                                alt={i === 0 ? `${product.name} in ${color}` : ""}
                                fill
                                priority={i === 0}
                                sizes={i === 0 ? "(min-width: 1024px) 58vw, 88vw" : "(min-width: 1024px) 29vw, 88vw"}
                                className="object-cover"
                            />
                        </div>
                    ))}
                </div>
                {images.length > 1 ? (
                    <p className="label mt-3 px-[var(--gutter)] text-ink-faint lg:hidden">
                        {images.length} photos · swipe
                    </p>
                ) : null}
            </div>

            <div className="lg:col-span-5">
                <div className="lg:sticky lg:top-[calc(var(--header-height)+2rem)]">
                    <nav aria-label="Breadcrumb" className="label flex gap-2 text-ink-faint">
                        <Link href="/shop" className="hover:text-ink">
                            Shop
                        </Link>
                        <span aria-hidden>/</span>
                        <Link href={`/shop/${product.category}`} className="hover:text-ink">
                            {category?.name ?? product.category}
                        </Link>
                    </nav>

                    <h1 className="type-title mt-6 text-balance">{product.name}</h1>

                    <div className="mt-5 flex items-baseline gap-3">
                        <p className={cn("tabular text-xl", off && "text-signal")}>{formatPrice(product.priceCents)}</p>
                        {off ? (
                            <>
                                <p className="tabular text-ink-faint line-through">{formatPrice(product.compareAtCents!)}</p>
                                <span className="label bg-signal px-2 py-1.5 text-white">−{off}%</span>
                            </>
                        ) : null}
                    </div>
                    <p className="mt-2 text-sm text-ink-faint">Sold by {product.seller} · HST calculated at checkout</p>

                    <p className="mt-8 max-w-md text-pretty leading-relaxed text-ink-soft">{product.description}</p>

                    {/* Colour */}
                    <fieldset className="mt-10">
                        <legend className="label flex w-full justify-between text-ink-faint">
                            <span>Colour</span>
                            <span className="text-ink">{color}</span>
                        </legend>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {colors.map((c) => {
                                const available = inStock(c);
                                return (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => pickColor(c)}
                                        aria-pressed={c === color}
                                        aria-label={`${c}${available ? "" : ", sold out"}`}
                                        className={cn(
                                            "relative grid size-11 place-items-center border transition-colors",
                                            c === color ? "border-ink" : "border-rule hover:border-ink-soft",
                                        )}
                                    >
                                        <span
                                            className="size-7 rounded-full shadow-[inset_0_0_0_1px_rgb(18_18_18/0.18)]"
                                            style={{ background: COLORS[c] ?? "#999" }}
                                        />
                                        {!available ? <span className="absolute h-px w-[140%] rotate-[-45deg] bg-ink-soft" aria-hidden /> : null}
                                    </button>
                                );
                            })}
                        </div>
                    </fieldset>

                    {/* Size */}
                    {sizes.length > 1 || sizes[0] !== "One size" ? (
                        <fieldset className="mt-8">
                            <legend className="label flex w-full justify-between text-ink-faint">
                                <span>Size</span>
                                {hint && !size ? <span className="text-signal">Choose a size</span> : <span className="text-ink">{size ?? ""}</span>}
                            </legend>
                            <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(3.5rem,1fr))] gap-2">
                                {sizes.map((s) => {
                                    const v = product.variants.find((x) => x.color === color && x.size === s);
                                    const out = !v || v.stock <= 0;
                                    return (
                                        <button
                                            key={s}
                                            type="button"
                                            disabled={out}
                                            onClick={() => {
                                                setSize(s);
                                                setHint(false);
                                            }}
                                            aria-pressed={s === size}
                                            aria-label={`${s}${out ? ", sold out" : ""}`}
                                            className={cn(
                                                "tabular h-12 border text-sm transition-colors",
                                                s === size ? "border-ink bg-ink text-paper" : "border-rule hover:border-ink",
                                                out && "cursor-not-allowed border-rule text-ink-faint line-through decoration-ink-faint hover:border-rule",
                                            )}
                                        >
                                            {s}
                                        </button>
                                    );
                                })}
                            </div>
                        </fieldset>
                    ) : null}

                    <div className="mt-8 grid gap-3">
                        <Button size="lg" onClick={add} disabled={soldOut || pending || Boolean(variant && variant.stock <= 0)} className="w-full">
                            {label}
                        </Button>
                        <p className="min-h-5 text-sm text-ink-soft" aria-live="polite">
                            {variant && variant.stock > 0 && variant.stock <= 5
                                ? `Only ${variant.stock} left in ${color}, ${variant.size}.`
                                : soldOut
                                  ? "This one's gone for now."
                                  : null}
                        </p>
                    </div>

                    <Accordion type="multiple" defaultValue={["details"]} className="mt-6 border-t border-rule">
                        <AccordionItem value="details">
                            <AccordionTrigger>Details</AccordionTrigger>
                            <AccordionContent>
                                <ul className="grid gap-2">
                                    {product.details.map((detail) => (
                                        <li key={detail} className="flex gap-3">
                                            <span className="mt-[0.6em] size-1 shrink-0 bg-ink-soft" aria-hidden />
                                            {detail}
                                        </li>
                                    ))}
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="shipping">
                            <AccordionTrigger>Shipping and returns</AccordionTrigger>
                            <AccordionContent>
                                Ships from {product.seller} within two business days and arrives in three to seven. Shipping is free over{" "}
                                {formatPrice(FREE_SHIPPING_THRESHOLD_CENTS)}, otherwise {formatPrice(FLAT_SHIPPING_CENTS)}. Return anything
                                unworn within 30 days of delivery.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="seller">
                            <AccordionTrigger>About the seller</AccordionTrigger>
                            <AccordionContent>
                                {product.seller} is one of the independent sellers on Polaris. Every seller is reviewed by hand before they
                                can list.{" "}
                                <Link href={`/shop?q=${encodeURIComponent(product.seller)}`} className="text-ink link-underline">
                                    See everything from {product.seller}
                                </Link>
                                .
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </div>
        </div>
    );
}
