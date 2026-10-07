import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";

import "./globals.css";

import { MotionProvider } from "@/components/motion";
import { Toaster } from "@/components/toaster";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

/*
 * Geist carries everything from 11px labels to 148px headlines; it was the
 * typeface the original project bundled and never used. Geist Mono sets the
 * catalogue numbers and labels, and Instrument Serif appears only as an
 * italic accent inside a headline.
 */
const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
const instrumentSerif = Instrument_Serif({
    subsets: ["latin"],
    weight: "400",
    style: "italic",
    variable: "--font-instrument-serif",
});

export const metadata: Metadata = {
    metadataBase: new URL(site.url),
    title: {
        default: `${site.name}: ${site.tagline}`,
        template: `%s · ${site.name}`,
    },
    description: site.description,
    applicationName: site.name,
    openGraph: {
        type: "website",
        siteName: site.name,
        locale: "en_CA",
        title: `${site.name}: ${site.tagline}`,
        description: site.description,
    },
    twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
    themeColor: "#f5f4f0",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
    return (
        <html lang="en-CA" className={cn(geist.variable, geistMono.variable, instrumentSerif.variable)}>
            <body>
                <MotionProvider>{children}</MotionProvider>
                <Toaster />
                <Analytics />
            </body>
        </html>
    );
}
