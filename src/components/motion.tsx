"use client";

import { MotionConfig, motion } from "motion/react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/*
 * `reducedMotion="user"` lets Motion honour the OS setting itself. Branching
 * on useReducedMotion() inside components instead makes the server and the
 * client disagree about initial styles, which breaks hydration for anyone
 * with Reduce Motion switched on.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
    return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

interface RevealProps {
    children: ReactNode;
    className?: string;
    delay?: number;
    as?: "div" | "section" | "li";
}

/** Fades content up as it scrolls into view, once. */
export function Reveal({ children, className, delay = 0, as = "div" }: RevealProps) {
    const Component = motion[as];
    return (
        <Component
            className={cn(className)}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
        >
            {children}
        </Component>
    );
}
