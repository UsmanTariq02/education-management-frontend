"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { BookOpenCheck, ClipboardList, Clock3, FileCheck2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { academicSessionsApi } from "@/features/academic-sessions/api/academic-sessions-api";
import { assignmentsApi } from "@/features/assignments/api/assignments-api";
import { assignmentSchema, type AssignmentSchema } from "@/features/assignments/schemas/assignment-schema";
import { batchesApi } from "@/features/batches/api/batches-api";
import { subjectsApi } from "@/features/subjects/api/subjects-api";
import { teachersApi } from "@/features/teachers/api/teachers-api";
import { MetricCard } from "@/components/cards/metric-card";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { FormField } from "@/components/forms/form-field";
import { FilterBar } from "@/components/shared/filter-bar";
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
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { usePermission } from "@/hooks/use-permission";
import { normalizeApiError } from "@/lib/api/errors";
import { formatDate } from "@/lib/formatters";
import { useAuth } from "@/providers/auth-provider";
import type { Assignment, AssignmentSubmission } from "@/types/domain";

type ReviewDraftState = Record<string, { feedback: string; awardedMarks: string }>;

export default function AssignmentsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [pageIndex, setPageIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [reviewDrafts, setReviewDrafts] = useState<ReviewDraftState>({});
  const canCreate = usePermission("assignments.create");
  const canManage = usePermission("assignments.update");

  const query = useQuery({
    queryKey: ["assignments", debouncedSearch, pageIndex],
    queryFn: () => assignmentsApi.list({ page: pageIndex + 1, limit: 10, search: debouncedSearch }),
  });
  const sessionsQuery = useQuery({ queryKey: ["academic-sessions", "assignment-options"], queryFn: () => academicSessionsApi.list({ page: 1, limit: 100 }) });
  const batchesQuery = useQuery({ queryKey: ["batches", "assignment-options"], queryFn: () => batchesApi.list({ page: 1, limit: 100 }) });
  const subjectsQuery = useQuery({ queryKey: ["subjects", "assignment-options"], queryFn: () => subjectsApi.list({ page: 1, limit: 100 }) });
  const teachersQuery = useQuery({ queryKey: ["teachers", "assignment-options"], queryFn: () => teachersApi.list({ page: 1, limit: 100 }) });

  const form = useForm<AssignmentSchema>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      academicSessionId: "",
      batchId: "",
      subjectId: "",
      teacherId: "",
      title: "",
      code: "",
      description: "",
      instructions: "",
      status: "DRAFT",
      maxMarks: 100,
      dueAt: "",
      allowLateSubmission: false,
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: AssignmentSchema) => {
      const payload = {
        ...values,
        academicSessionId: values.academicSessionId || undefined,
        teacherId: values.teacherId || undefined,
        description: values.description || undefined,
        instructions: values.instructions || undefined,
        dueAt: new Date(values.dueAt).toISOString(),
      };

      if (editingAssignment) {
        return assignmentsApi.update(editingAssignment.id, payload);
      }
      return assignmentsApi.create(payload);
    },
    onSuccess: () => {
      toast.success(editingAssignment ? "Assignment updated" : "Assignment created");
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      setOpen(false);
      setEditingAssignment(null);
      form.reset();
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ submissionId, feedback, awardedMarks }: { submissionId: string; feedback?: string; awardedMarks?: number }) =>
      assignmentsApi.reviewSubmission(submissionId, { feedback, awardedMarks, finalize: true }),
    onSuccess: async () => {
      toast.success("Submission reviewed");
      await queryClient.invalidateQueries({ queryKey: ["assignments"] });
      if (selectedAssignment) {
        const refreshed = await assignmentsApi.detail(selectedAssignment.id);
        setSelectedAssignment(refreshed);
      }
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const items = query.data?.items ?? [];
  const stats = useMemo(
    () => ({
      total: items.length,
      published: items.filter((item) => item.status === "PUBLISHED").length,
      dueSoon: items.filter((item) => new Date(item.dueAt).getTime() - Date.now() < 1000 * 60 * 60 * 72 && item.status === "PUBLISHED").length,
      reviewed: items.reduce((sum, item) => sum + item.reviewedCount, 0),
    }),
    [items],
  );

  const columns = useMemo<Array<ColumnDef<Assignment>>>(
    () => [
      {
        accessorKey: "title",
        header: "Assignment",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.title}</p>
            <p className="text-xs text-muted-foreground">
              {row.original.subjectName} · {row.original.code}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "batchName",
        header: "Batch",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.batchName}</p>
            <p className="text-xs text-muted-foreground">{row.original.batchCode}</p>
          </div>
        ),
      },
      {
        accessorKey: "teacherName",
        header: "Teacher",
        cell: ({ row }) => row.original.teacherName ?? <span className="text-muted-foreground">Unassigned</span>,
      },
      {
        accessorKey: "dueAt",
        header: "Due",
        cell: ({ row }) => formatDate(row.original.dueAt),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Badge variant={row.original.status === "PUBLISHED" ? "success" : row.original.status === "CLOSED" ? "warning" : "outline"}>
              {row.original.status}
            </Badge>
            <Badge variant="outline">{row.original.submissionCount} submissions</Badge>
          </div>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full border-primary/15 bg-background/80 px-3 font-medium shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/10"
              onClick={async () => {
                const detail = await assignmentsApi.detail(row.original.id);
                setSelectedAssignment(detail);
              }}
            >
              View
            </Button>
            {canManage ? (
              <Button
                variant="outline"
                size="sm"
                className="rounded-full border-primary/15 bg-background/80 px-3 font-medium shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/10"
                onClick={() => {
                  setEditingAssignment(row.original);
                  form.reset({
                    academicSessionId: row.original.academicSessionId ?? "",
                    batchId: row.original.batchId,
                    subjectId: row.original.subjectId,
                    teacherId: row.original.teacherId ?? "",
                    title: row.original.title,
                    code: row.original.code,
                    description: row.original.description ?? "",
                    instructions: row.original.instructions ?? "",
                    status: row.original.status,
                    maxMarks: row.original.maxMarks,
                    dueAt: row.original.dueAt.slice(0, 16),
                    allowLateSubmission: row.original.allowLateSubmission,
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

  function getDraft(submission: AssignmentSubmission) {
    return reviewDrafts[submission.id] ?? {
      feedback: submission.feedback ?? "",
      awardedMarks: submission.awardedMarks !== null ? String(submission.awardedMarks) : "",
    };
  }

  if ([query, sessionsQuery, batchesQuery, subjectsQuery, teachersQuery].some((entry) => entry.isLoading)) {
    return <LoadingState rows={6} />;
  }

  if ([query, sessionsQuery, batchesQuery, subjectsQuery, teachersQuery].some((entry) => entry.isError) || !query.data) {
    return <ErrorState description="Assignments could not be loaded." onRetry={() => query.refetch()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Academics" title="Assignments" description="Create real assignment workflows, track student submissions, and finalize teacher reviews." />
      <OrganizationScopeBanner moduleLabel="Academic operations" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Visible assignments" value={String(stats.total)} helper="Assignments in the current page scope" icon={ClipboardList} tone="sky" />
        <MetricCard title="Published" value={String(stats.published)} helper="Live assignments available to students" icon={BookOpenCheck} tone="emerald" />
        <MetricCard title="Due soon" value={String(stats.dueSoon)} helper="Assignments closing in the next 72 hours" icon={Clock3} tone="amber" />
        <MetricCard title="Reviewed submissions" value={String(stats.reviewed)} helper="Submission records already finalized by teachers" icon={FileCheck2} tone="violet" />
      </div>
      <FilterBar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPageIndex(0);
        }}
        searchPlaceholder="Search by title, code, batch, or subject..."
        action={
          canCreate || canManage ? (
            <Dialog open={open} onOpenChange={setOpen}>
              {canCreate ? (
                <DialogTrigger asChild>
                  <Button disabled={!user?.organizationId}>Create assignment</Button>
                </DialogTrigger>
              ) : null}
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>{editingAssignment ? "Edit assignment" : "Create assignment"}</DialogTitle>
                  <DialogDescription>Assignments are long-form coursework items with student submissions and teacher review.</DialogDescription>
                </DialogHeader>
                <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
                  <FormField label="Academic session" className="md:col-span-2">
                    <NativeSelect {...form.register("academicSessionId")}>
                      <option value="">General / all sessions</option>
                      {sessionsQuery.data?.items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </NativeSelect>
                  </FormField>
                  <FormField label="Batch" required error={form.formState.errors.batchId}>
                    <NativeSelect {...form.register("batchId")}>
                      <option value="">Select batch</option>
                      {batchesQuery.data?.items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </NativeSelect>
                  </FormField>
                  <FormField label="Subject" required error={form.formState.errors.subjectId}>
                    <NativeSelect {...form.register("subjectId")}>
                      <option value="">Select subject</option>
                      {subjectsQuery.data?.items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </NativeSelect>
                  </FormField>
                  <FormField label="Teacher">
                    <NativeSelect {...form.register("teacherId")}>
                      <option value="">Select teacher</option>
                      {teachersQuery.data?.items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.fullName}
                        </option>
                      ))}
                    </NativeSelect>
                  </FormField>
                  <FormField label="Status" required error={form.formState.errors.status}>
                    <NativeSelect {...form.register("status")}>
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                      <option value="CLOSED">Closed</option>
                    </NativeSelect>
                  </FormField>
                  <FormField label="Title" required error={form.formState.errors.title} className="md:col-span-2">
                    <Input {...form.register("title")} />
                  </FormField>
                  <FormField label="Code" required error={form.formState.errors.code}>
                    <Input {...form.register("code")} />
                  </FormField>
                  <FormField label="Max marks" required error={form.formState.errors.maxMarks}>
                    <Input type="number" {...form.register("maxMarks")} />
                  </FormField>
                  <FormField label="Due date" required error={form.formState.errors.dueAt}>
                    <Input type="datetime-local" {...form.register("dueAt")} />
                  </FormField>
                  <FormField label="Description" className="md:col-span-2">
                    <Textarea rows={3} {...form.register("description")} />
                  </FormField>
                  <FormField label="Instructions" className="md:col-span-2">
                    <Textarea rows={5} {...form.register("instructions")} />
                  </FormField>
                  <div className="md:col-span-2">
                    <Checkbox {...form.register("allowLateSubmission")} label="Allow late submissions" />
                  </div>
                  <div className="flex justify-end gap-2 md:col-span-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={mutation.isPending}>
                      {editingAssignment ? "Save changes" : "Create assignment"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />
      <DataTable
        data={items}
        columns={columns}
        pageCount={Math.ceil(query.data.total / query.data.limit)}
        pagination={{ pageIndex, pageSize: query.data.limit }}
        onPaginationChange={(state) => setPageIndex(state.pageIndex)}
      />
      <Dialog open={Boolean(selectedAssignment)} onOpenChange={(nextOpen) => !nextOpen && setSelectedAssignment(null)}>
        <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assignment detail</DialogTitle>
            <DialogDescription>Review assignment settings, student submissions, and grading feedback.</DialogDescription>
          </DialogHeader>
          {selectedAssignment ? (
            <div className="space-y-4 text-sm">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border px-4 py-3">
                  <p className="text-muted-foreground">Assignment</p>
                  <p className="mt-1 font-medium">{selectedAssignment.title}</p>
                  <p className="text-xs text-muted-foreground">{selectedAssignment.subjectName} · {selectedAssignment.batchName}</p>
                </div>
                <div className="rounded-2xl border px-4 py-3">
                  <p className="text-muted-foreground">Status</p>
                  <p className="mt-1 font-medium">
                    {selectedAssignment.status} · Due {formatDate(selectedAssignment.dueAt)}
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border px-4 py-3">
                <p className="font-medium">Instructions</p>
                <p className="mt-1 text-muted-foreground">{selectedAssignment.instructions ?? selectedAssignment.description ?? "No instructions provided."}</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">Submissions</p>
                  <Badge variant="outline">
                    {selectedAssignment.reviewedCount}/{selectedAssignment.submissionCount} reviewed
                  </Badge>
                </div>
                {selectedAssignment.submissions.length ? (
                  selectedAssignment.submissions.map((submission) => {
                    const draft = getDraft(submission);
                    return (
                      <div key={submission.id} className="rounded-2xl border p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{submission.studentName}</p>
                            <p className="text-xs text-muted-foreground">
                              {submission.studentEmail ?? "No email"} · {submission.status}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant={submission.status === "REVIEWED" ? "success" : submission.status === "SUBMITTED" ? "secondary" : "warning"}>
                              {submission.status}
                            </Badge>
                            {submission.awardedMarks !== null ? <Badge variant="outline">{submission.awardedMarks}/{selectedAssignment.maxMarks}</Badge> : null}
                          </div>
                        </div>
                        <p className="mt-3 whitespace-pre-wrap text-muted-foreground">{submission.submissionText ?? "No submission text provided."}</p>
                        {submission.attachmentLinks.length ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {submission.attachmentLinks.map((link) => (
                              <a key={link} href={link} target="_blank" rel="noreferrer" className="rounded-full border px-3 py-1 text-xs text-primary hover:bg-primary/5">
                                {link}
                              </a>
                            ))}
                          </div>
                        ) : null}
                        {canManage ? (
                          <div className="mt-4 grid gap-3 md:grid-cols-[120px_minmax(0,1fr)_auto]">
                            <Input
                              type="number"
                              placeholder="Marks"
                              value={draft.awardedMarks}
                              onChange={(event) =>
                                setReviewDrafts((current) => ({
                                  ...current,
                                  [submission.id]: { ...draft, awardedMarks: event.target.value },
                                }))
                              }
                            />
                            <Textarea
                              rows={3}
                              placeholder="Teacher feedback"
                              value={draft.feedback}
                              onChange={(event) =>
                                setReviewDrafts((current) => ({
                                  ...current,
                                  [submission.id]: { ...draft, feedback: event.target.value },
                                }))
                              }
                            />
                            <Button
                              type="button"
                              disabled={reviewMutation.isPending}
                              onClick={() =>
                                reviewMutation.mutate({
                                  submissionId: submission.id,
                                  feedback: draft.feedback || undefined,
                                  awardedMarks: draft.awardedMarks ? Number(draft.awardedMarks) : undefined,
                                })
                              }
                            >
                              Finalize
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed px-4 py-6 text-muted-foreground">No student submissions yet.</div>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
