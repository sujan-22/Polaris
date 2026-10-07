import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/** "Wireless Headphones" → "wireless-headphones". */
export function slugify(value: string): string {
    return value
        .normalize("NFKD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);
}

/*
 * Order references like PL-7K2Q9M. The alphabet drops 0/O and 1/I so a
 * customer reading one aloud over the phone can't get it wrong.
 */
const ORDER_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function orderNumber(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(6));
    let out = "";
    for (const byte of bytes) out += ORDER_ALPHABET[byte % ORDER_ALPHABET.length];
    return `PL-${out}`;
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
    return `${count} ${count === 1 ? singular : plural}`;
}

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
    day: "numeric",
    month: "short",
    year: "numeric",
});

export function formatDate(date: Date | string): string {
    return dateFormatter.format(typeof date === "string" ? new Date(date) : date);
}

export function initials(name: string): string {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");
}

/*
 * Menus close when a link inside them is followed. Delegating the click is
 * simpler than watching the pathname, which would make the header read URL
 * data and block prerendering on dynamic routes.
 */
export function closeOnLinkClick(close: () => void) {
    return (event: { target: EventTarget }) => {
        if (event.target instanceof Element && event.target.closest("a[href]")) close();
    };
}
