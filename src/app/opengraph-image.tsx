import { ImageResponse } from "next/og";

export const alt = "Polaris: things to come back to.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/* The share card: the peak, the wordmark and the line, on ink. */
export default function OpengraphImage() {
    return new ImageResponse(
        (
            <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#121212", color: "#f5f4f0", padding: 80 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                    <svg width="76" height="66" viewBox="0 0 306 266" fill="#f5f4f0">
                        <path d="M0 266 156 0l50 88-93 178Z" />
                        <path d="m198 266 53-95 55 95Z" />
                    </svg>
                    <span style={{ fontSize: 40, letterSpacing: 12, fontWeight: 600 }}>POLARIS</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: 94, lineHeight: 1, letterSpacing: -3.5 }}>Things to come back to.</span>
                    <span style={{ fontSize: 30, marginTop: 32, color: "#b5b3ac" }}>Everyday goods from independent sellers, reviewed by hand.</span>
                </div>
            </div>
        ),
        size,
    );
}
