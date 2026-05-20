import { describe, expect, it } from "vitest";

import {
  createCommentService,
  type CommentRecord,
  type CommentRepository,
  type NewCommentData,
} from "./comment-service";
import type { ResourceRecord } from "../resources/resource-service";

const now = new Date("2026-05-20T12:00:00.000Z");

const citizen = {
  id: "user-citizen",
  role: "citizen" as const,
};

const moderator = {
  id: "user-moderator",
  role: "moderator" as const,
};

const buildResource = (
  overrides: Partial<ResourceRecord> = {},
): ResourceRecord => ({
  authorId: "user-author",
  category: "famille",
  createdAt: now,
  id: "resource-published",
  isRestricted: false,
  relationType: "parent",
  resourceType: "guide",
  shareToken: null,
  status: "published",
  title: "Ressource publiee",
  updatedAt: now,
  visibility: "public",
  ...overrides,
});

const cloneComment = (comment: CommentRecord): CommentRecord => ({
  ...comment,
  createdAt: new Date(comment.createdAt),
  updatedAt: new Date(comment.updatedAt),
});

const createMemoryCommentRepository = (
  initialComments: CommentRecord[] = [],
): CommentRepository => {
  const comments = new Map<string, CommentRecord>();
  let sequence = 0;

  for (const comment of initialComments) {
    comments.set(comment.id, cloneComment(comment));
  }

  return {
    async create(data: NewCommentData) {
      sequence += 1;

      const comment: CommentRecord = {
        ...data,
        createdAt: now,
        id: `comment-${sequence}`,
        updatedAt: now,
      };

      comments.set(comment.id, cloneComment(comment));

      return cloneComment(comment);
    },

    async findById(id: string) {
      const comment = comments.get(id);
      return comment ? cloneComment(comment) : null;
    },

    async updateStatus(id, status) {
      const comment = comments.get(id);

      if (!comment) {
        throw new Error("Commentaire introuvable.");
      }

      const updatedComment = {
        ...comment,
        status,
        updatedAt: now,
      };

      comments.set(id, cloneComment(updatedComment));

      return cloneComment(updatedComment);
    },

    async listByResource(resourceId: string) {
      return [...comments.values()]
        .filter((comment) => comment.resourceId === resourceId)
        .map(cloneComment);
    },
  };
};

const createCommentServiceFixture = (
  comments = createMemoryCommentRepository(),
) =>
  createCommentService({
    comments,
    resources: {
      async findById(id: string) {
        return id === "resource-published" ? buildResource({ id }) : null;
      },
    },
  });

describe("Commentaires et echanges", () => {
  it("TC-C01 - ajoute un commentaire en attente de moderation non visible publiquement", async () => {
    const service = createCommentServiceFixture();

    const comment = await service.addComment(
      citizen,
      "resource-published",
      "Merci pour la ressource",
    );
    const publicComments =
      await service.listPublicComments("resource-published");

    expect(comment).toMatchObject({
      authorId: citizen.id,
      parentCommentId: null,
      status: "pending",
    });
    expect(publicComments).toEqual([]);
  });

  it("TC-C02 - valide un commentaire par moderateur et le rend visible publiquement", async () => {
    const comments = createMemoryCommentRepository();
    const service = createCommentServiceFixture(comments);
    const comment = await service.addComment(
      citizen,
      "resource-published",
      "A publier",
    );

    const approvedComment = await service.approveComment(moderator, comment.id);
    const publicComments =
      await service.listPublicComments("resource-published");

    expect(approvedComment.status).toBe("approved");
    expect(publicComments.map((publicComment) => publicComment.id)).toEqual([
      comment.id,
    ]);
  });

  it("TC-C03 - refuse un commentaire inapproprie sans publication", async () => {
    const comments = createMemoryCommentRepository();
    const service = createCommentServiceFixture(comments);
    const comment = await service.addComment(
      citizen,
      "resource-published",
      "Contenu non conforme",
    );

    const rejectedComment = await service.rejectComment(moderator, comment.id);
    const publicComments =
      await service.listPublicComments("resource-published");

    expect(rejectedComment.status).toBe("rejected");
    expect(publicComments).toEqual([]);
  });

  it("TC-C04 - soumet la reponse citoyenne a moderation", async () => {
    const comments = createMemoryCommentRepository();
    const service = createCommentServiceFixture(comments);
    const comment = await service.addComment(
      citizen,
      "resource-published",
      "Question initiale",
    );
    await service.approveComment(moderator, comment.id);

    const reply = await service.replyToComment(
      citizen,
      comment.id,
      "Reponse citoyenne",
    );

    expect(reply).toMatchObject({
      parentCommentId: comment.id,
      status: "pending",
    });
  });

  it("TC-C05 - publie directement une reponse de moderateur", async () => {
    const comments = createMemoryCommentRepository();
    const service = createCommentServiceFixture(comments);
    const comment = await service.addComment(
      citizen,
      "resource-published",
      "Question initiale",
    );
    await service.approveComment(moderator, comment.id);

    const reply = await service.replyToComment(
      moderator,
      comment.id,
      "Reponse officielle",
    );

    expect(reply).toMatchObject({
      parentCommentId: comment.id,
      status: "approved",
    });
  });
});
