"use client";

import { Toaster as Sonner } from "sonner";

/* Toasts are ink slips, square like everything else. */
export function Toaster() {
    return (
        <Sonner
            position="bottom-center"
            offset={20}
            mobileOffset={16}
            toastOptions={{
                unstyled: true,
                classNames: {
                    toast: "flex w-[min(24rem,calc(100vw-2rem))] items-start gap-3 bg-ink px-4 py-3.5 text-sm text-on-ink shadow-[0_12px_40px_-12px_rgb(0_0_0/0.45)]",
                    title: "font-medium",
                    description: "text-on-ink-soft",
                    actionButton: "label ml-auto shrink-0 self-center text-on-ink underline underline-offset-4",
                    icon: "mt-px",
                },
            }}
        />
    );
}
