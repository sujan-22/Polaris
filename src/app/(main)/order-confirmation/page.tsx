import { Suspense } from "react";
import Order from "./Order";

export const metadata = {
    title: "Polaris | Order Confirmation",
};

const Page = () => {
    return (
        <Suspense>
            <Order />
        </Suspense>
    );
};

export default Page;
