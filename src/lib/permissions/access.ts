import type { AuthUser, OrganizationModule } from "@/types/auth";

export function hasPermission(user: AuthUser | null, permission: string) {
  return Boolean(user?.permissions.includes(permission) || user?.roles.includes("SUPER_ADMIN"));
}

export function hasAnyPermission(user: AuthUser | null, permissions: string[]) {
  return permissions.some((permission) => hasPermission(user, permission));
}

export function hasRole(user: AuthUser | null, role: string) {
  return Boolean(user?.roles.includes(role));
}

export function hasModule(user: AuthUser | null, module: OrganizationModule) {
  return Boolean(user?.roles.includes("SUPER_ADMIN") || user?.enabledModules.includes(module));
}
