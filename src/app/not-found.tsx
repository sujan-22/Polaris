import { StatusPage } from "@/components/status-page";

export default function NotFound() {
    return (
        <StatusPage
            code="404"
            title={
                <>
                    Off the <span className="accent">map</span>.
                </>
            }
            body="That page doesn't exist, or the product sold out and left the shelves."
            action={{ href: "/shop", label: "Browse the shop" }}
        />
    );
}
