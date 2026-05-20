import { describe, expect, it } from "vitest";

import {
  backOfficeRedirects,
  createBackOfficeService,
  type BackOfficeResourceRepository,
  type CategoryRecord,
  type CategoryRepository,
  type StatisticsLog,
  type StatisticsPeriod,
  type StatisticsRepository,
} from "./back-office-service";
import type { AccountRecord } from "../auth/account-service";
import {
  createResourceService,
  type NewResourceData,
  type ResourceDashboard,
  type ResourceRecord,
  type ResourceRepository,
  type ResourceStatus,
  type UserResourceState,
} from "../resources/resource-service";

const now = new Date("2026-05-20T12:00:00.000Z");

const catalogAdmin: AccountRecord = {
  createdAt: now,
  email: "admin-catalogue@example.com",
  emailVerified: true,
  id: "account-catalog-admin",
  isActive: true,
  name: "Admin Catalogue",
  passwordHash: "$2b$12$abcdefghijklmnopqrstuuI6okDINoVHL7L/7xXlRyb4VxG6TuV4a",
  role: "catalog-admin",
  updatedAt: now,
};

const moderator: AccountRecord = {
  ...catalogAdmin,
  email: "moderator@example.com",
  id: "account-moderator",
  name: "Moderateur",
  role: "moderator",
};

const citizen: AccountRecord = {
  ...catalogAdmin,
  email: "citizen@example.com",
  id: "account-citizen",
  name: "Citoyen",
  role: "citizen",
};

