import type { ResourceRecord } from "../resources/resource-service";

export type ParticipantStatus = "accepted" | "pending";
export type ActivitySessionStatus = "active" | "closed";

export type ActivityParticipant = {
  userId: string;
  status: ParticipantStatus;
};

export type ActivityMessage = {
  id: string;
  sessionId: string;
  authorId: string;
  content: string;
  createdAt: Date;
};

export type ActivitySessionRecord = {
  id: string;
  resourceId: string;
  status: ActivitySessionStatus;
  participants: ActivityParticipant[];
  messages: ActivityMessage[];
  createdAt: Date;
};

export type ActivitySessionRepository = {
  create(resourceId: string, ownerId: string): Promise<ActivitySessionRecord>;
  findById(id: string): Promise<ActivitySessionRecord | null>;
  addParticipant(
    sessionId: string,
    participant: ActivityParticipant,
  ): Promise<ActivitySessionRecord>;
  addMessage(
    sessionId: string,
    authorId: string,
    content: string,
  ): Promise<ActivityMessage>;
};

export type ActivityResourceRepository = {
  findById(id: string): Promise<ResourceRecord | null>;
};

export type ActivityAccountRepository = {
  existsActiveCitizen(userId: string): Promise<boolean>;
};

export type ActivityInvitationSender = {
  sendInvitation(sessionId: string, invitedUserId: string): Promise<void>;
};

export type ActivitySessionServiceDependencies = {
  accounts: ActivityAccountRepository;
  invitations: ActivityInvitationSender;
  resources: ActivityResourceRepository;
  sessions: ActivitySessionRepository;
};

export class ActivitySessionError extends Error {
  constructor(
    message: string,
    public readonly code: "NOT_FOUND" | "UNAUTHORIZED",
  ) {
    super(message);
  }
}

export const activityMessages = {
  activityResourceRequired: "La ressource activite est introuvable.",
  participantRequired: "Acces refuse a cette session.",
  sessionRequired: "La session active est introuvable.",
} as const;

const isActivityResource = (resource: ResourceRecord) =>
  resource.visibility === "public" &&
  resource.status === "published" &&
  (resource.resourceType === "activity" || resource.resourceType === "game");

const isAcceptedParticipant = (
  session: ActivitySessionRecord,
  userId: string,
) =>
  session.participants.some(
    (participant) =>
      participant.userId === userId && participant.status === "accepted",
  );

export const createActivitySessionService = ({
  accounts,
  invitations,
  resources,
  sessions,
}: ActivitySessionServiceDependencies) => {
  const getActiveSession = async (sessionId: string) => {
    const session = await sessions.findById(sessionId);

    if (!session || session.status !== "active") {
      throw new ActivitySessionError(
        activityMessages.sessionRequired,
        "NOT_FOUND",
      );
    }

    return session;
  };

  return {
    async startSession(resourceId: string, userId: string) {
      const resource = await resources.findById(resourceId);

      if (!resource || !isActivityResource(resource)) {
        throw new Error(activityMessages.activityResourceRequired);
      }

      return sessions.create(resourceId, userId);
    },

    async inviteParticipant(sessionId: string, invitedUserId: string) {
      await getActiveSession(sessionId);

      const invitedUserExists =
        await accounts.existsActiveCitizen(invitedUserId);

      if (!invitedUserExists) {
        throw new ActivitySessionError(
          activityMessages.participantRequired,
          "NOT_FOUND",
        );
      }

      const session = await sessions.addParticipant(sessionId, {
        status: "pending",
        userId: invitedUserId,
      });

      await invitations.sendInvitation(sessionId, invitedUserId);

      return session;
    },

    async sendMessage(sessionId: string, authorId: string, content: string) {
      const session = await getActiveSession(sessionId);

      if (!isAcceptedParticipant(session, authorId)) {
        throw new ActivitySessionError(
          activityMessages.participantRequired,
          "UNAUTHORIZED",
        );
      }

      return sessions.addMessage(sessionId, authorId, content);
    },

    async getSessionForParticipant(sessionId: string, userId: string) {
      const session = await getActiveSession(sessionId);

      if (!isAcceptedParticipant(session, userId)) {
        throw new ActivitySessionError(
          activityMessages.participantRequired,
          "UNAUTHORIZED",
        );
      }

      return session;
    },
  };
};
