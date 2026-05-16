"use client";

import { Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/providers/auth-provider";
import { getAiAccessLabel, hasAiAccess } from "@/lib/ai/access";

interface OrganizationScopeBannerProps {
  moduleLabel: string;
}

export function OrganizationScopeBanner({ moduleLabel }: OrganizationScopeBannerProps) {
  const { user } = useAuth();
  const hasTenantContext = Boolean(user?.organizationId);
  const aiReady = hasAiAccess(user);
  const aiLabel = getAiAccessLabel(user);

  return (
    <Card className={hasTenantContext ? "border-primary/20 bg-primary/5" : "border-amber-500/30 bg-amber-50"}>
      <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className={hasTenantContext ? "rounded-xl bg-primary/10 p-2 text-primary" : "rounded-xl bg-amber-100 p-2 text-amber-700"}>
            <Building2 className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {hasTenantContext ? `${moduleLabel} is scoped to ${user?.organizationName}.` : `${moduleLabel} requires an organization-scoped session.`}
            </p>
            <p className="text-xs text-muted-foreground">
              {hasTenantContext
                ? "All records and actions on this screen are limited to the logged-in user's organization."
                : "Super admin platform sessions can review cross-organization data, but tenant-owned create actions must be performed within an organization context."}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{user?.organizationName ?? "Platform scope"}</Badge>
          {hasTenantContext ? <Badge variant={aiReady ? "success" : "warning"}>{aiReady ? aiLabel : "AI key missing"}</Badge> : null}
        </div>
      </CardContent>
    </Card>
  );
}
