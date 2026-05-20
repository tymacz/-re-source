import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const profilRouter = createTRPCRouter({
  getMe: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        date_creation: true,
        email: true,
        emailVerified: true,
        est_actif: true,
        id: true,
        name: true,
        role_id: true,
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Profil introuvable.",
      });
    }

    return user;
  }),

  updateMe: protectedProcedure
    .input(
      z.object({
        email: z.string().trim().email("Adresse e-mail invalide."),
        name: z.string().trim().min(2, "Le nom est trop court.").max(120),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const email = input.email.toLowerCase();

      const existingUser = await ctx.db.user.findFirst({
        where: {
          email,
          NOT: { id: userId },
        },
        select: { id: true },
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Cette adresse e-mail est deja utilisee.",
        });
      }

      const currentUser = await ctx.db.user.findUnique({
        where: { id: userId },
        select: { email: true, emailVerified: true },
      });

      return ctx.db.user.update({
        where: { id: userId },
        data: {
          email,
          emailVerified:
            currentUser?.email.toLowerCase() === email
              ? currentUser.emailVerified
              : false,
          name: input.name,
        },
        select: {
          email: true,
          emailVerified: true,
          id: true,
          name: true,
          role_id: true,
        },
      });
    }),

  deleteMe: protectedProcedure
    .input(
      z.object({
        confirmation: z.literal("SUPPRIMER"),
      }),
    )
    .mutation(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      const anonymizedEmail = `deleted-${userId}-${Date.now()}@deleted.local`;

      return ctx.db.$transaction(async (tx) => {
        await tx.statistiqueLog.updateMany({
          where: { utilisateur_id: userId },
          data: { utilisateur_id: null },
        });

        await tx.session.deleteMany({
          where: { userId },
        });

        await tx.account.deleteMany({
          where: { userId },
        });

        return tx.user.update({
          where: { id: userId },
          data: {
            email: anonymizedEmail,
            emailVerified: false,
            est_actif: false,
            name: "Compte supprime",
          },
          select: {
            est_actif: true,
            id: true,
          },
        });
      });
    }),
});
