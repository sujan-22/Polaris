import { StatusPage } from "@/components/status-page";

export default function Forbidden() {
    return (
        <StatusPage
            code="403"
            title="Sellers only, past this point."
            body="The studio is for approved sellers. You can apply from your account; a person reviews every application."
            action={{ href: "/account/selling", label: "Apply to sell" }}
        />
    );
}
