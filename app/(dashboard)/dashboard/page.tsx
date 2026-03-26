"use client";
import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Banknote, CalendarDays, CircleAlert, Landmark } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar, Line, LineChart, CartesianGrid, Area, AreaChart, RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend } from "recharts";
import { reportsApi } from "@/features/reports/api/reports-api";
import { activityLogsApi } from "@/features/activity-logs/api/activity-logs-api";
import { onlineClassesApi } from "@/features/online-classes/api/online-classes-api";
import { organizationsApi } from "@/features/organizations/api/organizations-api";
import { usePermission } from "@/hooks/use-permission";
import { useAuth } from "@/providers/auth-provider";
import { metricCardData } from "@/lib/utils/dashboard";
import { ChartCard } from "@/components/charts/chart-card";
import { HeatmapGrid } from "@/components/charts/heatmap-grid";
import { MetricCard } from "@/components/cards/metric-card";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { getChartColor } from "@/lib/constants/chart-colors";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.roles.includes("SUPER_ADMIN") ?? false;
  const isTeacher = user?.roles.includes("TEACHER") ?? false;
  const canReadActivityLogs = usePermission("activity-logs.read");
  const canReadOnlineClasses = usePermission("online-classes.read");
  const summaryQuery = useQuery({ queryKey: ["reports", "summary"], queryFn: reportsApi.summary });
  const shouldLoadSecondaryCharts = Boolean(summaryQuery.data);
  const feeCollectionOverviewQuery = useQuery({
    queryKey: ["reports", "fees", "collection-overview", "dashboard"],
    queryFn: reportsApi.feeCollectionOverview,
    enabled: shouldLoadSecondaryCharts,
  });
  const feePeriodComparisonQuery = useQuery({
    queryKey: ["reports", "fees", "period-comparison", "dashboard"],
    queryFn: reportsApi.feePeriodComparison,
    enabled: shouldLoadSecondaryCharts,
  });
  const feeTrendQuery = useQuery({
    queryKey: ["reports", "fees", "collection-trend"],
    queryFn: reportsApi.feeCollectionTrend,
    enabled: shouldLoadSecondaryCharts,
  });
  const attendanceBreakdownQuery = useQuery({
    queryKey: ["reports", "attendance", "status-breakdown"],
    queryFn: reportsApi.attendanceStatusBreakdown,
    enabled: shouldLoadSecondaryCharts,
  });
  const reminderBreakdownQuery = useQuery({
    queryKey: ["reports", "reminders", "channel-breakdown"],
    queryFn: reportsApi.reminderChannelBreakdown,
    enabled: shouldLoadSecondaryCharts,
  });
  const feeStatusQuery = useQuery({
    queryKey: ["reports", "fees", "status-breakdown"],
    queryFn: reportsApi.feeStatusBreakdown,
    enabled: shouldLoadSecondaryCharts,
  });
  const enrollmentTrendQuery = useQuery({
    queryKey: ["reports", "students", "enrollment-trend", "dashboard"],
    queryFn: reportsApi.enrollmentTrend,
    enabled: shouldLoadSecondaryCharts,
  });
  const activityLogsQuery = useQuery({
    queryKey: ["activity-logs", "dashboard"],
    queryFn: () => activityLogsApi.list({ page: 1, limit: 5, sortBy: "createdAt", sortOrder: "desc" }),
    enabled: canReadActivityLogs && shouldLoadSecondaryCharts,
  });
  const onlineClassesSummaryQuery = useQuery({
    queryKey: ["online-classes", "automation-summary", "dashboard"],
    queryFn: onlineClassesApi.getAutomationSummary,
    enabled: canReadOnlineClasses && shouldLoadSecondaryCharts,
  });
  const organizationsQuery = useQuery({
    queryKey: ["organizations", "dashboard-growth"],
    queryFn: () => organizationsApi.list({ page: 1, limit: 100 }),
    enabled: isSuperAdmin && shouldLoadSecondaryCharts,
  });

  if (summaryQuery.isError) {
    return <ErrorState description="Dashboard summary could not be loaded from the reports API." onRetry={() => summaryQuery.refetch()} />;
  }

  const metrics = summaryQuery.data ? metricCardData(summaryQuery.data) : [];
  const feeOverview = feeCollectionOverviewQuery.data;
  const feeComparison = feePeriodComparisonQuery.data ?? [];
  const toTrend = (currentValue: number, previousValue: number): number | undefined => {
    if (previousValue <= 0) {
      return currentValue > 0 ? 100 : undefined;
    }

    return Math.round(((currentValue - previousValue) / previousValue) * 100);
  };
  const collectionMetrics = feeOverview
    ? [
        {
          title: "Month collected",
          value: formatCurrency(feeOverview.currentMonth.collected),
          helper: `${formatCurrency(feeOverview.currentMonth.pending)} pending this month`,
          trend: toTrend(
            feeComparison.find((item) => item.period === "MONTH")?.currentCollected ?? 0,
            feeComparison.find((item) => item.period === "MONTH")?.previousCollected ?? 0,
          ),
          icon: CalendarDays,
          tone: "sky" as const,
        },
        {
          title: "Quarter collected",
          value: formatCurrency(feeOverview.currentQuarter.collected),
          helper: `${feeOverview.currentQuarter.collectionRate}% of billed value collected`,
          trend: toTrend(
            feeComparison.find((item) => item.period === "QUARTER")?.currentCollected ?? 0,
            feeComparison.find((item) => item.period === "QUARTER")?.previousCollected ?? 0,
          ),
          icon: Landmark,
          tone: "emerald" as const,
        },
        {
          title: "Year collected",
          value: formatCurrency(feeOverview.currentYear.collected),
          helper: `${formatCurrency(feeOverview.currentYear.pending)} still open this year`,
          trend: toTrend(
            feeComparison.find((item) => item.period === "YEAR")?.currentCollected ?? 0,
            feeComparison.find((item) => item.period === "YEAR")?.previousCollected ?? 0,
          ),
          icon: Banknote,
          tone: "violet" as const,
        },
        {
          title: "Overdue amount",
          value: formatCurrency(feeOverview.currentMonth.overdue),
          helper: "Current month exposure already past due",
          icon: CircleAlert,
          tone: "rose" as const,
        },
      ]
    : [];
  const operationsRadar = useMemo(() => {
    if (!summaryQuery.data) return [];
    const reminderTotal = (reminderBreakdownQuery.data ?? []).reduce((sum, item) => sum + item.count, 0);
    const attendanceTotal = (attendanceBreakdownQuery.data ?? []).reduce((sum, item) => sum + item.total, 0);
    const collectionRate = feeOverview?.currentMonth.collectionRate ?? 0;

    return [
      { metric: "Students", value: summaryQuery.data.totalStudents },
      { metric: "Active", value: summaryQuery.data.activeStudents },
      { metric: "Attendance", value: attendanceTotal },
      { metric: "Reminders", value: reminderTotal },
      { metric: "Collection", value: collectionRate },
    ];
  }, [attendanceBreakdownQuery.data, feeOverview, reminderBreakdownQuery.data, summaryQuery.data]);
  const enrollmentHeatmap = useMemo(
    () =>
      (enrollmentTrendQuery.data ?? []).map((entry) => ({
        label: entry.month,
        value: entry.count,
        hint: `${entry.count} admissions`,
      })),
    [enrollmentTrendQuery.data],
  );
  const organizationGrowth = useMemo(() => {
    const items = organizationsQuery.data?.items ?? [];
    const byMonth = new Map<string, { month: string; organizations: number; students: number }>();
    for (const organization of items) {
      const month = new Date(organization.createdAt).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      const current = byMonth.get(month) ?? { month, organizations: 0, students: 0 };
      current.organizations += 1;
      current.students += organization.totalStudents;
      byMonth.set(month, current);
    }
    return Array.from(byMonth.values());
  }, [organizationsQuery.data]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Overview"
        title="Operational dashboard"
        description="Fee collection, pending dues, attendance, reminders, and recent operational activity drawn from the live backend contract."
      />

      {summaryQuery.isLoading || !summaryQuery.data ? (
        <LoadingState rows={4} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.title} {...metric} />
          ))}
        </div>
      )}

      {collectionMetrics.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {collectionMetrics.map((metric) => (
            <MetricCard
              key={metric.title}
              title={metric.title}
              value={metric.value}
              helper={metric.helper}
              trend={metric.trend}
              icon={metric.icon}
              tone={metric.tone}
            />
          ))}
        </div>
      ) : summaryQuery.data ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-32 rounded-3xl" />
          ))}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ChartCard title="Monthly fee collection trend" description="Directly backed by the reports API collection trend endpoint.">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={feeTrendQuery.data ?? []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <defs>
                    <linearGradient id="feeTrendStroke" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#0284c7" />
                      <stop offset="50%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                  </defs>
                  <Line type="monotone" dataKey="collected" stroke="url(#feeTrendStroke)" strokeWidth={3} dot={{ fill: "#10b981" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
        <ChartCard title="Attendance status distribution" description="Current attendance mix across fetched records.">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={(attendanceBreakdownQuery.data ?? []).map((entry) => ({ name: entry.status, value: entry.total }))} dataKey="value" nameKey="name" innerRadius={70} outerRadius={100}>
                  {(attendanceBreakdownQuery.data ?? []).map((entry, index) => (
                    <Cell key={entry.status} fill={["#0ea5e9", "#ef4444", "#f59e0b", "#10b981"][index % 4]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Operational radar" description="A fast comparative view of activity across core operational areas.">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={operationsRadar}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <Radar dataKey="value" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.35} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Enrollment heatmap" description="Month-by-month intake intensity, shown as a heatmap-style grid instead of another line chart.">
          <HeatmapGrid cells={enrollmentHeatmap} columns={Math.min(Math.max(enrollmentHeatmap.length, 1), 6)} />
        </ChartCard>
      </div>

      {isSuperAdmin ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <ChartCard title="Organization growth" description="New organizations and total student footprint across the onboarded tenant base.">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={organizationGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="organizations" stroke="#0ea5e9" fill="#0ea5e955" />
                  <Area type="monotone" dataKey="students" stroke="#10b981" fill="#10b98133" />
                  <Legend />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
          <ChartCard title="Top tenant student bases" description="Largest organizations by current student footprint.">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={(organizationsQuery.data?.items ?? [])
                    .slice()
                    .sort((left, right) => right.totalStudents - left.totalStudents)
                    .slice(0, 8)
                    .map((item) => ({ name: item.name, students: item.totalStudents }))}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={110} />
                  <Tooltip />
                  <Bar dataKey="students" radius={[0, 10, 10, 0]}>
                    {(organizationsQuery.data?.items ?? [])
                      .slice()
                      .sort((left, right) => right.totalStudents - left.totalStudents)
                      .slice(0, 8)
                      .map((item, index) => <Cell key={item.id} fill={getChartColor(index)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <ChartCard title="Reminder channel activity" description="Recent reminder volume by channel.">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reminderBreakdownQuery.data ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="channel" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {(reminderBreakdownQuery.data ?? []).map((entry, index) => (
                    <Cell key={entry.channel} fill={getChartColor(index)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Enrollment trend" description="Monthly admissions trend from reports.">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={enrollmentTrendQuery.data ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <defs>
                  <linearGradient id="enrollmentFill" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.65} />
                    <stop offset="50%" stopColor="#0ea5e9" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.15} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="count" stroke="#10b981" fill="url(#enrollmentFill)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Fee status breakdown" description="Paid, overdue, pending, partial, and waived records.">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={feeStatusQuery.data ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                  {(feeStatusQuery.data ?? []).map((entry, index) => (
                    <Cell key={entry.status} fill={getChartColor(index)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {canReadOnlineClasses ? (
        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>{isTeacher ? "My upcoming online classes" : "Upcoming online classes"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {onlineClassesSummaryQuery.data?.upcomingSessions.length ? (
                onlineClassesSummaryQuery.data.upcomingSessions.map((session) => (
                  <div key={session.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4">
                    <div>
                      <p className="font-medium">{session.subjectName} · {session.batchName}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(session.scheduledStartAt, "MMM d, yyyy p")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isTeacher ? `${session.provider}` : `${session.teacherName ?? "Teacher pending"} · ${session.provider}`}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {session.meetingUrl ? (
                        <Button size="sm" variant="outline" asChild>
                          <a href={session.meetingUrl} target="_blank" rel="noreferrer">Open class</a>
                        </Button>
                      ) : null}
                      <Button size="sm" asChild>
                        <Link href="/online-classes">Open module</Link>
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  {isTeacher ? "No online classes are assigned to you yet." : "No upcoming online classes are scheduled yet."}
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Online class health</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="rounded-2xl border p-4">
                <p className="font-medium">Last automation run</p>
                <p className="mt-1 text-muted-foreground">
                  {onlineClassesSummaryQuery.data?.lastRun
                    ? `${onlineClassesSummaryQuery.data.lastRun.status} · ${formatDate(onlineClassesSummaryQuery.data.lastRun.startedAt, "MMM d, yyyy p")}`
                    : "No run recorded yet"}
                </p>
              </div>
              <div className="rounded-2xl border p-4">
                <p className="font-medium">Failed sync sessions</p>
                <p className="mt-1 text-muted-foreground">{onlineClassesSummaryQuery.data?.failedSessionsCount ?? 0}</p>
              </div>
              <div className="rounded-2xl border p-4">
                <p className="font-medium">Pending attendance sessions</p>
                <p className="mt-1 text-muted-foreground">{onlineClassesSummaryQuery.data?.pendingAttendanceCount ?? 0}</p>
              </div>
              <Button className="w-full" variant="outline" asChild>
                <Link href="/online-classes">Review online classes</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {feeOverview ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <ChartCard
            title="Collection performance snapshot"
            description="Current month, quarter, and year billed totals compared against collected and pending amounts."
          >
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    {
                      period: "Month",
                      billed: feeOverview.currentMonth.billed,
                      collected: feeOverview.currentMonth.collected,
                      pending: feeOverview.currentMonth.pending,
                    },
                    {
                      period: "Quarter",
                      billed: feeOverview.currentQuarter.billed,
                      collected: feeOverview.currentQuarter.collected,
                      pending: feeOverview.currentQuarter.pending,
                    },
                    {
                      period: "Year",
                      billed: feeOverview.currentYear.billed,
                      collected: feeOverview.currentYear.collected,
                      pending: feeOverview.currentYear.pending,
                    },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="billed" fill="#cbd5e1" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="collected" fill="#10b981" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="pending" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
          <ChartCard
            title="Collection vs previous period"
            description="Current period collection compared against the previous month, quarter, and year."
          >
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={feeComparison.map((item) => ({
                    period: item.period === "MONTH" ? "Month" : item.period === "QUARTER" ? "Quarter" : "Year",
                    currentCollected: item.currentCollected,
                    previousCollected: item.previousCollected,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="currentCollected" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="previousCollected" fill="#94a3b8" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Finance pulse</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="rounded-xl bg-muted/70 p-4">
              {summaryQuery.data?.totalStudents ?? 0} total students currently tracked in the active tenant scope.
            </div>
            <div className="rounded-xl bg-muted/70 p-4">
              {feeOverview
                ? `${formatCurrency(feeOverview.currentMonth.collected)} collected against ${formatCurrency(feeOverview.currentMonth.billed)} billed this month.`
                : `${(attendanceBreakdownQuery.data ?? []).reduce((total, entry) => total + entry.total, 0)} attendance rows contributing to today’s distribution.`}
            </div>
            <div className="rounded-xl bg-muted/70 p-4">
              {feeOverview
                ? `${formatCurrency(feeOverview.currentYear.pending)} still pending this year, with ${formatCurrency(feeOverview.currentMonth.overdue)} already overdue for the current month.`
                : `${(reminderBreakdownQuery.data ?? []).reduce((total, entry) => total + entry.count, 0)} reminders reflected in the current analytics snapshot.`}
            </div>
          </CardContent>
        </Card>
        {canReadActivityLogs ? (
          <Card>
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {(activityLogsQuery.data?.items ?? []).slice(0, 5).map((log) => (
                <div key={log.id} className="rounded-xl bg-muted/70 p-4">
                  <p className="font-medium">
                    {log.actorUser ? `${log.actorUser.firstName} ${log.actorUser.lastName}` : "System"} · {log.module} · {log.action}
                  </p>
                  <p className="text-muted-foreground">{formatDate(log.createdAt)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
