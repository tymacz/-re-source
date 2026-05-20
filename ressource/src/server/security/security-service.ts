import {
  canAccessBackOffice,
  type AccountRecord,
} from "../auth/account-service";
import { escapeCommentContent } from "../comments/comment-service";

export type AdminSession = {
  user: AccountRecord;
} | null;

export type StoredPasswordRecord = {
  userId: string;
  passwordHash: string;
  plainPasswordCandidate: string;
};

export type DeactivatedAccount = {
  id: string;
  isActive: boolean;
};

export type StatisticLogRecord = {
  id: string;
  userId: string | null;
};

export type AccountComplianceRepository = {
  deactivateAccount(accountId: string): Promise<DeactivatedAccount>;
};

export type StatisticLogComplianceRepository = {
  anonymizeUserLogs(userId: string): Promise<StatisticLogRecord[]>;
};

export type ResourceFormControl = {
  name: string;
  disabled?: boolean;
  tabIndex: number;
  hasVisibleFocusStyle: boolean;
};

export type ResourceCreationForm = {
  controls: ResourceFormControl[];
};

export class SecurityError extends Error {
  public readonly exposedData = null;

  constructor(
    message: string,
    public readonly code: "UNAUTHORIZED",
  ) {
    super(message);
  }
}

export const securityMessages = {
  adminTokenRequired: "UNAUTHORIZED",
} as const;

export const isBcryptHash = (value: string) =>
  /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(value);

export const verifyStoredPasswordsAreHashed = (
  records: StoredPasswordRecord[],
) =>
  records.every(
    (record) =>
      record.passwordHash !== record.plainPasswordCandidate &&
      isBcryptHash(record.passwordHash),
  );

export const assertAdminRouterAccess = (session: AdminSession) => {
  if (!session || !canAccessBackOffice(session.user)) {
    throw new SecurityError(
      securityMessages.adminTokenRequired,
      "UNAUTHORIZED",
    );
  }

  return true;
};

export const deactivateAccountAndAnonymizeLogs = async (
  accountId: string,
  accounts: AccountComplianceRepository,
  statisticLogs: StatisticLogComplianceRepository,
) => {
  const account = await accounts.deactivateAccount(accountId);
  const anonymizedLogs = await statisticLogs.anonymizeUserLogs(accountId);

  return {
    account,
    anonymizedLogs,
  };
};

export const validateKeyboardAccessibleForm = (form: ResourceCreationForm) => {
  const focusableControls = form.controls
    .filter((control) => !control.disabled)
    .sort((first, second) => first.tabIndex - second.tabIndex);

  return {
    focusOrder: focusableControls.map((control) => control.name),
    hasVisibleFocusAtEveryStep: focusableControls.every(
      (control) => control.hasVisibleFocusStyle,
    ),
    isKeyboardAccessible: focusableControls.every(
      (control) => control.tabIndex >= 0 && control.hasVisibleFocusStyle,
    ),
  };
};

export const sanitizeCommentForDisplay = (content: string) =>
  escapeCommentContent(content);
