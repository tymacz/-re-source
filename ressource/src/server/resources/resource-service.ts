export type ResourceVisibility = "public" | "private";
export type ResourceStatus = "pending" | "published" | "rejected" | "suspended";
export type RelationType = "parent" | "aidant" | "professionnel";
export type ResourceType = "activity" | "article" | "game" | "guide" | "video";

export type ResourceViewer = {
  id: string;
  emailVerified: boolean;
};

export type ResourceRecord = {
  id: string;
  title: string;
  category: string;
  relationType: RelationType;
  resourceType: ResourceType;
  visibility: ResourceVisibility;
  status: ResourceStatus;
  isRestricted: boolean;
  authorId: string;
  shareToken: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ResourceInput = {
  title: string;
  category: string;
  relationType: RelationType;
  resourceType: ResourceType;
  isRestricted?: boolean;
};

export type NewResourceData = ResourceInput & {
  authorId: string;
  visibility: ResourceVisibility;
  status: ResourceStatus;
  isRestricted: boolean;
  shareToken: string | null;
};

export type CatalogFilters = {
  category?: string;
  relationType?: RelationType;
  resourceType?: ResourceType;
};

export type UserResourceState = {
  userId: string;
  resourceId: string;
  isFavorite: boolean;
  isExploited: boolean;
  isAside: boolean;
};

export type ResourceDashboard = {
  favoriteResources: ResourceRecord[];
  asideResources: ResourceRecord[];
  progress: {
    exploitedCount: number;
  };
};

export type ResourceRepository = {
  list(): Promise<ResourceRecord[]>;
  create(data: NewResourceData): Promise<ResourceRecord>;
  findById(id: string): Promise<ResourceRecord | null>;
  update(
    id: string,
    data: Partial<Pick<ResourceRecord, "shareToken" | "status" | "updatedAt">>,
  ): Promise<ResourceRecord>;
  upsertUserState(
    userId: string,
    resourceId: string,
    data: Partial<
      Pick<UserResourceState, "isAside" | "isExploited" | "isFavorite">
    >,
  ): Promise<UserResourceState>;
  getDashboard(userId: string): Promise<ResourceDashboard>;
};

export type ResourceServiceDependencies = {
  resources: ResourceRepository;
  shareTokenGenerator: () => string;
};

export const resourceMessages = {
  publishedResourceRequired: "La ressource publiee est introuvable.",
  verifiedAccountRequired: "Un compte verifie est requis.",
} as const;

const assertVerifiedViewer = (viewer: ResourceViewer) => {
  if (!viewer.emailVerified) {
    throw new Error(resourceMessages.verifiedAccountRequired);
  }
};

const isPublicCatalogResource = (
  resource: ResourceRecord,
  viewer: ResourceViewer | null,
) =>
  resource.visibility === "public" &&
  resource.status === "published" &&
  (!resource.isRestricted || Boolean(viewer));

const matchesCatalogFilters = (
  resource: ResourceRecord,
  filters: CatalogFilters = {},
) =>
  (!filters.category || resource.category === filters.category) &&
  (!filters.relationType || resource.relationType === filters.relationType) &&
  (!filters.resourceType || resource.resourceType === filters.resourceType);

export const canViewerSeeResource = (
  resource: ResourceRecord,
  viewer: ResourceViewer | null,
) => {
  if (isPublicCatalogResource(resource, viewer)) {
    return true;
  }

  return resource.visibility === "private" && resource.authorId === viewer?.id;
};

export const createResourceService = ({
  resources,
  shareTokenGenerator,
}: ResourceServiceDependencies) => {
  const ensurePublishedVisibleResource = async (
    resourceId: string,
    viewer: ResourceViewer,
  ) => {
    const resource = await resources.findById(resourceId);

    if (!resource || !canViewerSeeResource(resource, viewer)) {
      throw new Error(resourceMessages.publishedResourceRequired);
    }

    return resource;
  };

  return {
    async getCatalog(
      filters: CatalogFilters = {},
      viewer: ResourceViewer | null = null,
    ) {
      const allResources = await resources.list();

      return allResources.filter(
        (resource) =>
          isPublicCatalogResource(resource, viewer) &&
          matchesCatalogFilters(resource, filters),
      );
    },

    async getVisibleResourcesForViewer(viewer: ResourceViewer) {
      const allResources = await resources.list();

      return allResources.filter((resource) =>
        canViewerSeeResource(resource, viewer),
      );
    },

    async createPrivateResource(viewer: ResourceViewer, input: ResourceInput) {
      assertVerifiedViewer(viewer);

      return resources.create({
        ...input,
        authorId: viewer.id,
        isRestricted: input.isRestricted ?? false,
        shareToken: null,
        status: "published",
        visibility: "private",
      });
    },

    async submitPublicResourceForModeration(
      viewer: ResourceViewer,
      input: ResourceInput,
    ) {
      assertVerifiedViewer(viewer);

      return resources.create({
        ...input,
        authorId: viewer.id,
        isRestricted: input.isRestricted ?? false,
        shareToken: null,
        status: "pending",
        visibility: "public",
      });
    },

    async generateShareLink(resourceId: string, baseUrl: string) {
      const resource = await resources.findById(resourceId);

      if (
        !resource ||
        resource.visibility !== "public" ||
        resource.status !== "published"
      ) {
        throw new Error(resourceMessages.publishedResourceRequired);
      }

      const shareToken = resource.shareToken ?? shareTokenGenerator();
      await resources.update(resource.id, {
        shareToken,
        updatedAt: new Date(),
      });

      return `${baseUrl.replace(/\/$/, "")}/ressources/${resource.id}?share=${shareToken}`;
    },

    async resolveShareLink(shareToken: string) {
      const allResources = await resources.list();

      return (
        allResources.find(
          (resource) =>
            resource.shareToken === shareToken &&
            resource.visibility === "public" &&
            resource.status === "published",
        ) ?? null
      );
    },

    async addToFavorites(viewer: ResourceViewer, resourceId: string) {
      await ensurePublishedVisibleResource(resourceId, viewer);

      return resources.upsertUserState(viewer.id, resourceId, {
        isFavorite: true,
      });
    },

    async markAsExploited(viewer: ResourceViewer, resourceId: string) {
      await ensurePublishedVisibleResource(resourceId, viewer);

      return resources.upsertUserState(viewer.id, resourceId, {
        isExploited: true,
      });
    },

    async putAside(viewer: ResourceViewer, resourceId: string) {
      await ensurePublishedVisibleResource(resourceId, viewer);

      return resources.upsertUserState(viewer.id, resourceId, {
        isAside: true,
      });
    },

    async getDashboard(viewer: ResourceViewer) {
      return resources.getDashboard(viewer.id);
    },

    ensurePublishedVisibleResource,
  };
};
