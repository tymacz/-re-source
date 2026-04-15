import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "@/server/db";
import { createAuthMiddleware, APIError } from "better-auth/api";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  
  emailAndPassword: {
    enabled: true,
  },

  user: {
    additionalFields: {
      role_id: {
        type: "string",
        required: true,
        defaultValue: "USER",
      },
      est_actif: {
        type: "boolean",
        required: true,
        defaultValue: true,
      },
    },
  },

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-in/email") {
        const body = ctx.body as { email?: string } | undefined;
        const email = body?.email;

        if (email) {
          const user = await db.user.findUnique({
            where: { email: email },
            select: { est_actif: true },
          });

          if (user?.est_actif === false) {
            throw new APIError("FORBIDDEN", {
              message: "Votre compte a été désactivé par un administrateur.",
            });
          }
        }
      }
    }),
  },
});

export type Session = typeof auth.$Infer.Session;