import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const progressionRouter = createTRPCRouter({
  getMonTableauDeBord: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const progressions = await ctx.db.progressionUtilisateur.findMany({
      where: {
        utilisateur_id: userId,
      },
      include: {
        ressource: {
          include: {
            categorie: true,
            auteur: { select: { name: true } },
          },
        },
      },
      orderBy: { date_derniere_action: "desc" },
    });

    const mesCreations = await ctx.db.ressource.findMany({
      where: {
        auteur_id: userId,
      },
      include: {
        categorie: true,
        auteur: { select: { name: true } },
      },
      orderBy: { date_creation: "desc" },
    });

    return {
      favoris: progressions.filter((p) => p.est_favori),
      misesDeCote: progressions.filter((p) => p.est_mise_de_cote),
      exploitees: progressions.filter((p) => p.est_exploitee),
      mesCreations,
    };
  }),
});