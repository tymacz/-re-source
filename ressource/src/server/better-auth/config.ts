import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "@/server/db";

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
        defaultValue: "USER",
      },
      est_actif: {
        type: "boolean",
        defaultValue: true,
      },
    },
  },

  hooks: {
    afterSignIn: async (ctx) => {
      const user = ctx.user;      
      if (!user.est_actif) {
        throw new Error("ACCOUNT_DISABLED");
      }
      
      return ctx;
    },
  },
});

export type Session = typeof auth.$Infer.Session;