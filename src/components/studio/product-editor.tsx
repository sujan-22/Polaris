"use client";

import { ArrowLeft, ArrowRight, ExternalLink, ImagePlus, LoaderCircle, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteProduct, saveProduct, uploadProductImage, type SaveResult } from "@/actions/studio";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input, Select, Textarea } from "@/components/ui/field";
import { DialogClose, DialogContent, DialogDescription, DialogRoot, DialogTitle, DialogTrigger } from "@/components/ui/sheet";
import { CATEGORIES, COLLECTIONS, COLOR_NAMES, COLORS, sortSizes } from "@/lib/catalog";
import { toCents, toDollarString } from "@/lib/money";
import { cn } from "@/lib/utils";

export interface EditorProduct {
    id: string;
    slug: string;
    name: string;
    description: string;
    details: string[];
    category: string;
    collection: "new_arrivals" | "weekly_picks" | null;
    status: "draft" | "active" | "archived";
    priceCents: number;
    compareAtCents: number | null;
    images: { url: string; color: string | null }[];
    variants: { color: string; size: string; stock: number }[];
}

const LADDERS = [
    { name: "Clothing", sizes: ["XS", "S", "M", "L", "XL", "XXL"] },
    { name: "Baby", sizes: ["0–6M", "6–12M", "12–24M"] },
    { name: "Shoes", sizes: ["6", "7", "8", "9", "10", "11"] },
    { name: "Other", sizes: ["One size"] },
];

const STATUSES = [
    { value: "active", label: "Active", hint: "Visible in the shop." },
    { value: "draft", label: "Draft", hint: "Only you can see it." },
    { value: "archived", label: "Archived", hint: "Off the shelves, kept for records." },
] as const;

const key = (color: string, size: string) => `${color}|${size}`;

/*
 * Shrinks an image in the browser before upload: longest side 1600px, WebP
 * where the browser can encode it (JPEG otherwise). A 6 MB phone photo
 * becomes a few hundred KB, comfortably inside the request limit.
 */
async function prepareImage(file: File): Promise<Blob> {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const encode = (type: string) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.86));
    const webp = await encode("image/webp");
    if (webp?.type === "image/webp") return webp;
    const jpeg = await encode("image/jpeg");
    if (!jpeg) throw new Error("Couldn't read that image.");
    return jpeg;
}

