"use client";

import { useActionState, useState } from "react";

import { applyToSell, changePassword, deleteAccount, updateName, type FormState } from "@/actions/account";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input, Textarea } from "@/components/ui/field";
import { DialogClose, DialogContent, DialogDescription, DialogRoot, DialogTitle, DialogTrigger } from "@/components/ui/sheet";

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
    return (
        <section className="grid gap-6 border-b border-rule py-10 lg:grid-cols-[16rem_1fr] lg:gap-12">
            <div>
                <h2 className="text-lg font-medium tracking-tight">{title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{description}</p>
            </div>
            <div className="max-w-md">{children}</div>
        </section>
    );
}

const invalid = (state: FormState, name: string) =>
    state.errors?.[name] ? { "aria-invalid": true as const, "aria-describedby": `${name}-error` } : {};

export function NameForm({ name }: { name: string }) {
    const [state, action, pending] = useActionState(updateName, {});
    return (
        <Section title="Name" description="How sellers address your parcels and how we greet you.">
            <form action={action} className="grid gap-5">
                <Field label="Full name" htmlFor="name" error={state.errors?.name}>
                    <Input id="name" name="name" defaultValue={name} autoComplete="name" {...invalid(state, "name")} />
                </Field>
                <FormMessage tone={state.ok ? "success" : "error"}>{state.message}</FormMessage>
                <Button type="submit" variant="outline" disabled={pending} className="justify-self-start">
                    {pending ? "Saving…" : "Save name"}
                </Button>
            </form>
        </Section>
    );
}

export function PasswordForm() {
    const [state, action, pending] = useActionState(changePassword, {});
    return (
        <Section title="Password" description="Changing it signs you out everywhere else.">
            <form action={action} className="grid gap-5">
                <Field label="Current password" htmlFor="currentPassword" error={state.errors?.currentPassword}>
                    <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" {...invalid(state, "currentPassword")} />
                </Field>
                <Field label="New password" htmlFor="newPassword" error={state.errors?.newPassword} hint="At least 8 characters.">
                    <Input id="newPassword" name="newPassword" type="password" autoComplete="new-password" {...invalid(state, "newPassword")} />
                </Field>
                <FormMessage tone={state.ok ? "success" : "error"}>{state.message}</FormMessage>
                <Button type="submit" variant="outline" disabled={pending} className="justify-self-start">
                    {pending ? "Changing…" : "Change password"}
                </Button>
            </form>
        </Section>
    );
}

export function DeleteAccount() {
    const [state, action, pending] = useActionState(deleteAccount, {});
    const [open, setOpen] = useState(false);
    return (
        <Section title="Close account" description="Deletes your account, your bag and your order history. Sellers lose their listings too.">
            <DialogRoot open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button variant="quiet" className="justify-self-start text-signal">
                        Delete my account
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogTitle>Delete your account?</DialogTitle>
                    <DialogDescription>This can&apos;t be undone. Enter your password to confirm.</DialogDescription>
                    <form action={action} className="grid gap-5">
                        <Field label="Password" htmlFor="delete-password" error={state.errors?.password}>
                            <Input id="delete-password" name="password" type="password" autoComplete="current-password" {...invalid(state, "password")} />
                        </Field>
                        <FormMessage>{state.message}</FormMessage>
                        <div className="flex justify-end gap-2">
                            <DialogClose asChild>
                                <Button type="button" variant="ghost">
                                    Keep it
                                </Button>
                            </DialogClose>
                            <Button type="submit" variant="danger" disabled={pending}>
                                {pending ? "Deleting…" : "Delete account"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </DialogRoot>
        </Section>
    );
}

export function SellerApplication({ defaults }: { defaults?: { storeName: string; pitch: string } }) {
    const [state, action, pending] = useActionState(applyToSell, {});
    if (state.ok) return <FormMessage tone="success">{state.message}</FormMessage>;
    return (
        <form action={action} className="grid max-w-lg gap-6">
            <Field label="Shop name" htmlFor="storeName" error={state.errors?.storeName} hint="What shoppers will see next to your goods.">
                <Input id="storeName" name="storeName" defaultValue={defaults?.storeName} {...invalid(state, "storeName")} />
            </Field>
            <Field label="What will you sell?" htmlFor="pitch" error={state.errors?.pitch} hint="A few sentences on what you make and how.">
                <Textarea id="pitch" name="pitch" defaultValue={defaults?.pitch} maxLength={600} {...invalid(state, "pitch")} />
            </Field>
            <FormMessage>{state.message}</FormMessage>
            <Button type="submit" size="lg" disabled={pending} className="justify-self-start">
                {pending ? "Sending…" : "Send application"}
            </Button>
        </form>
    );
}
