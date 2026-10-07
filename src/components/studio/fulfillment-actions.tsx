"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { setFulfillment } from "@/actions/studio";
import { Button } from "@/components/ui/button";

type Fulfillment = "unfulfilled" | "shipped" | "delivered";

const NEXT: Record<Fulfillment, { to: Fulfillment; label: string } | null> = {
    unfulfilled: { to: "shipped", label: "Mark shipped" },
    shipped: { to: "delivered", label: "Mark delivered" },
    delivered: null,
};

/** Moves one or more lines to the next fulfilment step, or back one. */
export function FulfillmentActions({ itemIds, current, all = false }: { itemIds: string[]; current: Fulfillment; all?: boolean }) {
    const [pending, startTransition] = useTransition();
    const next = NEXT[current];
    const back: Fulfillment | null = current === "delivered" ? "shipped" : current === "shipped" ? "unfulfilled" : null;

    const run = (to: Fulfillment) =>
        startTransition(async () => {
            const result = await setFulfillment({ itemIds, fulfillment: to });
            if (!result.ok) toast(result.message ?? "Couldn't update.");
        });

    return (
        <div className="flex items-center gap-1">
            {back && !all ? (
                <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => run(back)} className="text-ink-soft">
                    Undo
                </Button>
            ) : null}
            {next ? (
                <Button type="button" variant={all ? "primary" : "outline"} size="sm" disabled={pending} onClick={() => run(next.to)}>
                    {pending ? "Saving…" : all ? `Ship all ${itemIds.length}` : next.label}
                </Button>
            ) : null}
        </div>
    );
}
