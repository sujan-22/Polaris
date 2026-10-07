import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/*
 * Square, uppercase, tightly tracked: buttons read as labels on a garment
 * tag rather than as pills. One filled style does the selling; the outline
 * and ghost styles stay out of its way.
 */
export const buttonVariants = cva(
    "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-medium uppercase tracking-[0.08em] transition-[background-color,color,border-color,opacity] duration-150 disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    {
        variants: {
            variant: {
                primary: "bg-ink text-paper hover:bg-ink-2",
                outline: "border border-ink text-ink hover:bg-ink hover:text-paper",
                quiet: "border border-rule text-ink hover:border-ink",
                ghost: "text-ink hover:bg-paper-2",
                inverse: "bg-paper text-ink hover:bg-white",
                "inverse-outline": "border border-on-ink-faint text-on-ink hover:border-on-ink hover:bg-on-ink hover:text-ink",
                danger: "bg-signal text-white hover:bg-[#9e2c15]",
                link: "h-auto px-0 normal-case tracking-normal text-ink underline decoration-1 underline-offset-4 hover:decoration-2",
            },
            size: {
                sm: "h-9 px-3.5 text-[0.6875rem]",
                md: "h-11 px-5 text-xs",
                lg: "h-14 px-8 text-[0.8125rem]",
                icon: "size-10",
                "icon-sm": "size-8",
            },
        },
        compoundVariants: [{ variant: "link", className: "h-auto px-0" }],
        defaultVariants: { variant: "primary", size: "md" },
    },
);

export interface ButtonProps extends ComponentProps<"button">, VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
    const Comp = asChild ? Slot.Root : "button";
    return <Comp data-slot="button" className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
