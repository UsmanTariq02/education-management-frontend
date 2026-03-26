export type OrganizationModule =
  | "USERS"
  | "STUDENTS"
  | "PORTALS"
  | "BATCHES"
  | "ACADEMICS"
  | "FEES"
  | "ATTENDANCE"
  | "REMINDERS"
  | "REPORTS"
  | "ACTIVITY_LOGS"
  | "SETTINGS"
  | "MEDIA";

export interface AuthUser {
  id: string;
  email: string;
  organizationId: string | null;
  organizationName: string | null;
  userLimit: number | null;
  studentLimit: number | null;
  enabledModules: OrganizationModule[];
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface SessionState {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export type AuthSecurityEventStatus =
  | "SUCCESS"
  | "FAILED"
  | "BLOCKED"
  | "LOGOUT"
  | "REFRESH"
  | "SESSION_REVOKED";

export interface AuthSecuritySession {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
  revocationReason: string | null;
}

export interface AuthSecurityEvent {
  id: string;
  email: string;
  status: AuthSecurityEventStatus;
  ipAddress: string | null;
  userAgent: string | null;
  failureReason: string | null;
  createdAt: string;
}

export interface AuthSecuritySummary {
  sessions: AuthSecuritySession[];
  recentLoginEvents: AuthSecurityEvent[];
}

export type PortalAccountType = "STUDENT" | "PARENT";

export interface PortalAuthUser {
  accountId: string;
  studentId: string;
  organizationId: string;
  organizationName: string;
  email: string;
  accountType: PortalAccountType;
  studentName: string;
  guardianName: string;
  batches: string[];
  studentStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "GRADUATED";
}

export interface PortalAuthResponse {
  accessToken: string;
  refreshToken: string;
  user: PortalAuthUser;
}

export interface PortalSessionState {
  accessToken: string;
  refreshToken: string;
  user: PortalAuthUser;
}
