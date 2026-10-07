"use client";

import { LayoutGrid, LogOut, Package, User } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";

import { signOut } from "@/actions/auth";
import { Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger } from "@/components/ui/menu";

export function AccountMenuFallback() {
    return <span className="inline-flex h-10 w-[4.5rem] items-center px-2 text-sm text-ink-soft">Account</span>;
}

interface AccountMenuProps {
    user: { name: string; email: string; staff: boolean } | null;
}

export function AccountMenu({ user }: AccountMenuProps) {
    const [pending, startTransition] = useTransition();

    if (!user) {
        return (
            <Link href="/sign-in" className="inline-flex h-10 items-center px-2 text-sm hover:underline hover:underline-offset-4">
                Sign in
            </Link>
        );
    }

    return (
        <Menu>
            <MenuTrigger className="inline-flex h-10 items-center px-2 text-sm outline-none hover:underline hover:underline-offset-4 data-[state=open]:underline data-[state=open]:underline-offset-4">
                Account
            </MenuTrigger>
            <MenuContent align="end">
                <MenuLabel>
                    <p className="truncate text-sm font-medium">{user.name}</p>
                    <p className="truncate text-sm text-ink-soft">{user.email}</p>
                </MenuLabel>
                <MenuSeparator />
                <MenuItem asChild>
                    <Link href="/account">
                        <User aria-hidden /> Account
                    </Link>
                </MenuItem>
                <MenuItem asChild>
                    <Link href="/account/orders">
                        <Package aria-hidden /> Orders
                    </Link>
                </MenuItem>
                {user.staff ? (
                    <MenuItem asChild>
                        <Link href="/studio">
                            <LayoutGrid aria-hidden /> Studio
                        </Link>
                    </MenuItem>
                ) : null}
                <MenuSeparator />
                <MenuItem disabled={pending} onSelect={() => startTransition(() => signOut())}>
                    <LogOut aria-hidden /> {pending ? "Signing out…" : "Sign out"}
                </MenuItem>
            </MenuContent>
        </Menu>
    );
}
