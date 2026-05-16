"use client";

import { useMemo, useState } from "react";
import { Link2, School, UserRoundCheck, Waypoints } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table";
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
import { DetailItem } from "@/components/shared/detail-item";
import { OrganizationScopeBanner } from "@/components/shared/organization-scope-banner";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { NativeSelect } from "@/components/ui/native-select";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { usePermission } from "@/hooks/use-permission";
import { normalizeApiError } from "@/lib/api/errors";
import { exportRowsToCsv } from "@/lib/utils/export";
import { useAuth } from "@/providers/auth-provider";
import type { BatchSubjectAssignment } from "@/types/domain";

export default function BatchSubjectAssignmentsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [pageIndex, setPageIndex] = useState(0);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BatchSubjectAssignment | null>(null);
  const [selectedItem, setSelectedItem] = useState<BatchSubjectAssignment | null>(null);
  const canCreate = usePermission("batch-subject-assignments.create");
  const canManage = usePermission("batch-subject-assignments.update");
  const canDelete = usePermission("batch-subject-assignments.delete");

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

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => batchSubjectAssignmentsApi.bulkRemove(ids),
    onSuccess: () => {
      toast.success("Selected assignments deleted");
      queryClient.invalidateQueries({ queryKey: ["batch-subject-assignments"] });
      setRowSelection({});
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const bulkStatusMutation = useMutation({
    mutationFn: async (payload: { ids: string[]; isActive: boolean }) =>
      batchSubjectAssignmentsApi.bulkUpdateStatus(payload.ids, payload.isActive),
    onSuccess: (_, variables) => {
      toast.success(variables.isActive ? "Selected assignments activated" : "Selected assignments deactivated");
      queryClient.invalidateQueries({ queryKey: ["batch-subject-assignments"] });
      setRowSelection({});
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
  const selectedAssignmentIds = Object.entries(rowSelection)
    .filter(([, selected]) => selected)
    .map(([id]) => id);
  const selectedAssignmentExportRows = useMemo(
    () =>
      items
        .filter((assignment) => selectedAssignmentIds.includes(assignment.id))
        .map((assignment) => ({
          Batch: assignment.batchName,
          BatchCode: assignment.batchCode,
          Subject: assignment.subjectName,
          SubjectCode: assignment.subjectCode,
          Teacher: assignment.teacherName ?? "Unassigned",
          Period: assignment.academicSessionName ?? "General",
          WeeklyClasses: assignment.weeklyClasses,
          Primary: assignment.isPrimary ? "Yes" : "No",
          Status: assignment.isActive ? "Active" : "Inactive",
        })),
    [items, selectedAssignmentIds],
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
        header: "Period",
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
            <Button variant="outline" size="sm" className="rounded-full border-primary/15 bg-background/80 px-3 font-medium shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/10" onClick={() => setSelectedItem(row.original)}>
              View
            </Button>
            {canManage ? (
              <Button
                variant="outline"
                size="sm"
                className="rounded-full border-primary/15 bg-background/80 px-3 font-medium shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/10"
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
        searchPlaceholder="Search by batch, subject, teacher, or period..."
        action={
          canCreate || canManage ? (
            <Dialog open={open} onOpenChange={setOpen}>
              {canCreate ? (
                <DialogTrigger asChild>
                  <Button disabled={!user?.organizationId}>Create assignment</Button>
                </DialogTrigger>
              ) : null}
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingItem ? "Edit assignment" : "Create assignment"}</DialogTitle>
                  <DialogDescription>Use assignments to define which subjects a batch studies and who owns them academically.</DialogDescription>
                </DialogHeader>
                <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
                  <FormField label="Academic year / term" className="md:col-span-2">
                    <NativeSelect {...form.register("academicSessionId")}>
                      <option value="">General / all periods</option>
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
                    <input className="h-10 rounded-2xl border border-border/70 bg-background px-3 text-sm shadow-sm" type="number" min={1} {...form.register("weeklyClasses")} />
                  </FormField>
                  <Checkbox {...form.register("isPrimary")} label="Mark as primary subject" />
                  <Checkbox {...form.register("isActive")} label="Keep assignment active" />
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
      {selectedAssignmentIds.length > 0 && (canManage || canDelete) ? (
        <div className="flex items-center justify-between rounded-[1.75rem] border border-sky-200 bg-sky-50/70 px-4 py-3 text-sm shadow-sm">
          <p>
            {selectedAssignmentIds.length} assignment{selectedAssignmentIds.length === 1 ? "" : "s"} selected
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setRowSelection({})}>
              Clear selection
            </Button>
            <Button
              variant="outline"
              onClick={() => exportRowsToCsv({ filename: "batch-subject-assignments-selected", rows: selectedAssignmentExportRows })}
              disabled={selectedAssignmentExportRows.length === 0}
            >
              Export selected
            </Button>
            {canManage ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => bulkStatusMutation.mutate({ ids: selectedAssignmentIds, isActive: true })}
                  disabled={bulkStatusMutation.isPending || bulkDeleteMutation.isPending}
                >
                  Activate selected
                </Button>
                <Button
                  variant="outline"
                  onClick={() => bulkStatusMutation.mutate({ ids: selectedAssignmentIds, isActive: false })}
                  disabled={bulkStatusMutation.isPending || bulkDeleteMutation.isPending}
                >
                  Deactivate selected
                </Button>
              </>
            ) : null}
            {canDelete ? (
              <Button
                variant="destructive"
                onClick={() => bulkDeleteMutation.mutate(selectedAssignmentIds)}
                disabled={bulkDeleteMutation.isPending || bulkStatusMutation.isPending}
              >
                {bulkDeleteMutation.isPending ? "Deleting..." : "Delete selected"}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
      <DataTable
        data={items}
        columns={columns}
        pageCount={Math.ceil(query.data.total / query.data.limit)}
        pagination={{ pageIndex, pageSize: query.data.limit }}
        onPaginationChange={(state) => setPageIndex(state.pageIndex)}
        enableRowSelection
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
      />
      <Dialog open={Boolean(selectedItem)} onOpenChange={(nextOpen) => !nextOpen && setSelectedItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assignment detail</DialogTitle>
            <DialogDescription>Review the batch-subject mapping and its teaching ownership.</DialogDescription>
          </DialogHeader>
          {selectedItem ? (
            <div className="grid gap-3 md:grid-cols-2">
              <DetailItem label="Batch" value={selectedItem.batchName} />
              <DetailItem label="Subject" value={selectedItem.subjectName} />
              <DetailItem label="Teacher" value={selectedItem.teacherName ?? "Unassigned"} />
              <DetailItem label="Session" value={selectedItem.academicSessionName ?? "General"} />
              <DetailItem label="Weekly classes" value={String(selectedItem.weeklyClasses)} />
              <DetailItem label="Primary subject" value={selectedItem.isPrimary ? "Yes" : "No"} />
              <DetailItem label="Status" value={selectedItem.isActive ? "Active" : "Inactive"} className="md:col-span-2" />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
