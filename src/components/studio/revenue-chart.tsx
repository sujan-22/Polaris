"use client";

import { useEffect, useId, useRef, useState } from "react";

import { formatPrice } from "@/lib/money";
import { pluralize } from "@/lib/utils";

export interface WeekPoint {
    /** ISO date of the week's first day. */
    start: string;
    revenueCents: number;
    orders: number;
}

const HEIGHT = 220;
const PAD = { top: 12, right: 0, bottom: 28, left: 56 };
const MAX_BAR = 24;

/*
 * Weekly revenue as columns: one series, so no legend; the heading names it.
 * Columns are capped at 24px with the rest of each band left as air, square
 * at the baseline with a slightly rounded data end. Hovering or focusing a
 * column shows its week; the same numbers are in a table for screen readers.
 */
export function RevenueChart({ weeks }: { weeks: WeekPoint[] }) {
    const [active, setActive] = useState<number | null>(null);
    const [width, setWidth] = useState(720);
    const titleId = useId();
    const boxRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const node = boxRef.current;
        if (!node) return;
        const observer = new ResizeObserver(([entry]) => entry && setWidth(entry.contentRect.width));
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    const max = Math.max(1, ...weeks.map((w) => w.revenueCents));
    const step = niceStep(max / 4);
    const top = Math.ceil(max / step) * step;
    const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);

    const plotW = Math.max(0, width - PAD.left - PAD.right);
    const plotH = HEIGHT - PAD.top - PAD.bottom;
    const band = weeks.length ? plotW / weeks.length : 0;
    const barW = Math.min(MAX_BAR, band * 0.56);
    const y = (cents: number) => PAD.top + plotH - (cents / top) * plotH;
    const point = active !== null ? weeks[active] : null;

    return (
        <figure aria-labelledby={titleId} className="relative">
            <figcaption id={titleId} className="sr-only">
                Revenue by week for the last {weeks.length} weeks
            </figcaption>
            <div className="relative" ref={boxRef}>
                <svg width="100%" height={HEIGHT} role="img" aria-hidden className="block overflow-visible" onPointerLeave={() => setActive(null)}>
                    {ticks.map((tick) => (
                        <g key={tick}>
                            <line x1={PAD.left} x2={width - PAD.right} y1={y(tick)} y2={y(tick)} stroke="var(--rule)" strokeWidth={1} />
                            <text x={PAD.left - 10} y={y(tick)} dy="0.32em" textAnchor="end" className="fill-ink-faint font-mono text-[11px]">
                                {compactDollars(tick)}
                            </text>
                        </g>
                    ))}
                    {weeks.map((week, i) => {
                        const x = PAD.left + band * i + (band - barW) / 2;
                        const h = Math.max(0, PAD.top + plotH - y(week.revenueCents));
                        const label = i === 0 || i === weeks.length - 1 || i % 4 === 0;
                        return (
                            <g key={week.start}>
                                {/* Hit target: the whole band, taller than the mark. */}
                                <rect
                                    x={PAD.left + band * i}
                                    y={PAD.top}
                                    width={band}
                                    height={plotH}
                                    fill={active === i ? "var(--paper-2)" : "transparent"}
                                    onPointerEnter={() => setActive(i)}
                                />
                                {h > 0 ? (
                                    <path
                                        d={columnPath(x, PAD.top + plotH, barW, h, Math.min(3, barW / 2, h))}
                                        fill="var(--ink)"
                                        opacity={active === null || active === i ? 1 : 0.35}
                                        className="pointer-events-none transition-opacity duration-150"
                                    />
                                ) : null}
                                {label ? (
                                    <text x={x + barW / 2} y={HEIGHT - 8} textAnchor="middle" className="fill-ink-faint font-mono text-[11px]">
                                        {shortDate(week.start)}
                                    </text>
                                ) : null}
                            </g>
                        );
                    })}
                </svg>

                {/* Keyboard access: one focusable stop per column. */}
                <div className="absolute inset-0 flex" style={{ left: PAD.left, right: PAD.right, top: PAD.top, bottom: PAD.bottom }}>
                    {weeks.map((week, i) => (
                        <button
                            key={week.start}
                            type="button"
                            className="h-full flex-1 opacity-0 focus-visible:opacity-100 focus-visible:outline-offset-[-2px]"
                            onFocus={() => setActive(i)}
                            onBlur={() => setActive(null)}
                            onPointerEnter={() => setActive(i)}
                            aria-label={`Week of ${shortDate(week.start)}: ${formatPrice(week.revenueCents)} from ${pluralize(week.orders, "order")}`}
                        />
                    ))}
                </div>

                {point && active !== null ? (
                    <div
                        className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full bg-ink px-3 py-2.5 text-sm whitespace-nowrap text-on-ink shadow-lg"
                        style={{
                            left: Math.min(Math.max(PAD.left + band * active + band / 2, 80), width - 80),
                            top: y(point.revenueCents) - 10,
                        }}
                    >
                        <p className="label text-on-ink-faint">Week of {shortDate(point.start)}</p>
                        <p className="tabular mt-1.5 font-medium">{formatPrice(point.revenueCents)}</p>
                        <p className="text-on-ink-soft">{pluralize(point.orders, "order")}</p>
                    </div>
                ) : null}
            </div>

            <table className="sr-only">
                <caption>Revenue by week</caption>
                <thead>
                    <tr>
                        <th scope="col">Week of</th>
                        <th scope="col">Revenue</th>
                        <th scope="col">Orders</th>
                    </tr>
                </thead>
                <tbody>
                    {weeks.map((week) => (
                        <tr key={week.start}>
                            <td>{shortDate(week.start)}</td>
                            <td>{formatPrice(week.revenueCents)}</td>
                            <td>{week.orders}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </figure>
    );
}

/* Square at the baseline, rounded at the data end. */
function columnPath(x: number, base: number, w: number, h: number, r: number): string {
    const top = base - h;
    return `M${x},${base} V${top + r} Q${x},${top} ${x + r},${top} H${x + w - r} Q${x + w},${top} ${x + w},${top + r} V${base} Z`;
}

function niceStep(raw: number): number {
    const exponent = Math.pow(10, Math.floor(Math.log10(Math.max(raw, 1))));
    const fraction = raw / exponent;
    const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10;
    return nice * exponent;
}

function compactDollars(cents: number): string {
    const dollars = cents / 100;
    if (dollars >= 1000) return `$${(dollars / 1000).toFixed(dollars % 1000 === 0 ? 0 : 1)}k`;
    return `$${Math.round(dollars)}`;
}

function shortDate(iso: string): string {
    return new Date(`${iso}T12:00:00`).toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}
