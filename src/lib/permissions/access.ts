import type { AuthUser, OrganizationModule } from "@/types/auth";
import { ONLINE_CLASSES_ENABLED } from "@/lib/constants/features";

function isOnlineClassesPermission(permission: string) {
  return permission.startsWith("online-classes.");
}

export function hasPermission(user: AuthUser | null, permission: string) {
  if (isOnlineClassesPermission(permission) && !ONLINE_CLASSES_ENABLED) {
    return false;
  }

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
