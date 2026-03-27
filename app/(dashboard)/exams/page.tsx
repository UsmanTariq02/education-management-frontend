"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BookCopy, CalendarClock, NotebookPen, Trophy } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { academicSessionsApi } from "@/features/academic-sessions/api/academic-sessions-api";
import { batchesApi } from "@/features/batches/api/batches-api";
import { examsApi } from "@/features/exams/api/exams-api";
import { examSchema, type ExamSchema } from "@/features/exams/schemas/exam-schema";
import { subjectsApi } from "@/features/subjects/api/subjects-api";
import { teachersApi } from "@/features/teachers/api/teachers-api";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { usePermission } from "@/hooks/use-permission";
import { formatDate } from "@/lib/formatters";
import { getChartColor } from "@/lib/constants/chart-colors";
import { normalizeApiError } from "@/lib/api/errors";
import { useAuth } from "@/providers/auth-provider";
import type { Exam } from "@/types/domain";

export default function ExamsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [pageIndex, setPageIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const canCreate = usePermission("exams.create");
  const canManage = usePermission("exams.update");

  const examsQuery = useQuery({
    queryKey: ["exams", debouncedSearch, pageIndex],
    queryFn: () => examsApi.list({ page: pageIndex + 1, limit: 10, search: debouncedSearch }),
  });
  const sessionsQuery = useQuery({ queryKey: ["academic-sessions", "exam-options"], queryFn: () => academicSessionsApi.list({ page: 1, limit: 100 }) });
  const batchesQuery = useQuery({ queryKey: ["batches", "exam-options"], queryFn: () => batchesApi.list({ page: 1, limit: 100 }) });
  const subjectsQuery = useQuery({ queryKey: ["subjects", "exam-options"], queryFn: () => subjectsApi.list({ page: 1, limit: 100 }) });
  const teachersQuery = useQuery({ queryKey: ["teachers", "exam-options"], queryFn: () => teachersApi.list({ page: 1, limit: 100 }) });

  const form = useForm<ExamSchema>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      academicSessionId: "",
      batchId: "",
      teacherId: "",
      name: "",
      code: "",
      description: "",
      examDate: "",
      isPublished: false,
      subjects: [{ subjectId: "", totalMarks: 100, passMarks: 40 }],
    },
  });
  const subjectFields = useFieldArray({ control: form.control, name: "subjects" });

  const mutation = useMutation({
    mutationFn: async (values: ExamSchema) => {
      const payload = {
        ...values,
        academicSessionId: values.academicSessionId || undefined,
        teacherId: values.teacherId || undefined,
        description: values.description || undefined,
      };
      if (editingExam) {
        return examsApi.update(editingExam.id, payload);
      }
      return examsApi.create(payload);
    },
    onSuccess: () => {
      toast.success(editingExam ? "Exam updated" : "Exam created");
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      setOpen(false);
      setEditingExam(null);
      form.reset();
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const exams = examsQuery.data?.items ?? [];
  const stats = useMemo(
    () => ({
      total: exams.length,
      published: exams.filter((item) => item.isPublished).length,
      scheduled: new Set(exams.map((item) => item.examDate.slice(0, 10))).size,
      subjects: exams.reduce((sum, item) => sum + item.subjects.length, 0),
    }),
    [exams],
  );

  const batchChart = useMemo(
    () =>
      exams.reduce<Record<string, number>>((acc, item) => {
        acc[item.batchCode] = (acc[item.batchCode] ?? 0) + 1;
        return acc;
      }, {}),
    [exams],
  );
  const publishChart = [
    { name: "Published", value: stats.published },
    { name: "Draft", value: Math.max(stats.total - stats.published, 0) },
  ];

  const columns = useMemo<Array<ColumnDef<Exam>>>(
    () => [
      {
        accessorKey: "name",
        header: "Exam",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">{row.original.code}</p>
          </div>
        ),
      },
      { accessorKey: "batchName", header: "Batch" },
      { accessorKey: "academicSessionName", header: "Session", cell: ({ row }) => row.original.academicSessionName ?? "General" },
      { accessorKey: "examDate", header: "Date", cell: ({ row }) => formatDate(row.original.examDate) },
      {
        accessorKey: "subjects",
        header: "Subjects",
        cell: ({ row }) => <Badge variant="outline">{row.original.subjects.length}</Badge>,
      },
      {
        accessorKey: "isPublished",
        header: "Status",
        cell: ({ row }) => <Badge variant={row.original.isPublished ? "success" : "warning"}>{row.original.isPublished ? "Published" : "Draft"}</Badge>,
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedExam(row.original)}>
              View
            </Button>
            {canManage ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingExam(row.original);
                  form.reset({
                    academicSessionId: row.original.academicSessionId ?? "",
                    batchId: row.original.batchId,
                    teacherId: row.original.teacherId ?? "",
                    name: row.original.name,
                    code: row.original.code,
                    description: row.original.description ?? "",
                    examDate: row.original.examDate.slice(0, 10),
                    isPublished: row.original.isPublished,
                    subjects: row.original.subjects.map((subject) => ({
                      subjectId: subject.subjectId,
                      totalMarks: subject.totalMarks,
                      passMarks: subject.passMarks,
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

  if ([examsQuery, sessionsQuery, batchesQuery, subjectsQuery, teachersQuery].some((query) => query.isLoading)) {
    return <LoadingState rows={6} />;
  }
  if ([examsQuery, sessionsQuery, batchesQuery, subjectsQuery, teachersQuery].some((query) => query.isError) || !examsQuery.data) {
    return <ErrorState description="Exam planning data could not be loaded." onRetry={() => examsQuery.refetch()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Academics"
        title="Exams planner"
        description="Build exam structures with subject papers, publishing state, and batch scheduling."
      />
      <OrganizationScopeBanner moduleLabel="Academic operations" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Visible exams" value={String(stats.total)} helper="Exams in the current table scope" icon={Trophy} tone="sky" />
        <MetricCard title="Published" value={String(stats.published)} helper="Exams already finalized for reporting" icon={NotebookPen} tone="emerald" />
        <MetricCard title="Exam dates" value={String(stats.scheduled)} helper="Distinct dates currently scheduled" icon={CalendarClock} tone="violet" />
        <MetricCard title="Subject papers" value={String(stats.subjects)} helper="Total subject papers across visible exams" icon={BookCopy} tone="amber" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border bg-card p-4">
          <p className="mb-4 text-sm font-medium">Exams By Batch</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={Object.entries(batchChart).map(([batch, total]) => ({ batch, total }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="batch" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" radius={[10, 10, 0, 0]}>
                  {Object.entries(batchChart).map(([key], index) => (
                    <Cell key={key} fill={getChartColor(index)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <p className="mb-4 text-sm font-medium">Exam Publication Mix</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={publishChart} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95}>
                  {publishChart.map((item, index) => (
                    <Cell key={item.name} fill={getChartColor(index)} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
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
        searchPlaceholder="Search exams by name, code, or batch..."
        action={
          canCreate ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button disabled={!user?.organizationId}>Create exam</Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>{editingExam ? "Edit exam" : "Create exam"}</DialogTitle>
                  <DialogDescription>Each exam can carry multiple subject papers with independent total and pass marks.</DialogDescription>
                </DialogHeader>
                <form className="grid gap-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField label="Exam name" required error={form.formState.errors.name}>
                      <Input {...form.register("name")} />
                    </FormField>
                    <FormField label="Code" required error={form.formState.errors.code}>
                      <Input {...form.register("code")} />
                    </FormField>
                    <FormField label="Batch" required error={form.formState.errors.batchId}>
                      <select className="h-10 rounded-xl border bg-background px-3 text-sm" {...form.register("batchId")}>
                        <option value="">Select batch</option>
                        {batchesQuery.data?.items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                      </select>
                    </FormField>
                    <FormField label="Exam date" required error={form.formState.errors.examDate}>
                      <Input type="date" {...form.register("examDate")} />
                    </FormField>
                    <FormField label="Academic session">
                      <select className="h-10 rounded-xl border bg-background px-3 text-sm" {...form.register("academicSessionId")}>
                        <option value="">General</option>
                        {sessionsQuery.data?.items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                      </select>
                    </FormField>
                    <FormField label="Teacher">
                      <select className="h-10 rounded-xl border bg-background px-3 text-sm" {...form.register("teacherId")}>
                        <option value="">Unassigned</option>
                        {teachersQuery.data?.items.map((item) => <option key={item.id} value={item.id}>{item.fullName}</option>)}
                      </select>
                    </FormField>
                    <FormField label="Description" className="md:col-span-2">
                      <Input {...form.register("description")} />
                    </FormField>
                  </div>
                  <div className="space-y-3 rounded-2xl border p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Exam subjects</p>
                      <Button type="button" variant="outline" size="sm" onClick={() => subjectFields.append({ subjectId: "", totalMarks: 100, passMarks: 40 })}>
                        Add subject
                      </Button>
                    </div>
                    {subjectFields.fields.map((field, index) => (
                      <div key={field.id} className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto]">
                        <select className="h-10 rounded-xl border bg-background px-3 text-sm" {...form.register(`subjects.${index}.subjectId`)}>
                          <option value="">Select subject</option>
                          {subjectsQuery.data?.items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </select>
                        <input className="h-10 rounded-xl border bg-background px-3 text-sm" type="number" min={1} {...form.register(`subjects.${index}.totalMarks`)} />
                        <input className="h-10 rounded-xl border bg-background px-3 text-sm" type="number" min={0} {...form.register(`subjects.${index}.passMarks`)} />
                        <Button type="button" variant="ghost" onClick={() => subjectFields.remove(index)}>Remove</Button>
                      </div>
                    ))}
                  </div>
                  <Checkbox {...form.register("isPublished")} label="Publish exam immediately" />
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={mutation.isPending}>{editingExam ? "Save changes" : "Create exam"}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />
      <DataTable
        data={exams}
        columns={columns}
        pageCount={Math.ceil(examsQuery.data.total / examsQuery.data.limit)}
        pagination={{ pageIndex, pageSize: examsQuery.data.limit }}
        onPaginationChange={(state) => setPageIndex(state.pageIndex)}
      />
      <Dialog open={Boolean(selectedExam)} onOpenChange={(nextOpen) => !nextOpen && setSelectedExam(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Exam detail</DialogTitle>
            <DialogDescription>Review the exam structure, batch scope, and subject papers.</DialogDescription>
          </DialogHeader>
          {selectedExam ? (
            <div className="space-y-4 text-sm">
              <div className="grid gap-3 md:grid-cols-2">
                <DetailItem label="Exam" value={`${selectedExam.name} · ${selectedExam.code}`} />
                <DetailItem label="Batch" value={selectedExam.batchName} />
                <DetailItem label="Session" value={selectedExam.academicSessionName ?? "General"} />
                <DetailItem label="Date & status" value={`${formatDate(selectedExam.examDate)} · ${selectedExam.isPublished ? "Published" : "Draft"}`} />
              </div>
              <div className="space-y-3 rounded-2xl border p-4">
                <p className="text-sm font-medium">Subject papers</p>
                {selectedExam.subjects.map((subject) => (
                  <div key={subject.id} className="grid gap-3 rounded-xl border p-3 md:grid-cols-[1.6fr_0.8fr_0.8fr]">
                    <div>
                      <p className="font-medium">{subject.subjectName}</p>
                      <p className="text-xs text-muted-foreground">{subject.subjectCode}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Total marks</p>
                      <p className="mt-1 font-medium">{subject.totalMarks}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Pass marks</p>
                      <p className="mt-1 font-medium">{subject.passMarks}</p>
                    </div>
                  </div>
                ))}
              </div>
              {selectedExam.description ? <DetailItem label="Description" value={selectedExam.description} /> : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
