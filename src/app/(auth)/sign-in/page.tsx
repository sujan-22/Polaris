import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AuthForm } from "@/components/auth/auth-form";
import { getFreshUser } from "@/lib/session";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default function Page({ searchParams }: PageProps<"/sign-in">) {
    return (
        <>
            <p className="label text-ink-faint">Sign in</p>
            <h1 className="type-heading mt-5">Welcome <span className="accent">back</span>.</h1>
            <p className="mt-4 text-ink-soft">Sign in to check out, track orders and pick up the bag you started.</p>
            <div className="mt-10">
                <Suspense fallback={<div className="h-80" aria-busy />}>
                    <Form searchParams={searchParams} />
                </Suspense>
            </div>
        </>
    );
}

async function Form({ searchParams }: Pick<PageProps<"/sign-in">, "searchParams">) {
    const raw = (await searchParams).next;
    const next = typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//") ? raw : undefined;
    if (await getFreshUser()) redirect(next ?? "/account");
    return <AuthForm mode="sign-in" next={next} />;
}