export function ProductEditor({ product, uploadsEnabled }: { product?: EditorProduct; uploadsEnabled: boolean }) {
    const router = useRouter();
    const [saving, startSaving] = useTransition();
    const [deleting, startDeleting] = useTransition();
    const [result, setResult] = useState<SaveResult | null>(null);

    const [name, setName] = useState(product?.name ?? "");
    const [description, setDescription] = useState(product?.description ?? "");
    const [details, setDetails] = useState(product?.details.join("\n") ?? "");
    const [category, setCategory] = useState(product?.category ?? "");
    const [collection, setCollection] = useState<string>(product?.collection ?? "");
    const [status, setStatus] = useState<EditorProduct["status"]>(product?.status ?? "draft");
    const [price, setPrice] = useState(product ? toDollarString(product.priceCents) : "");
    const [compareAt, setCompareAt] = useState(product?.compareAtCents ? toDollarString(product.compareAtCents) : "");
    const [images, setImages] = useState(product?.images ?? []);
    const [uploading, setUploading] = useState(0);

    const [colors, setColors] = useState<string[]>(() => [...new Set(product?.variants.map((v) => v.color) ?? [])]);
    const [sizes, setSizes] = useState<string[]>(() => sortSizes(product?.variants.map((v) => v.size) ?? []));
    const [stock, setStock] = useState<Record<string, string>>(() =>
        Object.fromEntries((product?.variants ?? []).map((v) => [key(v.color, v.size), String(v.stock)])),
    );
    const fileInput = useRef<HTMLInputElement>(null);

    const errors = result?.errors ?? {};
    const variants = useMemo(
        () => colors.flatMap((color) => sizes.map((size) => ({ color, size, stock: Math.max(0, Number.parseInt(stock[key(color, size)] ?? "", 10) || 0) }))),
        [colors, sizes, stock],
    );
    const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);

    const toggle = (list: string[], value: string, set: (next: string[]) => void, sort?: (v: string[]) => string[]) => {
        const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
        set(sort ? sort(next) : next);
    };

    const fillStock = (value: string) => {
        setStock((current) => ({ ...current, ...Object.fromEntries(variants.map((v) => [key(v.color, v.size), value])) }));
    };

    const upload = async (files: FileList | null) => {
        if (!files?.length) return;
        const list = [...files].slice(0, 12 - images.length);
        setUploading((n) => n + list.length);
        for (const file of list) {
            try {
                const blob = await prepareImage(file);
                const form = new FormData();
                form.append("file", new File([blob], file.name.replace(/\.\w+$/, "") + (blob.type === "image/webp" ? ".webp" : ".jpg"), { type: blob.type }));
                const { url, message } = await uploadProductImage(form);
                if (url) setImages((current) => [...current, { url, color: null }]);
                else toast(message ?? "Upload failed.");
            } catch (error) {
                toast(error instanceof Error ? error.message : "Upload failed.");
            } finally {
                setUploading((n) => n - 1);
            }
        }
        if (fileInput.current) fileInput.current.value = "";
    };

    const move = (index: number, by: number) => {
        setImages((current) => {
            const next = [...current];
            const target = index + by;
            if (target < 0 || target >= next.length) return current;
            [next[index], next[target]] = [next[target]!, next[index]!];
            return next;
        });
    };

    const save = () =>
        startSaving(async () => {
            const response = await saveProduct({
                id: product?.id,
                name,
                description,
                details: details
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean),
                category: category as never,
                collection: (collection || null) as EditorProduct["collection"],
                status,
                priceCents: price ? toCents(price) : 0,
                compareAtCents: compareAt ? toCents(compareAt) : null,
                images: images.map((image) => ({ url: image.url, color: image.color && colors.includes(image.color) ? image.color : null })),
                variants,
            });
            setResult(response);
            if (!response.ok) {
                toast(response.message ?? "Couldn't save.");
                return;
            }
            toast(product ? "Saved." : "Product created.");
            if (!product) router.replace(`/studio/products/${response.id}`);
            else router.refresh();
        });

    const remove = () =>
        startDeleting(async () => {
            const response = await deleteProduct(product!.id);
            if (!response.ok) {
                toast(response.message ?? "Couldn't delete.");
                return;
            }
            toast(`${product!.name} deleted.`);
            router.push("/studio/products");
        });

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                save();
            }}
            noValidate
        >
            {/* Action bar */}
            <div className="sticky top-14 z-20 -mx-[var(--gutter)] flex flex-wrap items-center justify-between gap-4 border-b border-rule bg-paper/95 px-[var(--gutter)] py-4 backdrop-blur lg:top-0 lg:-mx-12 lg:px-12">
                <div className="flex min-w-0 items-center gap-3">
                    <Link href="/studio/products" className="inline-flex size-9 shrink-0 items-center justify-center border border-rule hover:border-ink" aria-label="Back to products">
                        <ArrowLeft className="size-4" aria-hidden />
                    </Link>
                    <div className="min-w-0">
                        <p className="label text-ink-faint">{product ? "Edit product" : "New product"}</p>
                        <p className="mt-1 truncate font-medium">{name || "Untitled"}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {product?.status === "active" ? (
                        <Button asChild variant="ghost" size="sm">
                            <Link href={`/products/${product.slug}`} target="_blank">
                                View <ExternalLink aria-hidden />
                            </Link>
                        </Button>
                    ) : null}
                    <Button type="submit" disabled={saving || uploading > 0}>
                        {saving ? "Saving…" : uploading ? "Uploading…" : product ? "Save changes" : "Create product"}
                    </Button>
                </div>
            </div>

            {result && !result.ok && result.message ? (
                <div className="mt-6">
                    <FormMessage>{result.message}</FormMessage>
                </div>
            ) : null}

            <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_18rem] lg:gap-14">
                <div className="grid min-w-0 gap-14">
                    {/* Basics */}
                    <EditorSection title="Basics">
                        <Field label="Name" htmlFor="name" error={errors.name}>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={errors.name ? true : undefined} />
                        </Field>
                        <Field label="Description" htmlFor="description" error={errors.description} hint="Two or three sentences: what it is and why it's good.">
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                maxLength={1000}
                                aria-invalid={errors.description ? true : undefined}
                            />
                        </Field>
                        <Field label="Details" htmlFor="details" error={errors.details} hint="One per line, up to eight: material, fit, care.">
                            <Textarea id="details" value={details} onChange={(e) => setDetails(e.target.value)} className="min-h-28" />
                        </Field>
                    </EditorSection>

                    {/* Photos */}
                    <EditorSection
                        title="Photos"
                        description="The first photo leads everywhere. Tag a photo with a colour and the product page shows it when that colour is picked."
                        error={errors.images}
                    >
                        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                            {images.map((image, i) => (
                                <li key={image.url} className="grid gap-2">
                                    <div className="studio group relative aspect-[4/5] overflow-hidden">
                                        <Image src={image.url} alt="" fill sizes="200px" className="object-cover" />
                                        {i === 0 ? <span className="label absolute top-2 left-2 bg-ink px-1.5 py-1 text-paper">Lead</span> : null}
                                        <div className="absolute inset-x-2 bottom-2 flex justify-between opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                                            <div className="flex gap-1">
                                                <IconButton label="Move earlier" onClick={() => move(i, -1)} disabled={i === 0}>
                                                    <ArrowLeft />
                                                </IconButton>
                                                <IconButton label="Move later" onClick={() => move(i, 1)} disabled={i === images.length - 1}>
                                                    <ArrowRight />
                                                </IconButton>
                                            </div>
                                            <IconButton label="Remove photo" onClick={() => setImages((current) => current.filter((_, j) => j !== i))}>
                                                <X />
                                            </IconButton>
                                        </div>
                                    </div>
                                    <select
                                        aria-label={`Colour shown in photo ${i + 1}`}
                                        value={image.color && colors.includes(image.color) ? image.color : ""}
                                        onChange={(e) =>
                                            setImages((current) => current.map((img, j) => (j === i ? { ...img, color: e.target.value || null } : img)))
                                        }
                                        className="h-9 w-full border border-rule bg-paper px-2 text-sm outline-none focus:border-ink"
                                    >
                                        <option value="">All colours</option>
                                        {colors.map((c) => (
                                            <option key={c} value={c}>
                                                {c}
                                            </option>
                                        ))}
                                    </select>
                                </li>
                            ))}
                            {Array.from({ length: uploading }, (_, i) => (
                                <li key={`uploading-${i}`} className="studio grid aspect-[4/5] place-items-center">
                                    <LoaderCircle className="size-5 animate-spin text-ink-soft" aria-label="Uploading" />
                                </li>
                            ))}
                            {images.length + uploading < 12 ? (
                                <li>
                                    <label
                                        className={cn(
                                            "grid aspect-[4/5] cursor-pointer place-content-center justify-items-center gap-2 border border-dashed border-rule-strong p-4 text-center text-sm text-ink-soft transition-colors hover:border-ink hover:text-ink",
                                            !uploadsEnabled && "pointer-events-none opacity-50",
                                        )}
                                    >
                                        <ImagePlus className="size-5" aria-hidden />
                                        {uploadsEnabled ? "Add photos" : "Uploads not configured"}
                                        <input
                                            ref={fileInput}
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp,image/avif"
                                            multiple
                                            className="sr-only"
                                            disabled={!uploadsEnabled}
                                            onChange={(e) => upload(e.target.files)}
                                        />
                                    </label>
                                </li>
                            ) : null}
                        </ul>
                    </EditorSection>

                    {/* Colours and sizes */}
                    <EditorSection title="Colours and sizes" description="Every combination you pick becomes a variant with its own stock." error={errors.variants}>
                        <div>
                            <p className="label text-ink-faint">Colours</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {COLOR_NAMES.map((c) => (
                                    <Chip key={c} pressed={colors.includes(c)} onClick={() => toggle(colors, c, setColors)}>
                                        <span
                                            className={cn(
                                                "size-3 rounded-full",
                                                colors.includes(c) ? "shadow-[0_0_0_1px_rgb(245_244_240/0.7)]" : "shadow-[inset_0_0_0_1px_rgb(18_18_18/0.2)]",
                                            )}
                                            style={{ background: COLORS[c] }}
                                        />
                                        {c}
                                    </Chip>
                                ))}
                            </div>
                        </div>
                        <div className="grid gap-4">
                            <p className="label text-ink-faint">Sizes</p>
                            {LADDERS.map((ladder) => (
                                <div key={ladder.name} className="flex flex-wrap items-center gap-2">
                                    <span className="w-16 text-sm text-ink-faint">{ladder.name}</span>
                                    {ladder.sizes.map((s) => (
                                        <Chip key={s} pressed={sizes.includes(s)} onClick={() => toggle(sizes, s, setSizes, sortSizes)}>
                                            {s}
                                        </Chip>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </EditorSection>

                    {/* Stock grid */}
                    {variants.length ? (
                        <EditorSection
                            title="Stock"
                            description={`${variants.length} variants, ${totalStock} units on hand.`}
                            aside={
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-ink-faint">Set all to</span>
                                    {["0", "10", "25"].map((n) => (
                                        <button
                                            key={n}
                                            type="button"
                                            onClick={() => fillStock(n)}
                                            aria-label={`Set every variant's stock to ${n}`}
                                            className="tabular h-8 border border-rule px-2.5 hover:border-ink"
                                        >
                                            {n}
                                        </button>
                                    ))}
                                </div>
                            }
                        >
                            <div className="overflow-x-auto">
                                <table className="text-sm">
                                    <thead>
                                        <tr>
                                            <th scope="col" className="label pr-4 pb-3 text-left font-medium text-ink-faint">
                                                Colour
                                            </th>
                                            {sizes.map((s) => (
                                                <th key={s} scope="col" className="label px-1 pb-3 text-center font-medium text-ink-faint">
                                                    {s}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {colors.map((c) => (
                                            <tr key={c}>
                                                <th scope="row" className="pr-4 py-1 text-left font-normal whitespace-nowrap">
                                                    {c}
                                                </th>
                                                {sizes.map((s) => (
                                                    <td key={s} className="px-1 py-1">
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            max={9999}
                                                            inputMode="numeric"
                                                            aria-label={`Stock for ${c}, ${s}`}
                                                            placeholder="0"
                                                            value={stock[key(c, s)] ?? ""}
                                                            onChange={(e) => setStock((current) => ({ ...current, [key(c, s)]: e.target.value }))}
                                                            className={cn(
                                                                "tabular h-10 w-16 border bg-paper px-2 text-center outline-none focus:border-ink",
                                                                (Number.parseInt(stock[key(c, s)] ?? "0", 10) || 0) === 0 ? "border-rule text-ink-faint" : "border-rule-strong",
                                                            )}
                                                        />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </EditorSection>
                    ) : null}
                </div>

                {/* Sidebar */}
                <aside className="grid content-start gap-10">
                    <fieldset>
                        <legend className="label w-full border-b border-rule pb-3 text-ink-faint">Status</legend>
                        <div className="mt-4 grid gap-1">
                            {STATUSES.map((option) => (
                                <label key={option.value} className="flex cursor-pointer gap-3 py-2">
                                    <input
                                        type="radio"
                                        name="status"
                                        value={option.value}
                                        checked={status === option.value}
                                        onChange={() => setStatus(option.value)}
                                        className="mt-1 size-4 accent-ink"
                                    />
                                    <span>
                                        <span className="block text-[0.9375rem]">{option.label}</span>
                                        <span className="block text-sm text-ink-faint">{option.hint}</span>
                                    </span>
                                </label>
                            ))}
                        </div>
                        {errors.status ? <p className="mt-2 text-sm text-signal">{errors.status[0]}</p> : null}
                    </fieldset>

                    <div className="grid gap-5">
                        <p className="label border-b border-rule pb-3 text-ink-faint">Pricing</p>
                        <Field label="Price (CAD)" htmlFor="price" error={errors.priceCents}>
                            <MoneyInput id="price" value={price} onChange={setPrice} invalid={Boolean(errors.priceCents)} />
                        </Field>
                        <Field label="Was (optional)" htmlFor="compareAt" error={errors.compareAtCents} hint="Shown struck through. Puts it in the sale.">
                            <MoneyInput id="compareAt" value={compareAt} onChange={setCompareAt} invalid={Boolean(errors.compareAtCents)} />
                        </Field>
                    </div>

                    <div className="grid gap-5">
                        <p className="label border-b border-rule pb-3 text-ink-faint">Organisation</p>
                        <Field label="Department" htmlFor="category" error={errors.category}>
                            <Select id="category" value={category} onChange={(e) => setCategory(e.target.value)} aria-invalid={errors.category ? true : undefined}>
                                <option value="" disabled>
                                    Choose…
                                </option>
                                {CATEGORIES.map((c) => (
                                    <option key={c.slug} value={c.slug}>
                                        {c.name}
                                    </option>
                                ))}
                            </Select>
                        </Field>
                        <Field label="Shelf" htmlFor="collection" hint="Feature it on the home page.">
                            <Select id="collection" value={collection} onChange={(e) => setCollection(e.target.value)}>
                                <option value="">None</option>
                                {Object.entries(COLLECTIONS).map(([value, c]) => (
                                    <option key={value} value={value}>
                                        {c.name}
                                    </option>
                                ))}
                            </Select>
                        </Field>
                    </div>

                    {product ? (
                        <DialogRoot>
                            <DialogTrigger asChild>
                                <Button type="button" variant="quiet" className="justify-self-start text-signal">
                                    Delete product
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogTitle>Delete {product.name}?</DialogTitle>
                                <DialogDescription>
                                    It comes off the shop and out of every bag. Past orders keep their own record of it. To hide it without deleting,
                                    archive it instead.
                                </DialogDescription>
                                <div className="flex justify-end gap-2">
                                    <DialogClose asChild>
                                        <Button type="button" variant="ghost">
                                            Keep it
                                        </Button>
                                    </DialogClose>
                                    <Button type="button" variant="danger" disabled={deleting} onClick={remove}>
                                        {deleting ? "Deleting…" : "Delete"}
                                    </Button>
                                </div>
                            </DialogContent>
                        </DialogRoot>
                    ) : null}
                </aside>
            </div>
        </form>
    );
}

function EditorSection({
    title,
    description,
    error,
    aside,
    children,
}: {
    title: string;
    description?: string;
    error?: string[];
    aside?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <section className="grid gap-6">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-3">
                <div>
                    <h2 className="font-medium">{title}</h2>
                    {description ? <p className="mt-1 text-sm text-ink-soft">{description}</p> : null}
                </div>
                {aside}
            </div>
            {error?.[0] ? <FormMessage>{error[0]}</FormMessage> : null}
            {children}
        </section>
    );
}

function Chip({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            type="button"
            aria-pressed={pressed}
            onClick={onClick}
            className={cn(
                "inline-flex h-9 items-center gap-2 border px-3 text-sm transition-colors",
                pressed ? "border-ink bg-ink text-paper" : "border-rule hover:border-ink",
            )}
        >
            {children}
        </button>
    );
}

function IconButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
    return (
        <button
            type="button"
            aria-label={label}
            onClick={onClick}
            disabled={disabled}
            className="inline-flex size-8 items-center justify-center bg-paper text-ink shadow-[0_0_0_1px_var(--rule)] hover:bg-white disabled:opacity-40 [&_svg]:size-3.5"
        >
            {children}
        </button>
    );
}

function MoneyInput({ id, value, onChange, invalid }: { id: string; value: string; onChange: (v: string) => void; invalid: boolean }) {
    return (
        <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-faint">$</span>
            <Input
                id={id}
                inputMode="decimal"
                value={value}
                onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ""))}
                onBlur={() => value && !Number.isNaN(Number.parseFloat(value)) && onChange(Number.parseFloat(value).toFixed(2))}
                placeholder="0.00"
                className="tabular pl-7"
                aria-invalid={invalid ? true : undefined}
            />
        </div>
    );
}

