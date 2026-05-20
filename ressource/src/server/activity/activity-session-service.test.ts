import { describe, expect, it, vi } from "vitest";

import {
  ActivitySessionError,
  createActivitySessionService,
  type ActivityMessage,
  type ActivityParticipant,
  type ActivitySessionRecord,
  type ActivitySessionRepository,
} from "./activity-session-service";
import type { ResourceRecord } from "../resources/resource-service";

const now = new Date("2026-05-20T12:00:00.000Z");

const activityResource: ResourceRecord = {
  authorId: "moderator",
  category: "jeu",
  createdAt: now,
  id: "resource-activity",
  isRestricted: false,
  relationType: "parent",
  resourceType: "activity",
  shareToken: null,
  status: "published",
  title: "Activite memoire",
  updatedAt: now,
  visibility: "public",
};

const cloneSession = (
  session: ActivitySessionRecord,
): ActivitySessionRecord => ({
  ...session,
  createdAt: new Date(session.createdAt),
  messages: session.messages.map((message) => ({
    ...message,
    createdAt: new Date(message.createdAt),
  })),
  participants: session.participants.map((participant) => ({ ...participant })),
});

const createMemoryActivitySessionRepository = (): ActivitySessionRepository => {
  const sessions = new Map<string, ActivitySessionRecord>();
  let sessionSequence = 0;
  let messageSequence = 0;

  return {
    async create(resourceId: string, ownerId: string) {
      sessionSequence += 1;

      const session: ActivitySessionRecord = {
        createdAt: now,
        id: `session-${sessionSequence}`,
        messages: [],
        participants: [{ status: "accepted", userId: ownerId }],
        resourceId,
        status: "active",
      };

      sessions.set(session.id, cloneSession(session));

      return cloneSession(session);
    },

    async findById(id: string) {
      const session = sessions.get(id);
      return session ? cloneSession(session) : null;
    },

    async addParticipant(sessionId: string, participant: ActivityParticipant) {
      const session = sessions.get(sessionId);

      if (!session) {
        throw new Error("Session introuvable.");
      }

      const nextSession = {
        ...session,
        participants: [...session.participants, participant],
      };

      sessions.set(sessionId, cloneSession(nextSession));

      return cloneSession(nextSession);
    },

    async addMessage(sessionId: string, authorId: string, content: string) {
      const session = sessions.get(sessionId);

      if (!session) {
        throw new Error("Session introuvable.");
      }

      messageSequence += 1;

      const message: ActivityMessage = {
        authorId,
        content,
        createdAt: now,
        id: `message-${messageSequence}`,
        sessionId,
      };
      const nextSession = {
        ...session,
        messages: [...session.messages, message],
      };

      sessions.set(sessionId, cloneSession(nextSession));

      return { ...message, createdAt: new Date(message.createdAt) };
    },
  };
};

const createActivitySessionServiceFixture = () => {
  const invitations = {
    sendInvitation: vi.fn(async () => undefined),
  };
  const service = createActivitySessionService({
    accounts: {
      async existsActiveCitizen(userId: string) {
        return userId === "user-invited";
      },
    },
    invitations,
    resources: {
      async findById(id: string) {
        return id === activityResource.id ? activityResource : null;
      },
    },
    sessions: createMemoryActivitySessionRepository(),
  });

  return { invitations, service };
};

describe("Sessions d'activite", () => {
  it("TC-S01 - demarre une session activite et ajoute l'utilisateur comme participant", async () => {
    const { service } = createActivitySessionServiceFixture();

    const session = await service.startSession(
      activityResource.id,
      "user-owner",
    );

    expect(session).toMatchObject({
      resourceId: activityResource.id,
      status: "active",
    });
    expect(session.participants).toEqual([
      { status: "accepted", userId: "user-owner" },
    ]);
  });

  it("TC-S02 - invite un participant et le place en attente", async () => {
    const { invitations, service } = createActivitySessionServiceFixture();
    const session = await service.startSession(
      activityResource.id,
      "user-owner",
    );

    const updatedSession = await service.inviteParticipant(
      session.id,
      "user-invited",
    );

    expect(invitations.sendInvitation).toHaveBeenCalledWith(
      session.id,
      "user-invited",
    );
    expect(updatedSession.participants).toContainEqual({
      status: "pending",
      userId: "user-invited",
    });
  });

  it("TC-S03 - enregistre un message visible pour les participants de la session", async () => {
    const { service } = createActivitySessionServiceFixture();
    const session = await service.startSession(
      activityResource.id,
      "user-owner",
    );

    const message = await service.sendMessage(
      session.id,
      "user-owner",
      "Bonjour tout le monde",
    );
    const visibleSession = await service.getSessionForParticipant(
      session.id,
      "user-owner",
    );

    expect(message).toMatchObject({
      authorId: "user-owner",
      content: "Bonjour tout le monde",
      sessionId: session.id,
    });
    expect(visibleSession.messages.map((item) => item.id)).toEqual([
      message.id,
    ]);
  });

  it("TC-S04 - refuse l'acces a une session pour un compte non invite sans exposer de donnees", async () => {
    const { service } = createActivitySessionServiceFixture();
    const session = await service.startSession(
      activityResource.id,
      "user-owner",
    );

    await expect(
      service.getSessionForParticipant(session.id, "user-outsider"),
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      message: "Acces refuse a cette session.",
    } satisfies Partial<ActivitySessionError>);
  });
});
