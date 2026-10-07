import Link from "next/link";

import { Mark } from "@/components/logo";
import { Button } from "@/components/ui/button";

/* 404, 403 and error pages share one quiet layout. */
export function StatusPage({ code, title, body, action = { href: "/", label: "Back to the store" } }: { code: string; title: React.ReactNode; body: string; action?: { href: string; label: string } }) {
    return (
        <div className="shell grid min-h-[70vh] content-center gap-8 py-24">
            <div className="label flex items-center gap-3 text-ink-faint">
                <Mark className="w-5 text-ink" /> {code}
            </div>
            <h1 className="type-display max-w-[12ch] text-balance">{title}</h1>
            <p className="type-lead max-w-md text-ink-soft">{body}</p>
            <div className="flex flex-wrap gap-2">
                <Button asChild size="lg">
                    <Link href={action.href}>{action.label}</Link>
                </Button>
                {action.href !== "/shop" ? (
                    <Button asChild size="lg" variant="outline">
                        <Link href="/shop">Browse the shop</Link>
                    </Button>
                ) : null}
            </div>
        </div>
    );
}
