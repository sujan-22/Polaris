import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface SectionHeadProps {
    index?: string;
    eyebrow?: string;
    title: ReactNode;
    href?: string;
    linkLabel?: string;
    tone?: "paper" | "ink";
    className?: string;
}

/*
 * The heading row above a shelf: a mono index on a hairline, the title, and
 * an optional link pinned to the right.
 */
export function SectionHead({ index, eyebrow, title, href, linkLabel = "View all", tone = "paper", className }: SectionHeadProps) {
    const ink = tone === "ink";
    return (
        <div className={cn("border-t pt-4", ink ? "border-white/15" : "border-ink", className)}>
            <div className={cn("label flex justify-between", ink ? "text-on-ink-faint" : "text-ink-faint")}>
                <span>{eyebrow}</span>
                <span>{index}</span>
            </div>
            <div className="mt-6 flex flex-wrap items-end justify-between gap-x-8 gap-y-4 sm:mt-8">
                <h2 className="type-title max-w-[16ch] text-balance">{title}</h2>
                {href ? (
                    <Link href={href} className={cn("group inline-flex items-center gap-2 text-sm font-medium", ink ? "text-on-ink" : "text-ink")}>
                        <span className="link-underline">{linkLabel}</span>
                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </Link>
                ) : null}
            </div>
        </div>
    );
}
