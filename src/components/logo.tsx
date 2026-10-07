import { cn } from "@/lib/utils";

/*
 * The peak: a leaning wedge and a small triangle, traced from the mark
 * printed on every Polaris product. The old site shipped a placeholder
 * "AURA" logo instead.
 */
export function Mark({ className, title }: { className?: string; title?: string }) {
    return (
        <svg
            viewBox="0 0 306 266"
            className={cn("h-auto w-6 fill-current", className)}
            role={title ? "img" : undefined}
            aria-hidden={title ? undefined : true}
        >
            {title ? <title>{title}</title> : null}
            <path d="M0 266 156 0l50 88-93 178Z" />
            <path d="m198 266 53-95 55 95Z" />
        </svg>
    );
}

export function Wordmark({ className }: { className?: string }) {
    return (
        <span className={cn("inline-flex items-center gap-2.5 text-ink", className)}>
            <Mark className="w-[1.35em]" />
            <span className="text-[1.0625em] leading-none font-semibold tracking-[0.2em]">POLARIS</span>
        </span>
    );
}
