import { ChevronDown } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

/*
 * Form controls. Inputs are a single bottom-weighted box with a hairline
 * border that darkens on focus; errors swap the border to the signal colour
 * and appear as text under the field, never as a toast.
 */

const control =
    "w-full border border-rule-strong bg-paper px-3.5 text-[0.9375rem] text-ink transition-colors placeholder:text-ink-faint hover:border-ink-soft focus-visible:border-ink focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-signal";

export function Input({ className, ...props }: ComponentProps<"input">) {
    return <input data-slot="input" className={cn(control, "h-12", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
    return <textarea data-slot="textarea" className={cn(control, "min-h-32 py-3 leading-relaxed", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
    return (
        <div className="relative">
            <select data-slot="select" className={cn(control, "h-12 appearance-none pr-10", className)} {...props}>
                {children}
            </select>
            <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-ink-soft" />
        </div>
    );
}

export function Label({ className, ...props }: ComponentProps<"label">) {
    return <label className={cn("label block text-ink-soft", className)} {...props} />;
}

interface FieldProps {
    label: string;
    htmlFor: string;
    hint?: ReactNode;
    error?: string | string[];
    className?: string;
    children: ReactNode;
}

/** Label, control, then either the error or a hint. */
export function Field({ label, htmlFor, hint, error, className, children }: FieldProps) {
    const message = Array.isArray(error) ? error[0] : error;
    return (
        <div className={cn("grid gap-2.5", className)}>
            <Label htmlFor={htmlFor}>{label}</Label>
            {children}
            {message ? (
                <p id={`${htmlFor}-error`} className="text-sm text-signal">
                    {message}
                </p>
            ) : hint ? (
                <p className="text-sm text-ink-faint">{hint}</p>
            ) : null}
        </div>
    );
}

/** A form-level message: the result of the last submit. */
export function FormMessage({ tone = "error", children }: { tone?: "error" | "success"; children?: ReactNode }) {
    if (!children) return null;
    return (
        <p
            role={tone === "error" ? "alert" : "status"}
            className={cn("border-l-2 py-1 pl-3 text-sm", tone === "error" ? "border-signal text-signal" : "border-success text-success")}
        >
            {children}
        </p>
    );
}
