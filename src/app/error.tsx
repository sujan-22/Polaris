"use client";

import { Button } from "@/components/ui/button";
import { Mark } from "@/components/logo";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <div className="shell grid min-h-[70vh] content-center gap-8 py-24">
            <div className="label flex items-center gap-3 text-ink-faint">
                <Mark className="w-5 text-ink" /> Error{error.digest ? ` · ${error.digest}` : ""}
            </div>
            <h1 className="type-display max-w-[12ch] text-balance">Something slipped.</h1>
            <p className="type-lead max-w-md text-ink-soft">That one&apos;s on us. Try again, and if it keeps happening, come back in a few minutes.</p>
            <div>
                <Button size="lg" onClick={reset}>
                    Try again
                </Button>
            </div>
        </div>
    );
}
