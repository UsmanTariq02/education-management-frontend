"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BellRing,
  BookOpenCheck,
  CalendarCheck2,
  CreditCard,
  Mail,
  Phone,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import { attendanceApi } from "@/features/attendance/api/attendance-api";
import { aiApi } from "@/features/ai/api/ai-api";
import { feesApi } from "@/features/fees/api/fees-api";
import { StudentDocumentsCard } from "@/features/media/components/student-documents-card";
import { StudentPortalAccessCard } from "@/features/portal/components/student-portal-access-card";
import { remindersApi } from "@/features/reminders/api/reminders-api";
import { studentsApi } from "@/features/students/api/students-api";
import { writePortalSession } from "@/lib/auth/portal-session";
import { BoxPlotSummary } from "@/components/charts/box-plot-summary";
import { MetricCard } from "@/components/cards/metric-card";
import { ChartCard } from "@/components/charts/chart-card";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { OrganizationScopeBanner } from "@/components/shared/organization-scope-banner";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getChartColor } from "@/lib/constants/chart-colors";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { normalizeApiError } from "@/lib/api/errors";
import { usePermission } from "@/hooks/use-permission";
import { useAuth } from "@/providers/auth-provider";
import { hasAiAccess } from "@/lib/ai/access";
import { toast } from "sonner";
import type { AiStudentRiskRecommendation } from "@/types/domain";

const attendanceOrder = ["PRESENT", "ABSENT", "LATE", "LEAVE"] as const;

