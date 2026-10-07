"use client";

import { X } from "lucide-react";
import { Dialog } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/*
 * Side sheets (the bag, the mobile menu, shop filters) and centred dialogs
 * share one Radix primitive. `sheet-viewport` sizes the sheet to the visible
 * viewport so iOS Safari's toolbars never cover its footer.
 */

export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export const SheetClose = Dialog.Close;
export const SheetTitle = Dialog.Title;
export const SheetDescription = Dialog.Description;

function Overlay({ className, ...props }: ComponentProps<typeof Dialog.Overlay>) {
    return (
        <Dialog.Overlay
            className={cn(
                "fixed inset-0 z-50 bg-ink/40 backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0",
                className,
            )}
            {...props}
        />
    );
}

interface SheetContentProps extends ComponentProps<typeof Dialog.Content> {
    side?: "right" | "left";
}

export function SheetContent({ side = "right", className, children, ...props }: SheetContentProps) {
    return (
        <Dialog.Portal>
            <Overlay />
            <Dialog.Content
                className={cn(
                    "sheet-viewport fixed top-0 z-50 flex w-full max-w-[28rem] flex-col bg-paper shadow-[0_0_0_1px_var(--rule)] duration-300 ease-[var(--ease-out-expo)] data-[state=closed]:animate-out data-[state=open]:animate-in",
                    side === "right"
                        ? "right-0 data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right"
                        : "left-0 data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
                    className,
                )}
                {...props}
            >
                {children}
            </Dialog.Content>
        </Dialog.Portal>
    );
}

export function SheetHeader({ className, children, ...props }: ComponentProps<"div">) {
    return (
        <div className={cn("flex h-16 shrink-0 items-center justify-between border-b border-rule px-5", className)} {...props}>
            {children}
            <Dialog.Close className="-mr-2 inline-flex size-10 items-center justify-center text-ink hover:bg-paper-2">
                <X className="size-5" aria-hidden />
                <span className="sr-only">Close</span>
            </Dialog.Close>
        </div>
    );
}

/* Centred dialog, used for confirmations. */
export const DialogRoot = Dialog.Root;
export const DialogTrigger = Dialog.Trigger;
export const DialogClose = Dialog.Close;

export function DialogContent({ className, children, ...props }: ComponentProps<typeof Dialog.Content>) {
    return (
        <Dialog.Portal>
            <Overlay />
            <Dialog.Content
                className={cn(
                    "fixed top-1/2 left-1/2 z-50 grid w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 gap-5 bg-paper p-6 shadow-[0_0_0_1px_var(--rule)] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-[0.98] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.98] sm:p-8",
                    className,
                )}
                {...props}
            >
                {children}
            </Dialog.Content>
        </Dialog.Portal>
    );
}

export function DialogTitle({ className, ...props }: ComponentProps<typeof Dialog.Title>) {
    return <Dialog.Title className={cn("type-subheading", className)} {...props} />;
}

export function DialogDescription({ className, ...props }: ComponentProps<typeof Dialog.Description>) {
    return <Dialog.Description className={cn("text-[0.9375rem] leading-relaxed text-ink-soft", className)} {...props} />;
}
