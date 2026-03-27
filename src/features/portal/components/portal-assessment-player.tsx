"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { portalApi } from "@/features/portal/api/portal-api";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { normalizeApiError } from "@/lib/api/errors";
import { formatDate } from "@/lib/formatters";
import type { PortalAssessmentDetail, PortalAssessmentSubmitResult } from "@/types/domain";

interface PortalAssessmentPlayerProps {
  assessmentId: string;
}

type AnswerState = Record<string, { selectedOptionId?: string; answerText?: string }>;

function getInitialAnswers(detail: PortalAssessmentDetail): AnswerState {
  const attemptAnswers = detail.activeAttempt?.answers ?? [];
  return Object.fromEntries(
    attemptAnswers.map((answer) => [
      answer.questionId,
      {
        selectedOptionId: answer.selectedOptionId ?? undefined,
        answerText: answer.answerText ?? undefined,
      },
    ]),
  );
}

export function PortalAssessmentPlayer({ assessmentId }: PortalAssessmentPlayerProps) {
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState<AnswerState>({});
  const [submittedResult, setSubmittedResult] = useState<PortalAssessmentSubmitResult | null>(null);
  const query = useQuery({
    queryKey: ["portal-assessment", assessmentId],
    queryFn: () => portalApi.assessmentDetail(assessmentId),
  });

  useEffect(() => {
    if (query.data) {
      setAnswers(getInitialAnswers(query.data));
    }
  }, [query.data]);

  const startMutation = useMutation({
    mutationFn: () => portalApi.startAssessment(assessmentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["portal-assessment", assessmentId] });
      await queryClient.invalidateQueries({ queryKey: ["portal-assessments"] });
      toast.success("Assessment attempt is ready.");
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const saveMutation = useMutation({
    mutationFn: (attemptId: string) =>
      portalApi.saveAssessmentAnswers(attemptId, {
        answers: Object.entries(answers).map(([questionId, value]) => ({
          questionId,
          selectedOptionId: value.selectedOptionId,
          answerText: value.answerText,
        })),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["portal-assessment", assessmentId] });
      toast.success("Progress saved.");
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const submitMutation = useMutation({
    mutationFn: async (attemptId: string) => {
      await portalApi.saveAssessmentAnswers(attemptId, {
        answers: Object.entries(answers).map(([questionId, value]) => ({
          questionId,
          selectedOptionId: value.selectedOptionId,
          answerText: value.answerText,
        })),
      });
      return portalApi.submitAssessment(attemptId);
    },
    onSuccess: async (result) => {
      setSubmittedResult(result);
      await queryClient.invalidateQueries({ queryKey: ["portal-assessment", assessmentId] });
      await queryClient.invalidateQueries({ queryKey: ["portal-assessments"] });
      await queryClient.invalidateQueries({ queryKey: ["portal-dashboard"] });
      toast.success(result.requiresManualReview ? "Assessment submitted. Manual review is pending." : "Assessment submitted and graded.");
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const detail = query.data;
  const activeAttempt = detail?.activeAttempt;
  const countdown = useMemo(() => {
    if (!detail || !activeAttempt || activeAttempt.status !== "IN_PROGRESS") return null;
    const startedAt = new Date(activeAttempt.startedAt).getTime();
    const endAt = startedAt + detail.durationMinutes * 60 * 1000;
    const remainingMs = Math.max(endAt - Date.now(), 0);
    const totalSeconds = Math.floor(remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }, [activeAttempt, detail]);

  if (query.isLoading) {
    return <LoadingState rows={6} />;
  }

  if (query.isError || !detail) {
    return <ErrorState description="Assessment detail could not be loaded." onRetry={() => query.refetch()} />;
  }

  const latestResult = submittedResult ?? (activeAttempt?.resultStatus ? {
    attemptId: activeAttempt.id,
    status: activeAttempt.resultStatus,
    requiresManualReview: activeAttempt.requiresManualReview,
    obtainedMarks: activeAttempt.obtainedMarks ?? 0,
    totalMarks: activeAttempt.totalMarks ?? detail.totalMarks,
    percentage: activeAttempt.percentage ?? 0,
    correctAnswers: activeAttempt.answers.filter((answer) => answer.isCorrect === true).length,
    incorrectAnswers: activeAttempt.answers.filter((answer) => answer.isCorrect === false).length,
    unansweredCount: detail.questionCount - activeAttempt.answers.length,
    answers: activeAttempt.answers,
  } : null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">Student assessments</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{detail.title}</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            {detail.subjectName} · {detail.batchName} · {detail.type}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/portal/student/assessments">Back to assessments</Link>
          </Button>
          {!activeAttempt || activeAttempt.status !== "IN_PROGRESS" ? (
            <Button onClick={() => startMutation.mutate()} disabled={startMutation.isPending}>
              {startMutation.isPending ? "Preparing..." : activeAttempt ? "Start new attempt" : "Start assessment"}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Duration</CardDescription>
            <CardTitle>{detail.durationMinutes} minutes</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Marks</CardDescription>
            <CardTitle>
              {detail.totalMarks} total · {detail.passMarks} pass
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Attempt window</CardDescription>
            <CardTitle>{detail.availableUntil ? formatDate(detail.availableUntil) : "Open schedule"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active timer</CardDescription>
            <CardTitle>{countdown ?? "Not started"}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {detail.instructions ? (
        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{detail.instructions}</p>
          </CardContent>
        </Card>
      ) : null}

      {latestResult ? (
        <Card className="border-emerald-200 bg-emerald-50/40">
          <CardHeader>
            <CardTitle>Latest result</CardTitle>
            <CardDescription>
              {latestResult.requiresManualReview
                ? "Objective answers were graded. Subjective answers still require teacher review."
                : "Your latest attempt has been graded."}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Score</p>
              <p className="mt-1 text-2xl font-semibold">
                {latestResult.obtainedMarks}/{latestResult.totalMarks}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Percentage</p>
              <p className="mt-1 text-2xl font-semibold">{latestResult.percentage}%</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Correct</p>
              <p className="mt-1 text-2xl font-semibold">{latestResult.correctAnswers}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
              <div className="mt-2">
                <Badge variant={latestResult.status === "FINALIZED" ? "success" : "warning"}>{latestResult.status}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-4">
        {detail.questions.map((question) => (
          <Card key={question.id}>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg">
                    Q{question.orderIndex}. {question.prompt}
                  </CardTitle>
                  {question.helperText ? <CardDescription>{question.helperText}</CardDescription> : null}
                </div>
                <Badge variant="outline">
                  {question.type.replaceAll("_", " ")} · {question.marks} marks
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {question.type === "MCQ" ? (
                question.options.map((option) => (
                  <label key={option.id} className="flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm">
                    <input
                      type="radio"
                      name={question.id}
                      checked={answers[question.id]?.selectedOptionId === option.id}
                      onChange={() =>
                        setAnswers((current) => ({
                          ...current,
                          [question.id]: { selectedOptionId: option.id },
                        }))
                      }
                      disabled={activeAttempt?.status !== "IN_PROGRESS"}
                    />
                    <span>{option.text}</span>
                  </label>
                ))
              ) : null}

              {question.type === "TRUE_FALSE" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { value: "true", label: "True" },
                    { value: "false", label: "False" },
                  ].map((option) => (
                    <label key={option.value} className="flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm">
                      <input
                        type="radio"
                        name={question.id}
                        checked={answers[question.id]?.answerText === option.value}
                        onChange={() =>
                          setAnswers((current) => ({
                            ...current,
                            [question.id]: { answerText: option.value },
                          }))
                        }
                        disabled={activeAttempt?.status !== "IN_PROGRESS"}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              ) : null}

              {question.type === "FILL_IN_THE_BLANK" || question.type === "SHORT_ANSWER" ? (
                <Input
                  value={answers[question.id]?.answerText ?? ""}
                  onChange={(event) =>
                    setAnswers((current) => ({
                      ...current,
                      [question.id]: { answerText: event.target.value },
                    }))
                  }
                  disabled={activeAttempt?.status !== "IN_PROGRESS"}
                  placeholder="Type your answer"
                />
              ) : null}

              {question.type === "LONG_ANSWER" ? (
                <Textarea
                  value={answers[question.id]?.answerText ?? ""}
                  onChange={(event) =>
                    setAnswers((current) => ({
                      ...current,
                      [question.id]: { answerText: event.target.value },
                    }))
                  }
                  disabled={activeAttempt?.status !== "IN_PROGRESS"}
                  className="min-h-[160px]"
                  placeholder="Write your answer"
                />
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      {activeAttempt?.status === "IN_PROGRESS" ? (
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="outline" onClick={() => saveMutation.mutate(activeAttempt.id)} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Saving..." : "Save progress"}
          </Button>
          <Button onClick={() => submitMutation.mutate(activeAttempt.id)} disabled={submitMutation.isPending}>
            {submitMutation.isPending ? "Submitting..." : "Submit assessment"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
