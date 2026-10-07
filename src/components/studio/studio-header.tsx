import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function StudioHeader({ eyebrow, title, description, actions, className }: { eyebrow: string; title: ReactNode; description?: ReactNode; actions?: ReactNode; className?: string }) {
    return (
        <header className={cn("flex flex-wrap items-end justify-between gap-6 border-b border-ink pb-7", className)}>
            <div className="min-w-0">
                <p className="label text-ink-faint">{eyebrow}</p>
                <h1 className="type-heading mt-4 text-balance">{title}</h1>
                {description ? <p className="mt-3 max-w-xl text-ink-soft">{description}</p> : null}
            </div>
            {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </header>
    );
}

export function StudioFallback() {
    return (
        <div aria-busy>
            <div className="border-b border-ink pb-7">
                <div className="h-3 w-20 bg-paper-2" />
                <div className="mt-4 h-10 w-72 bg-paper-2" />
            </div>
            <div className="mt-10 h-72 bg-paper-2/60" />
        </div>
    );
}

const TONES = {
    active: "bg-success/10 text-success",
    draft: "bg-paper-2 text-ink-soft",
    archived: "bg-paper-2 text-ink-faint",
    unfulfilled: "bg-ink text-paper",
    shipped: "bg-paper-2 text-ink",
    delivered: "bg-success/10 text-success",
    pending: "bg-ink text-paper",
    approved: "bg-success/10 text-success",
    denied: "bg-signal/10 text-signal",
    admin: "bg-ink text-paper",
    seller: "bg-paper-2 text-ink",
    user: "text-ink-faint",
    suspended: "bg-signal/10 text-signal",
} as const;

/** Status as text in a tinted chip: never colour alone. */
export function Badge({ tone, children }: { tone: keyof typeof TONES; children: ReactNode }) {
    return <span className={cn("label inline-flex items-center px-2 py-1.5 whitespace-nowrap", TONES[tone])}>{children}</span>;
}
