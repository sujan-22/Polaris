import { Suspense } from "react";

import { AccountNav, AccountNavLinks } from "@/components/account/account-nav";

/*
 * The frame is static; each page reads the session itself, inside its own
 * Suspense boundary, so the navigation shows instantly.
 */
export default function AccountLayout({ children }: LayoutProps<"/account">) {
    return (
        <div className="shell pt-8 pb-24 lg:pt-12 lg:pb-32">
            <div className="grid gap-10 lg:grid-cols-[13rem_1fr] lg:gap-16">
                <Suspense fallback={<AccountNavLinks pathname={null} />}>
                    <AccountNav />
                </Suspense>
                <div className="min-w-0">{children}</div>
            </div>
        </div>
    );
}
