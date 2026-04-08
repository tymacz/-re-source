import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { adminProcedure, createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const categorieSchema = z.object({
  libelle: z
    .string()
    .min(2, "Le libellé doit contenir au moins 2 caractères")
    .max(100, "Le libellé ne peut pas dépasser 100 caractères")
    .trim(),
});

export const categorieRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.categorie.findMany({ orderBy: { libelle: "asc" } });
  }),

  getById: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const categorie = await ctx.db.categorie.findUnique({
        where: { id: input.id },
      });
      if (!categorie) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Catégorie introuvable" });
      }
      return categorie;
    }),

  create: adminProcedure
    .input(categorieSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.categorie.findUnique({
        where: { libelle: input.libelle },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Une catégorie avec ce libellé existe déjà",
        });
      }
      return ctx.db.categorie.create({ data: { libelle: input.libelle } });
    }),

  update: adminProcedure
    .input(z.object({ id: z.string().min(1) }).merge(categorieSchema))
    .mutation(async ({ ctx, input }) => {
      const { id, libelle } = input;
      const existing = await ctx.db.categorie.findFirst({
        where: { libelle, NOT: { id } },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Une catégorie avec ce libellé existe déjà",
        });
      }
      return ctx.db.categorie.update({ where: { id }, data: { libelle } });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.categorie.delete({ where: { id: input.id } });
    }),
});
