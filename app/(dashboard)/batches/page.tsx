"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarRange, LayoutList, PlayCircle, PauseCircle } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { batchesApi } from "@/features/batches/api/batches-api";
import { batchSchema, type BatchSchema } from "@/features/batches/schemas/batch-schema";
import { normalizeApiError } from "@/lib/api/errors";
import type { Batch } from "@/types/domain";
import { usePermission } from "@/hooks/use-permission";
import { DataTable } from "@/components/tables/data-table";
import { FilterBar } from "@/components/shared/filter-bar";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/forms/form-field";
import { formatDate } from "@/lib/formatters";
import { OrganizationScopeBanner } from "@/components/shared/organization-scope-banner";
import { useAuth } from "@/providers/auth-provider";
import { MetricCard } from "@/components/cards/metric-card";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useSavedFilterPresets } from "@/hooks/use-saved-filter-presets";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { exportRowsToCsv } from "@/lib/utils/export";

export default function BatchesPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const pageSize = 10;
  const [open, setOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const canCreate = usePermission("batches.create");
  const canManage = usePermission("batches.update");
  const canDelete = usePermission("batches.delete");
  const canMutateWithinScope = Boolean(user?.organizationId);
  const queryClient = useQueryClient();
  const savedBatchFilterPresets = useSavedFilterPresets<{
    search: string;
    statusFilter: string;
  }>("batches-filter-presets");
  const batchesQuery = useQuery({
    queryKey: ["batches", debouncedSearch, pageIndex, pageSize],
    queryFn: () => batchesApi.list({ page: pageIndex + 1, limit: pageSize, search: debouncedSearch }),
  });

  const form = useForm<BatchSchema>({
    resolver: zodResolver(batchSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      startDate: "",
      endDate: "",
      scheduleInfo: "",
      isActive: true,
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: BatchSchema) => {
      if (editingBatch) return batchesApi.update(editingBatch.id, values);
      return batchesApi.create(values);
    },
    onSuccess: () => {
      toast.success(editingBatch ? "Batch updated" : "Batch created");
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      setOpen(false);
      setEditingBatch(null);
      form.reset();
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => batchesApi.bulkRemove(ids),
    onSuccess: () => {
      toast.success("Selected batches deleted");
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      setRowSelection({});
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const bulkStatusMutation = useMutation({
    mutationFn: async (payload: { ids: string[]; isActive: boolean }) => batchesApi.bulkUpdateStatus(payload.ids, payload.isActive),
    onSuccess: (_, variables) => {
      toast.success(variables.isActive ? "Selected batches activated" : "Selected batches deactivated");
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      setRowSelection({});
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const columns = useMemo<Array<ColumnDef<Batch>>>(
    () => {
      const baseColumns: Array<ColumnDef<Batch>> = [
        {
          accessorKey: "name",
          header: "Batch",
          cell: ({ row }) => (
            <div>
              <Link href={`/batches/${row.original.id}`} className="font-medium hover:text-primary">
                {row.original.name}
              </Link>
              <p className="text-xs text-muted-foreground">{row.original.code}</p>
            </div>
          ),
        },
        ...(user?.roles.includes("SUPER_ADMIN")
          ? [
              {
                accessorKey: "organizationName",
                header: "Organization",
                cell: ({ row }) => row.original.organizationName,
              } satisfies ColumnDef<Batch>,
            ]
          : []),
        {
          accessorKey: "scheduleInfo",
          header: "Schedule",
        },
        {
          accessorKey: "startDate",
          header: "Duration",
          cell: ({ row }) => `${formatDate(row.original.startDate)} - ${formatDate(row.original.endDate)}`,
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
              <Button variant="outline" size="sm" className="rounded-full px-3 shadow-sm hover:border-primary/40 hover:bg-primary/5" asChild>
                <Link href={`/batches/${row.original.id}`}>View</Link>
              </Button>
              {canManage ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingBatch(row.original);
                    form.reset({
                      name: row.original.name,
                      code: row.original.code,
                      description: row.original.description ?? "",
                      startDate: row.original.startDate.slice(0, 10),
                      endDate: row.original.endDate?.slice(0, 10) ?? "",
                      scheduleInfo: row.original.scheduleInfo ?? "",
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
      ];

      return baseColumns;
    },
    [canManage, form, user?.roles],
  );

  const filteredBatches = useMemo(() => {
    const items = batchesQuery.data?.items ?? [];

    return items.filter((item) => {
      if (statusFilter === "ALL") {
        return true;
      }

      return statusFilter === "ACTIVE" ? item.isActive : !item.isActive;
    });
  }, [batchesQuery.data, statusFilter]);

  const hasLocalFilters = statusFilter !== "ALL";
  const selectedBatchIds = Object.entries(rowSelection)
    .filter(([, selected]) => selected)
    .map(([id]) => id);
  const selectedBatchExportRows = useMemo(
    () =>
      (batchesQuery.data?.items ?? [])
        .filter((batch) => selectedBatchIds.includes(batch.id))
        .map((batch) => ({
          Batch: batch.name,
          Code: batch.code,
          Schedule: batch.scheduleInfo ?? "",
          StartDate: formatDate(batch.startDate),
          EndDate: batch.endDate ? formatDate(batch.endDate) : "",
          Status: batch.isActive ? "Active" : "Inactive",
          Organization: batch.organizationName,
        })),
    [batchesQuery.data?.items, selectedBatchIds],
  );

  const exportRows = useMemo(
    () =>
      filteredBatches.map((batch) => ({
        Batch: batch.name,
        Code: batch.code,
        Schedule: batch.scheduleInfo ?? "",
        StartDate: formatDate(batch.startDate),
        EndDate: formatDate(batch.endDate),
        Status: batch.isActive ? "Active" : "Inactive",
      })),
    [filteredBatches],
  );

  const batchStats = useMemo(() => {
    return {
      totalBatches: filteredBatches.length,
      activeBatches: filteredBatches.filter((item) => item.isActive).length,
      inactiveBatches: filteredBatches.filter((item) => !item.isActive).length,
      scheduledBatches: filteredBatches.filter((item) => Boolean(item.scheduleInfo)).length,
    };
  }, [filteredBatches]);
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

  if (batchesQuery.isLoading) return <LoadingState rows={6} />;
  if (batchesQuery.isError || !batchesQuery.data) return <ErrorState description="Batches could not be loaded." onRetry={() => batchesQuery.refetch()} />;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Structure" title="Batches and classes" description="Manage class groups, schedules, active states, and batch detail drill-downs." />
      <OrganizationScopeBanner moduleLabel="Batch management" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Visible batches" value={String(batchStats.totalBatches)} helper="Batches in the current page scope" icon={LayoutList} tone="sky" />
        <MetricCard title="Active batches" value={String(batchStats.activeBatches)} helper="Currently open and usable batches" icon={PlayCircle} tone="emerald" />
        <MetricCard title="Inactive batches" value={String(batchStats.inactiveBatches)} helper="Batches currently disabled" icon={PauseCircle} tone="amber" />
        <MetricCard title="Scheduled batches" value={String(batchStats.scheduledBatches)} helper="Batches with schedule information" icon={CalendarRange} tone="violet" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={buildActivityLogsHref({ module: "batches" })}>Audit batch events</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={buildActivityLogsHref({ action: "bulk-status" })}>Audit bulk status</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={buildActivityLogsHref({ action: "bulk-delete" })}>Audit bulk deletes</Link>
        </Button>
      </div>
      <FilterBar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPageIndex(0);
        }}
        searchPlaceholder="Search batches by name, code, or schedule..."
        filters={
          <select
            className="h-10 rounded-2xl border border-border/70 bg-background px-3 text-sm shadow-sm"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPageIndex(0);
            }}
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active only</option>
            <option value="INACTIVE">Inactive only</option>
          </select>
        }
        exportConfig={{ filename: "batches-management", rows: exportRows }}
        action={
          canCreate ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button disabled={!canMutateWithinScope}>Create batch</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingBatch ? "Edit batch" : "Create batch"}</DialogTitle>
                  <DialogDescription>Fields align with `CreateBatchDto` and support active/inactive scheduling.</DialogDescription>
                </DialogHeader>
                <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
                  <FormField label="Batch name" required error={form.formState.errors.name}>
                    <Input {...form.register("name")} />
                  </FormField>
                  <FormField label="Code" required error={form.formState.errors.code}>
                    <Input {...form.register("code")} />
                  </FormField>
                  <FormField label="Start date" required error={form.formState.errors.startDate}>
                    <Input type="date" {...form.register("startDate")} />
                  </FormField>
                  <FormField label="End date" error={form.formState.errors.endDate}>
                    <Input type="date" {...form.register("endDate")} />
                  </FormField>
                  <FormField label="Schedule information" error={form.formState.errors.scheduleInfo} className="md:col-span-2">
                    <Input {...form.register("scheduleInfo")} />
                  </FormField>
                  <FormField label="Description" error={form.formState.errors.description} className="md:col-span-2">
                    <Input {...form.register("description")} />
                  </FormField>
                  <div className="md:col-span-2 flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={mutation.isPending}>
                      {mutation.isPending ? "Saving..." : editingBatch ? "Update batch" : "Create batch"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.75rem] border border-border/70 bg-card/85 px-4 py-3 text-sm shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground">Saved views</span>
          <Select
            value={selectedPresetId}
            onValueChange={(presetId) => {
              const preset = savedBatchFilterPresets.presets.find((item) => item.id === presetId);
              if (!preset) {
                return;
              }

              setSearch(preset.value.search);
              setStatusFilter(preset.value.statusFilter);
              setSelectedPresetId(preset.id);
              setPageIndex(0);
            }}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select saved view" />
            </SelectTrigger>
            <SelectContent>
              {savedBatchFilterPresets.presets.length === 0 ? (
                <SelectItem value="__none" disabled>
                  No saved views yet
                </SelectItem>
              ) : (
                savedBatchFilterPresets.presets.map((preset) => (
                  <SelectItem key={preset.id} value={preset.id}>
                    {preset.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const name = window.prompt("Save the current batch filters as:");
              const preset = name
                ? savedBatchFilterPresets.savePreset(name, {
                    search,
                    statusFilter,
                  })
                : null;

              if (preset) {
                setSelectedPresetId(preset.id);
                toast.success(`Saved view "${preset.name}"`);
              }
            }}
          >
            Save current view
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              savedBatchFilterPresets.clearPresets();
              setSelectedPresetId("");
              toast.success("Saved batch views cleared");
            }}
            disabled={savedBatchFilterPresets.presets.length === 0}
          >
            Clear saved views
          </Button>
        </div>
      </div>
      {selectedBatchIds.length > 0 && (canManage || canDelete) ? (
        <div className="flex items-center justify-between rounded-[1.75rem] border border-sky-200 bg-sky-50/70 px-4 py-3 text-sm shadow-sm">
          <p>
            {selectedBatchIds.length} batch{selectedBatchIds.length === 1 ? "" : "es"} selected
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setRowSelection({})}>
              Clear selection
            </Button>
            <Button
              variant="outline"
              onClick={() => exportRowsToCsv({ filename: "batches-selected", rows: selectedBatchExportRows })}
              disabled={selectedBatchExportRows.length === 0}
            >
              Export selected
            </Button>
            {canManage ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => bulkStatusMutation.mutate({ ids: selectedBatchIds, isActive: true })}
                  disabled={bulkStatusMutation.isPending || bulkDeleteMutation.isPending}
                >
                  Activate selected
                </Button>
                <Button
                  variant="outline"
                  onClick={() => bulkStatusMutation.mutate({ ids: selectedBatchIds, isActive: false })}
                  disabled={bulkStatusMutation.isPending || bulkDeleteMutation.isPending}
                >
                  Deactivate selected
                </Button>
              </>
            ) : null}
            {canDelete ? (
              <Button
                variant="destructive"
                onClick={() => bulkDeleteMutation.mutate(selectedBatchIds)}
                disabled={bulkDeleteMutation.isPending || bulkStatusMutation.isPending}
              >
                {bulkDeleteMutation.isPending ? "Deleting..." : "Delete selected"}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
      <DataTable
        data={filteredBatches}
        columns={columns}
        pageCount={hasLocalFilters ? 1 : Math.ceil(batchesQuery.data.total / batchesQuery.data.limit)}
        pagination={{ pageIndex: hasLocalFilters ? 0 : batchesQuery.data.page - 1, pageSize: batchesQuery.data.limit }}
        onPaginationChange={(state) => {
          if (!hasLocalFilters) {
            setPageIndex(state.pageIndex);
          }
        }}
        enableRowSelection
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
      />
    </div>
  );
}
