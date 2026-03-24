export interface AuthUser {
  id: string;
  email: string;
  organizationId: string | null;
  organizationName: string | null;
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
