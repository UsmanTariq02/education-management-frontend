"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Award, BookOpenCheck, ClipboardCheck, FileQuestion, GraduationCap, Sparkles, Target, Trophy } from "lucide-react";
import { portalApi } from "@/features/portal/api/portal-api";
import { MetricCard } from "@/components/cards/metric-card";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getChartColor } from "@/lib/constants/chart-colors";

export function PortalReportCard({ variant }: { variant: "student" | "parent" }) {
  const query = useQuery({
    queryKey: ["portal-report-card", variant],
    queryFn: portalApi.reportCard,
  });

  const chartData = useMemo(
    () =>
      query.data?.subjectBreakdown.map((subject, index) => ({
        name: subject.subjectCode,
        value: subject.combinedPercentage ?? 0,
        fill: getChartColor(index),
      })) ?? [],
    [query.data],
  );

  if (query.isLoading) {
    return <LoadingState rows={5} />;
  }

  if (query.isError || !query.data) {
    return <ErrorState description="The portal report card could not be loaded." onRetry={() => query.refetch()} />;
  }

  const reportCard = query.data;
  const dashboardHref = variant === "parent" ? "/portal/parent" : "/portal/student";
  const commendation = getReportCardCommendation(reportCard.overallGrade, reportCard.overallPercentage, variant, reportCard.studentName);
  const strongestSubject = [...reportCard.subjectBreakdown]
    .filter((subject) => subject.combinedPercentage !== null)
    .sort((left, right) => (right.combinedPercentage ?? 0) - (left.combinedPercentage ?? 0))[0] ?? null;
  const focusSubject = [...reportCard.subjectBreakdown]
    .filter((subject) => subject.combinedPercentage !== null)
    .sort((left, right) => (left.combinedPercentage ?? 0) - (right.combinedPercentage ?? 0))[0] ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">
            {variant === "parent" ? "Parent academic summary" : "Student academic summary"}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Unified report card</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            {variant === "parent"
              ? "Review exams, assessments, and assignments together in one guardian-facing academic summary."
              : "Review exams, assessments, and assignments together in one consolidated academic summary."}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={dashboardHref}>Back to portal</Link>
        </Button>
      </div>

      <Card className="border-border/70">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="break-words">{reportCard.studentName}</CardTitle>
              <CardDescription className="break-words">
                {reportCard.batchName} · {reportCard.batchCode}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Overall grade {reportCard.overallGrade}</Badge>
              <Badge variant="outline">
                Class rank {reportCard.classRank ? `#${reportCard.classRank} / ${reportCard.classSize}` : "Pending"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard title="Overall" value={`${reportCard.overallPercentage}%`} helper="Combined academic percentage" icon={GraduationCap} tone="sky" />
          <MetricCard title="Published exams" value={String(reportCard.publishedExamCount)} helper={reportCard.examPercentage !== null ? `${reportCard.examPercentage}% exam average` : "No published exam marks"} icon={BookOpenCheck} tone="violet" />
          <MetricCard title="Assessments" value={String(reportCard.finalizedAssessmentCount)} helper={reportCard.assessmentPercentage !== null ? `${reportCard.assessmentPercentage}% assessment average` : "No scored assessments"} icon={FileQuestion} tone="emerald" />
          <MetricCard title="Assignments" value={String(reportCard.reviewedAssignmentCount)} helper={reportCard.assignmentPercentage !== null ? `${reportCard.assignmentPercentage}% reviewed average` : "No reviewed assignments"} icon={ClipboardCheck} tone="amber" />
          <MetricCard title="Class rank" value={reportCard.classRank ? `#${reportCard.classRank}` : "Pending"} helper={`Out of ${reportCard.classSize} students`} icon={Award} tone="sky" />
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,#111827_0%,#1d4ed8_55%,#22c55e_140%)] text-white shadow-[0_30px_80px_-50px_rgba(17,24,39,0.92)]">
          <CardContent className="relative p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.16),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(253,224,71,0.18),_transparent_24%)]" />
            <div className="relative space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-100">
                <commendation.icon className="h-3.5 w-3.5" />
                {commendation.label}
              </div>
              <div>
              <h2 className="break-words text-2xl font-semibold tracking-tight">{commendation.title}</h2>
              <p className="mt-2 max-w-3xl break-words text-sm text-slate-200">{commendation.description}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="min-w-0 rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-200">Overall score</p>
                <p className="mt-2 text-xl font-semibold">{reportCard.overallPercentage}%</p>
              </div>
              <div className="min-w-0 rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-200">Top subject</p>
                <p className="mt-2 text-xl font-semibold">{strongestSubject?.subjectCode ?? "Pending"}</p>
              </div>
              <div className="min-w-0 rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-200">Focus subject</p>
                <p className="mt-2 text-xl font-semibold">{focusSubject?.subjectCode ?? "Pending"}</p>
              </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance signal</CardTitle>
            <CardDescription>
              {variant === "parent"
                ? "A simple interpretation of current academic standing so parents see both achievement and next focus."
                : "A simple interpretation of your current academic standing so you see both achievement and next focus."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-slate-50 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Target className="h-4 w-4 text-sky-600" />
                Next message
              </div>
              <p className="mt-2 break-words text-sm text-slate-600">{commendation.motivation}</p>
            </div>
            <div className="space-y-3">
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4 text-sm shadow-sm">
                <p className="font-medium text-slate-900">Recognition</p>
                <p className="mt-1 break-words text-slate-600">
                  {strongestSubject
                    ? `${strongestSubject.subjectName} is currently leading with ${strongestSubject.combinedPercentage}% combined performance.`
                    : "Recognition will appear here once published marks are available."}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4 text-sm shadow-sm">
                <p className="font-medium text-slate-900">Improvement target</p>
                <p className="mt-1 break-words text-slate-600">
                  {focusSubject
                    ? `${focusSubject.subjectName} needs the most attention right now. Use assignments, quizzes, and teacher feedback to move this subject upward.`
                    : "The next improvement target will appear once subject-level marks are published."}
                </p>
              </div>
              {reportCard.focusAreas.length ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm shadow-sm">
                  <div className="flex items-center gap-2 font-medium text-amber-900">
                    <Target className="h-4 w-4" />
                    Focus more here
                  </div>
                  <div className="mt-3 space-y-3">
                    {reportCard.focusAreas.map((item) => (
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

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Subject breakdown</CardTitle>
            <CardDescription>Academic performance blended across available exam, assessment, and assignment signals.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {reportCard.subjectBreakdown.length ? (
              reportCard.subjectBreakdown.map((subject) => (
                <div key={subject.subjectId} className="rounded-2xl border border-border/70 bg-background/70 p-4 text-sm shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words font-medium">{subject.subjectName}</p>
                      <p className="break-words text-muted-foreground">{subject.subjectCode}</p>
                    </div>
                    <Badge variant="outline">
                      {subject.combinedPercentage !== null ? `${subject.combinedPercentage}% combined` : "No marks yet"}
                    </Badge>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <MiniScore label="Exam" value={subject.examPercentage} />
                    <MiniScore label="Assessment" value={subject.assessmentPercentage} />
                    <MiniScore label="Assignment" value={subject.assignmentPercentage} />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No academic marks have been published for this portal account yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Combined score trend</CardTitle>
            <CardDescription>Quick scan of the current subject-level combined percentages.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, "Combined"]} />
                  <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MiniScore({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="min-w-0 rounded-2xl border px-4 py-3">
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value !== null ? `${value}%` : "Pending"}</p>
    </div>
  );
}

function getReportCardCommendation(
  grade: string,
  percentage: number,
  variant: "student" | "parent",
  studentName: string,
) {
  const normalizedGrade = grade.toUpperCase();

  if (normalizedGrade === "A+" || percentage >= 90) {
    return {
      label: "Academic distinction",
      title: variant === "parent" ? `${studentName} has earned standout recognition` : "You have earned standout recognition",
      description:
        variant === "parent"
          ? "This report card reflects topper-level work. Keep the momentum visible by maintaining consistency across tests, assignments, and attendance."
          : "This report card reflects topper-level work. Keep the momentum visible by staying consistent across tests, assignments, and attendance.",
      motivation:
        variant === "parent"
          ? "Celebrate the result, then protect it. High performers still need routine, not just praise."
          : "Excellent work. Now aim to keep every next result at the same standard.",
      icon: Trophy,
    };
  }

  if (normalizedGrade === "A" || percentage >= 80) {
    return {
      label: "Strong academic standing",
      title: variant === "parent" ? `${studentName} is close to distinction level` : "You are close to distinction level",
      description:
        variant === "parent"
          ? "This is a strong report card and it is close to the highest bracket. A more deliberate push on weaker subjects can turn this into top-tier performance."
          : "This is a strong report card and it is close to the highest bracket. A more deliberate push on weaker subjects can turn this into top-tier performance.",
      motivation:
        variant === "parent"
          ? "The student is doing well. The right next message is to aim higher, not relax."
          : "You are doing well. Push the weaker areas and move this into the A+ zone.",
      icon: Award,
    };
  }

  if (percentage >= 65) {
    return {
      label: "Growth stage",
      title: variant === "parent" ? `${studentName} is improving and can move higher` : "You are improving and can move higher",
      description:
        variant === "parent"
          ? "This report shows a workable base. More consistent follow-up on low-performing subjects can change the final outcome noticeably."
          : "This report shows a workable base. More consistent follow-up on low-performing subjects can change the final outcome noticeably.",
      motivation:
        variant === "parent"
          ? "Steady weekly effort matters here more than pressure. The student can climb from this position."
          : "Keep trying. Consistency from here can still move your grade and rank upward.",
      icon: Sparkles,
    };
  }

  return {
    label: "Recovery focus",
    title: variant === "parent" ? `${studentName} needs stronger academic support` : "You need stronger academic support",
    description:
      variant === "parent"
        ? "This report card should trigger support and structure, not discouragement. The portal should now be used to track every next improvement step."
        : "This report card should push you toward action, not discourage you. Use the portal to track every next improvement step.",
    motivation:
      variant === "parent"
        ? "Encourage steady effort and focus on one weak subject at a time."
        : "Try harder from here. Start with one weak subject, build confidence, then keep moving upward.",
    icon: Sparkles,
  };
}
