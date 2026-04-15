import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const commentaireRouter = createTRPCRouter({
  getByRessource: publicProcedure
    .input(z.object({ ressourceId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.commentaire.findMany({
        where: { ressource_id: input.ressourceId, parent_id: null },
        include: {
          auteur: { select: { id: true, name: true } },
          reponses: {
            include: { auteur: { select: { id: true, name: true } } },
            orderBy: { date_publication: "asc" }, // Les plus anciennes réponses en haut
          },
        },
        orderBy: { date_publication: "desc" }, 
      });
    }),

  ajouter: protectedProcedure
    .input(z.object({ 
      ressourceId: z.string(), 
      contenu: z.string().min(1, "Le commentaire ne peut pas être vide"),
      parentId: z.string().optional() 
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.commentaire.create({
        data: {
          contenu: input.contenu,
          ressource_id: input.ressourceId,
          auteur_id: ctx.session.user.id,
          parent_id: input.parentId ?? null,
        },
      });
    }),

  supprimer: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const commentaire = await ctx.db.commentaire.findUnique({
        where: { id: input.id },
      });

      if (!commentaire) throw new TRPCError({ code: "NOT_FOUND" });

      const isAuthor = commentaire.auteur_id === ctx.session.user.id;
      const isAdmin = ctx.session.user.role_id === "ADMIN";

      if (!isAuthor && !isAdmin) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Non autorisé" });
      }

      return ctx.db.commentaire.delete({ where: { id: input.id } });
    }),
});