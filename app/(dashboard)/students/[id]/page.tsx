"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { ReactNode } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
import { feesApi } from "@/features/fees/api/fees-api";
import { remindersApi } from "@/features/reminders/api/reminders-api";
import { studentsApi } from "@/features/students/api/students-api";
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
import { usePermission } from "@/hooks/use-permission";

const attendanceOrder = ["PRESENT", "ABSENT", "LATE", "LEAVE"] as const;

export default function StudentDetailPage() {
  const params = useParams<{ id: string }>();
  const studentId = params?.id ?? "";
  const canReadFees = usePermission("fees.read");
  const canReadAttendance = usePermission("attendance.read");
  const canReadReminders = usePermission("reminders.read");

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

  const reminderStats = useMemo(
    () => ({
      sent: studentReminders.filter((record) => record.status === "SENT").length,
      failed: studentReminders.filter((record) => record.status === "FAILED").length,
      total: studentReminders.length,
    }),
    [studentReminders],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Student dashboard"
        title={student.fullName}
        description="Review student profile, fee position, attendance health, guardian contact details, and reminder activity from one operational view."
        actions={
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/students">Back to students</Link>
            </Button>
          </div>
        }
      />

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
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Student profile</CardTitle>
            <CardDescription>Core student and guardian identity with current tenant and batch enrollment context.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <InfoRow label="Student name" value={student.fullName} icon={<UserRound className="h-4 w-4" />} />
            <InfoRow label="Organization" value={student.organizationName} icon={<BookOpenCheck className="h-4 w-4" />} />
            <InfoRow label="Student email" value={student.email ?? "Not provided"} icon={<Mail className="h-4 w-4" />} />
            <InfoRow label="Student phone" value={student.phone} icon={<Phone className="h-4 w-4" />} />
            <InfoRow label="Guardian name" value={student.guardianName} icon={<UserRound className="h-4 w-4" />} />
            <InfoRow label="Guardian phone" value={student.guardianPhone} icon={<Phone className="h-4 w-4" />} />
            <InfoRow label="Guardian email" value={student.guardianEmail ?? "Not provided"} icon={<Mail className="h-4 w-4" />} />
            <InfoRow label="Admission date" value={formatDate(student.admissionDate)} icon={<CalendarCheck2 className="h-4 w-4" />} />
            <div className="md:col-span-2 rounded-2xl border p-4">
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

      <div className="grid gap-6 xl:grid-cols-3">
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
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
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
                <div key={record.id} className="rounded-2xl border p-4">
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
                <div key={record.id} className="rounded-2xl border p-4">
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
              <div key={record.id} className="rounded-2xl border p-4">
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
    <div className="rounded-2xl border p-4">
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
    <div className="flex items-center justify-between rounded-xl border px-4 py-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function EmptyBlock({ message }: { message: string }) {
  return <div className="rounded-2xl border bg-muted/30 p-6 text-sm text-muted-foreground">{message}</div>;
}
