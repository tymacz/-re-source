import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const ressourceRouter = createTRPCRouter({
getAllPublic: publicProcedure
    .input(
      z.object({
        recherche: z.string().optional(),
        categorieId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const isConnected = !!ctx.session?.user;

      const visibilitesAutorisees: Array<"PUBLIQUE" | "PARTAGEE"> = isConnected 
        ? ["PUBLIQUE", "PARTAGEE"] 
        : ["PUBLIQUE"];

      return ctx.db.ressource.findMany({
        where: {
          visibilite: {
            in: visibilitesAutorisees, 
          },
          statut_publication: "VALIDEE",
          titre: input.recherche 
            ? { contains: input.recherche, mode: "insensitive" } 
            : undefined,
          categorie_id: input.categorieId,
        },
        include: {
          categorie: true,
          auteur: {
            select: { name: true } 
          }
        },
        orderBy: {
          date_creation: "desc",
        },
      });
    }),
    
  getCategories: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.categorie.findMany({
      orderBy: { libelle: "asc" }
    });
  }),

getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const ressource = await ctx.db.ressource.findUnique({
        where: { id: input.id },
        include: {
          categorie: true,
          type_relation: true,
          type_ressource: true,
          auteur: {
            select: { id: true, name: true }, 
          },
        },
      });

      if (!ressource) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cette ressource n'existe pas.",
        });
      }

      const userId = ctx.session?.user?.id;
      const isAdmin = ctx.session?.user?.role_id === "ADMIN";
      
      const isAuthor = userId === ressource.auteur.id;
      const isPublic = ressource.visibilite === "PUBLIQUE" && ressource.statut_publication === "VALIDEE";
      const isSharedAndConnected = ressource.visibilite === "PARTAGEE" && ressource.statut_publication === "VALIDEE" && !!userId;

      if (!isAuthor && !isAdmin && !isPublic && !isSharedAndConnected) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Vous n'avez pas l'autorisation de voir cette ressource.",
        });
      }
      return ressource;
    }),

  getTypesRelation: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.typeRelation.findMany({ orderBy: { libelle: "asc" } });
  }),

  getTypesRessource: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.typeRessource.findMany({ orderBy: { libelle: "asc" } });
  }),

  create: protectedProcedure
    .input(
      z.object({
        titre: z.string().min(3, "Le titre est trop court"),
        contenu: z.string().min(10, "Le contenu est trop court"),
        categorie_id: z.string().min(1, "Veuillez choisir une catégorie"),
        type_relation_id: z.string().min(1, "Veuillez choisir un type de relation"),
        type_ressource_id: z.string().min(1, "Veuillez choisir un type de ressource"),
        visibilite: z.enum(["PUBLIQUE", "PARTAGEE", "PRIVEE"]).default("PRIVEE"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const statut = input.visibilite === "PUBLIQUE" ? "EN_ATTENTE" : "VALIDEE";

      const nouvelleRessource = await ctx.db.ressource.create({
        data: {
          titre: input.titre,
          contenu: input.contenu,
          categorie_id: input.categorie_id,
          type_relation_id: input.type_relation_id,
          type_ressource_id: input.type_ressource_id,
          visibilite: input.visibilite,
          statut_publication: statut,
          auteur_id: ctx.session.user.id,
        },
      });

      return nouvelleRessource;
    }),
});