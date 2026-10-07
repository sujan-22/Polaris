import { describe, expect, it } from "vitest";

import { formatPrice, percentOff, toCents } from "@/lib/money";
import { computeTotals, shippingFor, untilFreeShipping } from "@/lib/pricing";

describe("money", () => {
    it("rounds dollars to cents instead of truncating", () => {
        expect(toCents("19.99")).toBe(1999);
        expect(toCents("0.1")).toBe(10);
        expect(toCents(34.3)).toBe(3430);
    });

    it("formats Canadian dollars", () => {
        expect(formatPrice(1999)).toBe("$19.99");
        expect(formatPrice(0)).toBe("$0.00");
    });

    it("reports a discount only when the price is actually reduced", () => {
        expect(percentOff(7999, 8999)).toBe(11);
        expect(percentOff(2499, 2499)).toBeNull();
        expect(percentOff(2499, null)).toBeNull();
    });
});

describe("pricing", () => {
    it("charges flat shipping under the threshold and nothing over it", () => {
        expect(shippingFor(0)).toBe(0);
        expect(shippingFor(9999)).toBe(900);
        expect(shippingFor(10000)).toBe(0);
        expect(untilFreeShipping(7500)).toBe(2500);
        expect(untilFreeShipping(12000)).toBe(0);
    });

    it("taxes the subtotal and shipping at 13%", () => {
        // Two mugs: the order verified end to end against Stripe.
        expect(computeTotals([{ unitPriceCents: 999, quantity: 2 }])).toEqual({
            subtotalCents: 1998,
            shippingCents: 900,
            taxCents: 377,
            totalCents: 3275,
        });
    });

    it("matches Stripe's total for a free-shipping order", () => {
        const totals = computeTotals([
            { unitPriceCents: 14999, quantity: 1 },
            { unitPriceCents: 2499, quantity: 1 },
        ]);
        expect(totals.shippingCents).toBe(0);
        expect(totals.totalCents).toBe(19773);
    });
});
