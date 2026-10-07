import Image from "next/image";
import Link from "next/link";

import { Wordmark } from "@/components/logo";

/*
 * Sign-in and sign-up: the form on paper, a studio photograph alongside.
 * No site navigation, one way back home.
 */
export default function AuthLayout({ children }: LayoutProps<"/">) {
    return (
        <div className="grid min-h-dvh lg:grid-cols-2">
            <div className="flex flex-col">
                <header className="shell flex h-[var(--header-height)] items-center justify-between lg:max-w-none">
                    <Link href="/" aria-label="Polaris home" className="text-sm">
                        <Wordmark />
                    </Link>
                    <Link href="/shop" className="text-sm text-ink-soft link-underline">
                        Back to the shop
                    </Link>
                </header>
                <main id="main" className="shell flex flex-1 items-center py-12 lg:max-w-none">
                    <div className="mx-auto w-full max-w-sm">{children}</div>
                </main>
            </div>
            <div className="studio relative hidden overflow-hidden lg:block">
                <Image src="/products/hoodie-2.webp" alt="" fill priority sizes="50vw" className="object-cover" />
                <p className="label absolute bottom-6 left-6 bg-paper px-3 py-2 text-ink">Zip Hoodie · Northline</p>
            </div>
        </div>
    );
}
