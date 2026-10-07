import type { Metadata } from "next";
import { Suspense } from "react";

import { DeleteAccount, NameForm, PasswordForm } from "@/components/account/account-forms";
import { PageFallback, PageTitle } from "@/components/account/page-title";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Profile", robots: { index: false } };

export default function ProfilePage() {
    return (
        <Suspense fallback={<PageFallback />}>
            <Profile />
        </Suspense>
    );
}

async function Profile() {
    const user = await requireUser("/account/profile");
    return (
        <>
            <PageTitle eyebrow="Profile" title="Your details">
                {user.email}
            </PageTitle>
            <NameForm name={user.name} />
            <PasswordForm />
            <DeleteAccount />
        </>
    );
}
