"use client";

import { useAuth } from "@/providers/auth-provider";
import { hasAnyPermission } from "@/lib/permissions/access";

interface PermissionGateProps {
  permissions: string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGate({ permissions, fallback = null, children }: PermissionGateProps) {
  const { user } = useAuth();

  if (!hasAnyPermission(user, permissions)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