export default function StudentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const studentId = params?.id ?? "";
  const { user } = useAuth();
  const canReadFees = usePermission("fees.read");
  const canReadAttendance = usePermission("attendance.read");
  const canReadReminders = usePermission("reminders.read");
  const canManagePortalAccess = usePermission("portal-access.manage");
  const canReadStudentDocuments = usePermission("student-documents.read");
  const portalsEnabled = user?.enabledModules.includes("PORTALS") ?? false;
  const mediaEnabled = user?.enabledModules.includes("MEDIA") ?? false;
  const aiReady = hasAiAccess(user);
  const [aiRiskRecommendation, setAiRiskRecommendation] = useState<AiStudentRiskRecommendation | null>(null);

  const studentQuery = useQuery({
    queryKey: ["student", studentId],
    queryFn: () => studentsApi.detail(studentId),
    enabled: Boolean(studentId),
  });
  const feeQuery = useQuery({
    queryKey: ["student", studentId, "fees"],
    queryFn: () => feesApi.listRecords({ page: 1, limit: 100 }),
    enabled: Boolean(studentId) && canReadFees,
  });
  const attendanceQuery = useQuery({
    queryKey: ["student", studentId, "attendance"],
    queryFn: () => attendanceApi.list({ page: 1, limit: 100 }),
    enabled: Boolean(studentId) && canReadAttendance,
  });
  const remindersQuery = useQuery({
    queryKey: ["student", studentId, "reminders"],
    queryFn: () => remindersApi.list({ page: 1, limit: 100 }),
    enabled: Boolean(studentId) && canReadReminders,
  });

  const openStudentPortalMutation = useMutation({
    mutationFn: () => studentsApi.portalLogin(studentId),
    onSuccess: (response) => {
      writePortalSession(response);
      toast.success("Student portal session started");
      router.push("/portal/student");
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const openParentPortalMutation = useMutation({
    mutationFn: () => studentsApi.parentPortalLogin(studentId),
    onSuccess: (response) => {
      writePortalSession(response);
      toast.success("Parent portal session started");
      router.push("/portal/parent");
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const studentRiskRecommendationMutation = useMutation({
    mutationFn: async () =>
      aiApi.generateStudentRiskRecommendation({
        studentName: student.fullName,
        context: buildStudentRiskContext({
          studentName: student.fullName,
          organizationName: student.organizationName,
          studentEmail: student.email,
          guardianName: student.guardianName,
          guardianEmail: student.guardianEmail,
          guardianPhone: student.guardianPhone,
          studentStatus: student.status,
          batches: student.batches.map((batch) => batch.name),
          totalFee,
          paidFee,
          pendingFee,
          outstandingRecords,
          lastPaymentDate,
          attendanceRate,
          attendanceBreakdown,
          reminderStats,
          latestPercentage,
          resultSpread,
          riskScore,
          riskLevel,
          riskReasons,
        }),
      }),
    onSuccess: (data) => {
      setAiRiskRecommendation(data);
      toast.success("AI recommendations generated");
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  if (
    studentQuery.isLoading ||
    (canReadFees && feeQuery.isLoading) ||
    (canReadAttendance && attendanceQuery.isLoading) ||
    (canReadReminders && remindersQuery.isLoading)
  ) {
    return <LoadingState rows={8} />;
  }

  if (studentQuery.isError || !studentQuery.data) {
    return <ErrorState description="Student dashboard could not be loaded." />;
  }

  const student = studentQuery.data;
  const studentFees = (feeQuery.data?.items ?? [])
    .filter((record) => record.studentId === studentId)
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
  const studentAttendance = (attendanceQuery.data?.items ?? [])
    .filter((record) => record.studentId === studentId)
    .sort(
      (left, right) =>
        new Date(right.attendanceDate).getTime() - new Date(left.attendanceDate).getTime(),
    );
  const studentReminders = (remindersQuery.data?.items ?? [])
    .filter((record) => record.studentId === studentId)
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());

  const totalFee = studentFees.reduce((sum, record) => sum + Number(record.amountDue), 0);
  const paidFee = studentFees.reduce((sum, record) => sum + Number(record.amountPaid), 0);
  const pendingFee = Math.max(totalFee - paidFee, 0);
  const outstandingRecords = studentFees.filter((record) => record.status !== "PAID").length;
  const lastPaymentDate = studentFees.find((record) => record.paidAt)?.paidAt ?? null;

  const attendanceBreakdown = attendanceOrder.map((status) => ({
    status,
    total: studentAttendance.filter((record) => record.status === status).length,
  }));
  const attendanceRate = studentAttendance.length
    ? Math.round(
        (studentAttendance.filter((record) => record.status === "PRESENT").length / studentAttendance.length) *
          100,
      )
    : 0;

  const recentFeeRows = studentFees.slice(0, 5);
  const recentAttendanceRows = studentAttendance.slice(0, 7);
  const recentReminderRows = studentReminders.slice(0, 5);

  const reminderStats = {
    sent: studentReminders.filter((record) => record.status === "SENT").length,
    failed: studentReminders.filter((record) => record.status === "FAILED").length,
    total: studentReminders.length,
  };
  const academicSummary = student.academicSummary;
  const recentAcademicResults = academicSummary?.recentResults ?? [];
  const latestAcademicResult = recentAcademicResults[0] ?? null;
  const subjectRadar = latestAcademicResult
    ? latestAcademicResult.items.map((item: (typeof latestAcademicResult.items)[number]) => ({
        subject: item.subjectName,
        score: Math.round((item.obtainedMarks / Math.max(item.totalMarks, 1)) * 100),
      }))
    : [];
  const resultPercentages = recentAcademicResults.map((item) => item.percentage).sort((a, b) => a - b);
  const quantile = (values: number[], q: number) => {
    if (values.length === 0) return 0;
    const position = (values.length - 1) * q;
    const base = Math.floor(position);
    const remainder = position - base;
    const next = values[base + 1] ?? values[base];
    return values[base] + remainder * (next - values[base]);
  };
  const resultSpread = resultPercentages.length
    ? {
        min: resultPercentages[0],
        q1: quantile(resultPercentages, 0.25),
        median: quantile(resultPercentages, 0.5),
        q3: quantile(resultPercentages, 0.75),
        max: resultPercentages[resultPercentages.length - 1],
      }
    : null;
  const latestPercentage = academicSummary?.latestPercentage ?? latestAcademicResult?.percentage ?? null;
  const riskSignals = [
    pendingFee > 0 ? 30 : 0,
    attendanceRate < 75 ? 25 : attendanceRate < 85 ? 10 : 0,
    latestPercentage !== null && latestPercentage < 60 ? 25 : latestPercentage !== null && latestPercentage < 75 ? 10 : 0,
    reminderStats.failed > 0 || reminderStats.total >= 3 ? 20 : reminderStats.total >= 1 ? 10 : 0,
  ];
  const riskScore = Math.min(riskSignals.reduce((sum, value) => sum + value, 0), 100);
  const riskLevel = riskScore >= 70 ? "High risk" : riskScore >= 40 ? "Watchlist" : "Stable";
  const riskTone = riskScore >= 70 ? "rose" : riskScore >= 40 ? "amber" : "emerald";
  const riskReasons = [
    pendingFee > 0 ? `Pending fee ${formatCurrency(pendingFee)}` : null,
    attendanceRate < 85 ? `Attendance ${attendanceRate}%` : null,
    latestPercentage !== null && latestPercentage < 75 ? `Academic average ${latestPercentage}%` : null,
    reminderStats.total >= 3 ? `${reminderStats.total} reminder attempts` : null,
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Student dashboard"
        title={student.fullName}
        description="Review student profile, fee position, attendance health, guardian contact details, and reminder activity from one operational view."
      />
      <div className="sticky top-0 z-20 rounded-[1.75rem] border border-border/70 bg-card/95 px-4 py-3 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Student actions</span>
            <span>Keep edit and portal access close at hand.</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/students">Back to students</Link>
            </Button>
            {user?.roles.includes("SUPER_ADMIN") ? (
              <>
                <Button
                  variant="secondary"
                  onClick={() => openStudentPortalMutation.mutate()}
                  disabled={openStudentPortalMutation.isPending || !student.email}
                >
                  Open student portal
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => openParentPortalMutation.mutate()}
                  disabled={openParentPortalMutation.isPending || !student.guardianEmail}
                >
                  Open parent portal
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <OrganizationScopeBanner moduleLabel="Student detail operations" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Outstanding fee"
          value={formatCurrency(pendingFee)}
          helper={canReadFees ? `${outstandingRecords} unpaid or partial fee records` : "Fee access not available"}
          icon={ShieldAlert}
          tone={pendingFee > 0 ? "amber" : "emerald"}
        />
        <MetricCard
          title="Paid fee"
          value={formatCurrency(paidFee)}
          helper={canReadFees ? `Total received across ${studentFees.length} fee records` : "Fee access not available"}
          icon={CreditCard}
          tone="emerald"
        />
        <MetricCard
          title="Attendance rate"
          value={`${attendanceRate}%`}
          helper={canReadAttendance ? `${studentAttendance.length} attendance entries recorded` : "Attendance access not available"}
          icon={CalendarCheck2}
          tone={attendanceRate >= 75 ? "sky" : "rose"}
        />
        <MetricCard
          title="Reminder activity"
          value={String(reminderStats.total)}
          helper={canReadReminders ? `${reminderStats.sent} sent, ${reminderStats.failed} failed` : "Reminder access not available"}
          icon={BellRing}
          tone="violet"
        />
        <MetricCard
          title="Student risk"
          value={`${riskScore}/100`}
          helper={riskLevel}
          icon={ShieldAlert}
          tone={riskTone}
        />
      </div>

      <div className="grid gap-6 2xl:grid-cols-[1.1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Student profile</CardTitle>
            <CardDescription>Core student and guardian identity with current tenant and batch enrollment context.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-2">
            <InfoRow label="Student name" value={student.fullName} icon={<UserRound className="h-4 w-4" />} />
            <InfoRow label="Organization" value={student.organizationName} icon={<BookOpenCheck className="h-4 w-4" />} />
            <InfoRow label="Student email" value={student.email ?? "Not provided"} icon={<Mail className="h-4 w-4" />} />
            <InfoRow label="Student phone" value={student.phone} icon={<Phone className="h-4 w-4" />} />
            <InfoRow label="Guardian name" value={student.guardianName} icon={<UserRound className="h-4 w-4" />} />
            <InfoRow label="Guardian phone" value={student.guardianPhone} icon={<Phone className="h-4 w-4" />} />
            <InfoRow label="Guardian email" value={student.guardianEmail ?? "Not provided"} icon={<Mail className="h-4 w-4" />} />
            <InfoRow label="Admission date" value={formatDate(student.admissionDate)} icon={<CalendarCheck2 className="h-4 w-4" />} />
            <div className="md:col-span-2 rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Status and batches</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant={student.status === "ACTIVE" ? "success" : "warning"}>{student.status}</Badge>
                {student.batches.length ? (
                  student.batches.map((batch) => (
                    <Badge key={batch.id} variant="outline">
                      {batch.name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No batch linked yet</span>
                )}
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{student.address ?? "No address recorded."}</p>
            </div>
          </CardContent>
        </Card>

        <ChartCard title="Attendance distribution" description="Operational attendance mix for the selected student.">
          {canReadAttendance ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="total" radius={[10, 10, 0, 0]}>
                    {attendanceBreakdown.map((entry, index) => (
                      <Cell key={entry.status} fill={getChartColor(index)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyBlock message="Attendance summary is unavailable for your current access level." />
          )}
        </ChartCard>
      </div>

      <div className="grid gap-6 2xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Fee summary</CardTitle>
            <CardDescription>Current payment posture for this student.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {canReadFees ? (
              <>
                <SummaryRow label="Total billed" value={formatCurrency(totalFee)} />
                <SummaryRow label="Total paid" value={formatCurrency(paidFee)} />
                <SummaryRow label="Pending amount" value={formatCurrency(pendingFee)} />
                <SummaryRow label="Outstanding records" value={String(outstandingRecords)} />
                <SummaryRow label="Last payment" value={formatDate(lastPaymentDate)} />
              </>
            ) : (
              <EmptyBlock message="Fee details are unavailable for your current access level." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance summary</CardTitle>
            <CardDescription>Fast operational reading for follow-up.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {canReadAttendance ? (
              attendanceBreakdown.map((entry) => (
                <SummaryRow key={entry.status} label={entry.status} value={String(entry.total)} />
              ))
            ) : (
              <EmptyBlock message="Attendance details are unavailable for your current access level." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reminder summary</CardTitle>
            <CardDescription>Communication history tied to this student.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {canReadReminders ? (
              <>
                <SummaryRow label="Total reminders" value={String(reminderStats.total)} />
                <SummaryRow label="Sent" value={String(reminderStats.sent)} />
                <SummaryRow label="Failed" value={String(reminderStats.failed)} />
                <SummaryRow
                  label="Latest reminder"
                  value={recentReminderRows.length ? formatDate(recentReminderRows[0].createdAt, "MMM d, yyyy p") : "No reminders yet"}
                />
              </>
            ) : (
              <EmptyBlock message="Reminder history is unavailable for your current access level." />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Risk overview</CardTitle>
            <CardDescription>Quick operational indicator built from fee, attendance, academic, and reminder signals.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <SummaryRow label="Risk level" value={riskLevel} />
            <SummaryRow label="Risk score" value={`${riskScore}/100`} />
            {riskReasons.length ? (
              <div className="rounded-2xl border bg-muted/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Signals</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {riskReasons.map((reason) => (
                    <Badge key={reason} variant="outline">
                      {reason}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyBlock message="No current risk signals are active for this student." />
            )}
            <div className="rounded-2xl border border-border/70 bg-background/80 p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">AI recommendations</p>
                  <p className="text-xs text-muted-foreground">
                    Generate a staff-ready summary, next actions, and a suggested parent message from the current student risk context.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => studentRiskRecommendationMutation.mutate()}
                  disabled={studentRiskRecommendationMutation.isPending || !aiReady}
                >
                  {studentRiskRecommendationMutation.isPending ? "Generating..." : "Generate AI recommendations"}
                </Button>
              </div>
              {!aiReady ? (
                <p className="mt-3 text-xs text-amber-700">AI access is not enabled for this account. Add a tenant key or use the trial AI window to enable recommendations.</p>
              ) : null}
              {aiRiskRecommendation ? (
                <div className="mt-4 space-y-4">
                  <SummaryRow label="AI risk level" value={aiRiskRecommendation.riskLevel} />
                  <SummaryRow label="Confidence" value={`${Math.round(aiRiskRecommendation.confidence * 100)}%`} />
                  <div className="rounded-2xl border bg-muted/30 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Overview</p>
                    <p className="mt-2 text-sm text-foreground">{aiRiskRecommendation.overview}</p>
                  </div>
                  <div className="rounded-2xl border bg-muted/30 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Key signals</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {aiRiskRecommendation.keySignals.map((signal) => (
                        <Badge key={signal} variant="outline">
                          {signal}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border bg-muted/30 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Recommended actions</p>
                    <div className="mt-3 space-y-2">
                      {aiRiskRecommendation.recommendedActions.map((action) => (
                        <p key={action} className="rounded-2xl border border-border/70 bg-background px-3 py-2 text-sm shadow-sm">
                          {action}
                        </p>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border bg-muted/30 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Suggested parent message</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{aiRiskRecommendation.parentMessageDraft}</p>
                  </div>
                  <div className="rounded-2xl border bg-muted/30 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Staff note</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{aiRiskRecommendation.staffNote}</p>
                    <Badge className="mt-3" variant={aiRiskRecommendation.escalationNeeded ? "warning" : "success"}>
                      {aiRiskRecommendation.escalationNeeded ? "Escalation recommended" : "No escalation required"}
                    </Badge>
                  </div>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 2xl:grid-cols-3">
        <ChartCard title="Latest result subject radar" description="Subject-wise performance profile from the latest published academic result.">
          {latestAcademicResult ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={subjectRadar}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <Radar dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                  <Tooltip formatter={(value: number | string) => `${value}%`} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyBlock message="No academic result is available yet for a subject radar profile." />
          )}
        </ChartCard>
        <ChartCard title="Latest result subject mix" description="How the latest result is distributed across subject marks.">
          {latestAcademicResult ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={latestAcademicResult.items.map((item: (typeof latestAcademicResult.items)[number]) => ({ name: item.subjectName, value: item.obtainedMarks }))}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={100}
                  >
                    {latestAcademicResult.items.map((item: (typeof latestAcademicResult.items)[number], index: number) => (
                      <Cell key={item.subjectName} fill={getChartColor(index)} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyBlock message="No academic result is available yet for subject distribution." />
          )}
        </ChartCard>
        <ChartCard title="Result spread" description="A box-plot-style view of this student's recent result percentages.">
          {resultSpread ? (
            <BoxPlotSummary
              min={resultSpread.min}
              q1={resultSpread.q1}
              median={resultSpread.median}
              q3={resultSpread.q3}
              max={resultSpread.max}
              formatValue={(value) => `${value.toFixed(1)}%`}
            />
          ) : (
            <EmptyBlock message="More than one result record is needed before a spread summary becomes useful." />
          )}
        </ChartCard>
      </div>

      <div className="grid gap-6 2xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Recent fee records</CardTitle>
            <CardDescription>Latest fee cycles, payment progress, and collection status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!canReadFees ? (
              <EmptyBlock message="Fee records are unavailable for your current access level." />
            ) : recentFeeRows.length ? (
              recentFeeRows.map((record) => (
                <div key={record.id} className="rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {record.month}/{record.year}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Due {formatCurrency(record.amountDue)} · Paid {formatCurrency(record.amountPaid)}
                      </p>
                    </div>
                    <Badge variant={record.status === "PAID" ? "success" : "warning"}>{record.status}</Badge>
                  </div>
                  <div className="mt-3 text-sm text-muted-foreground">
                    Created {formatDate(record.createdAt)} {record.paidAt ? `· Paid at ${formatDate(record.paidAt, "MMM d, yyyy p")}` : ""}
                  </div>
                </div>
              ))
            ) : (
              <EmptyBlock message="No fee records have been recorded for this student yet." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent attendance</CardTitle>
            <CardDescription>Latest attendance marks for follow-up review.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!canReadAttendance ? (
              <EmptyBlock message="Attendance records are unavailable for your current access level." />
            ) : recentAttendanceRows.length ? (
              recentAttendanceRows.map((record) => (
                <div key={record.id} className="rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{formatDate(record.attendanceDate)}</p>
                      <p className="text-sm text-muted-foreground">{record.remarks ?? "No remarks"}</p>
                    </div>
                    <Badge variant={record.status === "PRESENT" ? "success" : "warning"}>{record.status}</Badge>
                  </div>
                </div>
              ))
            ) : (
              <EmptyBlock message="No attendance records are available for this student yet." />
            )}
          </CardContent>
        </Card>
      </div>

      {canManagePortalAccess && portalsEnabled ? <StudentPortalAccessCard studentId={studentId} /> : null}
      {canReadStudentDocuments && mediaEnabled ? <StudentDocumentsCard studentId={studentId} /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Recent reminder history</CardTitle>
          <CardDescription>Latest communication attempts sent for this student.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!canReadReminders ? (
            <EmptyBlock message="Reminder history is unavailable for your current access level." />
          ) : recentReminderRows.length ? (
            recentReminderRows.map((record) => (
              <div key={record.id} className="rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{record.channel}</Badge>
                      <Badge variant={record.status === "SENT" ? "success" : "warning"}>{record.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{formatDate(record.createdAt, "MMM d, yyyy p")}</p>
                  </div>
                  {record.failureReason ? (
                    <span className="text-sm text-amber-600">{record.failureReason}</span>
                  ) : null}
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{record.message}</p>
              </div>
            ))
          ) : (
            <EmptyBlock message="No reminders have been sent for this student yet." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-3 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/70 px-4 py-3 shadow-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function EmptyBlock({ message }: { message: string }) {
  return <div className="rounded-2xl border bg-muted/30 p-6 text-sm text-muted-foreground">{message}</div>;
}

function buildStudentRiskContext({
  studentName,
  organizationName,
  studentEmail,
  guardianName,
  guardianEmail,
  guardianPhone,
  studentStatus,
  batches,
  totalFee,
  paidFee,
  pendingFee,
  outstandingRecords,
  lastPaymentDate,
  attendanceRate,
  attendanceBreakdown,
  reminderStats,
  latestPercentage,
  resultSpread,
  riskScore,
  riskLevel,
  riskReasons,
}: {
  studentName: string;
  organizationName: string;
  studentEmail: string | null;
  guardianName: string;
  guardianEmail: string | null;
  guardianPhone: string;
  studentStatus: string;
  batches: string[];
  totalFee: number;
  paidFee: number;
  pendingFee: number;
  outstandingRecords: number;
  lastPaymentDate: string | null;
  attendanceRate: number;
  attendanceBreakdown: Array<{ status: string; total: number }>;
  reminderStats: { sent: number; failed: number; total: number };
  latestPercentage: number | null;
  resultSpread: { min: number; q1: number; median: number; q3: number; max: number } | null;
  riskScore: number;
  riskLevel: string;
  riskReasons: string[];
}) {
  return [
    `Student: ${studentName}`,
    `Organization: ${organizationName}`,
    `Student status: ${studentStatus}`,
    `Student email: ${studentEmail ?? "Not provided"}`,
    `Guardian: ${guardianName}`,
    `Guardian email: ${guardianEmail ?? "Not provided"}`,
    `Guardian phone: ${guardianPhone}`,
    `Batches: ${batches.length ? batches.join(", ") : "None"}`,
    `Fee summary: total billed ${formatCurrency(totalFee)}, paid ${formatCurrency(paidFee)}, pending ${formatCurrency(pendingFee)}, outstanding records ${outstandingRecords}, last payment ${formatDate(lastPaymentDate)}`,
    `Attendance summary: rate ${attendanceRate}%, breakdown ${attendanceBreakdown.map((item) => `${item.status}=${item.total}`).join(", ")}`,
    `Reminder summary: sent ${reminderStats.sent}, failed ${reminderStats.failed}, total ${reminderStats.total}`,
    `Academic summary: latest percentage ${latestPercentage !== null ? `${latestPercentage}%` : "Not available"}`,
    resultSpread
      ? `Academic spread: min ${resultSpread.min.toFixed(1)}%, q1 ${resultSpread.q1.toFixed(1)}%, median ${resultSpread.median.toFixed(1)}%, q3 ${resultSpread.q3.toFixed(1)}%, max ${resultSpread.max.toFixed(1)}%`
      : "Academic spread: Not available",
    `Risk score: ${riskScore}/100`,
    `Risk level: ${riskLevel}`,
    `Risk reasons: ${riskReasons.length ? riskReasons.join("; ") : "None"}`,
  ].join("\n");
}