const buildResource = (
  overrides: Partial<ResourceRecord> = {},
): ResourceRecord => ({
  authorId: "user-author",
  category: "emploi",
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

const cloneResource = (resource: ResourceRecord): ResourceRecord => ({
  ...resource,
  createdAt: new Date(resource.createdAt),
  updatedAt: new Date(resource.updatedAt),
});

const createMemoryResourceRepository = (
  initialResources: ResourceRecord[] = [],
): BackOfficeResourceRepository & ResourceRepository => {
  const resources = new Map<string, ResourceRecord>();
  let sequence = 0;

  for (const resource of initialResources) {
    resources.set(resource.id, cloneResource(resource));
  }

  const updateResource = (
    id: string,
    data: Partial<Pick<ResourceRecord, "shareToken" | "status" | "updatedAt">>,
  ) => {
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
  };

  return {
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

    async getDashboard(_userId: string): Promise<ResourceDashboard> {
      return {
        asideResources: [],
        favoriteResources: [],
        progress: {
          exploitedCount: 0,
        },
      };
    },

    async list() {
      return [...resources.values()].map(cloneResource);
    },

    async update(id, data) {
      return updateResource(id, data);
    },

    async updateStatus(id: string, status: ResourceStatus) {
      return updateResource(id, {
        status,
        updatedAt: now,
      });
    },

    async upsertUserState(
      userId: string,
      resourceId: string,
      data: Partial<
        Pick<UserResourceState, "isAside" | "isExploited" | "isFavorite">
      >,
    ) {
      return {
        isAside: data.isAside ?? false,
        isExploited: data.isExploited ?? false,
        isFavorite: data.isFavorite ?? false,
        resourceId,
        userId,
      };
    },
  };
};

const createMemoryCategoryRepository = (): CategoryRepository => {
  const categories: CategoryRecord[] = [];

  return {
    async create(name: string) {
      const category = {
        createdAt: now,
        id: `category-${categories.length + 1}`,
        name,
      };

      categories.push(category);

      return category;
    },

    async list() {
      return [...categories];
    },
  };
};

const createMemoryStatisticsRepository = (
  logs: StatisticsLog[],
): StatisticsRepository => ({
  async list(period?: StatisticsPeriod) {
    if (!period) {
      return [...logs];
    }

    return logs.filter(
      (log) => log.createdAt >= period.from && log.createdAt <= period.to,
    );
  },
});

const createBackOfficeFixture = (
  resources = createMemoryResourceRepository(),
  logs: StatisticsLog[] = [],
) =>
  createBackOfficeService({
    categories: createMemoryCategoryRepository(),
    resources,
    statistics: createMemoryStatisticsRepository(logs),
  });

describe("Back-office referentiel, moderation et statistiques", () => {
  it("TC-B01 - ajoute une categorie disponible dans les filtres du catalogue", async () => {
    const service = createBackOfficeFixture();

    const category = await service.createCategory(catalogAdmin, "Logement");
    const filters = await service.listCatalogFilters();

    expect(category).toMatchObject({
      name: "Logement",
    });
    expect(filters.categories.map((item) => item.name)).toEqual(["Logement"]);
  });

  it('TC-B02 - suspend une ressource publiee et la masque du catalogue avec le statut "suspended"', async () => {
    const resources = createMemoryResourceRepository([
      buildResource({ id: "resource-visible" }),
    ]);
    const backOffice = createBackOfficeFixture(resources);
    const frontOffice = createResourceService({
      resources,
      shareTokenGenerator: () => "share-token",
    });

    const suspendedResource = await backOffice.suspendResource(
      catalogAdmin,
      "resource-visible",
    );
    const catalog = await frontOffice.getCatalog();

    expect(suspendedResource.status).toBe("suspended");
    expect(catalog).toEqual([]);
  });

  it("TC-B03 - valide une ressource soumise et la rend visible dans le catalogue public", async () => {
    const resources = createMemoryResourceRepository([
      buildResource({ id: "resource-pending", status: "pending" }),
    ]);
    const backOffice = createBackOfficeFixture(resources);
    const frontOffice = createResourceService({
      resources,
      shareTokenGenerator: () => "share-token",
    });

    const publishedResource = await backOffice.approveSubmittedResource(
      moderator,
      "resource-pending",
    );
    const catalog = await frontOffice.getCatalog();

    expect(publishedResource.status).toBe("published");
    expect(catalog.map((resource) => resource.id)).toEqual([
      "resource-pending",
    ]);
  });

  it('TC-B04 - refuse une ressource soumise et enregistre le statut "rejected" sans publication', async () => {
    const resources = createMemoryResourceRepository([
      buildResource({ id: "resource-pending", status: "pending" }),
    ]);
    const backOffice = createBackOfficeFixture(resources);
    const frontOffice = createResourceService({
      resources,
      shareTokenGenerator: () => "share-token",
    });

    const rejectedResource = await backOffice.rejectSubmittedResource(
      moderator,
      "resource-pending",
    );
    const catalog = await frontOffice.getCatalog();

    expect(rejectedResource.status).toBe("rejected");
    expect(catalog).toEqual([]);
  });

  it("TC-B05 - affiche le tableau de bord statistiques avec consultations, creations et exploitations", async () => {
    const service = createBackOfficeFixture(createMemoryResourceRepository(), [
      {
        createdAt: now,
        id: "log-1",
        type: "consultation",
        userId: "user-1",
      },
      {
        createdAt: now,
        id: "log-2",
        type: "creation",
        userId: "user-1",
      },
      {
        createdAt: now,
        id: "log-3",
        type: "exploitation",
        userId: "user-1",
      },
    ]);

    const dashboard = await service.getStatisticsDashboard(catalogAdmin);

    expect(dashboard).toEqual({
      consultations: 1,
      creations: 1,
      exploitations: 1,
    });
  });

  it("TC-B06 - filtre les statistiques selon la periode selectionnee", async () => {
    const service = createBackOfficeFixture(createMemoryResourceRepository(), [
      {
        createdAt: new Date("2026-05-01T10:00:00.000Z"),
        id: "log-in-period",
        type: "consultation",
        userId: "user-1",
      },
      {
        createdAt: new Date("2026-04-01T10:00:00.000Z"),
        id: "log-out-period",
        type: "consultation",
        userId: "user-1",
      },
    ]);

    const dashboard = await service.getStatisticsDashboard(catalogAdmin, {
      from: new Date("2026-05-01T00:00:00.000Z"),
      to: new Date("2026-05-31T23:59:59.999Z"),
    });

    expect(dashboard).toEqual({
      consultations: 1,
      creations: 0,
      exploitations: 0,
    });
  });

  it.todo(
    "TC-B07 - exporte les statistiques en CSV avec des donnees coherentes avec les filtres",
  );

  it("TC-B08 - refuse le back-office a un compte sans role staff et redirige vers le front-office", () => {
    const service = createBackOfficeFixture();

    expect(service.accessBackOffice(citizen)).toEqual({
      ok: false,
      redirectTo: backOfficeRedirects.frontOffice,
    });
  });
});
