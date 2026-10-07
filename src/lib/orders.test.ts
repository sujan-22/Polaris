import { describe, expect, it } from "vitest";

import { orderProgress } from "@/lib/orders";
import { parseShopParams, shopHref, toggle } from "@/lib/shop-params";
import { orderNumber, slugify } from "@/lib/utils";

describe("orderProgress", () => {
    const lines = (...states: ("unfulfilled" | "shipped" | "delivered")[]) => states.map((fulfillment) => ({ fulfillment }));

    it("derives one status from per-seller lines", () => {
        expect(orderProgress("pending", lines("unfulfilled"))).toBe("awaiting_payment");
        expect(orderProgress("paid", lines("unfulfilled", "unfulfilled"))).toBe("processing");
        expect(orderProgress("paid", lines("shipped", "unfulfilled"))).toBe("partly_shipped");
        expect(orderProgress("paid", lines("shipped", "delivered"))).toBe("shipped");
        expect(orderProgress("paid", lines("delivered", "delivered"))).toBe("delivered");
        expect(orderProgress("cancelled", lines("unfulfilled"))).toBe("cancelled");
    });
});

describe("shop params", () => {
    it("drops unknown colours, shelves and sorts", () => {
        expect(parseShopParams({ color: "Black,Chartreuse", shelf: "everything", sort: "random" })).toEqual({
            shelf: undefined,
            colors: ["Black"],
            sizes: [],
            sort: "featured",
            q: undefined,
        });
    });

    it("round-trips through a URL", () => {
        const params = parseShopParams({ shelf: "sale", color: "Black,White", size: "M", sort: "price-asc" });
        expect(shopHref("/shop/men", params)).toBe("/shop/men?shelf=sale&color=Black%2CWhite&size=M&sort=price-asc");
        expect(shopHref("/shop", params, { colors: toggle(params.colors, "Black"), shelf: undefined })).toBe("/shop?color=White&size=M&sort=price-asc");
    });
});

describe("utils", () => {
    it("slugifies names", () => {
        expect(slugify("Olive & Oak")).toBe("olive-and-oak");
        expect(slugify("  Café Crème  ")).toBe("cafe-creme");
    });

    it("makes order numbers without ambiguous characters", () => {
        for (let i = 0; i < 200; i++) expect(orderNumber()).toMatch(/^PL-[2-9A-HJ-NP-Z]{6}$/);
    });
});
