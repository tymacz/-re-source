export type AccountRole =
  | "catalog-admin"
  | "citizen"
  | "moderator"
  | "super-admin";

export type AccountRecord = {
  id: string;
  name: string;
  email: string;
  role: AccountRole;
  isActive: boolean;
  emailVerified: boolean;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
};

export type AccountInput = {
  name: string;
  email: string;
  password: string;
};

export type NewAccountData = {
  name: string;
  email: string;
  role: AccountRole;
  isActive: boolean;
  emailVerified: boolean;
  passwordHash: string;
};

export type SessionRecord = {
  id: string;
  userId: string;
  role: AccountRole;
  createdAt: Date;
};

export type AccountRepository = {
  create(data: NewAccountData): Promise<AccountRecord>;
  findByEmail(email: string): Promise<AccountRecord | null>;
  findById(id: string): Promise<AccountRecord | null>;
  update(
    id: string,
    data: Partial<Pick<AccountRecord, "isActive" | "updatedAt">>,
  ): Promise<AccountRecord>;
};

export type PasswordHasher = {
  hash(password: string): Promise<string>;
  verify(password: string, passwordHash: string): Promise<boolean>;
};

export type VerificationMailer = {
  sendAccountVerification(account: AccountRecord): Promise<void>;
};

export type SessionCreator = {
  createSession(account: AccountRecord): Promise<SessionRecord>;
};

export type AccountServiceDependencies = {
  accounts: AccountRepository;
  passwordHasher: PasswordHasher;
  sessionCreator: SessionCreator;
  verificationMailer: VerificationMailer;
};

export const authRedirects = {
  home: "/",
  dashboard: "/dashboard",
} as const;

export const authMessages = {
  disabledAccount: "Votre compte est desactive. Contactez un administrateur.",
  invalidCredentials: "Identifiants invalides.",
  superAdminRequired: "Action reservee au super-admin.",
} as const;

export type SignInResult =
  | {
      ok: true;
      redirectTo: typeof authRedirects.dashboard;
      session: SessionRecord;
    }
  | {
      ok: false;
      error: string;
      session: null;
    };

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const assertActiveSuperAdmin = (actor: AccountRecord) => {
  if (actor.role !== "super-admin" || !actor.isActive) {
    throw new Error(authMessages.superAdminRequired);
  }
};

export const canAccessBackOffice = (account: AccountRecord) =>
  account.isActive &&
  (account.role === "catalog-admin" ||
    account.role === "moderator" ||
    account.role === "super-admin");

export const createAccountService = ({
  accounts,
  passwordHasher,
  sessionCreator,
  verificationMailer,
}: AccountServiceDependencies) => ({
  async createCitizenAccount(input: AccountInput) {
    const account = await accounts.create({
      email: normalizeEmail(input.email),
      emailVerified: false,
      isActive: true,
      name: input.name.trim(),
      passwordHash: await passwordHasher.hash(input.password),
      role: "citizen",
    });

    await verificationMailer.sendAccountVerification(account);

    return {
      account,
      emailVerificationSent: true,
      redirectTo: authRedirects.home,
    };
  },

  async signIn(input: Pick<AccountInput, "email" | "password">) {
    const account = await accounts.findByEmail(normalizeEmail(input.email));

    if (!account) {
      return {
        error: authMessages.invalidCredentials,
        ok: false,
        session: null,
      } satisfies SignInResult;
    }

    const passwordMatches = await passwordHasher.verify(
      input.password,
      account.passwordHash,
    );

    if (!passwordMatches) {
      return {
        error: authMessages.invalidCredentials,
        ok: false,
        session: null,
      } satisfies SignInResult;
    }

    if (!account.isActive) {
      return {
        error: authMessages.disabledAccount,
        ok: false,
        session: null,
      } satisfies SignInResult;
    }

    return {
      ok: true,
      redirectTo: authRedirects.dashboard,
      session: await sessionCreator.createSession(account),
    } satisfies SignInResult;
  },

  async deactivateCitizenAccount(actor: AccountRecord, citizenId: string) {
    assertActiveSuperAdmin(actor);

    const citizen = await accounts.findById(citizenId);
    if (!citizen) {
      throw new Error("Compte introuvable.");
    }

    if (citizen.role !== "citizen") {
      throw new Error("Seul un compte citoyen peut etre desactive.");
    }

    return accounts.update(citizenId, {
      isActive: false,
      updatedAt: new Date(),
    });
  },

  async createModeratorAccount(actor: AccountRecord, input: AccountInput) {
    assertActiveSuperAdmin(actor);

    const account = await accounts.create({
      email: normalizeEmail(input.email),
      emailVerified: false,
      isActive: true,
      name: input.name.trim(),
      passwordHash: await passwordHasher.hash(input.password),
      role: "moderator",
    });

    return {
      account,
      hasBackOfficeAccess: canAccessBackOffice(account),
    };
  },
});
