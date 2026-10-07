import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AuthForm } from "@/components/auth/auth-form";
import { getFreshUser } from "@/lib/session";

export const metadata: Metadata = { title: "Create an account", robots: { index: false } };

export default function Page({ searchParams }: PageProps<"/sign-up">) {
    return (
        <>
            <p className="label text-ink-faint">Create an account</p>
            <h1 className="type-heading mt-5">Make yourself <span className="accent">at home</span>.</h1>
            <p className="mt-4 text-ink-soft">An account keeps your bag between visits, lets you check out and track orders, and is how you apply to sell.</p>
            <div className="mt-10">
                <Suspense fallback={<div className="h-80" aria-busy />}>
                    <Form searchParams={searchParams} />
                </Suspense>
            </div>
        </>
    );
}

async function Form({ searchParams }: Pick<PageProps<"/sign-up">, "searchParams">) {
    const raw = (await searchParams).next;
    const next = typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//") ? raw : undefined;
    if (await getFreshUser()) redirect(next ?? "/account");
    return <AuthForm mode="sign-up" next={next} />;
}
