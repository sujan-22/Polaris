import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { Wordmark } from "@/components/logo";
import { StudioMobileBar, StudioNav, StudioNavLinks } from "@/components/studio/studio-nav";
import { prisma } from "@/lib/prisma";
import { requireSeller } from "@/lib/session";

export const metadata: Metadata = {
    title: { default: "Studio", template: "%s · Studio · Polaris" },
    robots: { index: false },
};

/*
 * The back office. One studio for sellers and admins: sellers see their own
 * shop, admins see the whole store plus customers and seller requests. The
 * old app kept two near-identical dashboards for this.
 */
export default function StudioLayout({ children }: LayoutProps<"/studio">) {
    const fallback = <StudioNavLinks admin={false} pathname={null} />;
    return (
        <div className="min-h-dvh lg:grid lg:grid-cols-[15.5rem_1fr]">
            <aside className="sticky top-0 hidden h-dvh flex-col border-r border-rule bg-paper-2 lg:flex">
                <Link href="/studio" className="flex h-16 items-center gap-3 px-6 text-[0.8125rem]">
                    <Wordmark />
                    <span className="label text-ink-faint">Studio</span>
                </Link>
                <div className="flex-1 overflow-y-auto px-3 py-6">
                    <Suspense fallback={fallback}>
                        <Nav />
                    </Suspense>
                </div>
                <Link href="/" className="flex items-center gap-2 border-t border-rule px-6 py-4 text-sm text-ink-soft hover:text-ink">
                    <ArrowLeft className="size-4" aria-hidden /> Back to the store
                </Link>
            </aside>
            <div className="min-w-0">
                <StudioMobileBar>
                    <Suspense fallback={fallback}>
                        <Nav />
                    </Suspense>
                </StudioMobileBar>
                <main id="main" className="mx-auto w-full max-w-[1200px] px-[var(--gutter)] pt-8 pb-24 lg:px-12 lg:pt-12">
                    {children}
                </main>
            </div>
        </div>
    );
}

async function Nav() {
    const user = await requireSeller();
    const admin = user.role === "admin";
    const pendingRequests = admin ? await prisma.sellerRequest.count({ where: { status: "pending" } }) : 0;
    return <StudioNav admin={admin} pendingRequests={pendingRequests} storeName={admin ? "Polaris" : user.storeName} />;
}
