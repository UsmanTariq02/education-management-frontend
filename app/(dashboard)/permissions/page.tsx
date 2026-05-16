"use client";

import { useQuery } from "@tanstack/react-query";
import { rolesApi } from "@/features/roles/api/roles-api";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/providers/auth-provider";

export default function PermissionsPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.roles.includes("SUPER_ADMIN") ?? false;
  const query = useQuery({ queryKey: ["permissions"], queryFn: rolesApi.permissions, enabled: isSuperAdmin });

  if (!isSuperAdmin) {
    return <ErrorState title="Access restricted" description="Only the super admin can review the full permissions catalogue." />;
  }

  if (query.isLoading) return <LoadingState rows={6} />;
  if (query.isError || !query.data) {
    return <ErrorState description="Permissions could not be loaded." onRetry={() => query.refetch()} />;
  }

  const grouped = query.data.reduce<Record<string, typeof query.data>>((acc, permission) => {
    const module = permission.name.split(".")[0] ?? "general";
    acc[module] = [...(acc[module] ?? []), permission];
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Authorization"
        title="Permissions catalogue"
        description="Grouped by module to support role design, page access, and action visibility."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        {Object.entries(grouped).map(([module, permissions]) => (
          <Card key={module} className="border-border/70 bg-card/85 shadow-sm backdrop-blur">
            <CardHeader>
              <CardTitle className="capitalize">{module}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {permissions.map((permission) => (
                <Badge key={permission.id} variant="outline">
                  {permission.name}
                </Badge>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
