"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, CircleAlert, Video } from "lucide-react";
import { MetricCard } from "@/components/cards/metric-card";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { activityLogsApi } from "@/features/activity-logs/api/activity-logs-api";
import { onlineClassesApi } from "@/features/online-classes/api/online-classes-api";
import { organizationsApi } from "@/features/organizations/api/organizations-api";
import { useAuth } from "@/providers/auth-provider";
import { usePermission } from "@/hooks/use-permission";
import { hasModule } from "@/lib/permissions/access";
import { formatDate } from "@/lib/formatters";

export default function AlertsPage() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<"all" | "online" | "security" | "billing">("all");
  const canReadOnlineClasses = usePermission("online-classes.read");
  const canReadActivityLogs = usePermission("activity-logs.read");
  const canViewTenantSettings = Boolean(user?.roles.includes("ADMIN")) && hasModule(user, "SETTINGS");
  const alertsQuery = useQuery({
    queryKey: ["online-classes", "alerts", "page"],
    queryFn: onlineClassesApi.getAlerts,
    enabled: canReadOnlineClasses,
  });
  const tenantHealthQuery = useQuery({
    queryKey: ["organization-settings", "alerts-page"],
    queryFn: organizationsApi.currentSettings,
    enabled: canViewTenantSettings,
  });
  const securityEventsQuery = useQuery({
    queryKey: ["activity-logs", "alerts-page", "auth"],
    queryFn: () => activityLogsApi.list({ page: 1, limit: 10, module: "auth", sortBy: "createdAt", sortOrder: "desc" }),
    enabled: canReadActivityLogs,
  });

  const alerts = alertsQuery.data ?? [];
  const tenantHealth = tenantHealthQuery.data ?? null;
  const securityLogs = securityEventsQuery.data?.items ?? [];
  const securityNotifications = useMemo(
    () => securityLogs.filter((entry) => ["login-failed", "session-revoked", "logout", "refresh"].includes(entry.action)),
    [securityLogs],
  );
  const high = alerts.filter((alert) => alert.severity === "HIGH").length;
  const medium = alerts.filter((alert) => alert.severity === "MEDIUM").length;
  const tenantHealthState = tenantHealth
    ? (() => {
        const trialExpired =
          tenantHealth.subscriptionStatus === "TRIAL" &&
          tenantHealth.trialEndsAt !== null &&
          new Date(tenantHealth.trialEndsAt).getTime() <= Date.now();
        const trialExpiringSoon =
          tenantHealth.subscriptionStatus === "TRIAL" &&
          tenantHealth.trialEndsAt !== null &&
          !trialExpired &&
          new Date(tenantHealth.trialEndsAt).getTime() - Date.now() <= 7 * 24 * 60 * 60 * 1000;

        if (!trialExpired && !trialExpiringSoon && tenantHealth.subscriptionStatus === "ACTIVE") {
          return null;
        }

        return {
          label: trialExpired
            ? "Trial expired"
            : trialExpiringSoon
              ? "Trial ending soon"
              : tenantHealth.subscriptionStatus.replaceAll("_", " "),
          description: trialExpired
            ? "This tenant is past its trial window and needs billing action."
            : trialExpiringSoon
              ? `Trial ends on ${formatDate(tenantHealth.trialEndsAt as string, "MMM d, yyyy")}.`
              : "Billing needs attention before access is affected.",
          variant:
            trialExpired ||
            tenantHealth.subscriptionStatus === "PAST_DUE" ||
            tenantHealth.subscriptionStatus === "SUSPENDED"
              ? ("danger" as const)
              : ("warning" as const),
        };
      })()
    : null;
  const billingNotifications = tenantHealthState ? [tenantHealthState] : [];
  const onlineClassAlerts = useMemo(() => alerts.filter((alert) => alert.sessionId), [alerts]);
  const activeCounts = {
    online: onlineClassAlerts.length,
    security: securityNotifications.length,
    billing: billingNotifications.length,
  };

  if (alertsQuery.isLoading || tenantHealthQuery.isLoading || securityEventsQuery.isLoading) {
    return <LoadingState rows={6} />;
  }

  if (alertsQuery.isError || tenantHealthQuery.isError || securityEventsQuery.isError) {
    return (
      <ErrorState
        description="Alerts could not be loaded."
        onRetry={() => {
          void alertsQuery.refetch();
          void tenantHealthQuery.refetch();
          void securityEventsQuery.refetch();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Monitoring"
        title="Notification center"
        description="Tenant health, security events, and online-class risks in one operational inbox."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Online alerts" value={String(alerts.length)} helper="Current online-class notifications" icon={Bell} tone="sky" />
        <MetricCard title="Security events" value={String(securityNotifications.length)} helper="Recent auth-related events" icon={CircleAlert} tone={securityNotifications.length ? "rose" : "emerald"} />
        <MetricCard title="High severity" value={String(high)} helper="Immediate action recommended" icon={CircleAlert} tone={high ? "rose" : "emerald"} />
        <MetricCard title="Medium severity" value={String(medium)} helper="Operational follow-up needed" icon={Video} tone={medium ? "amber" : "emerald"} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.75rem] border border-border/70 bg-card/85 px-4 py-3 text-sm shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { key: "all", label: "All" },
            { key: "online", label: `Online class (${activeCounts.online})` },
            { key: "security", label: `Security (${activeCounts.security})` },
            { key: "billing", label: `Billing (${activeCounts.billing})` },
          ].map((item) => (
            <Button
              key={item.key}
              type="button"
              size="sm"
              variant={activeFilter === item.key ? "default" : "outline"}
              onClick={() => setActiveFilter(item.key as typeof activeFilter)}
            >
              {item.label}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/activity-logs">Open activity logs</Link>
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setActiveFilter("all")}>
            Show all
          </Button>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/70 bg-muted/20">
          <CardHeader>
            <CardTitle>Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-3xl font-semibold tracking-tight">{securityNotifications.length}</p>
            <p className="text-sm text-muted-foreground">Recent auth-related events and account changes.</p>
          </CardContent>
        </Card>
        <Card className="border-border/70 bg-muted/20">
          <CardHeader>
            <CardTitle>Billing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-3xl font-semibold tracking-tight">{billingNotifications.length}</p>
            <p className="text-sm text-muted-foreground">Trial expiry and subscription state changes.</p>
          </CardContent>
        </Card>
        <Card className="border-border/70 bg-muted/20">
          <CardHeader>
            <CardTitle>Online classes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-3xl font-semibold tracking-tight">{alerts.length}</p>
            <p className="text-sm text-muted-foreground">Live class warnings and scheduling alerts.</p>
          </CardContent>
        </Card>
      </div>
      {tenantHealthState ? (
        <Card className={tenantHealthState.variant === "danger" ? "border-rose-200 bg-rose-50/70" : "border-amber-200 bg-amber-50/70"}>
          <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
            <div className="space-y-1">
              <Badge variant={tenantHealthState.variant}>{tenantHealthState.label}</Badge>
              <p className="text-sm text-muted-foreground">{tenantHealthState.description}</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/settings">Open settings</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>{activeFilter === "security" ? "Security notifications" : activeFilter === "billing" ? "Billing notifications" : "Inbox items"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeFilter === "billing" ? (
            billingNotifications.length ? (
              billingNotifications.map((item) => (
                <div key={item.label} className="rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{item.label}</p>
                        <Badge variant={item.variant}>{item.label}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/settings">Open settings</Link>
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No billing notifications right now.</p>
            )
          ) : activeFilter === "security" ? (
            securityNotifications.length ? (
              securityNotifications.map((entry) => {
                const severity = entry.action === "login-failed" || entry.action === "session-revoked" ? "danger" : "warning";
                return (
                  <div key={entry.id} className="rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{entry.action.replaceAll("-", " ")}</p>
                          <Badge variant={severity}>{entry.module}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {entry.actorUser ? `${entry.actorUser.firstName} ${entry.actorUser.lastName}` : "System"} · {entry.actorUser?.email ?? "No actor"}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">{formatDate(entry.createdAt, "MMM d, yyyy p")}</p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/activity-logs">Review logs</Link>
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">No security notifications right now.</p>
            )
          ) : (activeFilter === "online" ? onlineClassAlerts : alerts).length ? (
            (activeFilter === "online" ? onlineClassAlerts : alerts).map((alert) => (
              <div key={alert.id} className="rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{alert.title}</p>
                      <Badge variant={alert.severity === "HIGH" ? "danger" : alert.severity === "MEDIUM" ? "warning" : "outline"}>
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{alert.description}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {alert.scheduledAt ? formatDate(alert.scheduledAt, "MMM d, yyyy p") : "No schedule"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {alert.sessionId ? (
                      <Button size="sm" variant="outline" asChild>
                        <Link href="/online-classes">Open online classes</Link>
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No notifications match the current filter.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
