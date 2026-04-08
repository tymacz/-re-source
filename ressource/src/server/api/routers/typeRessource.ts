import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { adminProcedure, createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const typeRessourceSchema = z.object({
  libelle: z
    .string()
    .min(2, "Le libellé doit contenir au moins 2 caractères")
    .max(100, "Le libellé ne peut pas dépasser 100 caractères")
    .trim(),
});

export const typeRessourceRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.typeRessource.findMany({ orderBy: { libelle: "asc" } });
  }),

  getById: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const typeRessource = await ctx.db.typeRessource.findUnique({
        where: { id: input.id },
      });
      if (!typeRessource) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Type de ressource introuvable" });
      }
      return typeRessource;
    }),

  create: adminProcedure
    .input(typeRessourceSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.typeRessource.findUnique({
        where: { libelle: input.libelle },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Un type de ressource avec ce libellé existe déjà",
        });
      }
      return ctx.db.typeRessource.create({ data: { libelle: input.libelle } });
    }),

  update: adminProcedure
    .input(z.object({ id: z.string().min(1) }).merge(typeRessourceSchema))
    .mutation(async ({ ctx, input }) => {
      const { id, libelle } = input;
      const existing = await ctx.db.typeRessource.findFirst({
        where: { libelle, NOT: { id } },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Un type de ressource avec ce libellé existe déjà",
        });
      }
      return ctx.db.typeRessource.update({ where: { id }, data: { libelle } });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.typeRessource.delete({ where: { id: input.id } });
    }),
});
