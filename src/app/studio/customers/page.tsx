import { Search } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { CustomerMenu } from "@/components/studio/admin-actions";
import { Badge, StudioFallback, StudioHeader } from "@/components/studio/studio-header";
import { formatPrice } from "@/lib/money";
import { requireAdmin } from "@/lib/session";
import { formatDate, pluralize } from "@/lib/utils";
import { getCustomers } from "@/server/studio";

export const metadata: Metadata = { title: "Customers" };

export default function CustomersPage({ searchParams }: PageProps<"/studio/customers">) {
    return (
        <Suspense fallback={<StudioFallback />}>
            <Customers searchParams={searchParams} />
        </Suspense>
    );
}

async function Customers({ searchParams }: Pick<PageProps<"/studio/customers">, "searchParams">) {
    const admin = await requireAdmin();
    const raw = (await searchParams).q;
    const q = typeof raw === "string" ? raw.trim().slice(0, 60) : "";
    const users = await getCustomers(q || undefined);

    return (
        <>
            <StudioHeader eyebrow="Store admin" title="Customers" description={`${pluralize(users.length, "account")}${q ? ` matching “${q}”` : ""}.`} />
            <form action="/studio/customers" className="relative mt-6 w-full sm:w-72">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-faint" aria-hidden />
                <input
                    name="q"
                    defaultValue={q}
                    placeholder="Search name or email"
                    aria-label="Search customers"
                    className="h-10 w-full border border-rule bg-paper pr-3 pl-9 text-sm outline-none focus:border-ink"
                />
            </form>
            <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[44rem] text-left text-[0.9375rem]">
                    <thead>
                        <tr className="label border-b border-ink text-ink-faint">
                            <th scope="col" className="py-3 pr-4 font-medium">Name</th>
                            <th scope="col" className="py-3 pr-4 font-medium">Role</th>
                            <th scope="col" className="py-3 pr-4 text-right font-medium">Orders</th>
                            <th scope="col" className="py-3 pr-4 text-right font-medium">Spent</th>
                            <th scope="col" className="py-3 pr-4 text-right font-medium">Joined</th>
                            <th scope="col" className="py-3 font-medium">
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-rule">
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td className="py-3 pr-4">
                                    <p className="font-medium">
                                        {user.name}
                                        {user.id === admin.id ? <span className="text-ink-faint"> (you)</span> : null}
                                    </p>
                                    <p className="text-sm text-ink-faint">
                                        {user.email}
                                        {user.role === "seller" && user.storeName ? ` · ${user.storeName}` : ""}
                                    </p>
                                </td>
                                <td className="py-3 pr-4">
                                    <div className="flex flex-wrap gap-1.5">
                                        <Badge tone={user.role === "admin" ? "admin" : user.role === "seller" ? "seller" : "user"}>
                                            {user.role === "user" ? "Customer" : user.role === "seller" ? "Seller" : "Admin"}
                                        </Badge>
                                        {user.banned ? <Badge tone="suspended">Suspended</Badge> : null}
                                    </div>
                                </td>
                                <td className="tabular py-3 pr-4 text-right">{user.orderCount}</td>
                                <td className="tabular py-3 pr-4 text-right">{formatPrice(user.spentCents)}</td>
                                <td className="py-3 pr-4 text-right text-sm text-ink-soft">{formatDate(user.createdAt)}</td>
                                <td className="py-3 text-right">
                                    {user.id !== admin.id ? <CustomerMenu user={{ id: user.id, name: user.name, role: user.role, banned: user.banned }} /> : null}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}
