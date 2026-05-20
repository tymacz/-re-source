import { describe, expect, it } from "vitest";

import {
  createResourceService,
  type NewResourceData,
  type ResourceDashboard,
  type ResourceRecord,
  type ResourceRepository,
  type ResourceViewer,
  type UserResourceState,
} from "./resource-service";

const now = new Date("2026-05-20T12:00:00.000Z");

const viewer: ResourceViewer = {
  emailVerified: true,
  id: "user-author",
};

const otherViewer: ResourceViewer = {
  emailVerified: true,
  id: "user-other",
};

const buildResource = (
  overrides: Partial<ResourceRecord> = {},
): ResourceRecord => ({
  authorId: "moderator",
  category: "emploi",
  createdAt: now,
  id: "resource-emploi-guide",
  isRestricted: false,
  relationType: "parent",
  resourceType: "guide",
  shareToken: null,
  status: "published",
  title: "Guide emploi",
  updatedAt: now,
  visibility: "public",
  ...overrides,
});

const cloneResource = (resource: ResourceRecord): ResourceRecord => ({
  ...resource,
  createdAt: new Date(resource.createdAt),
  updatedAt: new Date(resource.updatedAt),
});

const createMemoryResourceRepository = (
  initialResources: ResourceRecord[] = [],
): ResourceRepository => {
  const resources = new Map<string, ResourceRecord>();
  const userStates = new Map<string, UserResourceState>();
  let sequence = 0;

  for (const resource of initialResources) {
    resources.set(resource.id, cloneResource(resource));
  }

  const stateKey = (userId: string, resourceId: string) =>
    `${userId}:${resourceId}`;

  const getState = (userId: string, resourceId: string): UserResourceState => {
    const existingState = userStates.get(stateKey(userId, resourceId));

    return (
      existingState ?? {
        isAside: false,
        isExploited: false,
        isFavorite: false,
        resourceId,
        userId,
      }
    );
  };

  return {
    async list() {
      return [...resources.values()].map(cloneResource);
    },

    async create(data: NewResourceData) {
      sequence += 1;

      const resource = buildResource({
        ...data,
        createdAt: now,
        id: `resource-${sequence}`,
        updatedAt: now,
      });

      resources.set(resource.id, cloneResource(resource));

      return cloneResource(resource);
    },

    async findById(id: string) {
      const resource = resources.get(id);
      return resource ? cloneResource(resource) : null;
    },

    async update(
      id: string,
      data: Partial<Pick<ResourceRecord, "shareToken" | "updatedAt">>,
    ) {
      const resource = resources.get(id);

      if (!resource) {
        throw new Error("Ressource introuvable.");
      }

      const updatedResource = {
        ...resource,
        ...data,
      };

      resources.set(id, cloneResource(updatedResource));

      return cloneResource(updatedResource);
    },

    async upsertUserState(userId, resourceId, data) {
      const nextState = {
        ...getState(userId, resourceId),
        ...data,
      };

      userStates.set(stateKey(userId, resourceId), nextState);

      return { ...nextState };
    },

    async getDashboard(userId: string): Promise<ResourceDashboard> {
      const favoriteResources: ResourceRecord[] = [];
      const asideResources: ResourceRecord[] = [];
      let exploitedCount = 0;

      for (const state of userStates.values()) {
        if (state.userId !== userId) {
          continue;
        }

        const resource = resources.get(state.resourceId);

        if (!resource) {
          continue;
        }

        if (state.isFavorite) {
          favoriteResources.push(cloneResource(resource));
        }

        if (state.isAside) {
          asideResources.push(cloneResource(resource));
        }

        if (state.isExploited) {
          exploitedCount += 1;
        }
      }

      return {
        asideResources,
        favoriteResources,
        progress: {
          exploitedCount,
        },
      };
    },
  };
};

