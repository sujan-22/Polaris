import { COLOR_NAMES, SORTS, type SortKey } from "@/lib/catalog";

/*
 * Shop filters live in the URL, so every filtered view can be shared,
 * bookmarked and rendered on the server. Lists are comma-separated:
 * /shop/men?color=Black,White&size=M&sort=price-asc
 */

export type ShelfParam = "new" | "picks" | "sale";

export interface ShopParams {
    shelf?: ShelfParam;
    colors: string[];
    sizes: string[];
    sort: SortKey;
    q?: string;
}

type RawParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
const list = (value: string | string[] | undefined) =>
    (first(value) ?? "")
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);

export function parseShopParams(raw: RawParams): ShopParams {
    const shelf = first(raw.shelf);
    const sort = first(raw.sort);
    const q = first(raw.q)?.trim().slice(0, 80);
    return {
        shelf: shelf === "new" || shelf === "picks" || shelf === "sale" ? shelf : undefined,
        colors: list(raw.color).filter((c) => COLOR_NAMES.includes(c)),
        sizes: list(raw.size).slice(0, 12),
        sort: sort && sort in SORTS ? (sort as SortKey) : "featured",
        q: q || undefined,
    };
}

export function shopHref(base: string, params: ShopParams, patch: Partial<ShopParams> = {}): string {
    const next = { ...params, ...patch };
    const search = new URLSearchParams();
    if (next.q) search.set("q", next.q);
    if (next.shelf) search.set("shelf", next.shelf);
    if (next.colors.length) search.set("color", next.colors.join(","));
    if (next.sizes.length) search.set("size", next.sizes.join(","));
    if (next.sort !== "featured") search.set("sort", next.sort);
    const query = search.toString();
    return query ? `${base}?${query}` : base;
}

export function toggle(values: string[], value: string): string[] {
    return values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
}

export const SHELF_NAMES: Record<ShelfParam, string> = {
    new: "New arrivals",
    picks: "Weekly picks",
    sale: "Sale",
};
