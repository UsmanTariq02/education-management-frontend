"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Pie, PieChart, Cell, ResponsiveContainer, RadialBarChart, RadialBar, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { BellRing, CalendarCheck2, CreditCard, GraduationCap, LogOut } from "lucide-react";
import { portalApi } from "@/features/portal/api/portal-api";
import { usePortalAuth } from "@/providers/portal-auth-provider";
import { MetricCard } from "@/components/cards/metric-card";
import { ChartCard } from "@/components/charts/chart-card";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { getChartColor } from "@/lib/constants/chart-colors";

export function PortalDashboard({ variant }: { variant: "student" | "parent" }) {
  const { user, logout } = usePortalAuth();
  const query = useQuery({
    queryKey: ["portal-dashboard", user?.accountId],
    queryFn: portalApi.dashboard,
    enabled: Boolean(user?.accountId),
  });

  const attendanceChart = useMemo(
    () => query.data?.attendanceSummary.breakdown.map((item, index) => ({ ...item, fill: getChartColor(index) })) ?? [],
    [query.data],
  );

  const resultChart = useMemo(
    () =>
      query.data?.academicSummary.recentResults.slice(0, 5).map((item, index) => ({
        name: item.examName,
        percentage: item.percentage,
        fill: getChartColor(index),
      })) ?? [],
    [query.data],
  );

  if (query.isLoading) {
    return <LoadingState rows={6} />;
  }

  if (query.isError || !query.data || !user) {
    return <ErrorState description="Portal dashboard could not be loaded." />;
  }

  const { student, feeSummary, attendanceSummary, reminderSummary, academicSummary } = query.data;
  const audienceLabel = variant === "parent" ? "Parent portal" : "Student portal";
  const guideHref = variant === "parent" ? "/portal/parent/guide" : "/portal/student/guide";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-3xl border bg-card p-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">{audienceLabel}</p>
          <h1 className="text-3xl font-semibold tracking-tight">{student.fullName}</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {variant === "parent"
              ? `Track ${student.fullName}'s fees, attendance, reminders, and published academic progress from one guardian view.`
              : "Track your attendance, dues, timetable, reminders, and published results from one student workspace."}
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{student.organizationName}</Badge>
            {student.batches.map((batch) => (
              <Badge key={batch.id} variant="secondary">
                {batch.name}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href={guideHref}>How to use this portal</Link>
          </Button>
          <Button variant="outline" onClick={() => logout()}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Pending dues" value={formatCurrency(feeSummary.pendingAmount)} helper={`${feeSummary.overdueCount} overdue fee cycles`} icon={CreditCard} tone={feeSummary.pendingAmount > 0 ? "amber" : "emerald"} />
        <MetricCard title="Attendance rate" value={`${attendanceSummary.attendanceRate}%`} helper={`${attendanceSummary.totalEntries} attendance entries`} icon={CalendarCheck2} tone={attendanceSummary.attendanceRate >= 75 ? "sky" : "rose"} />
        <MetricCard title="Published results" value={String(academicSummary.publishedResults)} helper={academicSummary.latestGrade ? `Latest grade ${academicSummary.latestGrade}` : "No published results yet"} icon={GraduationCap} tone="violet" />
        <MetricCard title="Reminders" value={String(reminderSummary.total)} helper={`${reminderSummary.sent} delivered · ${reminderSummary.failed} failed`} icon={BellRing} tone="amber" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <ChartCard title="Fee progress" description="Collected versus pending fee position.">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                innerRadius="45%"
                outerRadius="95%"
                data={[
                  {
                    name: "Collected",
                    value: feeSummary.totalDue ? Math.round((feeSummary.totalPaid / feeSummary.totalDue) * 100) : 0,
                    fill: getChartColor(1),
                  },
                ]}
              >
                <RadialBar dataKey="value" cornerRadius={16} background />
                <Tooltip formatter={(value) => [`${value}%`, "Collected"]} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Attendance mix" description="Presence pattern across recent attendance records.">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={attendanceChart} dataKey="total" nameKey="status" outerRadius={110}>
                  {attendanceChart.map((entry) => (
                    <Cell key={entry.status} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <Card>
          <CardHeader>
            <CardTitle>Portal profile</CardTitle>
            <CardDescription>Linked student and guardian contact information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <SummaryRow label="Student email" value={student.email ?? "Not provided"} />
            <SummaryRow label="Student phone" value={student.phone} />
            <SummaryRow label="Guardian" value={student.guardianName} />
            <SummaryRow label="Guardian email" value={student.guardianEmail ?? "Not provided"} />
            <SummaryRow label="Guardian phone" value={student.guardianPhone} />
            <SummaryRow label="Status" value={student.status} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Recent result performance" description="Latest published exam percentages.">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resultChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => [`${value}%`, "Score"]} />
                <Bar dataKey="percentage" radius={[10, 10, 0, 0]}>
                  {resultChart.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <Card>
          <CardHeader>
            <CardTitle>Weekly timetable</CardTitle>
            <CardDescription>Current active timetable entries for linked batches.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {academicSummary.timetable.length ? (
              academicSummary.timetable.slice(0, 8).map((entry) => (
                <div key={entry.id} className="rounded-2xl border p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{entry.subjectName}</p>
                      <p className="text-muted-foreground">
                        {entry.dayOfWeek} · {entry.startTime} - {entry.endTime}
                      </p>
                    </div>
                    <div className="text-right text-muted-foreground">
                      <p>{entry.batchName}</p>
                      <p>{entry.teacherName ?? "Teacher pending"}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No timetable has been published yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Recent fee records</CardTitle>
            <CardDescription>Latest billed cycles and payment progress.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {feeSummary.recentRecords.length ? (
              feeSummary.recentRecords.slice(0, 6).map((item) => (
                <div key={item.id} className="rounded-2xl border p-4 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {item.month}/{item.year}
                      </p>
                      <p className="text-muted-foreground">
                        Due {formatCurrency(item.amountDue)} · Paid {formatCurrency(item.amountPaid)}
                      </p>
                    </div>
                    <Badge variant={item.status === "PAID" ? "success" : "warning"}>{item.status}</Badge>
                  </div>
                  <p className="mt-2 text-muted-foreground">
                    {item.paidAt ? `Last payment on ${formatDate(item.paidAt)}` : "Payment still pending"}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No fee records are available yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent reminders</CardTitle>
            <CardDescription>Communication activity related to this student.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {reminderSummary.recentRecords.length ? (
              reminderSummary.recentRecords.map((item) => (
                <div key={item.id} className="rounded-2xl border p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline">{item.channel}</Badge>
                    <Badge variant={item.status === "SENT" ? "success" : "warning"}>{item.status}</Badge>
                  </div>
                  <p className="mt-2 line-clamp-3 text-muted-foreground">{item.message}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{formatDate(item.createdAt, "MMM d, yyyy p")}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No reminders have been logged yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border px-4 py-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
