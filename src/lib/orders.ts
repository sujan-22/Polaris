import type { Fulfillment, OrderStatus } from "@/generated/prisma/enums";

/*
 * An order's progress is derived from its lines, because each seller ships
 * their own items. Shown to customers as one status, to sellers per line.
 */

export type Progress = "awaiting_payment" | "cancelled" | "processing" | "partly_shipped" | "shipped" | "delivered";

export const PROGRESS_LABEL: Record<Progress, string> = {
    awaiting_payment: "Awaiting payment",
    cancelled: "Cancelled",
    processing: "Processing",
    partly_shipped: "Partly shipped",
    shipped: "Shipped",
    delivered: "Delivered",
};

export const FULFILLMENT_LABEL: Record<Fulfillment, string> = {
    unfulfilled: "To ship",
    shipped: "Shipped",
    delivered: "Delivered",
};

export function orderProgress(status: OrderStatus, items: { fulfillment: Fulfillment }[]): Progress {
    if (status === "pending") return "awaiting_payment";
    if (status === "cancelled") return "cancelled";
    if (items.length && items.every((i) => i.fulfillment === "delivered")) return "delivered";
    if (items.length && items.every((i) => i.fulfillment !== "unfulfilled")) return "shipped";
    if (items.some((i) => i.fulfillment !== "unfulfilled")) return "partly_shipped";
    return "processing";
}

/* How far along the Ordered → Shipped → Delivered track an order is. */
export const PROGRESS_STEP: Record<Progress, number> = {
    awaiting_payment: -1,
    cancelled: -1,
    processing: 0,
    partly_shipped: 0,
    shipped: 1,
    delivered: 2,
};

export interface ShippingAddress {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
}

export function asAddress(value: unknown): ShippingAddress | null {
    if (!value || typeof value !== "object") return null;
    const v = value as Record<string, unknown>;
    if (typeof v.line1 !== "string" || typeof v.city !== "string") return null;
    return value as ShippingAddress;
}
