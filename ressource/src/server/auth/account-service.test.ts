import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  authMessages,
  authRedirects,
  canAccessBackOffice,
  createAccountService,
  type AccountRecord,
  type AccountRepository,
  type NewAccountData,
  type PasswordHasher,
  type SessionCreator,
  type VerificationMailer,
} from "./account-service";

const now = new Date("2026-05-20T12:00:00.000Z");

const buildAccount = (
  overrides: Partial<AccountRecord> = {},
): AccountRecord => ({
  createdAt: now,
  email: "citizen@example.com",
  emailVerified: true,
  id: "account-citizen",
  isActive: true,
  name: "Citoyen Exemple",
  passwordHash: "hashed:password-valide",
  role: "citizen",
  updatedAt: now,
  ...overrides,
});

const cloneAccount = (account: AccountRecord): AccountRecord => ({
  ...account,
  createdAt: new Date(account.createdAt),
  updatedAt: new Date(account.updatedAt),
});

const createMemoryAccountRepository = (
  initialAccounts: AccountRecord[] = [],
): AccountRepository => {
  const accounts = new Map<string, AccountRecord>();
  let sequence = 0;

  for (const account of initialAccounts) {
    accounts.set(account.id, cloneAccount(account));
  }

  return {
    async create(data: NewAccountData) {
      sequence += 1;

      const account = buildAccount({
        ...data,
        createdAt: now,
        id: `account-${sequence}`,
        updatedAt: now,
      });

      accounts.set(account.id, cloneAccount(account));

      return cloneAccount(account);
    },

    async findByEmail(email: string) {
      for (const account of accounts.values()) {
        if (account.email === email) {
          return cloneAccount(account);
        }
      }

      return null;
    },

    async findById(id: string) {
      const account = accounts.get(id);
      return account ? cloneAccount(account) : null;
    },

    async update(
      id: string,
      data: Partial<Pick<AccountRecord, "isActive" | "updatedAt">>,
    ) {
      const account = accounts.get(id);

      if (!account) {
        throw new Error("Compte introuvable.");
      }

      const updatedAccount = {
        ...account,
        ...data,
      };

      accounts.set(id, cloneAccount(updatedAccount));

      return cloneAccount(updatedAccount);
    },
  };
};

describe("Authentification et comptes", () => {
  let passwordHasher: PasswordHasher;
  let sessionCreator: SessionCreator;
  let verificationMailer: VerificationMailer;

  beforeEach(() => {
    passwordHasher = {
      hash: vi.fn(async (password: string) => `hashed:${password}`),
      verify: vi.fn(
        async (password: string, passwordHash: string) =>
          passwordHash === `hashed:${password}`,
      ),
    };
    sessionCreator = {
      createSession: vi.fn(async (account: AccountRecord) => ({
        createdAt: now,
        id: `session-${account.id}`,
        role: account.role,
        userId: account.id,
      })),
    };
    verificationMailer = {
      sendAccountVerification: vi.fn(async () => undefined),
    };
  });

  it("TC-A01 - cree un compte citoyen, envoie l'e-mail de verification et redirige vers l'accueil", async () => {
    const accounts = createMemoryAccountRepository();
    const service = createAccountService({
      accounts,
      passwordHasher,
      sessionCreator,
      verificationMailer,
    });

    const result = await service.createCitizenAccount({
      email: "  Citoyen@Example.com  ",
      name: " Alice Martin ",
      password: "password-valide",
    });

    expect(result.account).toMatchObject({
      email: "citoyen@example.com",
      emailVerified: false,
      isActive: true,
      name: "Alice Martin",
      role: "citizen",
    });
    expect(result.emailVerificationSent).toBe(true);
    expect(result.redirectTo).toBe(authRedirects.home);
    expect(passwordHasher.hash).toHaveBeenCalledWith("password-valide");
    expect(verificationMailer.sendAccountVerification).toHaveBeenCalledWith(
      result.account,
    );
  });

  it("TC-A02 - connecte un compte actif avec des identifiants valides et ouvre le tableau de bord", async () => {
    const account = buildAccount();
    const accounts = createMemoryAccountRepository([account]);
    const service = createAccountService({
      accounts,
      passwordHasher,
      sessionCreator,
      verificationMailer,
    });

    const result = await service.signIn({
      email: account.email,
      password: "password-valide",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("La connexion devait reussir.");
    }
    expect(result.redirectTo).toBe(authRedirects.dashboard);
    expect(result.session).toMatchObject({
      role: "citizen",
      userId: account.id,
    });
    expect(sessionCreator.createSession).toHaveBeenCalledWith(account);
  });

  it("TC-A03 - refuse la connexion avec un mot de passe incorrect sans creer de session", async () => {
    const account = buildAccount();
    const accounts = createMemoryAccountRepository([account]);
    const service = createAccountService({
      accounts,
      passwordHasher,
      sessionCreator,
      verificationMailer,
    });

    const result = await service.signIn({
      email: account.email,
      password: "mauvais-mot-de-passe",
    });

    expect(result).toEqual({
      error: authMessages.invalidCredentials,
      ok: false,
      session: null,
    });
    expect(sessionCreator.createSession).not.toHaveBeenCalled();
  });

  it("TC-A04 - permet au super-admin de desactiver un compte citoyen actif", async () => {
    const citizen = buildAccount();
    const superAdmin = buildAccount({
      email: "admin@example.com",
      id: "account-admin",
      role: "super-admin",
    });
    const accounts = createMemoryAccountRepository([citizen, superAdmin]);
    const service = createAccountService({
      accounts,
      passwordHasher,
      sessionCreator,
      verificationMailer,
    });

    const deactivatedAccount = await service.deactivateCitizenAccount(
      superAdmin,
      citizen.id,
    );

    expect(deactivatedAccount).toMatchObject({
      id: citizen.id,
      isActive: false,
      role: "citizen",
    });

    const signInResult = await service.signIn({
      email: citizen.email,
      password: "password-valide",
    });

    expect(signInResult).toEqual({
      error: authMessages.disabledAccount,
      ok: false,
      session: null,
    });
  });

  it("TC-A05 - cree un compte moderateur avec acces back-office quand le super-admin agit", async () => {
    const superAdmin = buildAccount({
      email: "admin@example.com",
      id: "account-admin",
      role: "super-admin",
    });
    const accounts = createMemoryAccountRepository([superAdmin]);
    const service = createAccountService({
      accounts,
      passwordHasher,
      sessionCreator,
      verificationMailer,
    });

    const result = await service.createModeratorAccount(superAdmin, {
      email: "moderateur@example.com",
      name: "Moderateur Exemple",
      password: "password-valide",
    });

    expect(result.account).toMatchObject({
      email: "moderateur@example.com",
      isActive: true,
      role: "moderator",
    });
    expect(result.hasBackOfficeAccess).toBe(true);
    expect(canAccessBackOffice(result.account)).toBe(true);
  });

  it("TC-A06 - refuse clairement la connexion sur un compte desactive", async () => {
    const disabledCitizen = buildAccount({ isActive: false });
    const accounts = createMemoryAccountRepository([disabledCitizen]);
    const service = createAccountService({
      accounts,
      passwordHasher,
      sessionCreator,
      verificationMailer,
    });

    const result = await service.signIn({
      email: disabledCitizen.email,
      password: "password-valide",
    });

    expect(result).toEqual({
      error: authMessages.disabledAccount,
      ok: false,
      session: null,
    });
    expect(sessionCreator.createSession).not.toHaveBeenCalled();
  });
});
