/*
 * The fixed vocabulary of the store: departments, categories, shelves,
 * colours and sizes. Products store category slugs and colour names as plain
 * strings, validated against these lists on every write.
 */

export const CATEGORIES = [
    { slug: "women", name: "Women", department: "clothing", blurb: "Hoodies, tees and shoes cut for every day." },
    { slug: "men", name: "Men", department: "clothing", blurb: "Jackets, tees and the layers between." },
    { slug: "baby", name: "Baby", department: "clothing", blurb: "Soft basics for the smallest customers." },
    { slug: "accessories", name: "Accessories", department: "accessories", blurb: "Caps, hats and a watch with nothing extra." },
    { slug: "bags", name: "Bags", department: "accessories", blurb: "Packs and pouches for carrying the day." },
    { slug: "home", name: "Home", department: "living", blurb: "Cups, chairs and light for the rooms you use." },
    { slug: "electronics", name: "Electronics", department: "living", blurb: "Sound, light and a blender that means it." },
    { slug: "pets", name: "Pets", department: "living", blurb: "For the dog who runs cold." },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];
export type Category = (typeof CATEGORIES)[number];

export const DEPARTMENTS = [
    { slug: "clothing", name: "Clothing" },
    { slug: "accessories", name: "Accessories" },
    { slug: "living", name: "Living" },
] as const;

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug) as [CategorySlug, ...CategorySlug[]];

export function getCategory(slug: string): Category | undefined {
    return CATEGORIES.find((c) => c.slug === slug);
}

export const COLLECTIONS = {
    new_arrivals: { name: "New arrivals", param: "new", blurb: "Just in from our sellers." },
    weekly_picks: { name: "Weekly picks", param: "picks", blurb: "What we'd buy this week." },
} as const;

export type CollectionKey = keyof typeof COLLECTIONS;

/*
 * Swatch colours. These only paint the little chip next to a colour name, so
 * they aim for recognisable rather than exact.
 */
export const COLORS: Record<string, string> = {
    Black: "#141414",
    White: "#f4f3ef",
    Gray: "#9a9a96",
    Beige: "#d8cbb2",
    Tan: "#c7a983",
    Brown: "#6e4b32",
    Olive: "#5f5a36",
    Navy: "#1d2a4a",
    Blue: "#1f63e6",
    Green: "#2f6b45",
    Red: "#c4332b",
    Pink: "#e8489a",
    Purple: "#6a4bb5",
};

export const COLOR_NAMES = Object.keys(COLORS);

/*
 * Size ladders, in display order. A product draws its sizes from one ladder,
 * and the shop's size filter lists them in this order.
 */
export const SIZE_ORDER = [
    "0–6M",
    "6–12M",
    "12–24M",
    "XS",
    "S",
    "M",
    "L",
    "XL",
    "XXL",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "One size",
];

export function sortSizes(sizes: Iterable<string>): string[] {
    const rank = (s: string) => {
        const i = SIZE_ORDER.indexOf(s);
        return i === -1 ? SIZE_ORDER.length : i;
    };
    return [...new Set(sizes)].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}

export const SORTS = {
    featured: "Featured",
    newest: "Newest",
    "price-asc": "Price, low to high",
    "price-desc": "Price, high to low",
} as const;

export type SortKey = keyof typeof SORTS;
