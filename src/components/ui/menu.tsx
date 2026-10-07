"use client";

import { Accordion as AccordionPrimitive, DropdownMenu } from "radix-ui";
import { Plus } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export const Menu = DropdownMenu.Root;
export const MenuTrigger = DropdownMenu.Trigger;

export function MenuContent({ className, sideOffset = 8, ...props }: ComponentProps<typeof DropdownMenu.Content>) {
    return (
        <DropdownMenu.Portal>
            <DropdownMenu.Content
                sideOffset={sideOffset}
                className={cn(
                    "z-50 min-w-56 bg-paper p-1.5 shadow-[0_0_0_1px_var(--rule),0_12px_32px_-12px_rgb(18_18_18/0.25)] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[side=bottom]:slide-in-from-top-1",
                    className,
                )}
                {...props}
            />
        </DropdownMenu.Portal>
    );
}

export function MenuItem({ className, ...props }: ComponentProps<typeof DropdownMenu.Item>) {
    return (
        <DropdownMenu.Item
            className={cn(
                "flex h-10 cursor-pointer items-center gap-3 px-3 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-paper-2 [&_svg]:size-4 [&_svg]:text-ink-soft",
                className,
            )}
            {...props}
        />
    );
}

export function MenuLabel({ className, ...props }: ComponentProps<typeof DropdownMenu.Label>) {
    return <DropdownMenu.Label className={cn("px-3 pt-2.5 pb-2", className)} {...props} />;
}

export function MenuSeparator({ className, ...props }: ComponentProps<typeof DropdownMenu.Separator>) {
    return <DropdownMenu.Separator className={cn("-mx-1.5 my-1.5 h-px bg-rule", className)} {...props} />;
}

/* Accordion: hairline rows with a plus that turns into a cross. */
export const Accordion = AccordionPrimitive.Root;

export function AccordionItem({ className, ...props }: ComponentProps<typeof AccordionPrimitive.Item>) {
    return <AccordionPrimitive.Item className={cn("border-b border-rule", className)} {...props} />;
}

export function AccordionTrigger({ className, children, ...props }: ComponentProps<typeof AccordionPrimitive.Trigger>) {
    return (
        <AccordionPrimitive.Header className="flex">
            <AccordionPrimitive.Trigger
                className={cn(
                    "group flex flex-1 items-center justify-between py-5 text-left text-[0.9375rem] font-medium outline-none focus-visible:underline",
                    className,
                )}
                {...props}
            >
                {children}
                <Plus aria-hidden className="size-4 shrink-0 text-ink-soft transition-transform duration-200 group-data-[state=open]:rotate-45" />
            </AccordionPrimitive.Trigger>
        </AccordionPrimitive.Header>
    );
}

export function AccordionContent({ className, children, ...props }: ComponentProps<typeof AccordionPrimitive.Content>) {
    return (
        <AccordionPrimitive.Content
            className="overflow-hidden text-[0.9375rem] leading-relaxed text-ink-soft data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
            {...props}
        >
            <div className={cn("pb-6", className)}>{children}</div>
        </AccordionPrimitive.Content>
    );
}
