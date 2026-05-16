"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ClipboardCheck, Gauge, GraduationCap, LayoutGrid, Rows3, Table2, Trophy } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { toast } from "sonner";
import { examResultsApi } from "@/features/exam-results/api/exam-results-api";
import { examResultSchema, type ExamResultSchema } from "@/features/exam-results/schemas/exam-result-schema";
import { examsApi } from "@/features/exams/api/exams-api";
import { studentsApi } from "@/features/students/api/students-api";
import { MetricCard } from "@/components/cards/metric-card";
import { DataTable } from "@/components/tables/data-table";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { FormField } from "@/components/forms/form-field";
import { DetailItem } from "@/components/shared/detail-item";
import { FilterBar } from "@/components/shared/filter-bar";
import { OrganizationScopeBanner } from "@/components/shared/organization-scope-banner";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { usePermission } from "@/hooks/use-permission";
import { getChartColor } from "@/lib/constants/chart-colors";
import { normalizeApiError } from "@/lib/api/errors";
import { useAuth } from "@/providers/auth-provider";
import type { ExamResult } from "@/types/domain";
import { exportRowsToCsv } from "@/lib/utils/export";

export default function ExamResultsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [viewMode, setViewMode] = useState<"table" | "students" | "subjects" | "insights">("students");
  const [pageIndex, setPageIndex] = useState(0);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [open, setOpen] = useState(false);
  const [editingResult, setEditingResult] = useState<ExamResult | null>(null);
  const [selectedResult, setSelectedResult] = useState<ExamResult | null>(null);
  const [hydratedExamId, setHydratedExamId] = useState("");
  const canCreate = usePermission("exam-results.create");
  const canManage = usePermission("exam-results.update");

  const resultsQuery = useQuery({
    queryKey: ["exam-results", debouncedSearch, pageIndex],
    queryFn: () => examResultsApi.list({ page: pageIndex + 1, limit: 10, search: debouncedSearch }),
  });
  const shouldLoadReferenceData = open || Boolean(editingResult) || Boolean(selectedResult);
  const examsQuery = useQuery({
    queryKey: ["exams", "result-options"],
    queryFn: () => examsApi.list({ page: 1, limit: 100 }),
    enabled: shouldLoadReferenceData,
  });
  const studentsQuery = useQuery({
    queryKey: ["students", "result-options"],
    queryFn: () => studentsApi.list({ page: 1, limit: 100 }),
    enabled: shouldLoadReferenceData,
  });

  const form = useForm<ExamResultSchema>({
    resolver: zodResolver(examResultSchema),
    defaultValues: {
      examId: "",
      studentId: "",
      remarks: "",
      status: "DRAFT",
      items: [],
    },
  });
  const selectedExamId = form.watch("examId");
  const examDetailQuery = useQuery({
    queryKey: ["exam", "result-detail", selectedExamId],
    queryFn: () => examsApi.detail(selectedExamId),
    enabled: Boolean(selectedExamId),
  });
  const itemFields = useFieldArray({ control: form.control, name: "items" });
  const selectedExam = examDetailQuery.data ?? examsQuery.data?.items.find((item) => item.id === selectedExamId);

  useEffect(() => {
    if (!selectedExamId || !examDetailQuery.data || hydratedExamId === selectedExamId) {
      return;
    }

    itemFields.replace(
      examDetailQuery.data.subjects.map((subject) => ({
        examSubjectId: subject.id,
        subjectId: subject.subjectId,
        obtainedMarks: 0,
        remarks: "",
      })),
    );
    setHydratedExamId(selectedExamId);
  }, [examDetailQuery.data, hydratedExamId, itemFields, selectedExamId]);

  const mutation = useMutation({
    mutationFn: async (values: ExamResultSchema) => {
      const payload = {
        ...values,
        remarks: values.remarks || undefined,
      };
      if (editingResult) {
        return examResultsApi.update(editingResult.id, payload);
      }
      return examResultsApi.create(payload);
    },
    onSuccess: () => {
      toast.success(editingResult ? "Result updated" : "Result created");
      queryClient.invalidateQueries({ queryKey: ["exam-results"] });
      setOpen(false);
      setEditingResult(null);
      form.reset();
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => examResultsApi.bulkRemove(ids),
    onSuccess: () => {
      toast.success("Selected exam results deleted");
      queryClient.invalidateQueries({ queryKey: ["exam-results"] });
      setRowSelection({});
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const results = resultsQuery.data?.items ?? [];
  const stats = useMemo(() => {
    const average = results.length ? results.reduce((sum, item) => sum + item.percentage, 0) / results.length : 0;
    return {
      total: results.length,
      published: results.filter((item) => item.status === "PUBLISHED").length,
      average: Number(average.toFixed(1)),
      distinction: results.filter((item) => item.percentage >= 80).length,
    };
  }, [results]);
  const gradeChart = useMemo(
    () =>
      Object.entries(
        results.reduce<Record<string, number>>((acc, item) => {
          const grade = item.grade ?? "N/A";
          acc[grade] = (acc[grade] ?? 0) + 1;
          return acc;
        }, {}),
      ).map(([grade, total]) => ({ grade, total })),
    [results],
  );
  const studentCards = useMemo(
    () =>
      results
        .slice()
        .sort((left, right) => right.percentage - left.percentage)
        .map((result) => ({
          ...result,
          strongSubjects: result.items.filter((item) => item.obtainedMarks / item.totalMarks >= 0.75).length,
          weakSubjects: result.items.filter((item) => item.obtainedMarks < item.passMarks).length,
        })),
    [results],
  );
  const subjectMatrix = useMemo(() => {
    const map = new Map<
      string,
      {
        subjectName: string;
        subjectCode: string;
        attempts: number;
        average: number;
        passCount: number;
        highest: number;
        lowest: number;
      }
    >();

    for (const result of results) {
      for (const item of result.items) {
        const current = map.get(item.subjectId) ?? {
          subjectName: item.subjectName,
          subjectCode: item.subjectCode,
          attempts: 0,
          average: 0,
          passCount: 0,
          highest: 0,
          lowest: 100,
        };
        const percentage = item.totalMarks ? Math.round((item.obtainedMarks / item.totalMarks) * 100) : 0;
        current.attempts += 1;
        current.average += percentage;
        current.highest = Math.max(current.highest, percentage);
        current.lowest = Math.min(current.lowest, percentage);
        if (item.obtainedMarks >= item.passMarks) {
          current.passCount += 1;
        }
        map.set(item.subjectId, current);
      }
    }

    return Array.from(map.values())
      .map((item) => ({
        ...item,
        average: item.attempts ? Math.round(item.average / item.attempts) : 0,
        passRate: item.attempts ? Math.round((item.passCount / item.attempts) * 100) : 0,
      }))
      .sort((left, right) => right.average - left.average);
  }, [results]);
  const selectedResultIds = Object.entries(rowSelection)
    .filter(([, selected]) => selected)
    .map(([id]) => id);
  const examInsights = useMemo(() => {
    const byExam = new Map<
      string,
      {
        examName: string;
        examCode: string;
        count: number;
        average: number;
        published: number;
        topScore: number;
      }
    >();

    for (const result of results) {
      const current = byExam.get(result.examId) ?? {
        examName: result.examName,
        examCode: result.examCode,
        count: 0,
        average: 0,
        published: 0,
        topScore: 0,
      };
      current.count += 1;
      current.average += result.percentage;
      current.topScore = Math.max(current.topScore, result.percentage);
      if (result.status === "PUBLISHED") {
        current.published += 1;
      }
      byExam.set(result.examId, current);
    }

    return Array.from(byExam.values())
      .map((item) => ({
        ...item,
        average: item.count ? Math.round(item.average / item.count) : 0,
        publishRate: item.count ? Math.round((item.published / item.count) * 100) : 0,
      }))
      .sort((left, right) => right.average - left.average);
  }, [results]);
  const buildActivityLogsHref = (params: Record<string, string | undefined>) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        searchParams.set(key, value);
      }
    });
    const query = searchParams.toString();
    return query ? `/activity-logs?${query}` : "/activity-logs";
  };
  const selectedResultExportRows = useMemo(
    () =>
      results
        .filter((result) => selectedResultIds.includes(result.id))
        .map((result) => ({
          Student: result.studentName,
          Exam: result.examName,
          ExamCode: result.examCode,
          Batch: result.batchName,
          Percentage: `${result.percentage}%`,
          Grade: result.grade ?? "",
          Status: result.status,
        })),
    [results, selectedResultIds],
  );

  const columns = useMemo<Array<ColumnDef<ExamResult>>>(
    () => [
      {
        accessorKey: "studentName",
        header: "Student",
      },
      {
        accessorKey: "examName",
        header: "Exam",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.examName}</p>
            <p className="text-xs text-muted-foreground">{row.original.examCode}</p>
          </div>
        ),
      },
      { accessorKey: "batchName", header: "Batch" },
      { accessorKey: "percentage", header: "Percentage", cell: ({ row }) => `${row.original.percentage}%` },
      { accessorKey: "grade", header: "Grade" },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <Badge variant={row.original.status === "PUBLISHED" ? "success" : "warning"}>{row.original.status}</Badge>,
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-full px-3 shadow-sm hover:border-primary/40 hover:bg-primary/5" onClick={() => setSelectedResult(row.original)}>
              View
            </Button>
            {canManage ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingResult(row.original);
                  setHydratedExamId(row.original.examId);
                  form.reset({
                    examId: row.original.examId,
                    studentId: row.original.studentId,
                    remarks: row.original.remarks ?? "",
                    status: row.original.status,
                    items: row.original.items.map((item) => ({
                      examSubjectId: item.examSubjectId,
                      subjectId: item.subjectId,
                      obtainedMarks: item.obtainedMarks,
                      remarks: item.remarks ?? "",
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

  if (resultsQuery.isLoading) return <LoadingState rows={6} />;
  if (resultsQuery.isError || !resultsQuery.data) {
    return <ErrorState description="Exam results could not be loaded." onRetry={() => resultsQuery.refetch()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Academics"
        title="Results and report cards"
        description="Enter marks, publish academic outcomes, and review grading patterns through charts instead of flat records."
      />
      <OrganizationScopeBanner moduleLabel="Academic operations" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Visible results" value={String(stats.total)} helper="Results in the current table scope" icon={ClipboardCheck} tone="sky" />
        <MetricCard title="Published" value={String(stats.published)} helper="Results already visible as final outcomes" icon={GraduationCap} tone="emerald" />
        <MetricCard title="Average %" value={`${stats.average}%`} helper="Average score across visible records" icon={Gauge} tone="violet" />
        <MetricCard title="Distinctions" value={String(stats.distinction)} helper="Students scoring 80% or above" icon={Trophy} tone="amber" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={buildActivityLogsHref({ module: "exam-results" })}>Audit result events</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={buildActivityLogsHref({ action: "bulk-delete" })}>Audit bulk deletes</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={buildActivityLogsHref({ action: "create" })}>Audit result creation</Link>
        </Button>
      </div>

      {selectedResultIds.length > 0 && canManage ? (
        <div className="flex items-center justify-between rounded-[1.75rem] border border-sky-200 bg-sky-50/70 px-4 py-3 text-sm shadow-sm">
          <p>
            {selectedResultIds.length} exam result{selectedResultIds.length === 1 ? "" : "s"} selected
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setRowSelection({})}>
              Clear selection
            </Button>
            <Button
              variant="outline"
              onClick={() => exportRowsToCsv({ filename: "exam-results-selected", rows: selectedResultExportRows })}
              disabled={selectedResultExportRows.length === 0}
            >
              Export selected
            </Button>
            <Button
              variant="destructive"
              onClick={() => bulkDeleteMutation.mutate(selectedResultIds)}
              disabled={bulkDeleteMutation.isPending}
            >
              {bulkDeleteMutation.isPending ? "Deleting..." : "Delete selected"}
            </Button>
          </div>
        </div>
      ) : null}
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-border/70 bg-card/85 p-4 shadow-sm backdrop-blur xl:col-span-2">
          <p className="mb-4 text-sm font-medium">Grade Distribution</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="grade" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" radius={[10, 10, 0, 0]}>
                  {gradeChart.map((item, index) => <Cell key={item.grade} fill={getChartColor(index)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card/85 p-4 shadow-sm backdrop-blur">
          <p className="mb-4 text-sm font-medium">Publish Rate</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                innerRadius="45%"
                outerRadius="100%"
                data={[{ name: "Published", value: stats.total ? Math.round((stats.published / stats.total) * 100) : 0, fill: getChartColor(0) }]}
                startAngle={180}
                endAngle={0}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar background dataKey="value" cornerRadius={18} />
                <Tooltip />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <FilterBar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPageIndex(0);
        }}
        searchPlaceholder="Search by student, exam, or batch..."
        action={
          canCreate ? (
            <Dialog
              open={open}
              onOpenChange={(nextOpen) => {
                setOpen(nextOpen);
                if (!nextOpen) {
                  setEditingResult(null);
                  setHydratedExamId("");
                  form.reset();
                }
              }}
            >
              <DialogTrigger asChild>
                <Button disabled={!user?.organizationId}>Create result</Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingResult ? "Edit result" : "Create result"}</DialogTitle>
                  <DialogDescription>Select an exam first. The subject rows will be generated automatically from the exam structure.</DialogDescription>
                </DialogHeader>
                <form className="grid gap-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField label="Exam" required error={form.formState.errors.examId}>
                      <NativeSelect
                        {...form.register("examId")}
                        onChange={(event) => {
                          form.setValue("examId", event.target.value);
                          setHydratedExamId("");
                          itemFields.replace([]);
                        }}
                      >
                        <option value="">Select exam</option>
                        {examsQuery.data?.items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                      </NativeSelect>
                    </FormField>
                    <FormField label="Student" required error={form.formState.errors.studentId}>
                      <NativeSelect {...form.register("studentId")}>
                        <option value="">Select student</option>
                        {studentsQuery.data?.items.map((item) => <option key={item.id} value={item.id}>{item.fullName}</option>)}
                      </NativeSelect>
                    </FormField>
                    <FormField label="Status">
                      <NativeSelect {...form.register("status")}>
                        <option value="DRAFT">Draft</option>
                        <option value="PUBLISHED">Published</option>
                      </NativeSelect>
                    </FormField>
                    <FormField label="Remarks">
                      <Input {...form.register("remarks")} />
                    </FormField>
                  </div>
                  <div className="space-y-3 rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">Exam papers and marks entry</p>
                      {selectedExam ? (
                        <p className="text-xs text-muted-foreground">
                          {selectedExam.subjects.length} paper{selectedExam.subjects.length === 1 ? "" : "s"} loaded from {selectedExam.name}
                        </p>
                      ) : null}
                    </div>
                    {!itemFields.fields.length ? (
                      <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground shadow-sm">
                        {selectedExamId && examDetailQuery.isLoading
                          ? "Loading exam papers..."
                          : "Select an exam to load its subject papers automatically."}
                      </div>
                    ) : null}
                    {itemFields.fields.length ? (
                      <div className="hidden grid-cols-[1.8fr_0.8fr_1fr_1.2fr] gap-3 px-1 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground md:grid">
                        <span>Subject</span>
                        <span>Total marks</span>
                        <span>Obtained marks</span>
                        <span>Remarks</span>
                      </div>
                    ) : null}
                    {itemFields.fields.map((field, index) => {
                      const subject = selectedExam?.subjects.find((item) => item.id === field.examSubjectId);
                      return (
                        <div key={field.id} className="grid gap-3 rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm md:grid-cols-[1.8fr_0.9fr_1fr_1.2fr]">
                          <div className="text-sm">
                            <p className="mb-1 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground md:hidden">Subject</p>
                            <p className="font-medium">{subject?.subjectName ?? "Exam subject"}</p>
                            <p className="text-xs text-muted-foreground">
                              Pass marks: {subject?.passMarks ?? 0}
                            </p>
                          </div>
                          <input type="hidden" {...form.register(`items.${index}.examSubjectId`)} />
                          <input type="hidden" {...form.register(`items.${index}.subjectId`)} />
                          <div>
                            <p className="mb-1 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground md:hidden">Total marks</p>
                            <Input
                              className="bg-muted"
                              value={subject?.totalMarks ?? 0}
                              readOnly
                              aria-label={`Total marks for ${subject?.subjectName ?? "subject"}`}
                            />
                          </div>
                          <div>
                            <p className="mb-1 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground md:hidden">Obtained marks</p>
                            <Input
                              type="number"
                              min={0}
                              max={subject?.totalMarks ?? undefined}
                              aria-label={`Obtained marks for ${subject?.subjectName ?? "subject"}`}
                              {...form.register(`items.${index}.obtainedMarks`, { valueAsNumber: true })}
                            />
                          </div>
                          <div>
                            <p className="mb-1 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground md:hidden">Remarks</p>
                            <Input placeholder="Optional remarks" {...form.register(`items.${index}.remarks`)} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={mutation.isPending}>{editingResult ? "Save changes" : "Create result"}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />
      <div className="flex flex-wrap gap-2">
        <Button variant={viewMode === "students" ? "default" : "outline"} size="sm" onClick={() => setViewMode("students")}>
          <LayoutGrid className="mr-2 h-4 w-4" />
          Student cards
        </Button>
        <Button variant={viewMode === "subjects" ? "default" : "outline"} size="sm" onClick={() => setViewMode("subjects")}>
          <Table2 className="mr-2 h-4 w-4" />
          Subject matrix
        </Button>
        <Button variant={viewMode === "insights" ? "default" : "outline"} size="sm" onClick={() => setViewMode("insights")}>
          <Gauge className="mr-2 h-4 w-4" />
          Exam insights
        </Button>
        <Button variant={viewMode === "table" ? "default" : "outline"} size="sm" onClick={() => setViewMode("table")}>
          <Rows3 className="mr-2 h-4 w-4" />
          Table view
        </Button>
      </div>

      {viewMode === "students" ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {studentCards.length ? (
            studentCards.map((result) => (
              <button
                key={result.id}
                type="button"
                className="rounded-3xl border bg-card p-5 text-left transition hover:border-primary/40 hover:bg-muted/30"
                onClick={() => setSelectedResult(result)}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">{result.studentName}</p>
                    <p className="text-sm text-muted-foreground">{result.examName} · {result.batchName}</p>
                  </div>
                  <Badge variant={result.status === "PUBLISHED" ? "success" : "warning"}>{result.status}</Badge>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border p-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Score</p>
                    <p className="mt-2 text-xl font-semibold">{result.percentage}%</p>
                    <p className="text-xs text-muted-foreground">{result.grade ?? "No grade"}</p>
                  </div>
                  <div className="rounded-2xl border p-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Strong subjects</p>
                    <p className="mt-2 text-xl font-semibold">{result.strongSubjects}</p>
                    <p className="text-xs text-muted-foreground">75%+ performance</p>
                  </div>
                  <div className="rounded-2xl border p-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">At-risk subjects</p>
                    <p className="mt-2 text-xl font-semibold">{result.weakSubjects}</p>
                    <p className="text-xs text-muted-foreground">Below pass threshold</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {result.items.slice(0, 4).map((item) => {
                    const percentage = item.totalMarks ? Math.round((item.obtainedMarks / item.totalMarks) * 100) : 0;
                    return (
                      <div key={item.id} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>{item.subjectCode}</span>
                          <span>{item.obtainedMarks}/{item.totalMarks}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted">
                          <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min(percentage, 100)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </button>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed p-8 text-center text-sm text-muted-foreground xl:col-span-2">
              No result cards are available in the current scope.
            </div>
          )}
        </div>
      ) : null}

      {viewMode === "subjects" ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {subjectMatrix.length ? (
            subjectMatrix.map((subject) => (
              <div key={subject.subjectCode} className="rounded-3xl border bg-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">{subject.subjectName}</p>
                    <p className="text-sm text-muted-foreground">{subject.subjectCode} · {subject.attempts} scripts reviewed</p>
                  </div>
                  <Badge variant="outline">{subject.passRate}% pass rate</Badge>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border p-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Average</p>
                    <p className="mt-2 text-xl font-semibold">{subject.average}%</p>
                  </div>
                  <div className="rounded-2xl border p-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Highest</p>
                    <p className="mt-2 text-xl font-semibold">{subject.highest}%</p>
                  </div>
                  <div className="rounded-2xl border p-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Lowest</p>
                    <p className="mt-2 text-xl font-semibold">{subject.lowest}%</p>
                  </div>
                </div>
                <div className="mt-4 h-2 rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min(subject.average, 100)}%` }} />
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed p-8 text-center text-sm text-muted-foreground xl:col-span-2">
              Subject-wise insight will appear once result items are available.
            </div>
          )}
        </div>
      ) : null}

      {viewMode === "insights" ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {examInsights.length ? (
            examInsights.map((exam) => (
              <div key={exam.examCode} className="rounded-3xl border bg-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">{exam.examName}</p>
                    <p className="text-sm text-muted-foreground">{exam.examCode} · {exam.count} result records</p>
                  </div>
                  <Badge variant="outline">{exam.publishRate}% published</Badge>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border p-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Average</p>
                    <p className="mt-2 text-xl font-semibold">{exam.average}%</p>
                  </div>
                  <div className="rounded-2xl border p-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Top score</p>
                    <p className="mt-2 text-xl font-semibold">{exam.topScore}%</p>
                  </div>
                  <div className="rounded-2xl border p-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Published</p>
                    <p className="mt-2 text-xl font-semibold">{exam.published}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed p-8 text-center text-sm text-muted-foreground xl:col-span-2">
              Exam insights will appear once results are created for one or more exams.
            </div>
          )}
        </div>
      ) : null}

      {viewMode === "table" ? (
        <DataTable
          data={results}
          columns={columns}
          pageCount={Math.ceil(resultsQuery.data.total / resultsQuery.data.limit)}
          pagination={{ pageIndex, pageSize: resultsQuery.data.limit }}
          onPaginationChange={(state) => setPageIndex(state.pageIndex)}
          enableRowSelection
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
        />
      ) : null}
      <Dialog open={Boolean(selectedResult)} onOpenChange={(nextOpen) => !nextOpen && setSelectedResult(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Result detail</DialogTitle>
            <DialogDescription>Review the published structure and marks breakdown for this exam result.</DialogDescription>
          </DialogHeader>
          {selectedResult ? (
            <div className="space-y-4 text-sm">
              <div className="grid gap-3 md:grid-cols-2">
                <DetailItem label="Student" value={selectedResult.studentName} />
                <DetailItem label="Exam" value={`${selectedResult.examName} · ${selectedResult.examCode}`} />
                <DetailItem label="Batch" value={selectedResult.batchName} />
                <DetailItem label="Outcome" value={`${selectedResult.percentage}%${selectedResult.grade ? ` · ${selectedResult.grade}` : ""} · ${selectedResult.status}`} />
              </div>
              <div className="space-y-3 rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm">
                <p className="text-sm font-medium">Subject breakdown</p>
                {selectedResult.items.map((item) => (
                  <div key={item.id} className="grid gap-3 rounded-2xl border border-border/70 bg-background/70 p-3 shadow-sm md:grid-cols-[1.6fr_0.8fr_0.8fr_1fr]">
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground md:hidden">Subject</p>
                      <p className="font-medium">{item.subjectName}</p>
                      <p className="text-xs text-muted-foreground">Pass marks: {item.passMarks}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Total</p>
                      <p className="mt-1 font-medium">{item.totalMarks}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Obtained</p>
                      <p className="mt-1 font-medium">{item.obtainedMarks}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Remarks</p>
                      <p className="mt-1">{item.remarks ?? "—"}</p>
                    </div>
                  </div>
                ))}
              </div>
              {selectedResult.remarks ? <DetailItem label="Overall remarks" value={selectedResult.remarks} /> : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
