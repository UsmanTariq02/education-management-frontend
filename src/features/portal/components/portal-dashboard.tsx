"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Pie, PieChart, Cell, ResponsiveContainer, RadialBarChart, RadialBar, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { BellRing, CalendarCheck2, CreditCard, FileQuestion, GraduationCap, LogOut, ScrollText, ClipboardList, MessageSquareMore, FolderOpen, ShieldCheck, Megaphone, ReceiptText, Trophy, Medal, Sparkles, Target, TrendingUp } from "lucide-react";
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
  const activityFeedQuery = useQuery({
    queryKey: ["portal-activity-feed-preview", user?.accountId],
    queryFn: portalApi.activityFeed,
    enabled: Boolean(user?.accountId),
  });
  const reportCardQuery = useQuery({
    queryKey: ["portal-report-card-preview", user?.accountId],
    queryFn: portalApi.reportCard,
    enabled: Boolean(user?.accountId),
  });
  const acknowledgementQuery = useQuery({
    queryKey: ["portal-acknowledgements-preview", user?.accountId],
    queryFn: portalApi.acknowledgements,
    enabled: Boolean(user?.accountId),
  });
  const announcementsQuery = useQuery({
    queryKey: ["portal-announcements-preview", user?.accountId],
    queryFn: portalApi.announcements,
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
  const achievement = getPortalAchievement({
    grade: academicSummary.latestGrade,
    percentage: academicSummary.latestPercentage,
    attendanceRate: attendanceSummary.attendanceRate,
    variant,
    studentName: student.fullName,
  });

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[2rem] border bg-slate-950 p-6 text-slate-50 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.85)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.24),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.18),_transparent_26%)]" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">{audienceLabel}</p>
            <h1 className="text-3xl font-semibold tracking-tight">{student.fullName}</h1>
            <p className="max-w-2xl text-sm text-slate-300">
              {variant === "parent"
                ? `Track ${student.fullName}'s fees, attendance, reminders, and published academic progress from one guardian view.`
                : "Track your attendance, dues, timetable, reminders, and published results from one student workspace."}
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge className="border-sky-400/20 bg-sky-400/10 text-sky-100 hover:bg-sky-400/10">{student.organizationName}</Badge>
              {student.batches.map((batch) => (
                <Badge key={batch.id} className="border-white/10 bg-white/10 text-white hover:bg-white/10">
                  {batch.name}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="secondary">
              <Link href={guideHref}>How to use this portal</Link>
            </Button>
            <Button variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={() => logout()}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
        <div className="relative mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Pending dues</p>
            <p className="mt-2 text-2xl font-semibold">{formatCurrency(feeSummary.pendingAmount)}</p>
            <p className="mt-1 text-sm text-slate-300">{feeSummary.overdueCount} overdue cycles</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Attendance rate</p>
            <p className="mt-2 text-2xl font-semibold">{attendanceSummary.attendanceRate}%</p>
            <p className="mt-1 text-sm text-slate-300">{attendanceSummary.totalEntries} recent entries</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Published results</p>
            <p className="mt-2 text-2xl font-semibold">{academicSummary.publishedResults}</p>
            <p className="mt-1 text-sm text-slate-300">{academicSummary.latestGrade ? `Latest grade ${academicSummary.latestGrade}` : "No grade yet"}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Pending dues" value={formatCurrency(feeSummary.pendingAmount)} helper={`${feeSummary.overdueCount} overdue fee cycles`} icon={CreditCard} tone={feeSummary.pendingAmount > 0 ? "amber" : "emerald"} />
        <MetricCard title="Attendance rate" value={`${attendanceSummary.attendanceRate}%`} helper={`${attendanceSummary.totalEntries} attendance entries`} icon={CalendarCheck2} tone={attendanceSummary.attendanceRate >= 75 ? "sky" : "rose"} />
        <MetricCard title="Published results" value={String(academicSummary.publishedResults)} helper={academicSummary.latestGrade ? `Latest grade ${academicSummary.latestGrade}` : "No published results yet"} icon={GraduationCap} tone="violet" />
        <MetricCard title="Assessments" value={String(academicSummary.assessmentSummary.availableCount)} helper={`${academicSummary.assessmentSummary.inProgressCount} in progress`} icon={FileQuestion} tone="sky" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,#0f172a_0%,#155e75_55%,#f59e0b_140%)] text-white shadow-[0_30px_80px_-48px_rgba(15,23,42,0.95)]">
          <CardContent className="relative p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.2),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(125,211,252,0.18),_transparent_26%)]" />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sky-100">
                  <achievement.icon className="h-3.5 w-3.5" />
                  {achievement.eyebrow}
                </div>
                <div className="min-w-0">
                  <h2 className="break-words text-2xl font-semibold tracking-tight">{achievement.title}</h2>
                  <p className="mt-2 max-w-2xl break-words text-sm text-slate-200">{achievement.description}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className="border-white/10 bg-white/12 text-white hover:bg-white/12">
                    Latest grade {academicSummary.latestGrade ?? "Pending"}
                  </Badge>
                  <Badge className="border-white/10 bg-black/10 text-white hover:bg-black/10">
                    Overall {academicSummary.latestPercentage !== null ? `${academicSummary.latestPercentage}%` : "No result yet"}
                  </Badge>
                  <Badge className="border-white/10 bg-black/10 text-white hover:bg-black/10">
                    Attendance {attendanceSummary.attendanceRate}%
                  </Badge>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:w-[320px]">
                {achievement.highlights.map((item) => (
                  <div key={item.label} className="min-w-0 rounded-2xl border border-white/12 bg-white/10 p-4">
                    <p className="break-words text-xs uppercase tracking-[0.2em] text-slate-200">{item.label}</p>
                    <p className="mt-2 text-xl font-semibold">{item.value}</p>
                    <p className="mt-1 break-words text-xs text-slate-300">{item.caption}</p>
                  </div>
                ))}
                <div className="min-w-0 rounded-2xl border border-white/12 bg-white/10 p-4 sm:col-span-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-200">Class rank</p>
                  <p className="mt-2 text-xl font-semibold">
                    {reportCardQuery.data?.classRank ? `#${reportCardQuery.data.classRank} of ${reportCardQuery.data.classSize}` : "Pending"}
                  </p>
                  <p className="mt-1 text-xs text-slate-300">Current position in the linked batch based on blended academic performance.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/85 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle>Next target</CardTitle>
            <CardDescription>
              {variant === "parent"
                ? "A practical message to keep the student focused, whether they are leading or still catching up."
                : "A practical next step to keep your momentum strong, whether you are leading or still catching up."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-slate-50 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Target className="h-4 w-4 text-sky-600" />
                Motivation note
              </div>
              <p className="mt-2 text-sm text-slate-600">{achievement.motivation}</p>
            </div>
            <div className="space-y-3">
              {achievement.actions.map((action) => (
                <div key={action.title} className="rounded-2xl border border-border/70 bg-background/70 p-4 text-sm shadow-sm">
                  <p className="font-medium text-slate-900">{action.title}</p>
                  <p className="mt-1 break-words text-slate-600">{action.description}</p>
                </div>
              ))}
              {reportCardQuery.data?.focusAreas?.length ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm shadow-sm">
                  <div className="flex items-center gap-2 font-medium text-amber-900">
                    <Target className="h-4 w-4" />
                    Focus more on
                  </div>
                  <div className="mt-3 space-y-3">
                    {reportCardQuery.data.focusAreas.slice(0, 2).map((item) => (
                      <div key={item.subjectId} className="min-w-0 rounded-2xl border border-amber-200 bg-background/80 p-3 shadow-sm">
                        <p className="break-words font-medium text-slate-900">
                          {item.subjectName} ({item.subjectCode})
                        </p>
                        <p className="mt-1 break-words text-slate-600">
                          {item.combinedPercentage !== null ? `${item.combinedPercentage}% combined.` : "No combined score yet."} {item.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
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
        <Card>
          <CardHeader>
            <CardTitle>Academic summary</CardTitle>
            <CardDescription>Open the blended report card built from exams, assessments, and assignments.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border px-4 py-3 text-sm">
                <p className="text-muted-foreground">Overall</p>
                <p className="mt-1 text-xl font-semibold">{academicSummary.latestPercentage !== null ? `${academicSummary.latestPercentage}%` : "Pending"}</p>
              </div>
              <div className="rounded-2xl border px-4 py-3 text-sm">
                <p className="text-muted-foreground">Published results</p>
                <p className="mt-1 text-xl font-semibold">{academicSummary.publishedResults}</p>
              </div>
              <div className="rounded-2xl border px-4 py-3 text-sm">
                <p className="text-muted-foreground">Latest grade</p>
                <p className="mt-1 text-xl font-semibold">{academicSummary.latestGrade ?? "Pending"}</p>
              </div>
            </div>
            <Button asChild>
              <Link href={variant === "parent" ? "/portal/parent/report-card" : "/portal/student/report-card"}>
                <ScrollText className="mr-2 h-4 w-4" />
                Open unified report card
              </Link>
            </Button>
          </CardContent>
        </Card>

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
                <div key={entry.id} className="rounded-2xl border border-border/70 bg-background/70 p-3 text-sm shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words font-medium">{entry.subjectName}</p>
                      <p className="break-words text-muted-foreground">
                        {entry.dayOfWeek} · {entry.startTime} - {entry.endTime}
                      </p>
                    </div>
                    <div className="min-w-0 text-right text-muted-foreground">
                      <p className="break-words">{entry.batchName}</p>
                      <p className="break-words">{entry.teacherName ?? "Teacher pending"}</p>
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
                <div key={item.id} className="rounded-2xl border border-border/70 bg-background/70 p-4 text-sm shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words font-medium">
                        {item.month}/{item.year}
                      </p>
                      <p className="break-words text-muted-foreground">
                        Due {formatCurrency(item.amountDue)} · Paid {formatCurrency(item.amountPaid)}
                      </p>
                    </div>
                    <Badge variant={item.status === "PAID" ? "success" : "warning"}>{item.status}</Badge>
                  </div>
                  <p className="mt-2 break-words text-muted-foreground">
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
                <div key={item.id} className="rounded-2xl border border-border/70 bg-background/70 p-3 text-sm shadow-sm">
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

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Teacher feedback and notifications</CardTitle>
              <CardDescription>Recent reminders, published results, and reviewed academic feedback in one feed.</CardDescription>
            </div>
            <Button asChild variant="outline">
              <Link href={variant === "parent" ? "/portal/parent/activity" : "/portal/student/activity"}>
                <MessageSquareMore className="mr-2 h-4 w-4" />
                Open timeline
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {activityFeedQuery.data?.length ? (
            activityFeedQuery.data.slice(0, 4).map((item) => (
              <div key={item.id} className="rounded-2xl border border-border/70 bg-background/70 p-4 text-sm shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{item.kind.replaceAll("_", " ")}</Badge>
                    {item.subjectName ? <Badge variant="outline">{item.subjectName}</Badge> : null}
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDate(item.occurredAt, "MMM d, yyyy p")}</span>
                </div>
                <p className="mt-2 break-words font-medium">{item.title}</p>
                <p className="mt-1 break-words text-muted-foreground">{item.description}</p>
                {item.scoreLabel || item.actorName ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {[item.scoreLabel, item.actorName ? `by ${item.actorName}` : null].filter(Boolean).join(" · ")}
                  </p>
                ) : null}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              {activityFeedQuery.isLoading ? "Loading activity feed..." : "No notifications or teacher feedback have been recorded yet."}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Assessment center</CardTitle>
            <CardDescription>Start available quizzes and review recent attempt activity.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border px-4 py-3 text-sm">
                <p className="text-muted-foreground">Available</p>
                <p className="mt-1 text-xl font-semibold">{academicSummary.assessmentSummary.availableCount}</p>
              </div>
              <div className="rounded-2xl border px-4 py-3 text-sm">
                <p className="text-muted-foreground">In progress</p>
                <p className="mt-1 text-xl font-semibold">{academicSummary.assessmentSummary.inProgressCount}</p>
              </div>
              <div className="rounded-2xl border px-4 py-3 text-sm">
                <p className="text-muted-foreground">Completed</p>
                <p className="mt-1 text-xl font-semibold">{academicSummary.assessmentSummary.completedCount}</p>
              </div>
            </div>
            {variant === "student" ? (
              <Button asChild>
                <Link href="/portal/student/assessments">Open assessment center</Link>
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link href="/portal/parent/assessments">Monitor assessments</Link>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent assessment attempts</CardTitle>
            <CardDescription>Latest assessment activity recorded in this portal.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {academicSummary.assessmentSummary.recentAttempts.length ? (
              academicSummary.assessmentSummary.recentAttempts.map((attempt) => (
                <div key={attempt.attemptId} className="rounded-2xl border border-border/70 bg-background/70 p-3 text-sm shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="break-words font-medium">{attempt.title}</p>
                      <p className="break-words text-muted-foreground">
                        {attempt.subjectName}
                        {attempt.percentage !== null ? ` · ${attempt.percentage}%` : ""}
                      </p>
                    </div>
                    <Badge variant={attempt.status === "IN_PROGRESS" ? "warning" : "outline"}>{attempt.status.replaceAll("_", " ")}</Badge>
                  </div>
                  {attempt.submittedAt ? <p className="mt-2 text-xs text-muted-foreground">{formatDate(attempt.submittedAt, "MMM d, yyyy p")}</p> : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No assessment attempts have been recorded yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assignments</CardTitle>
          <CardDescription>
            {variant === "parent"
              ? "Monitor due work, submission state, and reviewed feedback for the linked student."
              : "Track assignment deadlines, saved drafts, and reviewed feedback from teachers."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-3">
            <Badge variant="outline">
              <ClipboardList className="mr-2 h-3.5 w-3.5" />
              Assignment workflow active
            </Badge>
            <Badge variant="outline">
              <GraduationCap className="mr-2 h-3.5 w-3.5" />
              Results feed into report cards
            </Badge>
          </div>
          <Button asChild>
            <Link href={variant === "parent" ? "/portal/parent/assignments" : "/portal/student/assignments"}>Open assignments</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Announcements</CardTitle>
                <CardDescription>Institution notices, academic updates, and urgent operational communication.</CardDescription>
              </div>
              <Button asChild variant="outline">
                <Link href={variant === "parent" ? "/portal/parent/announcements" : "/portal/student/announcements"}>
                  <Megaphone className="mr-2 h-4 w-4" />
                  Open board
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {announcementsQuery.data?.length ? (
              announcementsQuery.data.slice(0, 3).map((item) => (
                <div key={item.id} className="rounded-2xl border border-border/70 bg-background/70 p-4 text-sm shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{item.title}</p>
                    <Badge variant={item.isPinned ? "warning" : "outline"}>{item.category}</Badge>
                  </div>
                <p className="mt-1 line-clamp-2 break-words text-muted-foreground">{item.body}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                {announcementsQuery.isLoading ? "Loading announcements..." : "No active announcements are published right now."}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Acknowledgements</CardTitle>
                <CardDescription>Items that still need explicit review in this portal.</CardDescription>
              </div>
              <Button asChild variant="outline">
                <Link href={variant === "parent" ? "/portal/parent/acknowledgements" : "/portal/student/acknowledgements"}>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Open center
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {acknowledgementQuery.data?.length ? (
              acknowledgementQuery.data.slice(0, 4).map((item) => (
                <div key={item.itemKey} className="rounded-2xl border border-border/70 bg-background/70 p-4 text-sm shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="break-words font-medium">{item.title}</p>
                    <Badge variant={item.acknowledgedAt ? "success" : "warning"}>
                      {item.acknowledgedAt ? "Acknowledged" : "Pending"}
                    </Badge>
                  </div>
                  <p className="mt-1 break-words text-muted-foreground">{item.description}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                {acknowledgementQuery.isLoading ? "Loading acknowledgements..." : "No acknowledgement items are waiting right now."}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Document center</CardTitle>
                <CardDescription>Download generated academic exports and uploaded student files.</CardDescription>
              </div>
              <Button asChild variant="outline">
                <Link href={variant === "parent" ? "/portal/parent/documents" : "/portal/student/documents"}>
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Open documents
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Generated downloads now include a unified report card export and an activity timeline export for quick sharing and offline review.</p>
            <p>Uploaded student files already stored by the institution also appear here for direct portal download.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Fee actions</CardTitle>
              <CardDescription>
                {variant === "parent"
                  ? "Upload payment evidence for pending fee cycles and track proof review status."
                  : "Review fee cycles and submitted payment evidence linked to this student."}
              </CardDescription>
            </div>
            <Button asChild variant="outline">
              <Link href={variant === "parent" ? "/portal/parent/fees" : "/portal/student/fees"}>
                <ReceiptText className="mr-2 h-4 w-4" />
                Open fee center
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Pending amount right now: {formatCurrency(feeSummary.pendingAmount)}.</p>
          <p>{variant === "parent" ? "Parents can now upload payment proofs directly from the portal." : "Students can review fee history and proof submissions in one place."}</p>
        </CardContent>
      </Card>
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

function getPortalAchievement({
  grade,
  percentage,
  attendanceRate,
  variant,
  studentName,
}: {
  grade: string | null;
  percentage: number | null;
  attendanceRate: number;
  variant: "student" | "parent";
  studentName: string;
}) {
  const normalizedGrade = grade?.toUpperCase() ?? null;
  const currentPercentage = percentage ?? 0;

  if (normalizedGrade === "A+" || currentPercentage >= 90) {
    return {
      eyebrow: "Top performer",
      title: variant === "parent" ? `${studentName} is performing at topper level` : "You are performing at topper level",
      description:
        variant === "parent"
          ? "This profile is showing strong academic control. Keep the rhythm steady and use the portal as a place to protect consistency, not just celebrate results."
          : "You are already in the strong-performance zone. Keep the routine disciplined so the next results stay at A+ level, not just this one.",
      icon: Trophy,
      highlights: [
        { label: "Recognition", value: "Honor badge", caption: "A+ or elite percentage achieved" },
        { label: "Momentum", value: `${attendanceRate}%`, caption: "Attendance supports academic lead" },
      ],
      motivation:
        variant === "parent"
          ? "Celebrate the result, but keep pushing for consistency across every subject so the lead does not slip."
          : "Excellent work. The next challenge is consistency across subjects and every test window.",
      actions: [
        { title: "Protect the lead", description: "Keep revision cycles short and frequent before each assessment instead of waiting for major exams." },
        { title: "Aim beyond marks", description: "Turn strong grades into subject mastery by improving weaker chapters even when overall results are already high." },
      ],
    };
  }

  if (normalizedGrade === "A" || currentPercentage >= 80) {
    return {
      eyebrow: "Strong performer",
      title: variant === "parent" ? `${studentName} is close to the top bracket` : "You are close to the top bracket",
      description:
        variant === "parent"
          ? "This is strong academic ground. A little more consistency can push the student from good performance into visible distinction."
          : "This is strong performance. A sharper routine on revision and test practice can push you into the A+ bracket.",
      icon: Medal,
      highlights: [
        { label: "Current zone", value: "A range", caption: "Strong academic standing" },
        { label: "Gap to top", value: `${Math.max(90 - currentPercentage, 0).toFixed(0)}%`, caption: "Needed to reach the 90% band" },
      ],
      motivation:
        variant === "parent"
          ? "The student is doing well. The next message should be about pushing from good to outstanding."
          : "You are not far from the top. Push a little harder on weak papers and timed practice.",
      actions: [
        { title: "Target the next band", description: "Focus on one or two weaker subjects and move them up instead of spreading effort too thin." },
        { title: "Turn review into score", description: "Use assessment mistakes as a revision list before the next paper." },
      ],
    };
  }

  if (currentPercentage >= 65) {
    return {
      eyebrow: "Progress in motion",
      title: variant === "parent" ? `${studentName} is on track but can climb higher` : "You are on track but can climb higher",
      description:
        variant === "parent"
          ? "The student is in a recoverable and improvable range. The portal should now be used as a weekly check-in tool, not only after results are published."
          : "You are in a workable range. With steadier revision and better follow-up on assignments, you can move upward quickly.",
      icon: TrendingUp,
      highlights: [
        { label: "Current standing", value: `${currentPercentage.toFixed(0)}%`, caption: "Solid base, but more growth needed" },
        { label: "Attendance", value: `${attendanceRate}%`, caption: "Routine has direct score impact" },
      ],
      motivation:
        variant === "parent"
          ? "This is the stage where regular follow-up matters most. Small weekly gains can change the final grade significantly."
          : "You can improve from here. Keep going and treat every assignment, quiz, and revision session as a chance to move up.",
      actions: [
        { title: "Fix consistency", description: "Complete assignments on time and review teacher feedback before the next assessment cycle." },
        { title: "Build a weekly habit", description: "Use the portal every week to check activity, pending work, and recent performance instead of reacting late." },
      ],
    };
  }

  return {
    eyebrow: "Comeback mode",
    title: variant === "parent" ? `${studentName} needs a stronger academic push` : "You need a stronger academic push",
    description:
      variant === "parent"
        ? "The current academic position needs focused support. This should be presented as a rebuild plan, not just a low-score warning."
        : "The current results are below your target, but this is not the end point. Use the portal as your recovery dashboard and start improving step by step.",
    icon: Sparkles,
    highlights: [
      { label: "Immediate goal", value: "Move upward", caption: "Stabilize performance before the next cycle" },
      { label: "Attendance", value: `${attendanceRate}%`, caption: "Improving routine will help marks" },
    ],
    motivation:
      variant === "parent"
        ? "The student should be encouraged, monitored, and guided consistently. Improvement is still realistic with structured follow-up."
        : "Try harder from here. Show up consistently, submit everything on time, and use each result as feedback instead of frustration.",
    actions: [
      { title: "Start with weak areas", description: "Pick the weakest subjects first and set simple weekly improvement targets." },
      { title: "Build confidence again", description: "Focus on finishing classwork, assignments, and revision sessions regularly before chasing high scores." },
    ],
  };
}
