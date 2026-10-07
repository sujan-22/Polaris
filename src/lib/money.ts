/*
 * Prices are integer cents everywhere: in the database, in Stripe and in
 * every calculation. Dollars only exist at the edges, when a seller types a
 * price in and when a price is formatted for display.
 */

export const CURRENCY = "cad";

const formatter = new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
});

/** `1999` → `$19.99`. */
export function formatPrice(cents: number): string {
    return formatter.format(cents / 100);
}

/** `"19.99"` → `1999`. Rounds rather than truncates, so `"0.1"` is 10. */
export function toCents(dollars: number | string): number {
    const value = typeof dollars === "string" ? Number.parseFloat(dollars) : dollars;
    return Math.round(value * 100);
}

/** `1999` → `"19.99"`, for prefilling inputs. */
export function toDollarString(cents: number): string {
    return (cents / 100).toFixed(2);
}

/** Whole-number percentage off, or null when the item isn't reduced. */
export function percentOff(priceCents: number, compareAtCents: number | null | undefined): number | null {
    if (!compareAtCents || compareAtCents <= priceCents) return null;
    return Math.round(((compareAtCents - priceCents) / compareAtCents) * 100);
}
