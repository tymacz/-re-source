import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const userDb = await ctx.db.user.findUnique({
    where: { id: ctx.session.user.id },
    select: { role_id: true },
  });

    if (userDb?.role_id !== "ADMIN") {
        throw new TRPCError({
        code: "FORBIDDEN",
        message: "Accès refusé. Réservé aux administrateurs.",
        });
    }

  return next({ ctx });
});

export const adminRouter = createTRPCRouter({
  
  ajouterCategorie: adminProcedure
    .input(z.object({ libelle: z.string().min(2, "Le nom est trop court") }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.categorie.create({ data: { libelle: input.libelle } });
    }),

  ajouterTypeRelation: adminProcedure
    .input(z.object({ libelle: z.string().min(2) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.typeRelation.create({ data: { libelle: input.libelle } });
    }),

  ajouterTypeRessource: adminProcedure
    .input(z.object({ libelle: z.string().min(2) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.typeRessource.create({ data: { libelle: input.libelle } });
    }),

  
  supprimerCategorie: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.categorie.delete({ where: { id: input.id } });
    }),

  supprimerTypeRelation: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.typeRelation.delete({ where: { id: input.id } });
    }),

  supprimerTypeRessource: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.typeRessource.delete({ where: { id: input.id } });
    }),
    getAllRessources: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.ressource.findMany({
      include: {
        categorie: true,
        auteur: {
          select: { name: true, email: true },
        },
      },
      orderBy: { date_creation: "desc" },
    });
  }),

    changerStatutRessource: adminProcedure
    .input(
      z.object({
        id: z.string(),
        nouveauStatut: z.enum(["VALIDEE", "EN_ATTENTE", "SUSPENDUE"]), 
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.ressource.update({
        where: { id: input.id },
        data: { statut_publication: input.nouveauStatut },
      });
    }),

  supprimerRessource: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.ressource.delete({
        where: { id: input.id },
      });
    }),
    getAllUsers: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findMany({
      orderBy: { date_creation: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role_id: true,
        est_actif: true,
        date_creation: true,
      },
    });
  }),

  changerStatutUtilisateur: adminProcedure
    .input(z.object({ id: z.string(), est_actif: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      if (input.id === ctx.session?.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Vous ne pouvez pas désactiver votre propre compte.",
        });
      }

      return ctx.db.user.update({
        where: { id: input.id },
        data: { est_actif: input.est_actif },
      });
    }),

  changerRoleUtilisateur: adminProcedure
    .input(z.object({ id: z.string(), role: z.enum(["USER", "ADMIN"]) }))
    .mutation(async ({ ctx, input }) => {
      if (input.id === ctx.session?.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Vous ne pouvez pas modifier votre propre rôle.",
        });
      }

      return ctx.db.user.update({
        where: { id: input.id },
        data: { role_id: input.role },
      });
    }),
    getStatistiques: adminProcedure.query(async ({ ctx }) => {
    const statsGlobales = await ctx.db.statistiqueLog.groupBy({
      by: ['type_action'],
      _count: {
        id: true,
      },
    });

    const derniersLogs = await ctx.db.statistiqueLog.findMany({
      take: 100,
      orderBy: { date_action: "desc" },
      include: {
        user: { select: { name: true } },
        ressource: { select: { titre: true } },
      },
    });

    const compteParType = {
      CONSULTATION: statsGlobales.find(s => s.type_action === "CONSULTATION")?._count.id ?? 0,
      RECHERCHE: statsGlobales.find(s => s.type_action === "RECHERCHE")?._count.id ?? 0,
      PARTAGE: statsGlobales.find(s => s.type_action === "PARTAGE")?._count.id ?? 0,
      EXPLOITATION: statsGlobales.find(s => s.type_action === "EXPLOITATION")?._count.id ?? 0,
      CREATION: statsGlobales.find(s => s.type_action === "CREATION")?._count.id ?? 0,
    };

    return {
      compteParType,
      derniersLogs,
    };
  }),
});