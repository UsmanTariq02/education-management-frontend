"use client";

import { useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, GraduationCap, TimerReset } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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
import { Input } from "@/components/ui/input";
import { academicSessionsApi } from "@/features/academic-sessions/api/academic-sessions-api";
import {
  academicSessionSchema,
  type AcademicSessionSchema,
} from "@/features/academic-sessions/schemas/academic-session-schema";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { usePermission } from "@/hooks/use-permission";
import { normalizeApiError } from "@/lib/api/errors";
import { formatDate } from "@/lib/formatters";
import { exportRowsToCsv } from "@/lib/utils/export";
import { useAuth } from "@/providers/auth-provider";
import type { AcademicSession } from "@/types/domain";

export default function AcademicSessionsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [pageIndex, setPageIndex] = useState(0);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [open, setOpen] = useState(false);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [editingSession, setEditingSession] = useState<AcademicSession | null>(null);
  const [selectedSession, setSelectedSession] = useState<AcademicSession | null>(null);
  const canCreate = usePermission("academic-sessions.create");
  const canManage = usePermission("academic-sessions.update");
  const canDelete = usePermission("academic-sessions.delete");
  const query = useQuery({
    queryKey: ["academic-sessions", debouncedSearch, pageIndex],
    queryFn: () => academicSessionsApi.list({ page: pageIndex + 1, limit: 10, search: debouncedSearch }),
  });

  const form = useForm<AcademicSessionSchema>({
    resolver: zodResolver(academicSessionSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      startDate: "",
      endDate: "",
      isCurrent: false,
      isActive: true,
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: AcademicSessionSchema) => {
      if (editingSession) {
        return academicSessionsApi.update(editingSession.id, values);
      }
      return academicSessionsApi.create(values);
    },
    onSuccess: () => {
      toast.success(editingSession ? "Academic period updated" : "Academic period created");
      queryClient.invalidateQueries({ queryKey: ["academic-sessions"] });
      setOpen(false);
      setEditingSession(null);
      form.reset();
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => academicSessionsApi.bulkRemove(ids),
    onSuccess: () => {
      toast.success("Selected periods deleted");
      queryClient.invalidateQueries({ queryKey: ["academic-sessions"] });
      setRowSelection({});
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const bulkStatusMutation = useMutation({
    mutationFn: async (payload: { ids: string[]; isActive: boolean }) => academicSessionsApi.bulkUpdateStatus(payload.ids, payload.isActive),
    onSuccess: (_, variables) => {
      toast.success(variables.isActive ? "Selected periods activated" : "Selected periods deactivated");
      queryClient.invalidateQueries({ queryKey: ["academic-sessions"] });
      setRowSelection({});
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const filteredItems = useMemo(() => {
    const items = query.data?.items ?? [];
    if (statusFilter === "ACTIVE") {
      return items.filter((item) => item.isActive);
    }
    if (statusFilter === "INACTIVE") {
      return items.filter((item) => !item.isActive);
    }
    if (statusFilter === "CURRENT") {
      return items.filter((item) => item.isCurrent);
    }
    return items;
  }, [query.data, statusFilter]);

  const stats = useMemo(
    () => ({
      total: filteredItems.length,
      current: filteredItems.filter((item) => item.isCurrent).length,
      active: filteredItems.filter((item) => item.isActive).length,
      archived: filteredItems.filter((item) => !item.isActive).length,
    }),
    [filteredItems],
  );
  const selectedSessionIds = Object.entries(rowSelection)
    .filter(([, selected]) => selected)
    .map(([id]) => id);
  const selectedSessionExportRows = useMemo(
    () =>
      filteredItems
        .filter((session) => selectedSessionIds.includes(session.id))
        .map((session) => ({
          Period: session.name,
          Code: session.code,
          Duration: `${formatDate(session.startDate)} - ${formatDate(session.endDate)}`,
          Current: session.isCurrent ? "Yes" : "No",
          Status: session.isActive ? "Active" : "Inactive",
          Organization: session.organizationName ?? "",
          Description: session.description ?? "",
        })),
    [filteredItems, selectedSessionIds],
  );

  const columns = useMemo<Array<ColumnDef<AcademicSession>>>(
    () => [
      {
        accessorKey: "name",
        header: "Period",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">{row.original.code}</p>
          </div>
        ),
      },
      ...(user?.roles.includes("SUPER_ADMIN")
        ? [
            {
              accessorKey: "organizationName",
              header: "Organization",
            } satisfies ColumnDef<AcademicSession>,
          ]
        : []),
      {
        accessorKey: "startDate",
        header: "Duration",
        cell: ({ row }) => `${formatDate(row.original.startDate)} - ${formatDate(row.original.endDate)}`,
      },
      {
        accessorKey: "isCurrent",
        header: "Current",
        cell: ({ row }) => <Badge variant={row.original.isCurrent ? "success" : "secondary"}>{row.original.isCurrent ? "Current" : "Reference"}</Badge>,
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => <Badge variant={row.original.isActive ? "success" : "warning"}>{row.original.isActive ? "Active" : "Inactive"}</Badge>,
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-full border-primary/15 bg-background/80 px-3 font-medium shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/10" onClick={() => setSelectedSession(row.original)}>
              View
            </Button>
            {canManage ? (
              <Button
                variant="outline"
                size="sm"
                className="rounded-full border-primary/15 bg-background/80 px-3 font-medium shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/10"
                onClick={() => {
                  setEditingSession(row.original);
                  form.reset({
                    name: row.original.name,
                    code: row.original.code,
                    description: row.original.description ?? "",
                    startDate: row.original.startDate.slice(0, 10),
                    endDate: row.original.endDate.slice(0, 10),
                    isCurrent: row.original.isCurrent,
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
    [canManage, form, user?.roles],
  );

  if (query.isLoading) return <LoadingState rows={6} />;
  if (query.isError || !query.data) {
    return <ErrorState description="Academic years and terms could not be loaded." onRetry={() => query.refetch()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Academics"
        title="Academic years / terms"
        description="Define yearly or term-based academic periods so exams, timetables, and promotions can anchor to the right calendar."
      />
      <OrganizationScopeBanner moduleLabel="Academic operations" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Visible periods" value={String(stats.total)} helper="Academic periods within the current table scope" icon={GraduationCap} tone="sky" />
        <MetricCard title="Current periods" value={String(stats.current)} helper="Active default period markers" icon={CheckCircle2} tone="emerald" />
        <MetricCard title="Active periods" value={String(stats.active)} helper="Periods available for scheduling" icon={CalendarDays} tone="violet" />
        <MetricCard title="Archived periods" value={String(stats.archived)} helper="Historical or disabled periods" icon={TimerReset} tone="amber" />
      </div>
      <FilterBar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPageIndex(0);
        }}
        searchPlaceholder="Search periods by name or code..."
        filters={
          <select
            className="h-10 rounded-2xl border border-border/70 bg-background px-3 text-sm shadow-sm"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPageIndex(0);
            }}
          >
            <option value="ALL">All periods</option>
            <option value="CURRENT">Current only</option>
            <option value="ACTIVE">Active only</option>
            <option value="INACTIVE">Inactive only</option>
          </select>
        }
        action={
          canCreate || canManage ? (
            <Dialog open={open} onOpenChange={setOpen}>
              {canCreate ? (
                <DialogTrigger asChild>
                  <Button disabled={!user?.organizationId}>Create period</Button>
                </DialogTrigger>
              ) : null}
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingSession ? "Edit academic period" : "Create academic period"}</DialogTitle>
                  <DialogDescription>Only one period should normally be flagged as current for each organization.</DialogDescription>
                </DialogHeader>
                <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
                  <FormField label="Period name" required error={form.formState.errors.name}>
                    <Input {...form.register("name")} />
                  </FormField>
                  <FormField label="Code" required error={form.formState.errors.code}>
                    <Input {...form.register("code")} />
                  </FormField>
                  <FormField label="Start date" required error={form.formState.errors.startDate}>
                    <Input type="date" {...form.register("startDate")} />
                  </FormField>
                  <FormField label="End date" required error={form.formState.errors.endDate}>
                    <Input type="date" {...form.register("endDate")} />
                  </FormField>
                  <FormField label="Description" error={form.formState.errors.description} className="md:col-span-2">
                    <Input {...form.register("description")} />
                  </FormField>
                  <Checkbox {...form.register("isCurrent")} label="Mark as current period" />
                  <Checkbox {...form.register("isActive")} label="Keep period active" />
                  <div className="md:col-span-2 flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={mutation.isPending}>
                      {editingSession ? "Save changes" : "Create period"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />
      {selectedSessionIds.length > 0 && (canManage || canDelete) ? (
        <div className="flex items-center justify-between rounded-[1.75rem] border border-sky-200 bg-sky-50/70 px-4 py-3 text-sm shadow-sm">
          <p>
            {selectedSessionIds.length} period{selectedSessionIds.length === 1 ? "" : "s"} selected
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setRowSelection({})}>
              Clear selection
            </Button>
            <Button
              variant="outline"
              onClick={() => exportRowsToCsv({ filename: "academic-periods-selected", rows: selectedSessionExportRows })}
              disabled={selectedSessionExportRows.length === 0}
            >
              Export selected
            </Button>
            {canManage ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => bulkStatusMutation.mutate({ ids: selectedSessionIds, isActive: true })}
                  disabled={bulkStatusMutation.isPending || bulkDeleteMutation.isPending}
                >
                  Activate selected
                </Button>
                <Button
                  variant="outline"
                  onClick={() => bulkStatusMutation.mutate({ ids: selectedSessionIds, isActive: false })}
                  disabled={bulkStatusMutation.isPending || bulkDeleteMutation.isPending}
                >
                  Deactivate selected
                </Button>
              </>
            ) : null}
            {canDelete ? (
              <Button
                variant="destructive"
                onClick={() => bulkDeleteMutation.mutate(selectedSessionIds)}
                disabled={bulkDeleteMutation.isPending || bulkStatusMutation.isPending}
              >
                {bulkDeleteMutation.isPending ? "Deleting..." : "Delete selected"}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
      <DataTable
        data={filteredItems}
        columns={columns}
        pageCount={Math.ceil(query.data.total / query.data.limit)}
        pagination={{ pageIndex, pageSize: query.data.limit }}
        onPaginationChange={(state) => setPageIndex(state.pageIndex)}
        enableRowSelection
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
      />
      <Dialog open={Boolean(selectedSession)} onOpenChange={(nextOpen) => !nextOpen && setSelectedSession(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Academic period detail</DialogTitle>
            <DialogDescription>Review the period timeline and default academic state.</DialogDescription>
          </DialogHeader>
          {selectedSession ? (
            <div className="grid gap-3 md:grid-cols-2">
              <DetailItem label="Name" value={selectedSession.name} />
              <DetailItem label="Code" value={selectedSession.code} />
              <DetailItem label="Duration" value={`${formatDate(selectedSession.startDate)} - ${formatDate(selectedSession.endDate)}`} />
              <DetailItem label="Current" value={selectedSession.isCurrent ? "Yes" : "No"} />
              <DetailItem label="Status" value={selectedSession.isActive ? "Active" : "Inactive"} />
              <DetailItem label="Description" value={selectedSession.description ?? "—"} className="md:col-span-2" />
              {user?.roles.includes("SUPER_ADMIN") ? <DetailItem label="Organization" value={selectedSession.organizationName} className="md:col-span-2" /> : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
