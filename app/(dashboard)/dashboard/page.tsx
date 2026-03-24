"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar, Line, LineChart, CartesianGrid, Area, AreaChart } from "recharts";
import { reportsApi } from "@/features/reports/api/reports-api";
import { activityLogsApi } from "@/features/activity-logs/api/activity-logs-api";
import { usePermission } from "@/hooks/use-permission";
import { metricCardData } from "@/lib/utils/dashboard";
import { ChartCard } from "@/components/charts/chart-card";
import { MetricCard } from "@/components/cards/metric-card";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/formatters";
import { getChartColor } from "@/lib/constants/chart-colors";

export default function DashboardPage() {
  const canReadActivityLogs = usePermission("activity-logs.read");
  const summaryQuery = useQuery({ queryKey: ["reports", "summary"], queryFn: reportsApi.summary });
  const feeTrendQuery = useQuery({ queryKey: ["reports", "fees", "collection-trend"], queryFn: reportsApi.feeCollectionTrend });
  const attendanceBreakdownQuery = useQuery({
    queryKey: ["reports", "attendance", "status-breakdown"],
    queryFn: reportsApi.attendanceStatusBreakdown,
  });
  const reminderBreakdownQuery = useQuery({
    queryKey: ["reports", "reminders", "channel-breakdown"],
    queryFn: reportsApi.reminderChannelBreakdown,
  });
  const feeStatusQuery = useQuery({
    queryKey: ["reports", "fees", "status-breakdown"],
    queryFn: reportsApi.feeStatusBreakdown,
  });
  const enrollmentTrendQuery = useQuery({
    queryKey: ["reports", "students", "enrollment-trend", "dashboard"],
    queryFn: reportsApi.enrollmentTrend,
  });
  const activityLogsQuery = useQuery({
    queryKey: ["activity-logs", "dashboard"],
    queryFn: () => activityLogsApi.list({ page: 1, limit: 5, sortBy: "createdAt", sortOrder: "desc" }),
    enabled: canReadActivityLogs,
  });

  if (summaryQuery.isLoading) {
    return <LoadingState rows={6} />;
  }

  if (summaryQuery.isError || !summaryQuery.data) {
    return <ErrorState description="Dashboard summary could not be loaded from the reports API." onRetry={() => summaryQuery.refetch()} />;
  }

  const metrics = metricCardData(summaryQuery.data);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Overview"
        title="Operational dashboard"
        description="Fee collection, attendance, reminders, and recent exceptions drawn from the live backend contract."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>

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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent system pulse</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="rounded-xl bg-muted/70 p-4">
              {summaryQuery.data.totalStudents} total students currently tracked in the active tenant scope.
            </div>
            <div className="rounded-xl bg-muted/70 p-4">
              {(attendanceBreakdownQuery.data ?? []).reduce((total, entry) => total + entry.total, 0)} attendance rows contributing to today’s distribution.
            </div>
            <div className="rounded-xl bg-muted/70 p-4">
              {(reminderBreakdownQuery.data ?? []).reduce((total, entry) => total + entry.count, 0)} reminders reflected in the current analytics snapshot.
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
