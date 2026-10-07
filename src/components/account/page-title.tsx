import type { ReactNode } from "react";

export function PageTitle({ eyebrow, title, children }: { eyebrow: string; title: ReactNode; children?: ReactNode }) {
    return (
        <header className="border-b border-ink pb-8">
            <p className="label text-ink-faint">{eyebrow}</p>
            <h1 className="type-title mt-6 text-balance">{title}</h1>
            {children ? <div className="mt-5 max-w-xl text-ink-soft">{children}</div> : null}
        </header>
    );
}

export function PageFallback() {
    return (
        <div aria-busy>
            <div className="border-b border-ink pb-8">
                <div className="h-3 w-24 bg-paper-2" />
                <div className="mt-6 h-14 w-64 bg-paper-2" />
            </div>
            <div className="mt-10 h-64 bg-paper-2/60" />
        </div>
    );
}
