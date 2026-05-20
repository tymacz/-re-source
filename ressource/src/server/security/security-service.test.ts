import { describe, expect, it } from "vitest";

import type { AccountRecord } from "../auth/account-service";
import {
  assertAdminRouterAccess,
  deactivateAccountAndAnonymizeLogs,
  sanitizeCommentForDisplay,
  validateKeyboardAccessibleForm,
  verifyStoredPasswordsAreHashed,
  type StatisticLogRecord,
} from "./security-service";

const now = new Date("2026-05-20T12:00:00.000Z");

const moderator: AccountRecord = {
  createdAt: now,
  email: "moderator@example.com",
  emailVerified: true,
  id: "account-moderator",
  isActive: true,
  name: "Moderateur",
  passwordHash: "$2b$12$abcdefghijklmnopqrstuuI6okDINoVHL7L/7xXlRyb4VxG6TuV4a",
  role: "moderator",
  updatedAt: now,
};

describe("Securite et conformite", () => {
  it("TC-SEC01 - verifie que les mots de passe sont stockes uniquement en hash bcrypt", () => {
    const passwordAudit = [
      {
        passwordHash:
          "$2b$12$abcdefghijklmnopqrstuuI6okDINoVHL7L/7xXlRyb4VxG6TuV4a",
        plainPasswordCandidate: "mot-de-passe-secret",
        userId: "user-1",
      },
    ];

    expect(verifyStoredPasswordsAreHashed(passwordAudit)).toBe(true);
  });

  it("TC-SEC02 - refuse un appel direct a un router admin sans token valide sans exposer de donnees", () => {
    expect(() => assertAdminRouterAccess(null)).toThrowError(
      expect.objectContaining({
        code: "UNAUTHORIZED",
        exposedData: null,
        message: "UNAUTHORIZED",
      }),
    );
    expect(assertAdminRouterAccess({ user: moderator })).toBe(true);
  });

  it("TC-SEC03 - desactive un compte et anonymise les logs statistiques associes", async () => {
    const logs: StatisticLogRecord[] = [
      { id: "log-1", userId: "account-citizen" },
      { id: "log-2", userId: "account-citizen" },
    ];

    const result = await deactivateAccountAndAnonymizeLogs(
      "account-citizen",
      {
        async deactivateAccount(accountId: string) {
          return {
            id: accountId,
            isActive: false,
          };
        },
      },
      {
        async anonymizeUserLogs(userId: string) {
          for (const log of logs) {
            if (log.userId === userId) {
              log.userId = null;
            }
          }

          return logs.filter((log) => log.userId === null);
        },
      },
    );

    expect(result.account).toEqual({
      id: "account-citizen",
      isActive: false,
    });
    expect(result.anonymizedLogs).toEqual([
      { id: "log-1", userId: null },
      { id: "log-2", userId: null },
    ]);
  });

  it("TC-SEC04 - valide la navigation clavier du formulaire de creation de ressource avec focus visible", () => {
    const result = validateKeyboardAccessibleForm({
      controls: [
        { hasVisibleFocusStyle: true, name: "titre", tabIndex: 0 },
        { hasVisibleFocusStyle: true, name: "categorie", tabIndex: 1 },
        { hasVisibleFocusStyle: true, name: "type", tabIndex: 2 },
        { hasVisibleFocusStyle: true, name: "visibilite", tabIndex: 3 },
        { hasVisibleFocusStyle: true, name: "soumettre", tabIndex: 4 },
      ],
    });

    expect(result).toEqual({
      focusOrder: ["titre", "categorie", "type", "visibilite", "soumettre"],
      hasVisibleFocusAtEveryStep: true,
      isKeyboardAccessible: true,
    });
  });

  it.todo(
    "TC-SEC05 - verifie les contrastes de la page catalogue selon le ratio WCAG AA 4.5:1",
  );

  it("TC-SEC06 - echappe le contenu malveillant d'un commentaire en texte brut sans executer de script", () => {
    const escapedContent = sanitizeCommentForDisplay(
      '<script>alert("xss")</script><strong>ok</strong>',
    );

    expect(escapedContent).toBe(
      "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;&lt;strong&gt;ok&lt;/strong&gt;",
    );
    expect(escapedContent).not.toContain("<script>");
  });
});
