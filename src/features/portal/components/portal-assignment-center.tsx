"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Clock3, FileEdit, FileSearch } from "lucide-react";
import { portalApi } from "@/features/portal/api/portal-api";
import { MetricCard } from "@/components/cards/metric-card";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/formatters";

export function PortalAssignmentCenter({ variant = "student" }: { variant?: "student" | "parent" }) {
  const query = useQuery({
    queryKey: ["portal-assignments", variant],
    queryFn: portalApi.assignments,
  });

  if (query.isLoading) {
    return <LoadingState rows={5} />;
  }

  if (query.isError || !query.data) {
    return <ErrorState description="Assignments could not be loaded for this portal account." onRetry={() => query.refetch()} />;
  }

  const assignments = query.data;
  const stats = {
    total: assignments.length,
    drafts: assignments.filter((item) => item.submission?.status === "DRAFT").length,
    submitted: assignments.filter((item) => item.submission?.status === "SUBMITTED").length,
    reviewed: assignments.filter((item) => item.submission?.status === "REVIEWED").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">
            {variant === "parent" ? "Parent assignment monitor" : "Student assignments"}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Assignments</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            {variant === "parent"
              ? "Monitor published assignments, due dates, submission status, and reviewed feedback for the linked student."
              : "Review due work, keep drafts in progress, submit final responses, and track feedback from your teachers."}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={variant === "parent" ? "/portal/parent" : "/portal/student"}>Back to portal</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Available" value={String(stats.total)} helper="Published assignments in your current classes" icon={ClipboardList} tone="sky" />
        <MetricCard title="Drafts" value={String(stats.drafts)} helper="Assignments with saved but unsubmitted work" icon={FileEdit} tone="amber" />
        <MetricCard title="Submitted" value={String(stats.submitted)} helper="Awaiting teacher review" icon={Clock3} tone="violet" />
        <MetricCard title="Reviewed" value={String(stats.reviewed)} helper="Assignments carrying marks or teacher feedback" icon={FileSearch} tone="emerald" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {assignments.map((assignment) => (
          <Card key={assignment.id} className="border-border/70">
            <CardHeader className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>{assignment.title}</CardTitle>
                  <CardDescription>
                    {assignment.subjectName} · {assignment.batchName} · {assignment.code}
                  </CardDescription>
                </div>
                <Badge variant="outline">{assignment.status}</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{assignment.maxMarks} marks</Badge>
                <Badge variant={assignment.allowLateSubmission ? "warning" : "outline"}>
                  {assignment.allowLateSubmission ? "Late allowed" : "Due strict"}
                </Badge>
                {assignment.submission ? (
                  <Badge variant={assignment.submission.status === "REVIEWED" ? "success" : assignment.submission.status === "SUBMITTED" ? "secondary" : "warning"}>
                    {assignment.submission.status}
                  </Badge>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border px-4 py-3 text-sm">
                  <p className="text-muted-foreground">Teacher</p>
                  <p className="mt-1 font-medium">{assignment.teacherName ?? "Course team"}</p>
                </div>
                <div className="rounded-2xl border px-4 py-3 text-sm">
                  <p className="text-muted-foreground">Due</p>
                  <p className="mt-1 font-medium">{formatDate(assignment.dueAt)}</p>
                </div>
              </div>
              {assignment.submission ? (
                <div className="rounded-2xl border border-dashed px-4 py-3 text-sm">
                  <p className="font-medium">Current submission</p>
                  <p className="mt-1 text-muted-foreground">
                    {assignment.submission.status}
                    {assignment.submission.awardedMarks !== null ? ` · ${assignment.submission.awardedMarks}/${assignment.maxMarks}` : ""}
                    {assignment.submission.submittedAt ? ` · Submitted ${formatDate(assignment.submission.submittedAt)}` : ""}
                  </p>
                </div>
              ) : null}
              {variant === "student" ? (
                <Button asChild className="w-full">
                  <Link href={`/portal/student/assignments/${assignment.id}`}>Open assignment</Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
