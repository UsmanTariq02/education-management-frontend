"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, ClipboardList, Download, Sparkles } from "lucide-react";
import Link from "next/link";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { aiApi } from "@/features/ai/api/ai-api";
import { organizationsApi } from "@/features/organizations/api/organizations-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartCard } from "@/components/charts/chart-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrganizationScopeBanner } from "@/components/shared/organization-scope-banner";
import { useAuth } from "@/providers/auth-provider";
import { getAiAccessLabel } from "@/lib/ai/access";
import { ErrorState } from "@/components/feedback/error-state";
import { getChartColor } from "@/lib/constants/chart-colors";

export default function AiAdminPage() {
  const { user } = useAuth();
  const isSuperAdmin = Boolean(user?.roles?.includes("SUPER_ADMIN"));
  const organizationsQuery = useQuery({
    queryKey: ["ai-admin-organizations"],
    queryFn: () => organizationsApi.list({ page: 1, limit: 100 }),
    enabled: isSuperAdmin,
  });
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | undefined>(user?.organizationId ?? undefined);

  useEffect(() => {
    if (user?.organizationId) {
      setSelectedOrganizationId(user.organizationId);
      return;
    }

    if (!selectedOrganizationId) {
      const firstOrganization = organizationsQuery.data?.items?.[0];
      if (firstOrganization) {
        setSelectedOrganizationId(firstOrganization.id);
      }
    }
  }, [organizationsQuery.data?.items, selectedOrganizationId, user?.organizationId]);

  const selectedOrganization = useMemo(
    () => organizationsQuery.data?.items?.find((item) => item.id === selectedOrganizationId) ?? null,
    [organizationsQuery.data?.items, selectedOrganizationId],
  );

  const queueSummaryQuery = useQuery({
    queryKey: ["ai-admin-queue-summary", selectedOrganizationId],
    queryFn: () => aiApi.organizationQueueSummary(selectedOrganizationId),
    enabled: Boolean(selectedOrganizationId),
  });
  const usageQuery = useQuery({
    queryKey: ["ai-admin-usage", selectedOrganizationId],
    queryFn: () => aiApi.getUsage(selectedOrganizationId),
    enabled: Boolean(selectedOrganizationId),
  });
  const queueTrendQuery = useQuery({
    queryKey: ["ai-admin-queue-trend", selectedOrganizationId],
    queryFn: () => aiApi.organizationQueueTrend(selectedOrganizationId),
    enabled: Boolean(selectedOrganizationId),
  });
  const noticeAnalyticsQuery = useQuery({
    queryKey: ["ai-admin-notice-analytics", selectedOrganizationId],
    queryFn: () => aiApi.noticeCampaignAnalytics(selectedOrganizationId),
    enabled: Boolean(selectedOrganizationId),
  });
  const deliveryAnalyticsQuery = useQuery({
    queryKey: ["ai-admin-delivery-analytics", selectedOrganizationId],
    queryFn: () => aiApi.announcementDeliveryAnalytics(selectedOrganizationId),
    enabled: Boolean(selectedOrganizationId),
  });

  const exportSnapshot = () => {
    if (!selectedOrganizationId) {
      return;
    }

    const snapshot = {
      organizationId: selectedOrganizationId,
      organizationName: selectedOrganization?.name ?? null,
      capturedAt: new Date().toISOString(),
      queueSummary: queueSummaryQuery.data ?? null,
      usageSummary: usageQuery.data ?? null,
      noticeAnalytics: noticeAnalyticsQuery.data ?? null,
      deliveryAnalytics: deliveryAnalyticsQuery.data ?? null,
    };

    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `ai-admin-snapshot-${selectedOrganizationId}-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (!isSuperAdmin) {
    return <ErrorState description="This page is available to super admins only." />;
  }

  const organizationLabel = selectedOrganization ? `${selectedOrganization.name} · ${getAiAccessLabel(selectedOrganization)}` : "Choose organization";

  return (
    <div className="space-y-6">
      <OrganizationScopeBanner moduleLabel="AI Admin" />
      <Card className="overflow-hidden border-border/70 bg-card/85 shadow-sm backdrop-blur">
        <CardHeader className="space-y-3 border-b bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_45%,#10b981_100%)] text-white">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">Platform oversight</Badge>
              <CardTitle className="text-3xl tracking-tight">AI admin overview</CardTitle>
              <CardDescription className="max-w-2xl text-white/75">
                Monitor AI usage, review queue pressure, and notice health across the selected organization.
              </CardDescription>
            </div>
            <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">
              <Sparkles className="mr-2 h-4 w-4" />
              Super admin
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/80 p-4 shadow-sm">
            <div className="space-y-1">
              <p className="text-sm font-medium">Organization</p>
              <p className="text-xs text-muted-foreground">{organizationLabel}</p>
            </div>
            <div className="flex min-w-[280px] flex-1 items-center gap-3 md:flex-none">
              <Select value={selectedOrganizationId} onValueChange={setSelectedOrganizationId}>
                <SelectTrigger>
                  <SelectValue placeholder={organizationsQuery.isLoading ? "Loading organizations..." : "Choose organization"} />
                </SelectTrigger>
                <SelectContent>
                  {organizationsQuery.data?.items?.map((organization) => (
                    <SelectItem key={organization.id} value={organization.id}>
                      {organization.name} · {getAiAccessLabel(organization)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" onClick={exportSnapshot} disabled={!selectedOrganizationId}>
                <Download className="mr-2 h-4 w-4" />
                Export snapshot
              </Button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Stat label="Queue items" value={queueSummaryQuery.data?.totalItems ?? 0} />
            <Stat label="Waiting review" value={queueSummaryQuery.data?.draftItems ?? 0} />
            <Stat label="AI requests" value={usageQuery.data?.todayCount ?? 0} />
            <Stat label="Notice campaigns" value={noticeAnalyticsQuery.data?.totalCampaigns ?? 0} />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Panel title="Queue breakdown" description="Where drafts and approvals are concentrated.">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Approved {queueSummaryQuery.data?.approvedItems ?? 0}</Badge>
                <Badge variant="outline">Archived {queueSummaryQuery.data?.archivedItems ?? 0}</Badge>
                {queueSummaryQuery.data?.kindBreakdown.map((item) => (
                  <Badge key={item.kind} variant="outline">
                    {item.kind} {item.count}
                  </Badge>
                )) ?? null}
              </div>
              <div className="space-y-2">
                {queueSummaryQuery.data?.userBreakdown.length ? (
                  queueSummaryQuery.data.userBreakdown.slice(0, 5).map((item) => (
                  <div key={item.userId} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/70 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">
                        {item.firstName} {item.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">{item.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{item.count}</p>
                      <p className="text-[11px] text-muted-foreground">{item.latestUpdatedAt ? new Date(item.latestUpdatedAt).toLocaleDateString() : "No updates"}</p>
                    </div>
                  </div>
                  ))
                ) : (
                  <EmptyHint label="No queue items yet." />
                )}
              </div>
            </Panel>

            <Panel title="Usage and notices" description="Operational signals for AI and announcements.">
              <div className="grid gap-3 md:grid-cols-2">
                <MiniStat label="Month" value={usageQuery.data?.monthCount ?? 0} />
                <MiniStat label="Trial left" value={usageQuery.data?.trialRemaining ?? 0} />
                <MiniStat label="Pinned notices" value={deliveryAnalyticsQuery.data?.pinnedAnnouncements ?? 0} />
                <MiniStat label="Published notices" value={deliveryAnalyticsQuery.data?.publishedAnnouncements ?? 0} />
              </div>
              <div className="rounded-xl border border-border/60 bg-background/70 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Quick links</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/ai">
                      <Sparkles className="mr-2 h-4 w-4" />
                      Open AI Lab
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/ai/queue">
                      <ClipboardList className="mr-2 h-4 w-4" />
                      Open Queue
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/reports">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Reports
                    </Link>
                  </Button>
                </div>
              </div>
            </Panel>
          </div>

          <ChartCard title="Queue activity trend" description="The last 14 days of queue creation and update activity for this organization.">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={queueTrendQuery.data ?? []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(value) => value.slice(5)} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="createdCount" stroke={getChartColor(0)} fill={getChartColor(0)} fillOpacity={0.2} />
                  <Area type="monotone" dataKey="updatedCount" stroke={getChartColor(1)} fill={getChartColor(1)} fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/80 p-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}

function Panel({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div className="space-y-4 rounded-3xl border border-border/70 bg-background/75 p-5 shadow-sm">
      <div className="space-y-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function EmptyHint({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
      {label}
    </div>
  );
}
