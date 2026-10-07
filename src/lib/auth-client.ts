import { adminClient, inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import type { auth } from "@/lib/auth";

// No baseURL: the client talks to whichever origin served the page, so
// preview deployments and localhost work without extra configuration.
export const authClient = createAuthClient({
    plugins: [adminClient(), inferAdditionalFields<typeof auth>()],
});
