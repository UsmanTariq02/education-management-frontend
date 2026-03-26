"use client";

import { useMemo, useState } from "react";
import { Link2, School, UserRoundCheck, Waypoints } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { batchesApi } from "@/features/batches/api/batches-api";
import { academicSessionsApi } from "@/features/academic-sessions/api/academic-sessions-api";
import { subjectsApi } from "@/features/subjects/api/subjects-api";
import { teachersApi } from "@/features/teachers/api/teachers-api";
import { batchSubjectAssignmentsApi } from "@/features/batch-subject-assignments/api/batch-subject-assignments-api";
import {
  batchSubjectAssignmentSchema,
  type BatchSubjectAssignmentSchema,
} from "@/features/batch-subject-assignments/schemas/batch-subject-assignment-schema";
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { NativeSelect } from "@/components/ui/native-select";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { usePermission } from "@/hooks/use-permission";
import { normalizeApiError } from "@/lib/api/errors";
import { useAuth } from "@/providers/auth-provider";
import type { BatchSubjectAssignment } from "@/types/domain";

export default function BatchSubjectAssignmentsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [pageIndex, setPageIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BatchSubjectAssignment | null>(null);
  const [selectedItem, setSelectedItem] = useState<BatchSubjectAssignment | null>(null);
  const canCreate = usePermission("batch-subject-assignments.create");
  const canManage = usePermission("batch-subject-assignments.update");

  const query = useQuery({
    queryKey: ["batch-subject-assignments", debouncedSearch, pageIndex],
    queryFn: () => batchSubjectAssignmentsApi.list({ page: pageIndex + 1, limit: 10, search: debouncedSearch }),
  });
  const sessionsQuery = useQuery({ queryKey: ["academic-sessions", "options"], queryFn: () => academicSessionsApi.list({ page: 1, limit: 100 }) });
  const batchesQuery = useQuery({ queryKey: ["batches", "options"], queryFn: () => batchesApi.list({ page: 1, limit: 100 }) });
  const subjectsQuery = useQuery({ queryKey: ["subjects", "options"], queryFn: () => subjectsApi.list({ page: 1, limit: 100 }) });
  const teachersQuery = useQuery({ queryKey: ["teachers", "options"], queryFn: () => teachersApi.list({ page: 1, limit: 100 }) });

  const form = useForm<BatchSubjectAssignmentSchema>({
    resolver: zodResolver(batchSubjectAssignmentSchema),
    defaultValues: {
      academicSessionId: "",
      batchId: "",
      subjectId: "",
      teacherId: "",
      weeklyClasses: 1,
      isPrimary: false,
      isActive: true,
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: BatchSubjectAssignmentSchema) => {
      const payload = {
        ...values,
        academicSessionId: values.academicSessionId || undefined,
        teacherId: values.teacherId || undefined,
      };
      if (editingItem) {
        return batchSubjectAssignmentsApi.update(editingItem.id, payload);
      }
      return batchSubjectAssignmentsApi.create(payload);
    },
    onSuccess: () => {
      toast.success(editingItem ? "Assignment updated" : "Assignment created");
      queryClient.invalidateQueries({ queryKey: ["batch-subject-assignments"] });
      setOpen(false);
      setEditingItem(null);
      form.reset();
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const items = query.data?.items ?? [];
  const stats = useMemo(
    () => ({
      total: items.length,
      primary: items.filter((item) => item.isPrimary).length,
      teacherMapped: items.filter((item) => item.teacherId).length,
      active: items.filter((item) => item.isActive).length,
    }),
    [items],
  );

  const columns = useMemo<Array<ColumnDef<BatchSubjectAssignment>>>(
    () => [
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
        accessorKey: "subjectName",
        header: "Subject",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.subjectName}</p>
            <p className="text-xs text-muted-foreground">{row.original.subjectCode}</p>
          </div>
        ),
      },
      {
        accessorKey: "teacherName",
        header: "Teacher",
        cell: ({ row }) => row.original.teacherName ?? <span className="text-muted-foreground">Unassigned</span>,
      },
      {
        accessorKey: "academicSessionName",
        header: "Session",
        cell: ({ row }) => row.original.academicSessionName ?? <span className="text-muted-foreground">General</span>,
      },
      {
        accessorKey: "weeklyClasses",
        header: "Weekly",
      },
      {
        accessorKey: "isPrimary",
        header: "Flags",
        cell: ({ row }) => (
          <div className="flex gap-1">
            {row.original.isPrimary ? <Badge variant="success">Primary</Badge> : null}
            <Badge variant={row.original.isActive ? "secondary" : "warning"}>{row.original.isActive ? "Active" : "Inactive"}</Badge>
          </div>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedItem(row.original)}>
              View
            </Button>
            {canManage ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingItem(row.original);
                  form.reset({
                    academicSessionId: row.original.academicSessionId ?? "",
                    batchId: row.original.batchId,
                    subjectId: row.original.subjectId,
                    teacherId: row.original.teacherId ?? "",
                    weeklyClasses: row.original.weeklyClasses,
                    isPrimary: row.original.isPrimary,
                    isActive: row.original.isActive,
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

  if ([query, sessionsQuery, batchesQuery, subjectsQuery, teachersQuery].some((entry) => entry.isLoading)) {
    return <LoadingState rows={6} />;
  }
  if ([query, sessionsQuery, batchesQuery, subjectsQuery, teachersQuery].some((entry) => entry.isError) || !query.data) {
    return <ErrorState description="Batch subject assignments could not be loaded." onRetry={() => query.refetch()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Academics"
        title="Batch subject assignments"
        description="Attach subjects and teachers to batches before timetable building, exams, and result ownership."
      />
      <OrganizationScopeBanner moduleLabel="Academic operations" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Visible mappings" value={String(stats.total)} helper="Assignments in the current page scope" icon={Waypoints} tone="sky" />
        <MetricCard title="Primary subjects" value={String(stats.primary)} helper="Subjects flagged as major or primary" icon={School} tone="emerald" />
        <MetricCard title="Teacher mapped" value={String(stats.teacherMapped)} helper="Assignments already linked to a teacher" icon={UserRoundCheck} tone="violet" />
        <MetricCard title="Active mappings" value={String(stats.active)} helper="Assignments ready for timetable use" icon={Link2} tone="amber" />
      </div>
      <FilterBar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPageIndex(0);
        }}
        searchPlaceholder="Search by batch, subject, teacher, or session..."
        action={
          canCreate ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button disabled={!user?.organizationId}>Create assignment</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingItem ? "Edit assignment" : "Create assignment"}</DialogTitle>
                  <DialogDescription>Use assignments to define which subjects a batch studies and who owns them academically.</DialogDescription>
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
                      <option value="">Unassigned</option>
                      {teachersQuery.data?.items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.fullName}
                        </option>
                      ))}
                    </NativeSelect>
                  </FormField>
                  <FormField label="Weekly classes" required error={form.formState.errors.weeklyClasses}>
                    <input className="h-10 rounded-xl border bg-background px-3 text-sm" type="number" min={1} {...form.register("weeklyClasses")} />
                  </FormField>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" {...form.register("isPrimary")} />
                    Mark as primary subject
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" {...form.register("isActive")} />
                    Keep assignment active
                  </label>
                  <div className="md:col-span-2 flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={mutation.isPending}>
                      {editingItem ? "Save changes" : "Create assignment"}
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
      <Dialog open={Boolean(selectedItem)} onOpenChange={(nextOpen) => !nextOpen && setSelectedItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assignment detail</DialogTitle>
            <DialogDescription>Review the batch-subject mapping and its teaching ownership.</DialogDescription>
          </DialogHeader>
          {selectedItem ? (
            <div className="space-y-3 text-sm">
              <p><span className="font-medium">Batch:</span> {selectedItem.batchName}</p>
              <p><span className="font-medium">Subject:</span> {selectedItem.subjectName}</p>
              <p><span className="font-medium">Teacher:</span> {selectedItem.teacherName ?? "Unassigned"}</p>
              <p><span className="font-medium">Session:</span> {selectedItem.academicSessionName ?? "General"}</p>
              <p><span className="font-medium">Weekly classes:</span> {selectedItem.weeklyClasses}</p>
              <p><span className="font-medium">Primary subject:</span> {selectedItem.isPrimary ? "Yes" : "No"}</p>
              <p><span className="font-medium">Status:</span> {selectedItem.isActive ? "Active" : "Inactive"}</p>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
