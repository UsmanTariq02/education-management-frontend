"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { BarChart3, BookCopy, Clock3, FileQuestion, FileUp, LibraryBig, ListChecks, MessageSquareText, Sparkles } from "lucide-react";
import { useFieldArray, useForm, useWatch, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { toast } from "sonner";
import { academicSessionsApi } from "@/features/academic-sessions/api/academic-sessions-api";
import { parseImportedQuestions } from "@/features/assessments/import-tools";
import { assessmentsApi } from "@/features/assessments/api/assessments-api";
import { assessmentSchema, type AssessmentSchema } from "@/features/assessments/schemas/assessment-schema";
import {
  clearGradingWorkspace,
  readAssessmentDraft,
  readGradingWorkspace,
  readQuestionBank,
  writeAssessmentDraft,
  writeGradingWorkspace,
  writeQuestionBank,
  type GradingWorkspaceState,
  type QuestionBankEntry,
} from "@/features/assessments/storage";
import { batchesApi } from "@/features/batches/api/batches-api";
import { subjectsApi } from "@/features/subjects/api/subjects-api";
import { teachersApi } from "@/features/teachers/api/teachers-api";
import { MetricCard } from "@/components/cards/metric-card";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { FormField } from "@/components/forms/form-field";
import { OrganizationScopeBanner } from "@/components/shared/organization-scope-banner";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { FilterBar } from "@/components/shared/filter-bar";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { usePermission } from "@/hooks/use-permission";
import { normalizeApiError } from "@/lib/api/errors";
import { formatDate } from "@/lib/formatters";
import type { Assessment } from "@/types/domain";

const QUESTION_TYPE_OPTIONS = [
  { value: "MCQ", label: "MCQ" },
  { value: "TRUE_FALSE", label: "True / False" },
  { value: "FILL_IN_THE_BLANK", label: "Fill In The Blank" },
  { value: "SHORT_ANSWER", label: "Short Answer" },
  { value: "LONG_ANSWER", label: "Long Answer" },
] as const;

const defaultQuestion = (): AssessmentSchema["questions"][number] => ({
  type: "MCQ",
  prompt: "",
  helperText: "",
  explanation: "",
  marks: 1,
  acceptedAnswersText: "",
  options: [
    { text: "", isCorrect: true },
    { text: "", isCorrect: false },
  ],
});

const defaultAssessmentValues: AssessmentSchema = {
  academicSessionId: "",
  batchId: "",
  subjectId: "",
  teacherId: "",
  title: "",
  code: "",
  description: "",
  instructions: "",
  type: "QUIZ",
  status: "DRAFT",
  durationMinutes: 30,
  passMarks: 0,
  startsAt: "",
  endsAt: "",
  availableFrom: "",
  availableUntil: "",
  shuffleQuestions: false,
  shuffleOptions: false,
  showResultImmediately: true,
  allowMultipleAttempts: false,
  maxAttempts: 1,
  negativeMarkingEnabled: false,
  negativeMarkingPerWrong: 0,
  questions: [defaultQuestion()],
};

interface QuestionEditorProps {
  control: Control<AssessmentSchema>;
  register: UseFormRegister<AssessmentSchema>;
  errors: FieldErrors<AssessmentSchema>;
  index: number;
  onRemove: () => void;
  onSaveToBank: () => void;
}

function QuestionEditor({ control, register, errors, index, onRemove, onSaveToBank }: QuestionEditorProps) {
  const optionsFieldArray = useFieldArray({
    control,
    name: `questions.${index}.options`,
  });
  const questionType = useWatch({ control, name: `questions.${index}.type` });
  const questionError = errors.questions?.[index];

  return (
    <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="font-medium">Question {index + 1}</p>
          <p className="text-xs text-muted-foreground">Define the prompt and evaluation rules.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={onSaveToBank}>
            Save To Bank
          </Button>
          <Button type="button" variant="outline" onClick={onRemove}>
            Remove
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <FormField label="Type" error={questionError?.type}>
          <NativeSelect {...register(`questions.${index}.type`)}>
            {QUESTION_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect>
        </FormField>
        <FormField label="Marks" error={questionError?.marks}>
          <Input type="number" step="0.5" min="0" {...register(`questions.${index}.marks`)} />
        </FormField>
      </div>
      <div className="mt-4 grid gap-4">
        <FormField label="Prompt" error={questionError?.prompt} required>
          <Textarea {...register(`questions.${index}.prompt`)} className="min-h-[90px]" />
        </FormField>
        <FormField label="Helper text" error={questionError?.helperText}>
          <Input {...register(`questions.${index}.helperText`)} placeholder="Optional guidance for the student" />
        </FormField>
        <FormField label="Explanation" error={questionError?.explanation}>
          <Textarea {...register(`questions.${index}.explanation`)} className="min-h-[80px]" />
        </FormField>
      </div>

      {questionType === "MCQ" ? (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Options</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => optionsFieldArray.append({ text: "", isCorrect: false })}
            >
              Add option
            </Button>
          </div>
          {optionsFieldArray.fields.map((field, optionIndex) => {
            const optionError = questionError?.options?.[optionIndex];
            return (
              <div key={field.id} className="grid gap-3 rounded-xl border border-dashed p-3 md:grid-cols-[1fr_auto_auto]">
                <FormField label={`Option ${optionIndex + 1}`} error={optionError?.text}>
                  <Input {...register(`questions.${index}.options.${optionIndex}.text`)} />
                </FormField>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm">
                    <Checkbox {...register(`questions.${index}.options.${optionIndex}.isCorrect`)} />
                    Correct
                  </label>
                </div>
                <div className="flex items-end">
                  <Button type="button" variant="outline" onClick={() => optionsFieldArray.remove(optionIndex)}>
                    Remove
                  </Button>
                </div>
              </div>
            );
          })}
          {typeof questionError?.options?.message === "string" ? (
            <p className="text-xs text-destructive">{questionError.options.message}</p>
          ) : null}
        </div>
      ) : null}

      {questionType === "TRUE_FALSE" ? (
        <div className="mt-4">
          <FormField label="Correct answer" error={questionError?.correctBooleanAnswer}>
            <NativeSelect
              {...register(`questions.${index}.correctBooleanAnswer`, {
                setValueAs: (value) => (value === "" ? undefined : value === "true"),
              })}
            >
              <option value="">Select the correct answer</option>
              <option value="true">True</option>
              <option value="false">False</option>
            </NativeSelect>
          </FormField>
        </div>
      ) : null}

      {questionType === "FILL_IN_THE_BLANK" ? (
        <div className="mt-4">
          <FormField label="Accepted answers" error={questionError?.acceptedAnswersText}>
            <Input
              {...register(`questions.${index}.acceptedAnswersText`)}
              placeholder="e.g. photosynthesis, Photo Synthesis"
            />
          </FormField>
        </div>
      ) : null}
    </div>
  );
}

export default function AssessmentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [detailView, setDetailView] = useState<"overview" | "grading" | "analytics" | "bank">("overview");
  const [questionBank, setQuestionBank] = useState<QuestionBankEntry[]>([]);
  const [gradingWorkspace, setGradingWorkspace] = useState<GradingWorkspaceState>({});
  const [importText, setImportText] = useState("");
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [hasStoredDraft, setHasStoredDraft] = useState(false);
  const debouncedSearch = useDebouncedValue(search);
  const canCreate = usePermission("assessments.create");
  const canManage = usePermission("assessments.update");

  const assessmentsQuery = useQuery({
    queryKey: ["assessments", debouncedSearch, pageIndex],
    queryFn: () => assessmentsApi.list({ page: pageIndex + 1, limit: 10, search: debouncedSearch }),
  });
  const sessionsQuery = useQuery({ queryKey: ["academic-sessions", "assessment-options"], queryFn: () => academicSessionsApi.list({ page: 1, limit: 100 }) });
  const batchesQuery = useQuery({ queryKey: ["batches", "assessment-options"], queryFn: () => batchesApi.list({ page: 1, limit: 100 }) });
  const subjectsQuery = useQuery({ queryKey: ["subjects", "assessment-options"], queryFn: () => subjectsApi.list({ page: 1, limit: 100 }) });
  const teachersQuery = useQuery({ queryKey: ["teachers", "assessment-options"], queryFn: () => teachersApi.list({ page: 1, limit: 100 }) });

  const form = useForm<AssessmentSchema>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: defaultAssessmentValues,
  });
  const watchedForm = useWatch({ control: form.control });

  const questionsFieldArray = useFieldArray({
    control: form.control,
    name: "questions",
  });

  useEffect(() => {
    setQuestionBank(readQuestionBank());
    setHasStoredDraft(Boolean(readAssessmentDraft()));
  }, []);

  useEffect(() => {
    if (!selectedAssessment) {
      setGradingWorkspace({});
      return;
    }

    setGradingWorkspace(readGradingWorkspace(selectedAssessment.id));
  }, [selectedAssessment]);

  useEffect(() => {
    if (!open || editingAssessment) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      writeAssessmentDraft(watchedForm as AssessmentSchema);
      setHasStoredDraft(true);
      setDraftSavedAt(new Date().toISOString());
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [editingAssessment, open, watchedForm]);

  const mutation = useMutation({
    mutationFn: async (values: AssessmentSchema) => {
      const payload = {
        ...values,
        academicSessionId: values.academicSessionId || undefined,
        teacherId: values.teacherId || undefined,
        description: values.description || undefined,
        instructions: values.instructions || undefined,
        startsAt: values.startsAt || undefined,
        endsAt: values.endsAt || undefined,
        availableFrom: values.availableFrom || undefined,
        availableUntil: values.availableUntil || undefined,
        negativeMarkingPerWrong: values.negativeMarkingEnabled ? values.negativeMarkingPerWrong ?? 0 : undefined,
        maxAttempts: values.allowMultipleAttempts ? values.maxAttempts : 1,
        questions: values.questions.map((question) => ({
          type: question.type,
          prompt: question.prompt,
          helperText: question.helperText || undefined,
          explanation: question.explanation || undefined,
          marks: question.marks,
          correctBooleanAnswer: question.type === "TRUE_FALSE" ? question.correctBooleanAnswer === true : undefined,
          acceptedAnswers:
            question.type === "FILL_IN_THE_BLANK"
              ? (question.acceptedAnswersText ?? "")
                  .split(",")
                  .map((value) => value.trim())
                  .filter(Boolean)
              : undefined,
          options:
            question.type === "MCQ"
              ? question.options.map((option) => ({
                  text: option.text,
                  isCorrect: option.isCorrect,
                }))
              : undefined,
        })),
      };

      if (editingAssessment) {
        return assessmentsApi.update(editingAssessment.id, payload);
      }
      return assessmentsApi.create(payload);
    },
    onSuccess: () => {
      toast.success(editingAssessment ? "Assessment updated" : "Assessment created");
      queryClient.invalidateQueries({ queryKey: ["assessments"] });
      setOpen(false);
      setEditingAssessment(null);
      form.reset(defaultAssessmentValues);
      writeAssessmentDraft(null);
      setHasStoredDraft(false);
      setDraftSavedAt(null);
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  function restoreDraft() {
    const draft = readAssessmentDraft();
    if (!draft) {
      toast.error("No saved draft was found.");
      return;
    }

    form.reset(draft);
    setDraftSavedAt(new Date().toISOString());
    toast.success("Draft restored.");
  }

  function addCurrentQuestionToBank(index: number) {
    const question = form.getValues(`questions.${index}`);
    const title = question.prompt.trim() || `Question ${index + 1}`;
    const nextBank = [
      {
        id: crypto.randomUUID(),
        title,
        question,
        createdAt: new Date().toISOString(),
      },
      ...questionBank,
    ].slice(0, 24);
    setQuestionBank(nextBank);
    writeQuestionBank(nextBank);
    toast.success("Question saved to the local question bank.");
  }

  function insertQuestionFromBank(entry: QuestionBankEntry) {
    questionsFieldArray.append(entry.question);
    toast.success(`Added "${entry.title}" from the question bank.`);
  }

  function removeQuestionBankEntry(id: string) {
    const nextBank = questionBank.filter((entry) => entry.id !== id);
    setQuestionBank(nextBank);
    writeQuestionBank(nextBank);
  }

  function importQuestions() {
    try {
      const importedQuestions = parseImportedQuestions(importText);
      if (!importedQuestions.length) {
        toast.error("No importable questions were found.");
        return;
      }
      questionsFieldArray.append(importedQuestions);
      setImportText("");
      toast.success(`${importedQuestions.length} question(s) imported into the builder.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Question import failed.");
    }
  }

  function updateGradingWorkspace(
    questionId: string,
    patch: Partial<{
      rubricNote: string;
      suggestedFeedback: string;
      reviewPriority: "LOW" | "MEDIUM" | "HIGH";
      expectedScore: number;
    }>,
  ) {
    if (!selectedAssessment) {
      return;
    }

    const nextState = {
      ...gradingWorkspace,
      [questionId]: {
        rubricNote: gradingWorkspace[questionId]?.rubricNote ?? "",
        suggestedFeedback: gradingWorkspace[questionId]?.suggestedFeedback ?? "",
        reviewPriority: gradingWorkspace[questionId]?.reviewPriority ?? "MEDIUM",
        expectedScore: gradingWorkspace[questionId]?.expectedScore ?? 0,
        ...patch,
      },
    };

    setGradingWorkspace(nextState);
    writeGradingWorkspace(selectedAssessment.id, nextState);
  }

  const assessments = assessmentsQuery.data?.items ?? [];
  const stats = useMemo(
    () => ({
      total: assessments.length,
      published: assessments.filter((assessment) => assessment.status === "PUBLISHED").length,
      objectiveReady: assessments.filter((assessment) => assessment.showResultImmediately).length,
      totalQuestions: assessments.reduce((sum, assessment) => sum + assessment.questionCount, 0),
    }),
    [assessments],
  );

  const analytics = useMemo(() => {
    const allQuestions = assessments.flatMap((assessment) => assessment.questions);
    const typeCounts = QUESTION_TYPE_OPTIONS.map((option) => ({
      type: option.value,
      total: allQuestions.filter((question) => question.type === option.value).length,
    }));
    const subjectiveCount = allQuestions.filter((question) => ["SHORT_ANSWER", "LONG_ANSWER"].includes(question.type)).length;
    const objectiveCount = allQuestions.length - subjectiveCount;

    return {
      subjectiveCount,
      objectiveCount,
      typeCounts,
      averageQuestions: assessments.length ? Number((stats.totalQuestions / assessments.length).toFixed(1)) : 0,
      gradingHeavyAssessments: assessments.filter(
        (assessment) => assessment.questions.filter((question) => ["SHORT_ANSWER", "LONG_ANSWER"].includes(question.type)).length >= 2,
      ).length,
    };
  }, [assessments, stats.totalQuestions]);

  const selectedAssessmentInsights = useMemo(() => {
    if (!selectedAssessment) {
      return null;
    }

    const subjectiveQuestions = selectedAssessment.questions.filter((question) => ["SHORT_ANSWER", "LONG_ANSWER"].includes(question.type));
    const objectiveQuestions = selectedAssessment.questions.filter((question) => !["SHORT_ANSWER", "LONG_ANSWER"].includes(question.type));
    const totalMarks = selectedAssessment.questions.reduce((sum, question) => sum + question.marks, 0);

    return {
      subjectiveQuestions,
      objectiveQuestions,
      objectiveCoverage: totalMarks ? Number(((objectiveQuestions.reduce((sum, question) => sum + question.marks, 0) / totalMarks) * 100).toFixed(1)) : 0,
      subjectiveCoverage: totalMarks ? Number(((subjectiveQuestions.reduce((sum, question) => sum + question.marks, 0) / totalMarks) * 100).toFixed(1)) : 0,
      gradingTemplatesReady: subjectiveQuestions.filter((question) => gradingWorkspace[question.id]?.rubricNote?.trim()).length,
    };
  }, [gradingWorkspace, selectedAssessment]);

  const columns = useMemo<Array<ColumnDef<Assessment>>>(
    () => [
      {
        accessorKey: "title",
        header: "Assessment",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.title}</p>
            <p className="text-xs text-muted-foreground">
              {row.original.code} • {row.original.type.replaceAll("_", " ")}
            </p>
          </div>
        ),
      },
      { accessorKey: "batchName", header: "Batch" },
      { accessorKey: "subjectName", header: "Subject" },
      {
        accessorKey: "questionCount",
        header: "Questions",
        cell: ({ row }) => <Badge variant="outline">{row.original.questionCount}</Badge>,
      },
      {
        accessorKey: "durationMinutes",
        header: "Duration",
        cell: ({ row }) => `${row.original.durationMinutes} min`,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.status === "PUBLISHED" ? "success" : row.original.status === "CLOSED" ? "warning" : "outline"}>
            {row.original.status}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setSelectedAssessment(row.original)}>
              View
            </Button>
            {canManage ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingAssessment(row.original);
                  form.reset({
                    academicSessionId: row.original.academicSessionId ?? "",
                    batchId: row.original.batchId,
                    subjectId: row.original.subjectId,
                    teacherId: row.original.teacherId ?? "",
                    title: row.original.title,
                    code: row.original.code,
                    description: row.original.description ?? "",
                    instructions: row.original.instructions ?? "",
                    type: row.original.type,
                    status: row.original.status,
                    durationMinutes: row.original.durationMinutes,
                    passMarks: row.original.passMarks,
                    startsAt: row.original.startsAt ? row.original.startsAt.slice(0, 16) : "",
                    endsAt: row.original.endsAt ? row.original.endsAt.slice(0, 16) : "",
                    availableFrom: row.original.availableFrom ? row.original.availableFrom.slice(0, 16) : "",
                    availableUntil: row.original.availableUntil ? row.original.availableUntil.slice(0, 16) : "",
                    shuffleQuestions: row.original.shuffleQuestions,
                    shuffleOptions: row.original.shuffleOptions,
                    showResultImmediately: row.original.showResultImmediately,
                    allowMultipleAttempts: row.original.allowMultipleAttempts,
                    maxAttempts: row.original.maxAttempts,
                    negativeMarkingEnabled: row.original.negativeMarkingEnabled,
                    negativeMarkingPerWrong: row.original.negativeMarkingPerWrong ?? 0,
                    questions: row.original.questions.map((question) => ({
                      type: question.type,
                      prompt: question.prompt,
                      helperText: question.helperText ?? "",
                      explanation: question.explanation ?? "",
                      marks: question.marks,
                      acceptedAnswersText: question.acceptedAnswers.join(", "),
                      correctBooleanAnswer: question.correctBooleanAnswer ?? undefined,
                      options:
                        question.type === "MCQ" && question.options.length
                          ? question.options.map((option) => ({ text: option.text, isCorrect: option.isCorrect }))
                          : question.type === "MCQ"
                            ? [
                                { text: "", isCorrect: true },
                                { text: "", isCorrect: false },
                              ]
                            : [],
                    })),
                  });
                  setOpen(true);
                }}
              >
                Edit
              </Button>
            ) : null}
          </div>
        ),
      },
    ],
    [canManage, form],
  );

  if ([assessmentsQuery, sessionsQuery, batchesQuery, subjectsQuery, teachersQuery].some((query) => query.isLoading)) {
    return <LoadingState rows={6} />;
  }

  if ([assessmentsQuery, sessionsQuery, batchesQuery, subjectsQuery, teachersQuery].some((query) => query.isError) || !assessmentsQuery.data) {
    return <ErrorState description="Assessment planning data could not be loaded." onRetry={() => assessmentsQuery.refetch()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Academics"
        title="Assessment studio"
        description="Create system-based quizzes and tests with mixed question types and immediate objective result settings."
      />
      <OrganizationScopeBanner moduleLabel="Assessment operations" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Visible assessments" value={String(stats.total)} helper="Items in the current table scope" icon={FileQuestion} tone="sky" />
        <MetricCard title="Published" value={String(stats.published)} helper="Live for students or ready for release" icon={Sparkles} tone="emerald" />
        <MetricCard title="Immediate results" value={String(stats.objectiveReady)} helper="Configured to reveal results instantly" icon={ListChecks} tone="amber" />
        <MetricCard title="Question bank" value={String(stats.totalQuestions)} helper="Questions across visible assessments" icon={Clock3} tone="violet" />
      </div>

      <FilterBar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPageIndex(0);
        }}
        searchPlaceholder="Search assessments by title, code, batch, or subject..."
        action={
          canCreate || canManage ? (
            <Dialog open={open} onOpenChange={setOpen}>
              {canCreate ? (
                <DialogTrigger asChild>
                  <Button>Create assessment</Button>
                </DialogTrigger>
              ) : null}
              <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingAssessment ? "Edit assessment" : "Create assessment"}</DialogTitle>
                  <DialogDescription>
                    Set up the structure, schedule, and question model for a system-based test.
                  </DialogDescription>
                </DialogHeader>
                <form
                  className="space-y-6"
                  onSubmit={form.handleSubmit((values) => {
                    mutation.mutate(values);
                  })}
                >
                  {!editingAssessment ? (
                    <div className="grid gap-3 rounded-2xl border border-dashed border-sky-200 bg-sky-50/60 p-4 md:grid-cols-[1fr_auto_auto] md:items-center">
                      <div>
                        <p className="font-medium text-sky-900">Draft-safe studio</p>
                        <p className="text-sm text-sky-800/80">
                          {hasStoredDraft
                            ? `A local draft is available${draftSavedAt ? ` · last saved ${formatDate(draftSavedAt, "MMM d, yyyy p")}` : ""}.`
                            : "New assessments autosave locally while you build them."}
                        </p>
                      </div>
                      <Button type="button" variant="outline" onClick={restoreDraft} disabled={!hasStoredDraft}>
                        Restore Draft
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          writeAssessmentDraft(null);
                          setHasStoredDraft(false);
                          setDraftSavedAt(null);
                          form.reset(defaultAssessmentValues);
                        }}
                      >
                        Reset Builder
                      </Button>
                    </div>
                  ) : null}

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <FormField label="Title" error={form.formState.errors.title} required>
                      <Input {...form.register("title")} />
                    </FormField>
                    <FormField label="Code" error={form.formState.errors.code} required>
                      <Input {...form.register("code")} />
                    </FormField>
                    <FormField label="Type" error={form.formState.errors.type}>
                      <NativeSelect {...form.register("type")}>
                        <option value="QUIZ">Quiz</option>
                        <option value="TEST">Test</option>
                        <option value="ASSIGNMENT">Assignment</option>
                        <option value="PRACTICE">Practice</option>
                      </NativeSelect>
                    </FormField>
                    <FormField label="Status" error={form.formState.errors.status}>
                      <NativeSelect {...form.register("status")}>
                        <option value="DRAFT">Draft</option>
                        <option value="PUBLISHED">Published</option>
                        <option value="CLOSED">Closed</option>
                      </NativeSelect>
                    </FormField>
                    <FormField label="Batch" error={form.formState.errors.batchId} required>
                      <NativeSelect {...form.register("batchId")}>
                        <option value="">Select batch</option>
                        {batchesQuery.data?.items.map((batch) => (
                          <option key={batch.id} value={batch.id}>
                            {batch.name}
                          </option>
                        ))}
                      </NativeSelect>
                    </FormField>
                    <FormField label="Subject" error={form.formState.errors.subjectId} required>
                      <NativeSelect {...form.register("subjectId")}>
                        <option value="">Select subject</option>
                        {subjectsQuery.data?.items.map((subject) => (
                          <option key={subject.id} value={subject.id}>
                            {subject.name}
                          </option>
                        ))}
                      </NativeSelect>
                    </FormField>
                    <FormField label="Academic session" error={form.formState.errors.academicSessionId}>
                      <NativeSelect {...form.register("academicSessionId")}>
                        <option value="">No session</option>
                        {sessionsQuery.data?.items.map((session) => (
                          <option key={session.id} value={session.id}>
                            {session.name}
                          </option>
                        ))}
                      </NativeSelect>
                    </FormField>
                    <FormField label="Teacher" error={form.formState.errors.teacherId}>
                      <NativeSelect {...form.register("teacherId")}>
                        <option value="">Unassigned</option>
                        {teachersQuery.data?.items.map((teacher) => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.fullName}
                          </option>
                        ))}
                      </NativeSelect>
                    </FormField>
                    <FormField label="Duration (minutes)" error={form.formState.errors.durationMinutes}>
                      <Input type="number" min="1" {...form.register("durationMinutes")} />
                    </FormField>
                    <FormField label="Pass marks" error={form.formState.errors.passMarks}>
                      <Input type="number" min="0" step="0.5" {...form.register("passMarks")} />
                    </FormField>
                    <FormField label="Start time" error={form.formState.errors.startsAt}>
                      <Input type="datetime-local" {...form.register("startsAt")} />
                    </FormField>
                    <FormField label="End time" error={form.formState.errors.endsAt}>
                      <Input type="datetime-local" {...form.register("endsAt")} />
                    </FormField>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField label="Description" error={form.formState.errors.description}>
                      <Textarea {...form.register("description")} className="min-h-[100px]" />
                    </FormField>
                    <FormField label="Instructions" error={form.formState.errors.instructions}>
                      <Textarea {...form.register("instructions")} className="min-h-[100px]" />
                    </FormField>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-2">
                    <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
                      <div className="flex items-center gap-2">
                        <FileUp className="h-4 w-4 text-sky-600" />
                        <p className="font-medium">Import questions</p>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Paste JSON question arrays or pipe-separated rows like
                        <span className="font-mono text-xs"> MCQ|Question|1|Option A,Option B|Option A|Explanation</span>
                      </p>
                      <Textarea value={importText} onChange={(event) => setImportText(event.target.value)} className="mt-3 min-h-[140px]" />
                      <div className="mt-3 flex justify-end">
                        <Button type="button" variant="outline" onClick={importQuestions}>
                          Import Into Builder
                        </Button>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
                      <div className="flex items-center gap-2">
                        <LibraryBig className="h-4 w-4 text-emerald-600" />
                        <p className="font-medium">Question bank</p>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Reuse locally saved questions to speed up quiz and test creation.
                      </p>
                      <div className="mt-3 space-y-2">
                        {questionBank.length ? (
                          questionBank.slice(0, 4).map((entry) => (
                            <div key={entry.id} className="rounded-xl border p-3">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-medium">{entry.title}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {entry.question.type.replaceAll("_", " ")} · {entry.question.marks} marks
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <Button type="button" variant="outline" size="sm" onClick={() => insertQuestionFromBank(entry)}>
                                    Use
                                  </Button>
                                  <Button type="button" variant="outline" size="sm" onClick={() => removeQuestionBankEntry(entry.id)}>
                                    Remove
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">Save any question from the builder to start building a reusable bank.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 rounded-2xl border border-border/70 bg-card/60 p-4 md:grid-cols-2 xl:grid-cols-3">
                    <label className="flex items-center gap-3 text-sm">
                      <Checkbox {...form.register("shuffleQuestions")} />
                      Shuffle questions
                    </label>
                    <label className="flex items-center gap-3 text-sm">
                      <Checkbox {...form.register("shuffleOptions")} />
                      Shuffle options
                    </label>
                    <label className="flex items-center gap-3 text-sm">
                      <Checkbox {...form.register("showResultImmediately")} />
                      Show results immediately
                    </label>
                    <label className="flex items-center gap-3 text-sm">
                      <Checkbox {...form.register("allowMultipleAttempts")} />
                      Allow multiple attempts
                    </label>
                    <label className="flex items-center gap-3 text-sm">
                      <Checkbox {...form.register("negativeMarkingEnabled")} />
                      Enable negative marking
                    </label>
                    <FormField label="Max attempts" error={form.formState.errors.maxAttempts}>
                      <Input type="number" min="1" {...form.register("maxAttempts")} />
                    </FormField>
                    <FormField label="Negative marks / wrong answer" error={form.formState.errors.negativeMarkingPerWrong}>
                      <Input type="number" min="0" step="0.25" {...form.register("negativeMarkingPerWrong")} />
                    </FormField>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Questions</p>
                        <p className="text-sm text-muted-foreground">Use objective and subjective questions in the same assessment.</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          questionsFieldArray.append({
                            type: "MCQ",
                            prompt: "",
                            helperText: "",
                            explanation: "",
                            marks: 1,
                            acceptedAnswersText: "",
                            options: [
                              { text: "", isCorrect: true },
                              { text: "", isCorrect: false },
                            ],
                          })
                        }
                      >
                        Add question
                      </Button>
                    </div>
                    {questionsFieldArray.fields.map((field, index) => (
                      <QuestionEditor
                        key={field.id}
                        control={form.control}
                        register={form.register}
                        errors={form.formState.errors}
                        index={index}
                        onRemove={() => questionsFieldArray.remove(index)}
                        onSaveToBank={() => addCurrentQuestionToBank(index)}
                      />
                    ))}
                    {typeof form.formState.errors.questions?.message === "string" ? (
                      <p className="text-xs text-destructive">{form.formState.errors.questions.message}</p>
                    ) : null}
                  </div>

                  <div className="grid gap-4 rounded-2xl border border-border/70 bg-card/60 p-4 md:grid-cols-3">
                    {(() => {
                      const previewQuestions = (watchedForm?.questions ?? []).filter(
                        (question): question is AssessmentSchema["questions"][number] => Boolean(question?.type),
                      );
                      return (
                        <>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Preview questions</p>
                      <p className="mt-1 text-2xl font-semibold">{previewQuestions.length}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Objective questions</p>
                      <p className="mt-1 text-2xl font-semibold">
                        {previewQuestions.filter((question) => !["SHORT_ANSWER", "LONG_ANSWER"].includes(question.type)).length}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Manual review load</p>
                      <p className="mt-1 text-2xl font-semibold">
                        {previewQuestions.filter((question) => ["SHORT_ANSWER", "LONG_ANSWER"].includes(question.type)).length}
                      </p>
                    </div>
                        </>
                      );
                    })()}
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setOpen(false);
                        setEditingAssessment(null);
                        form.reset(defaultAssessmentValues);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={mutation.isPending}>
                      {mutation.isPending ? "Saving..." : editingAssessment ? "Update assessment" : "Create assessment"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />

      <DataTable
        columns={columns}
        data={assessments}
        pageCount={Math.max(1, Math.ceil(assessmentsQuery.data.total / 10))}
        pagination={{ pageIndex, pageSize: 10 }}
        onPaginationChange={(state) => setPageIndex(state.pageIndex)}
      />

      {selectedAssessment ? (
        <div className="rounded-2xl border border-border/70 bg-card/70 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-lg font-semibold">{selectedAssessment.title}</p>
              <p className="text-sm text-muted-foreground">
                {selectedAssessment.code} • {selectedAssessment.subjectName} • {selectedAssessment.batchName}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{selectedAssessment.type}</Badge>
              <Badge variant={selectedAssessment.status === "PUBLISHED" ? "success" : "outline"}>{selectedAssessment.status}</Badge>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { id: "overview", label: "Overview", icon: BookCopy },
              { id: "grading", label: "Grading Workspace", icon: MessageSquareText },
              { id: "analytics", label: "Analytics", icon: BarChart3 },
              { id: "bank", label: "Question Bank", icon: LibraryBig },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  type="button"
                  variant={detailView === item.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDetailView(item.id as typeof detailView)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Duration</p>
              <p className="mt-1 font-medium">{selectedAssessment.durationMinutes} minutes</p>
            </div>
            <div className="rounded-xl border p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Marks</p>
              <p className="mt-1 font-medium">
                {selectedAssessment.totalMarks} total / {selectedAssessment.passMarks} pass
              </p>
            </div>
            <div className="rounded-xl border p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Window</p>
              <p className="mt-1 font-medium">{selectedAssessment.startsAt ? formatDate(selectedAssessment.startsAt) : "Not scheduled"}</p>
            </div>
            <div className="rounded-xl border p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Result mode</p>
              <p className="mt-1 font-medium">{selectedAssessment.showResultImmediately ? "Immediate objective result" : "Manual release"}</p>
            </div>
          </div>
          {detailView === "overview" ? (
            <div className="mt-5 space-y-3">
              {selectedAssessment.questions.map((question, index) => (
                <div key={question.id} className="rounded-xl border border-dashed p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">
                      Q{index + 1}. {question.prompt}
                    </p>
                    <Badge variant="outline">
                      {question.type.replaceAll("_", " ")} • {question.marks} marks
                    </Badge>
                  </div>
                  {question.options.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {question.options.map((option) => (
                        <Badge key={option.id} variant={option.isCorrect ? "success" : "outline"}>
                          {option.text}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                  {question.acceptedAnswers.length ? (
                    <p className="mt-3 text-sm text-muted-foreground">Accepted answers: {question.acceptedAnswers.join(", ")}</p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          {detailView === "grading" && selectedAssessmentInsights ? (
            <div className="mt-5 space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Manual review queue</p>
                  <p className="mt-1 text-2xl font-semibold">{selectedAssessmentInsights.subjectiveQuestions.length}</p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Rubrics prepared</p>
                  <p className="mt-1 text-2xl font-semibold">{selectedAssessmentInsights.gradingTemplatesReady}</p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Estimated review time</p>
                  <p className="mt-1 text-2xl font-semibold">{selectedAssessmentInsights.subjectiveQuestions.length * 4} min</p>
                </div>
              </div>
              {selectedAssessmentInsights.subjectiveQuestions.length ? (
                selectedAssessmentInsights.subjectiveQuestions.map((question, index) => (
                  <div key={question.id} className="rounded-xl border border-dashed p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">
                          Review {index + 1}. {question.prompt}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {question.type.replaceAll("_", " ")} · {question.marks} marks
                        </p>
                      </div>
                      <Badge variant="outline">{gradingWorkspace[question.id]?.reviewPriority ?? "MEDIUM"} priority</Badge>
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <FormField label="Rubric note">
                        <Textarea
                          value={gradingWorkspace[question.id]?.rubricNote ?? ""}
                          onChange={(event) => updateGradingWorkspace(question.id, { rubricNote: event.target.value, expectedScore: gradingWorkspace[question.id]?.expectedScore ?? question.marks })}
                          className="min-h-[120px]"
                        />
                      </FormField>
                      <FormField label="Suggested feedback">
                        <Textarea
                          value={gradingWorkspace[question.id]?.suggestedFeedback ?? ""}
                          onChange={(event) => updateGradingWorkspace(question.id, { suggestedFeedback: event.target.value, expectedScore: gradingWorkspace[question.id]?.expectedScore ?? question.marks })}
                          className="min-h-[120px]"
                        />
                      </FormField>
                      <FormField label="Priority">
                        <NativeSelect
                          value={gradingWorkspace[question.id]?.reviewPriority ?? "MEDIUM"}
                          onChange={(event) =>
                            updateGradingWorkspace(question.id, {
                              reviewPriority: event.target.value as "LOW" | "MEDIUM" | "HIGH",
                              expectedScore: gradingWorkspace[question.id]?.expectedScore ?? question.marks,
                            })
                          }
                        >
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                        </NativeSelect>
                      </FormField>
                      <FormField label="Expected score">
                        <Input
                          type="number"
                          min="0"
                          step="0.5"
                          value={gradingWorkspace[question.id]?.expectedScore ?? question.marks}
                          onChange={(event) =>
                            updateGradingWorkspace(question.id, {
                              expectedScore: Number(event.target.value),
                            })
                          }
                        />
                      </FormField>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border p-4 text-sm text-muted-foreground">
                  This assessment is fully objective, so no manual grading workspace is needed.
                </div>
              )}
              {selectedAssessmentInsights.subjectiveQuestions.length ? (
                <div className="flex justify-end">
                  <Button type="button" variant="outline" onClick={() => {
                    clearGradingWorkspace(selectedAssessment.id);
                    setGradingWorkspace({});
                  }}>
                    Reset Grading Workspace
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}

          {detailView === "analytics" && selectedAssessmentInsights ? (
            <div className="mt-5 space-y-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Objective coverage</p>
                  <p className="mt-1 text-2xl font-semibold">{selectedAssessmentInsights.objectiveCoverage}%</p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Subjective coverage</p>
                  <p className="mt-1 text-2xl font-semibold">{selectedAssessmentInsights.subjectiveCoverage}%</p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Objective questions</p>
                  <p className="mt-1 text-2xl font-semibold">{selectedAssessmentInsights.objectiveQuestions.length}</p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Subjective questions</p>
                  <p className="mt-1 text-2xl font-semibold">{selectedAssessmentInsights.subjectiveQuestions.length}</p>
                </div>
              </div>
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-xl border p-4">
                  <p className="font-medium">Assessment composition</p>
                  <div className="mt-4 space-y-3">
                    {QUESTION_TYPE_OPTIONS.map((option) => {
                      const count = selectedAssessment.questions.filter((question) => question.type === option.value).length;
                      return (
                        <div key={option.value} className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm">
                          <span>{option.label}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="font-medium">Portfolio analytics</p>
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex items-center justify-between rounded-xl border px-3 py-2">
                      <span>Average questions per assessment</span>
                      <Badge variant="outline">{analytics.averageQuestions}</Badge>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border px-3 py-2">
                      <span>Objective questions in portfolio</span>
                      <Badge variant="outline">{analytics.objectiveCount}</Badge>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border px-3 py-2">
                      <span>Subjective questions in portfolio</span>
                      <Badge variant="outline">{analytics.subjectiveCount}</Badge>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border px-3 py-2">
                      <span>Grading-heavy assessments</span>
                      <Badge variant="outline">{analytics.gradingHeavyAssessments}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {detailView === "bank" ? (
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">Reusable question bank</p>
                  <p className="text-sm text-muted-foreground">Promote strong prompts into reusable inventory for future assessments.</p>
                </div>
                <Badge variant="outline">{questionBank.length} saved questions</Badge>
              </div>
              <div className="grid gap-4 xl:grid-cols-2">
                {questionBank.length ? (
                  questionBank.map((entry) => (
                    <div key={entry.id} className="rounded-xl border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{entry.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {entry.question.type.replaceAll("_", " ")} · {entry.question.marks} marks
                          </p>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={() => insertQuestionFromBank(entry)}>
                          Add to builder
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border p-4 text-sm text-muted-foreground">
                    Save questions from the assessment builder to create a reusable question bank.
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
