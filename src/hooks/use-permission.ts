"use client";

import { useAuth } from "@/providers/auth-provider";
import { hasAnyPermission, hasPermission, hasRole } from "@/lib/permissions/access";

export function usePermission(permission: string) {
  const { user } = useAuth();
  return hasPermission(user, permission);
}

export function useAnyPermission(permissions: string[]) {
  const { user } = useAuth();
  return hasAnyPermission(user, permissions);
}

export function useRole(role: string) {
  const { user } = useAuth();
  return hasRole(user, role);
}
