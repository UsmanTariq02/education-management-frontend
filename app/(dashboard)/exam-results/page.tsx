"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ClipboardCheck, Gauge, GraduationCap, Trophy } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
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

export default function ExamResultsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [pageIndex, setPageIndex] = useState(0);
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
            <Button variant="ghost" size="sm" onClick={() => setSelectedResult(row.original)}>
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
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border bg-card p-4 xl:col-span-2">
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
        <div className="rounded-2xl border bg-card p-4">
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
                  <div className="space-y-3 rounded-2xl border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">Exam papers and marks entry</p>
                      {selectedExam ? (
                        <p className="text-xs text-muted-foreground">
                          {selectedExam.subjects.length} paper{selectedExam.subjects.length === 1 ? "" : "s"} loaded from {selectedExam.name}
                        </p>
                      ) : null}
                    </div>
                    {!itemFields.fields.length ? (
                      <div className="rounded-xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
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
                        <div key={field.id} className="grid gap-3 rounded-2xl border p-4 md:grid-cols-[1.8fr_0.9fr_1fr_1.2fr]">
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
      <DataTable
        data={results}
        columns={columns}
        pageCount={Math.ceil(resultsQuery.data.total / resultsQuery.data.limit)}
        pagination={{ pageIndex, pageSize: resultsQuery.data.limit }}
        onPaginationChange={(state) => setPageIndex(state.pageIndex)}
      />
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
              <div className="space-y-3 rounded-2xl border p-4">
                <p className="text-sm font-medium">Subject breakdown</p>
                {selectedResult.items.map((item) => (
                  <div key={item.id} className="grid gap-3 rounded-xl border p-3 md:grid-cols-[1.6fr_0.8fr_0.8fr_1fr]">
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
