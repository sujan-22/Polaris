import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { SellerApplication } from "@/components/account/account-forms";
import { PageFallback, PageTitle } from "@/components/account/page-title";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Selling", robots: { index: false } };

export default function SellingPage() {
    return (
        <Suspense fallback={<PageFallback />}>
            <Selling />
        </Suspense>
    );
}

async function Selling() {
    const user = await requireUser("/account/selling");

    if (user.role !== "user") {
        return (
            <>
                <PageTitle eyebrow="Selling" title={<>You&apos;re a seller{user.storeName ? <>, {user.storeName}</> : null}.</>}>
                    Add products, manage stock and ship orders from the studio.
                </PageTitle>
                <Button asChild size="lg" className="mt-10">
                    <Link href="/studio">Open the studio</Link>
                </Button>
            </>
        );
    }

    const request = await prisma.sellerRequest.findUnique({ where: { userId: user.id } });

    if (request?.status === "pending") {
        return (
            <PageTitle eyebrow="Selling" title={<>Application <span className="accent">received</span>.</>}>
                We&apos;re reviewing {request.storeName}, sent {formatDate(request.createdAt)}. Once it&apos;s approved, the studio appears in your
                account menu and you can start listing.
            </PageTitle>
        );
    }

    return (
        <>
            <PageTitle eyebrow="Selling" title={request?.status === "denied" ? "Apply again" : "Sell on Polaris"}>
                {request?.status === "denied" ? (
                    <>
                        We couldn&apos;t approve your last application{request.note ? `: “${request.note}”` : "."} You&apos;re welcome to apply again.
                    </>
                ) : (
                    "Tell us about your shop. Every application is read by a person, usually within a couple of days."
                )}
            </PageTitle>
            <div className="mt-10">
                <SellerApplication defaults={request ? { storeName: request.storeName, pitch: request.pitch } : undefined} />
            </div>
        </>
    );
}
