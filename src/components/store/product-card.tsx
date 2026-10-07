import Image from "next/image";
import Link from "next/link";

import { COLORS } from "@/lib/catalog";
import { formatPrice, percentOff } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { ProductCard as Card } from "@/server/catalog";

interface ProductCardProps {
    product: Card;
    /** Catalogue number shown in the corner, e.g. 3 → "003". */
    index?: number;
    priority?: boolean;
    sizes?: string;
    className?: string;
}

/*
 * A product is a photo on the studio sweep and two lines of type. No card,
 * no shadow, no button: the whole thing is the link. Pointers get the
 * second photo on hover.
 */
export function ProductCard({ product, index, priority, sizes = "(min-width: 1024px) 25vw, 50vw", className }: ProductCardProps) {
    const off = percentOff(product.priceCents, product.compareAtCents);
    const [first, second] = product.images;

    return (
        <Link href={`/products/${product.slug}`} className={cn("group block", className)}>
            <div className="studio relative aspect-[4/5] overflow-hidden">
                {first ? (
                    <Image
                        src={first}
                        alt={product.name}
                        fill
                        sizes={sizes}
                        priority={priority}
                        className={cn(
                            "object-cover transition-[opacity,transform] duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.03]",
                            second && "[@media(hover:hover)]:group-hover:opacity-0",
                        )}
                    />
                ) : null}
                {second ? (
                    <Image
                        src={second}
                        alt=""
                        fill
                        sizes={sizes}
                        className="hidden object-cover opacity-0 transition-[opacity,transform] duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.03] [@media(hover:hover)]:block [@media(hover:hover)]:group-hover:opacity-100"
                    />
                ) : null}

                <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5">
                        {product.soldOut ? (
                            <span className="label bg-paper px-2 py-1.5 text-ink">Sold out</span>
                        ) : off ? (
                            <span className="label bg-signal px-2 py-1.5 text-white">−{off}%</span>
                        ) : product.collection === "new_arrivals" ? (
                            <span className="label bg-paper px-2 py-1.5 text-ink">New</span>
                        ) : null}
                    </div>
                    {index !== undefined ? <span className="label text-ink-faint">{String(index).padStart(3, "0")}</span> : null}
                </div>
            </div>

            <div className="mt-3.5 flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="truncate text-[0.9375rem] font-medium tracking-[-0.01em] group-hover:underline group-hover:underline-offset-4">
                        {product.name}
                    </h3>
                    <p className="mt-1 truncate text-sm text-ink-faint">{product.seller}</p>
                </div>
                <p className="tabular shrink-0 text-right text-[0.9375rem]">
                    <span className={cn(off && "text-signal")}>{formatPrice(product.priceCents)}</span>
                    {off ? <span className="block text-sm text-ink-faint line-through">{formatPrice(product.compareAtCents!)}</span> : null}
                </p>
            </div>

            {product.colors.length > 1 ? (
                <div className="mt-2.5 flex items-center gap-1.5" aria-label={`${product.colors.length} colours`}>
                    {product.colors.slice(0, 6).map((color) => (
                        <span
                            key={color}
                            title={color}
                            className="size-2.5 rounded-full shadow-[inset_0_0_0_1px_rgb(18_18_18/0.18)]"
                            style={{ background: COLORS[color] ?? "#999" }}
                        />
                    ))}
                </div>
            ) : null}
        </Link>
    );
}

export function ProductCardSkeleton() {
    return (
        <div aria-hidden>
            <div className="studio aspect-[4/5] animate-pulse" />
            <div className="mt-3.5 h-4 w-2/3 bg-paper-2" />
            <div className="mt-2 h-3.5 w-1/3 bg-paper-2" />
        </div>
    );
}
