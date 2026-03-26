"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Bell, CircleAlert, Video } from "lucide-react";
import { MetricCard } from "@/components/cards/metric-card";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { onlineClassesApi } from "@/features/online-classes/api/online-classes-api";
import { formatDate } from "@/lib/formatters";

export default function AlertsPage() {
  const alertsQuery = useQuery({
    queryKey: ["online-classes", "alerts", "page"],
    queryFn: onlineClassesApi.getAlerts,
  });

  if (alertsQuery.isLoading) {
    return <LoadingState rows={6} />;
  }

  if (alertsQuery.isError || !alertsQuery.data) {
    return <ErrorState description="Alerts could not be loaded." onRetry={() => alertsQuery.refetch()} />;
  }

  const alerts = alertsQuery.data;
  const high = alerts.filter((alert) => alert.severity === "HIGH").length;
  const medium = alerts.filter((alert) => alert.severity === "MEDIUM").length;
  const low = alerts.filter((alert) => alert.severity === "LOW").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Monitoring"
        title="Alerts"
        description="Current online-class risks including failed syncs, pending attendance, and classes starting soon."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Active alerts" value={String(alerts.length)} helper="Current online-class notifications" icon={Bell} tone="sky" />
        <MetricCard title="High severity" value={String(high)} helper="Immediate action recommended" icon={CircleAlert} tone={high ? "rose" : "emerald"} />
        <MetricCard title="Medium severity" value={String(medium)} helper="Operational follow-up needed" icon={Video} tone={medium ? "amber" : "emerald"} />
        <MetricCard title="Low severity" value={String(low)} helper="Heads-up items for staff and teachers" icon={Bell} tone="violet" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Alert feed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {alerts.length ? (
            alerts.map((alert) => (
              <div key={alert.id} className="rounded-2xl border p-4">
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
            <p className="text-sm text-muted-foreground">No active alerts right now.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