describe("Catalogue et ressources front-office", () => {
  it("TC-R01 - affiche le catalogue public sans connexion sans les ressources restreintes", async () => {
    const publicResource = buildResource({
      id: "resource-public",
      title: "Ressource publique",
    });
    const restrictedResource = buildResource({
      id: "resource-restreinte",
      isRestricted: true,
      title: "Ressource restreinte",
    });
    const repository = createMemoryResourceRepository([
      publicResource,
      restrictedResource,
    ]);
    const service = createResourceService({
      resources: repository,
      shareTokenGenerator: () => "share-token",
    });

    const catalog = await service.getCatalog();

    expect(catalog.map((resource) => resource.id)).toEqual(["resource-public"]);
  });

  it("TC-R02 - filtre le catalogue par categorie", async () => {
    const repository = createMemoryResourceRepository([
      buildResource({ category: "emploi", id: "resource-emploi" }),
      buildResource({ category: "logement", id: "resource-logement" }),
    ]);
    const service = createResourceService({
      resources: repository,
      shareTokenGenerator: () => "share-token",
    });

    const catalog = await service.getCatalog({ category: "logement" });

    expect(catalog.map((resource) => resource.id)).toEqual([
      "resource-logement",
    ]);
    expect(catalog.every((resource) => resource.category === "logement")).toBe(
      true,
    );
  });

  it("TC-R03 - applique ensemble les filtres de type de relation et de type de ressource", async () => {
    const repository = createMemoryResourceRepository([
      buildResource({
        id: "resource-parent-video",
        relationType: "parent",
        resourceType: "video",
      }),
      buildResource({
        id: "resource-parent-guide",
        relationType: "parent",
        resourceType: "guide",
      }),
      buildResource({
        id: "resource-aidant-video",
        relationType: "aidant",
        resourceType: "video",
      }),
    ]);
    const service = createResourceService({
      resources: repository,
      shareTokenGenerator: () => "share-token",
    });

    const catalog = await service.getCatalog({
      relationType: "parent",
      resourceType: "video",
    });

    expect(catalog.map((resource) => resource.id)).toEqual([
      "resource-parent-video",
    ]);
  });

  it("TC-R04 - cree une ressource privee visible uniquement par son auteur", async () => {
    const repository = createMemoryResourceRepository();
    const service = createResourceService({
      resources: repository,
      shareTokenGenerator: () => "share-token",
    });

    const privateResource = await service.createPrivateResource(viewer, {
      category: "emploi",
      relationType: "parent",
      resourceType: "guide",
      title: "Note privee",
    });

    expect(privateResource).toMatchObject({
      authorId: viewer.id,
      status: "published",
      visibility: "private",
    });
    await expect(service.getCatalog()).resolves.toEqual([]);
    await expect(service.getVisibleResourcesForViewer(viewer)).resolves.toEqual(
      [privateResource],
    );
    await expect(
      service.getVisibleResourcesForViewer(otherViewer),
    ).resolves.toEqual([]);
  });

  it("TC-R05 - cree une ressource publique en attente de moderation absente du catalogue public", async () => {
    const repository = createMemoryResourceRepository();
    const service = createResourceService({
      resources: repository,
      shareTokenGenerator: () => "share-token",
    });

    const pendingResource = await service.submitPublicResourceForModeration(
      viewer,
      {
        category: "logement",
        relationType: "aidant",
        resourceType: "article",
        title: "Demarche logement",
      },
    );

    expect(pendingResource).toMatchObject({
      status: "pending",
      visibility: "public",
    });
    await expect(service.getCatalog()).resolves.toEqual([]);
  });

  it("TC-R06 - genere un lien de partage fonctionnel pour une ressource publiee", async () => {
    const publishedResource = buildResource({
      id: "resource-shareable",
      title: "Ressource partageable",
    });
    const repository = createMemoryResourceRepository([publishedResource]);
    const service = createResourceService({
      resources: repository,
      shareTokenGenerator: () => "share-token-123",
    });

    const shareLink = await service.generateShareLink(
      publishedResource.id,
      "https://example.test/",
    );
    const shareToken = new URL(shareLink).searchParams.get("share");
    const sharedResource = await service.resolveShareLink(shareToken ?? "");

    expect(shareLink).toBe(
      "https://example.test/ressources/resource-shareable?share=share-token-123",
    );
    expect(sharedResource).toMatchObject({
      id: publishedResource.id,
      status: "published",
      visibility: "public",
    });
  });

  it("TC-R07 - ajoute une ressource publiee aux favoris et la rend visible dans le tableau de bord", async () => {
    const publishedResource = buildResource({ id: "resource-favorite" });
    const repository = createMemoryResourceRepository([publishedResource]);
    const service = createResourceService({
      resources: repository,
      shareTokenGenerator: () => "share-token",
    });

    await service.addToFavorites(viewer, publishedResource.id);
    const dashboard = await service.getDashboard(viewer);

    expect(dashboard.favoriteResources.map((resource) => resource.id)).toEqual([
      publishedResource.id,
    ]);
  });

  it("TC-R08 - marque une ressource comme exploitee et met a jour le compteur de progression", async () => {
    const publishedResource = buildResource({ id: "resource-exploited" });
    const repository = createMemoryResourceRepository([publishedResource]);
    const service = createResourceService({
      resources: repository,
      shareTokenGenerator: () => "share-token",
    });

    await service.markAsExploited(viewer, publishedResource.id);
    const dashboard = await service.getDashboard(viewer);

    expect(dashboard.progress.exploitedCount).toBe(1);
  });

  it("TC-R09 - met une ressource de cote et met a jour le tableau de bord", async () => {
    const publishedResource = buildResource({ id: "resource-aside" });
    const repository = createMemoryResourceRepository([publishedResource]);
    const service = createResourceService({
      resources: repository,
      shareTokenGenerator: () => "share-token",
    });

    await service.putAside(viewer, publishedResource.id);
    const dashboard = await service.getDashboard(viewer);

    expect(dashboard.asideResources.map((resource) => resource.id)).toEqual([
      publishedResource.id,
    ]);
  });
});
