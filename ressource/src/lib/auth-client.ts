import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    user: {
        additionalFields: {
            role_id: {
                type: "string",
            },
            est_actif: {
                type: "boolean",
            }
        }
    }
});

export const { useSession, signIn, signOut } = authClient;