/*
 * The store's pricing rules. Totals are always computed here, on the server,
 * from prices read out of the database. The previous checkout trusted a total
 * sent from the browser, which meant anyone could choose their own price.
 */

/** Ontario HST. Every order ships within Canada. */
export const TAX_RATE = 0.13;

export const FREE_SHIPPING_THRESHOLD_CENTS = 100_00;
export const FLAT_SHIPPING_CENTS = 9_00;

export interface Totals {
    subtotalCents: number;
    shippingCents: number;
    taxCents: number;
    totalCents: number;
}

export function shippingFor(subtotalCents: number): number {
    if (subtotalCents === 0) return 0;
    return subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : FLAT_SHIPPING_CENTS;
}

export function computeTotals(lines: { unitPriceCents: number; quantity: number }[]): Totals {
    const subtotalCents = lines.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0);
    const shippingCents = shippingFor(subtotalCents);
    // Shipping is taxable in Ontario.
    const taxCents = Math.round((subtotalCents + shippingCents) * TAX_RATE);
    return {
        subtotalCents,
        shippingCents,
        taxCents,
        totalCents: subtotalCents + shippingCents + taxCents,
    };
}

/** How much more the shopper needs to spend to unlock free shipping. */
export function untilFreeShipping(subtotalCents: number): number {
    return Math.max(0, FREE_SHIPPING_THRESHOLD_CENTS - subtotalCents);
}
