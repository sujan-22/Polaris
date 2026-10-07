"use client";

import Link from "next/link";
import { useActionState } from "react";

import { signIn, signUp, type AuthState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input } from "@/components/ui/field";

/*
 * One component for both forms. Plain <form action>, so they work before
 * JavaScript loads; errors come back from the server action per field.
 */
export function AuthForm({ mode, next }: { mode: "sign-in" | "sign-up"; next?: string }) {
    const [state, action, pending] = useActionState<AuthState, FormData>(mode === "sign-in" ? signIn : signUp, {});
    const errors = state.errors ?? {};
    const suffix = next ? `?next=${encodeURIComponent(next)}` : "";

    return (
        <form action={action} className="grid gap-6" noValidate>
            {next ? <input type="hidden" name="next" value={next} /> : null}
            {mode === "sign-up" ? (
                <Field label="Name" htmlFor="name" error={errors.name}>
                    <Input
                        id="name"
                        name="name"
                        autoComplete="name"
                        defaultValue={state.values?.name}
                        aria-invalid={errors.name ? true : undefined}
                        aria-describedby={errors.name ? "name-error" : undefined}
                        required
                    />
                </Field>
            ) : null}
            <Field label="Email" htmlFor="email" error={errors.email}>
                <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    defaultValue={state.values?.email}
                    aria-invalid={errors.email ? true : undefined}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    required
                />
            </Field>
            <Field
                label="Password"
                htmlFor="password"
                error={errors.password}
                hint={mode === "sign-up" ? "At least 8 characters." : undefined}
            >
                <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                    aria-invalid={errors.password ? true : undefined}
                    aria-describedby={errors.password ? "password-error" : undefined}
                    required
                />
            </Field>

            <FormMessage>{state.message}</FormMessage>

            <Button type="submit" size="lg" disabled={pending} className="mt-2 w-full">
                {pending ? (mode === "sign-in" ? "Signing in…" : "Creating account…") : mode === "sign-in" ? "Sign in" : "Create account"}
            </Button>

            <p className="text-sm text-ink-soft">
                {mode === "sign-in" ? (
                    <>
                        New to Polaris?{" "}
                        <Link href={`/sign-up${suffix}`} className="text-ink link-underline">
                            Create an account
                        </Link>
                    </>
                ) : (
                    <>
                        Already have an account?{" "}
                        <Link href={`/sign-in${suffix}`} className="text-ink link-underline">
                            Sign in
                        </Link>
                    </>
                )}
            </p>
        </form>
    );
}
