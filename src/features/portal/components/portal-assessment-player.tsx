"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Expand, FileCheck2, Flag, Minimize, Save, SendHorizonal } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/formatters";
import type { PortalAssessmentDetail, PortalAssessmentQuestion, PortalAssessmentSubmitResult } from "@/types/domain";

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

function isQuestionAnswered(question: PortalAssessmentQuestion, answers: AnswerState): boolean {
  const answer = answers[question.id];
  if (!answer) {
    return false;
  }
  if (question.type === "MCQ") {
    return Boolean(answer.selectedOptionId);
  }
  return Boolean(answer.answerText?.trim());
}

export function PortalAssessmentPlayer({ assessmentId }: PortalAssessmentPlayerProps) {
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState<AnswerState>({});
  const [submittedResult, setSubmittedResult] = useState<PortalAssessmentSubmitResult | null>(null);
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);
  const [reviewFlags, setReviewFlags] = useState<Record<string, boolean>>({});
  const [saveState, setSaveState] = useState<"idle" | "dirty" | "saving" | "saved">("idle");
  const [now, setNow] = useState(Date.now());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const query = useQuery({
    queryKey: ["portal-assessment", assessmentId],
    queryFn: () => portalApi.assessmentDetail(assessmentId),
  });

  useEffect(() => {
    if (query.data) {
      setAnswers(getInitialAnswers(query.data));
      setCurrentQuestionId((current) => current ?? query.data.questions[0]?.id ?? null);
    }
  }, [query.data]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

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
    onMutate: () => setSaveState("saving"),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["portal-assessment", assessmentId] });
      setSaveState("saved");
      toast.success("Progress saved.");
    },
    onError: (error) => {
      setSaveState("dirty");
      toast.error(normalizeApiError(error).message);
    },
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
      setSaveState("saved");
      await queryClient.invalidateQueries({ queryKey: ["portal-assessment", assessmentId] });
      await queryClient.invalidateQueries({ queryKey: ["portal-assessments"] });
      await queryClient.invalidateQueries({ queryKey: ["portal-dashboard"] });
      toast.success(result.requiresManualReview ? "Assessment submitted. Manual review is pending." : "Assessment submitted and graded.");
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const detail = query.data;
  const activeAttempt = detail?.activeAttempt;

  useEffect(() => {
    if (!activeAttempt || activeAttempt.status !== "IN_PROGRESS") {
      return;
    }
    if (saveState !== "dirty" || saveMutation.isPending) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      saveMutation.mutate(activeAttempt.id);
    }, 12000);

    return () => window.clearTimeout(timeoutId);
  }, [activeAttempt, saveMutation, saveState]);

  const countdown = useMemo(() => {
    if (!detail || !activeAttempt || activeAttempt.status !== "IN_PROGRESS") return null;
    const startedAt = new Date(activeAttempt.startedAt).getTime();
    const endAt = startedAt + detail.durationMinutes * 60 * 1000;
    const remainingMs = Math.max(endAt - now, 0);
    const totalSeconds = Math.floor(remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }, [activeAttempt, detail, now]);

  const questionStatus = useMemo(() => {
    if (!detail) {
      return [];
    }

    return detail.questions.map((question) => ({
      questionId: question.id,
      answered: isQuestionAnswered(question, answers),
      flagged: Boolean(reviewFlags[question.id]),
    }));
  }, [answers, detail, reviewFlags]);

  if (query.isLoading) {
    return <LoadingState rows={6} />;
  }

  if (query.isError || !detail) {
    return <ErrorState description="Assessment detail could not be loaded." onRetry={() => query.refetch()} />;
  }

  const latestResult =
    submittedResult ??
    (activeAttempt?.resultStatus
      ? {
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
        }
      : null);

  const answeredCount = detail.questions.filter((question) => isQuestionAnswered(question, answers)).length;
  const reviewCount = Object.values(reviewFlags).filter(Boolean).length;

  async function toggleFullscreen() {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      return;
    }
    await document.exitFullscreen();
  }

  function scrollToQuestion(questionId: string) {
    setCurrentQuestionId(questionId);
    document.getElementById(`assessment-question-${questionId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function updateAnswer(questionId: string, value: { selectedOptionId?: string; answerText?: string }) {
    setAnswers((current) => ({
      ...current,
      [questionId]: value,
    }));
    setSaveState("dirty");
  }

  function handleSubmitAttempt() {
    if (!activeAttempt) {
      return;
    }

    const unansweredQuestions = detail.questions.filter((question) => !isQuestionAnswered(question, answers));
    const confirmed = window.confirm(
      unansweredQuestions.length
        ? `You still have ${unansweredQuestions.length} unanswered question(s). Submit anyway?`
        : "Submit this assessment now?",
    );

    if (!confirmed) {
      return;
    }

    submitMutation.mutate(activeAttempt.id);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
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
            <Button type="button" variant="outline" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize className="mr-2 h-4 w-4" /> : <Expand className="mr-2 h-4 w-4" />}
              {isFullscreen ? "Exit focus mode" : "Focus mode"}
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
              <CardDescription>Save status</CardDescription>
              <CardTitle>
                {saveState === "dirty" ? "Unsaved changes" : saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved" : "Ready"}
              </CardTitle>
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
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
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
              </div>
              <div className="space-y-3">
                {detail.questions.map((question, index) => {
                  const answer = latestResult.answers.find((item) => item.questionId === question.id);
                  return (
                    <div key={question.id} className="rounded-2xl border border-dashed p-4 text-sm">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">
                            Q{index + 1}. {question.prompt}
                          </p>
                          <p className="mt-1 text-muted-foreground">
                            {answer?.answerText ?? question.options.find((option) => option.id === answer?.selectedOptionId)?.text ?? "No answer submitted"}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={answer?.isCorrect === true ? "success" : answer?.isCorrect === false ? "warning" : "outline"}>
                            {answer?.isCorrect === true ? "Correct" : answer?.isCorrect === false ? "Needs review / Incorrect" : "Pending"}
                          </Badge>
                          <Badge variant="outline">{answer?.awardedMarks ?? 0} marks</Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ) : null}

        <div className="space-y-4">
          {detail.questions.map((question) => (
            <Card key={question.id} id={`assessment-question-${question.id}`} className={cn(currentQuestionId === question.id ? "ring-2 ring-sky-500/60" : "")}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">
                      Q{question.orderIndex}. {question.prompt}
                    </CardTitle>
                    {question.helperText ? <CardDescription>{question.helperText}</CardDescription> : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {question.type.replaceAll("_", " ")} · {question.marks} marks
                    </Badge>
                    {activeAttempt?.status === "IN_PROGRESS" ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setReviewFlags((current) => ({
                            ...current,
                            [question.id]: !current[question.id],
                          }))
                        }
                      >
                        <Flag className="mr-2 h-4 w-4" />
                        {reviewFlags[question.id] ? "Unmark review" : "Mark for review"}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {question.type === "MCQ"
                  ? question.options.map((option) => (
                      <label key={option.id} className="flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm">
                        <input
                          type="radio"
                          name={question.id}
                          checked={answers[question.id]?.selectedOptionId === option.id}
                          onChange={() => updateAnswer(question.id, { selectedOptionId: option.id })}
                          disabled={activeAttempt?.status !== "IN_PROGRESS"}
                        />
                        <span>{option.text}</span>
                      </label>
                    ))
                  : null}

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
                          onChange={() => updateAnswer(question.id, { answerText: option.value })}
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
                    onChange={(event) => updateAnswer(question.id, { answerText: event.target.value })}
                    disabled={activeAttempt?.status !== "IN_PROGRESS"}
                    placeholder="Type your answer"
                  />
                ) : null}

                {question.type === "LONG_ANSWER" ? (
                  <Textarea
                    value={answers[question.id]?.answerText ?? ""}
                    onChange={(event) => updateAnswer(question.id, { answerText: event.target.value })}
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
              <Save className="mr-2 h-4 w-4" />
              {saveMutation.isPending ? "Saving..." : "Save progress"}
            </Button>
            <Button onClick={handleSubmitAttempt} disabled={submitMutation.isPending}>
              <SendHorizonal className="mr-2 h-4 w-4" />
              {submitMutation.isPending ? "Submitting..." : "Submit assessment"}
            </Button>
          </div>
        ) : null}
      </div>

      <div className="space-y-4">
        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle>Attempt guide</CardTitle>
            <CardDescription>Track progress and jump between questions quickly.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-2xl border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Timer</p>
                <p className="mt-1 text-xl font-semibold">{countdown ?? "Not started"}</p>
              </div>
              <div className="rounded-2xl border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Answered</p>
                <p className="mt-1 text-xl font-semibold">
                  {answeredCount}/{detail.questionCount}
                </p>
              </div>
              <div className="rounded-2xl border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Marked for review</p>
                <p className="mt-1 text-xl font-semibold">{reviewCount}</p>
              </div>
              <div className="rounded-2xl border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Mode</p>
                <p className="mt-1 text-xl font-semibold">{isFullscreen ? "Focus" : "Standard"}</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">Question palette</p>
              <div className="grid grid-cols-5 gap-2">
                {detail.questions.map((question) => {
                  const status = questionStatus.find((item) => item.questionId === question.id);
                  return (
                    <button
                      key={question.id}
                      type="button"
                      onClick={() => scrollToQuestion(question.id)}
                      className={cn(
                        "rounded-xl border px-3 py-2 text-sm font-medium transition",
                        currentQuestionId === question.id && "border-sky-500 bg-sky-50 text-sky-700",
                        currentQuestionId !== question.id && status?.answered && "border-emerald-300 bg-emerald-50 text-emerald-700",
                        currentQuestionId !== question.id && !status?.answered && "border-border bg-card text-foreground",
                        status?.flagged && "ring-2 ring-amber-300",
                      )}
                    >
                      {question.orderIndex}
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1">Answered</span>
                <span className="rounded-full border border-border px-3 py-1">Unanswered</span>
                <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1">Review flag</span>
              </div>
            </div>

            <div className="rounded-2xl border border-dashed p-3 text-sm text-muted-foreground">
              Autosave runs after you make changes, and you can still use manual save before final submission.
            </div>
            {latestResult ? (
              <div className="rounded-2xl border border-dashed p-3 text-sm">
                <div className="flex items-center gap-2 font-medium">
                  <FileCheck2 className="h-4 w-4 text-emerald-600" />
                  Result summary available
                </div>
                <p className="mt-2 text-muted-foreground">Scroll up to review question-wise marks and correctness feedback.</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
