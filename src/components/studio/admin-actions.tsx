"use client";

import { MoreHorizontal } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { reviewSellerRequest, setBanned, setRole, type AdminResult } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/field";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/menu";
import { DialogClose, DialogContent, DialogDescription, DialogRoot, DialogTitle } from "@/components/ui/sheet";

function useAdminAction() {
    const [pending, startTransition] = useTransition();
    const run = (action: () => Promise<AdminResult>) =>
        startTransition(async () => {
            const result = await action();
            if (result.message) toast(result.message);
        });
    return { pending, run };
}

export function CustomerMenu({ user }: { user: { id: string; name: string; role: string; banned: boolean } }) {
    const { pending, run } = useAdminAction();
    if (user.role === "admin") return null;
    return (
        <Menu>
            <MenuTrigger className="inline-flex size-9 items-center justify-center hover:bg-paper-2 disabled:opacity-40" disabled={pending} aria-label={`Actions for ${user.name}`}>
                <MoreHorizontal className="size-4" aria-hidden />
            </MenuTrigger>
            <MenuContent align="end">
                {user.role === "seller" ? (
                    <MenuItem onSelect={() => run(() => setRole({ userId: user.id, role: "user" }))}>Remove selling (archives their products)</MenuItem>
                ) : (
                    <MenuItem onSelect={() => run(() => setRole({ userId: user.id, role: "seller" }))}>Make a seller</MenuItem>
                )}
                {user.banned ? (
                    <MenuItem onSelect={() => run(() => setBanned({ userId: user.id, banned: false }))}>Reinstate account</MenuItem>
                ) : (
                    <MenuItem className="text-signal" onSelect={() => run(() => setBanned({ userId: user.id, banned: true }))}>
                        Suspend and sign out
                    </MenuItem>
                )}
            </MenuContent>
        </Menu>
    );
}

export function ReviewActions({ requestId, storeName }: { requestId: string; storeName: string }) {
    const { pending, run } = useAdminAction();
    const [open, setOpen] = useState(false);
    const [note, setNote] = useState("");
    return (
        <div className="flex gap-2">
            <Button size="sm" disabled={pending} onClick={() => run(() => reviewSellerRequest({ requestId, decision: "approved" }))}>
                Approve
            </Button>
            <Button size="sm" variant="outline" disabled={pending} onClick={() => setOpen(true)}>
                Decline
            </Button>
            <DialogRoot open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogTitle>Decline {storeName}?</DialogTitle>
                    <DialogDescription>The applicant sees your note and can apply again.</DialogDescription>
                    <Field label="Note to the applicant" htmlFor="note" hint="Optional, but kind.">
                        <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} className="min-h-24" />
                    </Field>
                    <div className="flex justify-end gap-2">
                        <DialogClose asChild>
                            <Button variant="ghost">Cancel</Button>
                        </DialogClose>
                        <Button
                            variant="danger"
                            disabled={pending}
                            onClick={() => {
                                setOpen(false);
                                run(() => reviewSellerRequest({ requestId, decision: "denied", note }));
                            }}
                        >
                            Decline
                        </Button>
                    </div>
                </DialogContent>
            </DialogRoot>
        </div>
    );
}
