import type { AccountRole } from "../auth/account-service";
import type { ResourceRecord } from "../resources/resource-service";

export type CommentStatus = "approved" | "pending" | "rejected";

export type CommentActor = {
  id: string;
  role: AccountRole;
};

export type CommentRecord = {
  id: string;
  resourceId: string;
  authorId: string;
  parentCommentId: string | null;
  content: string;
  status: CommentStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type NewCommentData = {
  resourceId: string;
  authorId: string;
  parentCommentId: string | null;
  content: string;
  status: CommentStatus;
};

export type CommentRepository = {
  create(data: NewCommentData): Promise<CommentRecord>;
  findById(id: string): Promise<CommentRecord | null>;
  updateStatus(id: string, status: CommentStatus): Promise<CommentRecord>;
  listByResource(resourceId: string): Promise<CommentRecord[]>;
};

export type CommentResourceRepository = {
  findById(id: string): Promise<ResourceRecord | null>;
};

export type CommentServiceDependencies = {
  comments: CommentRepository;
  resources: CommentResourceRepository;
};

export const commentMessages = {
  approvedParentRequired: "Le commentaire parent doit etre approuve.",
  publishedResourceRequired: "La ressource publiee est introuvable.",
  staffRequired: "Action reservee a la moderation.",
} as const;

export const escapeCommentContent = (content: string) =>
  content
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const isStaff = (actor: CommentActor) =>
  actor.role === "catalog-admin" ||
  actor.role === "moderator" ||
  actor.role === "super-admin";

export const createCommentService = ({
  comments,
  resources,
}: CommentServiceDependencies) => {
  const ensurePublishedResource = async (resourceId: string) => {
    const resource = await resources.findById(resourceId);

    if (
      !resource ||
      resource.visibility !== "public" ||
      resource.status !== "published"
    ) {
      throw new Error(commentMessages.publishedResourceRequired);
    }

    return resource;
  };

  const ensureModerator = (actor: CommentActor) => {
    if (!isStaff(actor)) {
      throw new Error(commentMessages.staffRequired);
    }
  };

  return {
    async addComment(actor: CommentActor, resourceId: string, content: string) {
      await ensurePublishedResource(resourceId);

      return comments.create({
        authorId: actor.id,
        content: escapeCommentContent(content),
        parentCommentId: null,
        resourceId,
        status: "pending",
      });
    },

    async approveComment(actor: CommentActor, commentId: string) {
      ensureModerator(actor);

      return comments.updateStatus(commentId, "approved");
    },

    async rejectComment(actor: CommentActor, commentId: string) {
      ensureModerator(actor);

      return comments.updateStatus(commentId, "rejected");
    },

    async replyToComment(
      actor: CommentActor,
      parentCommentId: string,
      content: string,
    ) {
      const parentComment = await comments.findById(parentCommentId);

      if (!parentComment || parentComment.status !== "approved") {
        throw new Error(commentMessages.approvedParentRequired);
      }

      await ensurePublishedResource(parentComment.resourceId);

      return comments.create({
        authorId: actor.id,
        content: escapeCommentContent(content),
        parentCommentId,
        resourceId: parentComment.resourceId,
        status: isStaff(actor) ? "approved" : "pending",
      });
    },

    async listPublicComments(resourceId: string) {
      const resourceComments = await comments.listByResource(resourceId);

      return resourceComments.filter(
        (comment) => comment.status === "approved",
      );
    },
  };
};
