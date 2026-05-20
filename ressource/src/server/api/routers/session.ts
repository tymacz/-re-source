import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const sessionRouter = createTRPCRouter({
creer: protectedProcedure
    .input(z.object({ ressourceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const nouvelleSession = await ctx.db.sessionActivite.create({
        data: {
          ressource_id: input.ressourceId,
          initiateur_id: ctx.session.user.id,
        },
      });

      await ctx.db.participantSession.create({
        data: {
          session_id: nouvelleSession.id,
          utilisateur_id: ctx.session.user.id,
          a_accepte: true,
        },
      });
      await ctx.db.statistiqueLog.create({
        data: {
          type_action: "EXPLOITATION",
          utilisateur_id: ctx.session.user.id,
          ressource_id: input.ressourceId,
        },
      });

      return nouvelleSession;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const session = await ctx.db.sessionActivite.findUnique({
        where: { id: input.id },
        include: {
          ressource: { select: { id: true, titre: true } },
          initiateur: { select: { id: true, name: true } },
          participants: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
          messages: {
            include: { auteur: { select: { id: true, name: true } } },
            orderBy: { date_envoi: "asc" },
          },
        },
      });

      if (!session) throw new TRPCError({ code: "NOT_FOUND" });

      const estParticipant = session.participants.some(p => p.utilisateur_id === ctx.session.user.id);
      const estAdmin = ctx.session.user.role_id === "ADMIN";

      if (!estParticipant && !estAdmin) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Vous ne participez pas à cette session." });
      }

      return session;
    }),

  envoyerMessage: protectedProcedure
    .input(z.object({ sessionId: z.string(), contenu: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.messageSession.create({
        data: {
          contenu: input.contenu,
          session_id: input.sessionId,
          auteur_id: ctx.session.user.id,
        },
      });
    }),

  inviter: protectedProcedure
    .input(z.object({ sessionId: z.string(), email: z.string().email("Email invalide") }))
    .mutation(async ({ ctx, input }) => {
      const invite = await ctx.db.user.findUnique({ where: { email: input.email } });
      if (!invite) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Aucun citoyen trouvé avec cet email." });
      }

      const dejaParticipant = await ctx.db.participantSession.findUnique({
        where: {
          session_id_utilisateur_id: {
            session_id: input.sessionId,
            utilisateur_id: invite.id,
          }
        }
      });

      if (dejaParticipant) {
        throw new TRPCError({ code: "CONFLICT", message: "Cet utilisateur est déjà invité." });
      }

      return ctx.db.participantSession.create({
        data: {
          session_id: input.sessionId,
          utilisateur_id: invite.id,
        },
      });
    }),
});