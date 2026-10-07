import { BagProvider } from "@/components/store/bag";
import { AnnouncementBar, SiteFooter } from "@/components/store/site-footer";
import { SiteHeader } from "@/components/store/site-header";

export default function StoreLayout({ children }: LayoutProps<"/">) {
    return (
        <BagProvider>
            <a href="#main" className="label sr-only z-50 bg-ink px-4 py-3 text-paper focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
                Skip to content
            </a>
            <AnnouncementBar />
            <SiteHeader />
            <main id="main" className="min-h-[60vh]">
                {children}
            </main>
            <SiteFooter />
        </BagProvider>
    );
}
