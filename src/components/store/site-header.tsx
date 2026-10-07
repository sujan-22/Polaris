import Link from "next/link";
import { Suspense } from "react";

import { Wordmark } from "@/components/logo";
import { AccountMenu, AccountMenuFallback } from "@/components/store/account-menu";
import { BagButton, BagButtonFallback } from "@/components/store/bag";
import { MobileMenu } from "@/components/store/mobile-menu";
import { SearchButton } from "@/components/store/search-dialog";
import { ShopMenu } from "@/components/store/shop-menu";
import { getCurrentUser, isStaff } from "@/lib/session";
import { getCart } from "@/server/cart";
import { getCategoryCovers } from "@/server/catalog";

/*
 * The header prerenders into the static shell. Only the two pieces that
 * depend on who's visiting, the account link and the bag count, stream in
 * behind Suspense, with fallbacks the same size so nothing shifts.
 */
export async function SiteHeader() {
    const covers = await getCategoryCovers();
    return (
        <header className="sticky top-0 z-40 border-b border-rule bg-paper/92 backdrop-blur-md supports-[backdrop-filter]:bg-paper/80">
            <div className="shell grid h-[var(--header-height)] grid-cols-[1fr_auto_1fr] items-center">
                <nav aria-label="Primary" className="flex items-center gap-1">
                    <MobileMenu />
                    <div className="hidden items-center lg:flex">
                        <ShopMenu covers={covers} />
                        <HeaderLink href="/shop?shelf=new">New</HeaderLink>
                        <HeaderLink href="/shop?shelf=sale">Sale</HeaderLink>
                        <HeaderLink href="/sell">Sell with us</HeaderLink>
                    </div>
                </nav>

                <Link href="/" aria-label="Polaris home" className="text-[0.8125rem] sm:text-sm">
                    <Wordmark />
                </Link>

                <div className="flex items-center justify-end gap-1">
                    <SearchButton />
                    <div className="hidden sm:block">
                        <Suspense fallback={<AccountMenuFallback />}>
                            <Account />
                        </Suspense>
                    </div>
                    <Suspense fallback={<BagButtonFallback />}>
                        <Bag />
                    </Suspense>
                </div>
            </div>
        </header>
    );
}

function HeaderLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <Link href={href} className="inline-flex h-10 items-center px-3 text-sm hover:underline hover:underline-offset-4">
            {children}
        </Link>
    );
}

async function Account() {
    const user = await getCurrentUser();
    return <AccountMenu user={user ? { name: user.name, email: user.email, staff: isStaff(user) } : null} />;
}

async function Bag() {
    const [cart, user] = await Promise.all([getCart(), getCurrentUser()]);
    return <BagButton cart={cart} signedIn={Boolean(user)} />;
}
