import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { adminProcedure, createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const typeRelationSchema = z.object({
  libelle: z
    .string()
    .min(2, "Le libellé doit contenir au moins 2 caractères")
    .max(100, "Le libellé ne peut pas dépasser 100 caractères")
    .trim(),
});

export const typeRelationRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.typeRelation.findMany({ orderBy: { libelle: "asc" } });
  }),

  getById: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const typeRelation = await ctx.db.typeRelation.findUnique({
        where: { id: input.id },
      });
      if (!typeRelation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Type de relation introuvable" });
      }
      return typeRelation;
    }),

  create: adminProcedure
    .input(typeRelationSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.typeRelation.findUnique({
        where: { libelle: input.libelle },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Un type de relation avec ce libellé existe déjà",
        });
      }
      return ctx.db.typeRelation.create({ data: { libelle: input.libelle } });
    }),

  update: adminProcedure
    .input(z.object({ id: z.string().min(1) }).merge(typeRelationSchema))
    .mutation(async ({ ctx, input }) => {
      const { id, libelle } = input;
      const existing = await ctx.db.typeRelation.findFirst({
        where: { libelle, NOT: { id } },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Un type de relation avec ce libellé existe déjà",
        });
      }
      return ctx.db.typeRelation.update({ where: { id }, data: { libelle } });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.typeRelation.delete({ where: { id: input.id } });
    }),
});
