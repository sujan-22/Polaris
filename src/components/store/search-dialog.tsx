"use client";

import { ArrowRight, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dialog } from "radix-ui";
import { useState } from "react";

import { closeOnLinkClick } from "@/lib/utils";

const SUGGESTIONS = ["Tee", "Hoodie", "Cap", "Mug", "Baby", "Headphones"];

/* A sheet that drops from the top: one input, a few suggestions. */
export function SearchButton() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const router = useRouter();

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        const q = query.trim();
        setOpen(false);
        router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
    };

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger className="inline-flex h-10 items-center gap-2 px-2 text-sm hover:underline hover:underline-offset-4">
                <Search className="size-[1.125rem] sm:size-4" aria-hidden />
                <span className="sr-only sm:not-sr-only">Search</span>
            </Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
                <Dialog.Content
                    aria-describedby={undefined}
                    onClick={closeOnLinkClick(() => setOpen(false))}
                    className="fixed inset-x-0 top-0 z-50 border-b border-rule bg-paper data-[state=closed]:animate-out data-[state=closed]:slide-out-to-top data-[state=open]:animate-in data-[state=open]:slide-in-from-top"
                >
                    <Dialog.Title className="sr-only">Search the store</Dialog.Title>
                    <form onSubmit={submit} className="shell flex h-24 items-center gap-4 sm:h-28">
                        <Search className="size-5 shrink-0 text-ink-soft" aria-hidden />
                        <input
                            autoFocus
                            type="search"
                            name="q"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search Polaris"
                            aria-label="Search"
                            className="type-heading h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-ink-faint/60 [&::-webkit-search-cancel-button]:hidden"
                        />
                        <button type="submit" className="inline-flex size-11 shrink-0 items-center justify-center bg-ink text-paper" aria-label="Search">
                            <ArrowRight className="size-5" aria-hidden />
                        </button>
                    </form>
                    <div className="shell flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-rule py-4">
                        <span className="label text-ink-faint">Try</span>
                        {SUGGESTIONS.map((term) => (
                            <Link key={term} href={`/shop?q=${encodeURIComponent(term)}`} className="text-sm link-underline">
                                {term}
                            </Link>
                        ))}
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
