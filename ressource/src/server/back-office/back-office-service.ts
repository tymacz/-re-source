import {
  canAccessBackOffice,
  type AccountRecord,
} from "../auth/account-service";
import type {
  ResourceRecord,
  ResourceStatus,
} from "../resources/resource-service";

export type BackOfficeActor = AccountRecord | null;

export type CategoryRecord = {
  id: string;
  name: string;
  createdAt: Date;
};

export type StatisticsLogType = "consultation" | "creation" | "exploitation";

export type StatisticsLog = {
  id: string;
  type: StatisticsLogType;
  createdAt: Date;
  userId: string | null;
};

export type StatisticsPeriod = {
  from: Date;
  to: Date;
};

export type StatisticsDashboard = {
  consultations: number;
  creations: number;
  exploitations: number;
};

export type BackOfficeResourceRepository = {
  findById(id: string): Promise<ResourceRecord | null>;
  updateStatus(id: string, status: ResourceStatus): Promise<ResourceRecord>;
};

export type CategoryRepository = {
  create(name: string): Promise<CategoryRecord>;
  list(): Promise<CategoryRecord[]>;
};

export type StatisticsRepository = {
  list(period?: StatisticsPeriod): Promise<StatisticsLog[]>;
};

export type BackOfficeServiceDependencies = {
  categories: CategoryRepository;
  resources: BackOfficeResourceRepository;
  statistics: StatisticsRepository;
};

export class BackOfficeError extends Error {
  constructor(
    message: string,
    public readonly code: "UNAUTHORIZED",
  ) {
    super(message);
  }
}

export const backOfficeMessages = {
  pendingResourceRequired: "La ressource en attente est introuvable.",
  resourceRequired: "La ressource est introuvable.",
  staffRequired: "Acces back-office refuse.",
} as const;

export const backOfficeRedirects = {
  frontOffice: "/",
} as const;

export const createBackOfficeService = ({
  categories,
  resources,
  statistics,
}: BackOfficeServiceDependencies) => {
  const assertStaff = (actor: BackOfficeActor) => {
    if (!actor || !canAccessBackOffice(actor)) {
      throw new BackOfficeError(
        backOfficeMessages.staffRequired,
        "UNAUTHORIZED",
      );
    }
  };

  const assertPendingResource = async (resourceId: string) => {
    const resource = await resources.findById(resourceId);

    if (!resource || resource.status !== "pending") {
      throw new Error(backOfficeMessages.pendingResourceRequired);
    }

    return resource;
  };

  return {
    accessBackOffice(actor: BackOfficeActor) {
      if (!actor || !canAccessBackOffice(actor)) {
        return {
          ok: false,
          redirectTo: backOfficeRedirects.frontOffice,
        };
      }

      return {
        ok: true,
        redirectTo: null,
      };
    },

    async createCategory(actor: BackOfficeActor, name: string) {
      assertStaff(actor);

      return categories.create(name.trim());
    },

    async listCatalogFilters() {
      return {
        categories: await categories.list(),
      };
    },

    async suspendResource(actor: BackOfficeActor, resourceId: string) {
      assertStaff(actor);

      const resource = await resources.findById(resourceId);
      if (!resource) {
        throw new Error(backOfficeMessages.resourceRequired);
      }

      return resources.updateStatus(resource.id, "suspended");
    },

    async approveSubmittedResource(actor: BackOfficeActor, resourceId: string) {
      assertStaff(actor);
      const resource = await assertPendingResource(resourceId);

      return resources.updateStatus(resource.id, "published");
    },

    async rejectSubmittedResource(actor: BackOfficeActor, resourceId: string) {
      assertStaff(actor);
      const resource = await assertPendingResource(resourceId);

      return resources.updateStatus(resource.id, "rejected");
    },

    async getStatisticsDashboard(
      actor: BackOfficeActor,
      period?: StatisticsPeriod,
    ): Promise<StatisticsDashboard> {
      assertStaff(actor);

      const logs = await statistics.list(period);

      return {
        consultations: logs.filter((log) => log.type === "consultation").length,
        creations: logs.filter((log) => log.type === "creation").length,
        exploitations: logs.filter((log) => log.type === "exploitation").length,
      };
    },

    assertStaff,
  };
};
