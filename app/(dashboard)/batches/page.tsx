"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarRange, LayoutList, PlayCircle, PauseCircle } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
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

export default function BatchesPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 10;
  const [open, setOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const canCreate = usePermission("batches.create");
  const canManage = usePermission("batches.update");
  const canMutateWithinScope = Boolean(user?.organizationId);
  const queryClient = useQueryClient();
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
              <Button variant="ghost" size="sm" asChild>
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
      <FilterBar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPageIndex(0);
        }}
        searchPlaceholder="Search batches by name, code, or schedule..."
        filters={
          <select
            className="h-10 rounded-xl border bg-background px-3 text-sm"
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
      />
    </div>
  );
}
