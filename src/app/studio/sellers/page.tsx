import type { Metadata } from "next";
import { Suspense } from "react";

import { ReviewActions } from "@/components/studio/admin-actions";
import { Badge, StudioFallback, StudioHeader } from "@/components/studio/studio-header";
import { requireAdmin } from "@/lib/session";
import { formatDate } from "@/lib/utils";
import { getSellerRequests } from "@/server/studio";

export const metadata: Metadata = { title: "Seller requests" };

export default function SellersPage() {
    return (
        <Suspense fallback={<StudioFallback />}>
            <Sellers />
        </Suspense>
    );
}

async function Sellers() {
    await requireAdmin();
    const requests = await getSellerRequests();
    const pending = requests.filter((r) => r.status === "pending");
    const reviewed = requests.filter((r) => r.status !== "pending");

    return (
        <>
            <StudioHeader
                eyebrow="Store admin"
                title="Seller requests"
                description="Approving an application turns the applicant into a seller under the shop name they chose."
            />

            <section className="mt-10">
                <h2 className="label border-b border-rule pb-3 text-ink-faint">Waiting · {pending.length}</h2>
                {pending.length ? (
                    <ul className="divide-y divide-rule">
                        {pending.map((request) => (
                            <li key={request.id} className="grid gap-5 py-7 lg:grid-cols-[1fr_auto] lg:gap-10">
                                <div>
                                    <p className="type-subheading">{request.storeName}</p>
                                    <p className="mt-1 text-sm text-ink-soft">
                                        {request.user.name} · {request.user.email} · applied {formatDate(request.createdAt)}
                                    </p>
                                    <blockquote className="mt-4 max-w-2xl border-l-2 border-rule-strong pl-4 leading-relaxed text-ink-soft">
                                        {request.pitch}
                                    </blockquote>
                                </div>
                                <ReviewActions requestId={request.id} storeName={request.storeName} />
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="py-8 text-ink-soft">No applications waiting.</p>
                )}
            </section>

            {reviewed.length ? (
                <section className="mt-14">
                    <h2 className="label border-b border-rule pb-3 text-ink-faint">Reviewed</h2>
                    <ul className="divide-y divide-rule">
                        {reviewed.map((request) => (
                            <li key={request.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                                <div>
                                    <p className="font-medium">{request.storeName}</p>
                                    <p className="text-sm text-ink-faint">
                                        {request.user.name} · {request.reviewedAt ? formatDate(request.reviewedAt) : ""}
                                        {request.note ? ` · “${request.note}”` : ""}
                                    </p>
                                </div>
                                <Badge tone={request.status}>{request.status}</Badge>
                            </li>
                        ))}
                    </ul>
                </section>
            ) : null}
        </>
    );
}
