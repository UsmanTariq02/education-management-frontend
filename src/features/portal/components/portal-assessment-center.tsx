"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Clock3, FileQuestion, ListChecks, Sparkles } from "lucide-react";
import { portalApi } from "@/features/portal/api/portal-api";
import { MetricCard } from "@/components/cards/metric-card";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/formatters";

export function PortalAssessmentCenter({ variant = "student" }: { variant?: "student" | "parent" }) {
  const query = useQuery({
    queryKey: ["portal-assessments", variant],
    queryFn: portalApi.assessments,
  });

  if (query.isLoading) {
    return <LoadingState rows={5} />;
  }

  if (query.isError || !query.data) {
    return <ErrorState description="Assessments could not be loaded for this portal account." onRetry={() => query.refetch()} />;
  }

  const assessments = query.data;
  const stats = {
    total: assessments.length,
    inProgress: assessments.filter((item) => item.latestAttempt?.status === "IN_PROGRESS").length,
    immediate: assessments.filter((item) => item.showResultImmediately).length,
    completed: assessments.filter((item) => item.latestAttempt?.resultStatus).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">
            {variant === "parent" ? "Parent assessment monitor" : "Student assessments"}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Assessment center</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            {variant === "parent"
              ? "Monitor published quizzes and tests, attempt status, and latest scoring activity for the linked student."
              : "Start quizzes and tests, resume in-progress attempts, and review instant results for auto-graded questions."}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={variant === "parent" ? "/portal/parent" : "/portal/student"}>Back to portal</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Available" value={String(stats.total)} helper="Published assessments in your current batches" icon={FileQuestion} tone="sky" />
        <MetricCard title="In progress" value={String(stats.inProgress)} helper="Attempts you can resume right now" icon={Clock3} tone="amber" />
        <MetricCard title="Immediate results" value={String(stats.immediate)} helper="Assessments configured for instant objective scoring" icon={Sparkles} tone="emerald" />
        <MetricCard title="Completed" value={String(stats.completed)} helper="Attempts with saved results" icon={ListChecks} tone="violet" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {assessments.map((assessment) => (
          <Card key={assessment.id} className="border-border/70">
            <CardHeader className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>{assessment.title}</CardTitle>
                  <CardDescription>
                    {assessment.subjectName} · {assessment.batchName} · {assessment.code}
                  </CardDescription>
                </div>
                <Badge variant="outline">{assessment.type}</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{assessment.questionCount} questions</Badge>
                <Badge variant="outline">{assessment.durationMinutes} min</Badge>
                <Badge variant={assessment.showResultImmediately ? "success" : "warning"}>
                  {assessment.showResultImmediately ? "Immediate result" : "Manual release"}
                </Badge>
                {assessment.latestAttempt ? (
                  <Badge variant={assessment.latestAttempt.status === "IN_PROGRESS" ? "warning" : "outline"}>
                    {assessment.latestAttempt.status.replaceAll("_", " ")}
                  </Badge>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border px-4 py-3 text-sm">
                  <p className="text-muted-foreground">Marks</p>
                  <p className="mt-1 font-medium">
                    {assessment.totalMarks} total · {assessment.passMarks} pass
                  </p>
                </div>
                <div className="rounded-2xl border px-4 py-3 text-sm">
                  <p className="text-muted-foreground">Availability</p>
                  <p className="mt-1 font-medium">
                    {assessment.availableUntil ? `Until ${formatDate(assessment.availableUntil)}` : "Open schedule"}
                  </p>
                </div>
              </div>
              {assessment.latestAttempt ? (
                <div className="rounded-2xl border border-dashed px-4 py-3 text-sm">
                  <p className="font-medium">Latest attempt</p>
                  <p className="mt-1 text-muted-foreground">
                    Attempt {assessment.latestAttempt.attemptNumber}
                    {assessment.latestAttempt.percentage !== null ? ` · ${assessment.latestAttempt.percentage}%` : ""}
                    {assessment.latestAttempt.submittedAt ? ` · Submitted ${formatDate(assessment.latestAttempt.submittedAt)}` : ""}
                  </p>
                </div>
              ) : null}
              {variant === "student" ? (
                <Button asChild className="w-full">
                  <Link href={`/portal/student/assessments/${assessment.id}`}>
                    {assessment.latestAttempt?.status === "IN_PROGRESS" ? "Resume attempt" : "Open assessment"}
                  </Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
