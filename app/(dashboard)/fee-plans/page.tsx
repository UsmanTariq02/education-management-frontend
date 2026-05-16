"use client";

import { useMemo, useState } from "react";
import { CalendarDays, CircleDollarSign, Link2, ReceiptText } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { toast } from "sonner";
import { feesApi } from "@/features/fees/api/fees-api";
import { studentsApi } from "@/features/students/api/students-api";
import { batchesApi } from "@/features/batches/api/batches-api";
import { feePlanSchema, type FeePlanSchema } from "@/features/fees/schemas/fee-plan-schema";
import { normalizeApiError } from "@/lib/api/errors";
import type { FeePlan } from "@/types/domain";
import { usePermission } from "@/hooks/use-permission";
import { ChartCard } from "@/components/charts/chart-card";
import { DataTable } from "@/components/tables/data-table";
import { FilterBar } from "@/components/shared/filter-bar";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField } from "@/components/forms/form-field";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { getChartColor } from "@/lib/constants/chart-colors";
import { OrganizationScopeBanner } from "@/components/shared/organization-scope-banner";
import { useAuth } from "@/providers/auth-provider";
import { MetricCard } from "@/components/cards/metric-card";
import { useSavedFilterPresets } from "@/hooks/use-saved-filter-presets";

export default function FeePlansPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 10;
  const [open, setOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<FeePlan | null>(null);
  const canCreate = usePermission("fees.create");
  const canMutateWithinScope = Boolean(user?.organizationId);
  const queryClient = useQueryClient();
  const savedFeePlanFilterPresets = useSavedFilterPresets<{
    search: string;
  }>("fee-plans-filter-presets");

  const plansQuery = useQuery({
    queryKey: ["fees", "plans", pageIndex, pageSize],
    queryFn: () => feesApi.listPlans({ page: pageIndex + 1, limit: pageSize }),
  });
  const studentsQuery = useQuery({
    queryKey: ["students", "fee-plans", search],
    queryFn: () => studentsApi.list({ page: 1, limit: 100, search }),
  });
  const batchesQuery = useQuery({
    queryKey: ["batches", "fee-plans"],
    queryFn: () => batchesApi.list({ page: 1, limit: 100 }),
  });

  const form = useForm<FeePlanSchema>({
    resolver: zodResolver(feePlanSchema),
    defaultValues: {
      studentId: "",
      batchId: "",
      monthlyFee: 0,
      dueDay: 5,
      isActive: true,
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: FeePlanSchema) =>
      feesApi.createPlan({
        ...values,
        batchId: values.batchId || undefined,
      }),
    onSuccess: () => {
      toast.success("Fee plan created");
      queryClient.invalidateQueries({ queryKey: ["fees", "plans"] });
      setOpen(false);
      form.reset();
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const batchMap = useMemo(
    () => new Map((batchesQuery.data?.items ?? []).map((batch) => [batch.id, batch])),
    [batchesQuery.data],
  );

  const studentMap = useMemo(
    () => new Map((studentsQuery.data?.items ?? []).map((student) => [student.id, student])),
    [studentsQuery.data],
  );

  const columns = useMemo<Array<ColumnDef<FeePlan>>>(
    () => {
      const baseColumns: Array<ColumnDef<FeePlan>> = [
        {
          accessorKey: "studentId",
          header: "Student",
          cell: ({ row }) => {
            const student = studentMap.get(row.original.studentId);
            return (
              <div>
                <p className="font-medium">{student?.fullName ?? "Unknown student"}</p>
                <p className="text-xs text-muted-foreground">{student?.guardianName ?? "Guardian"} · {student?.phone ?? "No phone"}</p>
              </div>
            );
          },
        },
        ...(user?.roles.includes("SUPER_ADMIN")
          ? [
              {
                id: "organization",
                header: "Organization",
                cell: ({ row }) => studentMap.get(row.original.studentId)?.organizationName ?? "Unknown organization",
              } satisfies ColumnDef<FeePlan>,
            ]
          : []),
        {
          accessorKey: "batchId",
          header: "Batch",
          cell: ({ row }) => {
            const batch = row.original.batchId ? batchMap.get(row.original.batchId) : null;
            return batch ? batch.name : "Unassigned";
          },
        },
        {
          accessorKey: "monthlyFee",
          header: "Monthly fee",
          cell: ({ row }) => formatCurrency(row.original.monthlyFee),
        },
        {
          accessorKey: "dueDay",
          header: "Due day",
        },
        {
          accessorKey: "isActive",
          header: "Status",
          cell: ({ row }) => <Badge variant={row.original.isActive ? "success" : "warning"}>{row.original.isActive ? "Active" : "Inactive"}</Badge>,
        },
        {
          accessorKey: "createdAt",
          header: "Created",
          cell: ({ row }) => formatDate(row.original.createdAt),
        },
        {
          id: "actions",
          header: "Actions",
          cell: ({ row }) => (
            <Button variant="outline" size="sm" className="rounded-full px-3 shadow-sm hover:border-primary/40 hover:bg-primary/5" onClick={() => setSelectedPlan(row.original)}>
              View
            </Button>
          ),
        },
      ];

      return baseColumns;
    },
    [batchMap, studentMap, user?.roles],
  );

  const dueDayChart = useMemo(() => {
    const counts = new Map<number, number>();
    plansQuery.data?.items.forEach((plan) => counts.set(plan.dueDay, (counts.get(plan.dueDay) ?? 0) + 1));
    return Array.from(counts.entries())
      .sort(([a], [b]) => a - b)
      .map(([dueDay, total]) => ({ dueDay: `Day ${dueDay}`, total }));
  }, [plansQuery.data]);

  const exportRows = useMemo(
    () =>
      (plansQuery.data?.items ?? []).map((plan) => ({
        Student: studentMap.get(plan.studentId)?.fullName ?? "Unknown student",
        Batch: plan.batchId ? batchMap.get(plan.batchId)?.name ?? "Unassigned" : "Unassigned",
        MonthlyFee: formatCurrency(plan.monthlyFee),
        DueDay: plan.dueDay,
        Status: plan.isActive ? "Active" : "Inactive",
        Created: formatDate(plan.createdAt),
      })),
    [batchMap, plansQuery.data, studentMap],
  );

  const feePlanStats = useMemo(() => {
    const items = plansQuery.data?.items ?? [];
    return {
      totalPlans: items.length,
      activePlans: items.filter((item) => item.isActive).length,
      batchLinkedPlans: items.filter((item) => Boolean(item.batchId)).length,
      avgDueDay: items.length > 0 ? Math.round(items.reduce((sum, item) => sum + item.dueDay, 0) / items.length) : 0,
    };
  }, [plansQuery.data]);

  if (plansQuery.isLoading || studentsQuery.isLoading || batchesQuery.isLoading) return <LoadingState rows={6} />;
  if (plansQuery.isError || studentsQuery.isError || batchesQuery.isError || !plansQuery.data || !studentsQuery.data || !batchesQuery.data) {
    return (
      <ErrorState
        description="Fee plans could not be loaded."
        onRetry={() => {
          void plansQuery.refetch();
          void studentsQuery.refetch();
          void batchesQuery.refetch();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Revenue structure"
        title="Fee plans"
        description="Manage recurring student fee plans, due days, active states, and batch-linked billing setup."
      />
      <OrganizationScopeBanner moduleLabel="Fee plan management" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Visible plans" value={String(feePlanStats.totalPlans)} helper="Fee plans in the current page scope" icon={ReceiptText} tone="sky" />
        <MetricCard title="Active plans" value={String(feePlanStats.activePlans)} helper="Recurring billing plans currently enabled" icon={CircleDollarSign} tone="emerald" />
        <MetricCard title="Batch-linked plans" value={String(feePlanStats.batchLinkedPlans)} helper="Plans tied to a specific batch" icon={Link2} tone="violet" />
        <MetricCard title="Avg due day" value={String(feePlanStats.avgDueDay)} helper="Average configured due day" icon={CalendarDays} tone="amber" />
      </div>
      <ChartCard title="Fee plan due-day distribution" description="Quick view of how student billing schedules are distributed across the month.">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dueDayChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dueDay" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                {dueDayChart.map((entry, index) => (
                  <Cell key={entry.dueDay} fill={getChartColor(index)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
      <FilterBar
        search={search}
        onSearchChange={(value) => setSearch(value)}
        exportConfig={{ filename: "fee-plans", rows: exportRows }}
        action={
          canCreate ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button disabled={!canMutateWithinScope}>Create fee plan</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create fee plan</DialogTitle>
                  <DialogDescription>Configure the student monthly fee and due day before generating fee records.</DialogDescription>
                </DialogHeader>
                <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
                  <FormField label="Student" required error={form.formState.errors.studentId}>
                    <select className="h-10 rounded-2xl border border-border/70 bg-background px-3 text-sm shadow-sm" {...form.register("studentId")}>
                      <option value="">Select student</option>
                      {studentsQuery.data.items.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.fullName}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Batch" error={form.formState.errors.batchId}>
                    <select className="h-10 rounded-2xl border border-border/70 bg-background px-3 text-sm shadow-sm" {...form.register("batchId")}>
                      <option value="">Optional batch</option>
                      {batchesQuery.data.items.map((batch) => (
                        <option key={batch.id} value={batch.id}>
                          {batch.name}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Monthly fee" required error={form.formState.errors.monthlyFee}>
                    <Input type="number" step="0.01" {...form.register("monthlyFee", { valueAsNumber: true })} />
                  </FormField>
                  <FormField label="Due day" required error={form.formState.errors.dueDay}>
                    <Input type="number" {...form.register("dueDay", { valueAsNumber: true })} />
                  </FormField>
                  <div className="md:col-span-2 flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={mutation.isPending}>
                      {mutation.isPending ? "Saving..." : "Create plan"}
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
              const preset = savedFeePlanFilterPresets.presets.find((item) => item.id === presetId);
              if (!preset) return;
              setSearch(preset.value.search);
              setSelectedPresetId(preset.id);
              setPageIndex(0);
            }}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select saved view" />
            </SelectTrigger>
            <SelectContent>
              {savedFeePlanFilterPresets.presets.length === 0 ? (
                <SelectItem value="__none" disabled>
                  No saved views yet
                </SelectItem>
              ) : (
                savedFeePlanFilterPresets.presets.map((preset) => (
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
              const name = window.prompt("Save the current fee plan search as:");
              const preset = name ? savedFeePlanFilterPresets.savePreset(name, { search }) : null;
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
              savedFeePlanFilterPresets.clearPresets();
              setSelectedPresetId("");
              toast.success("Saved fee plan views cleared");
            }}
            disabled={savedFeePlanFilterPresets.presets.length === 0}
          >
            Clear saved views
          </Button>
        </div>
      </div>
      <DataTable
        data={plansQuery.data.items}
        columns={columns}
        pageCount={Math.ceil(plansQuery.data.total / plansQuery.data.limit)}
        pagination={{ pageIndex: plansQuery.data.page - 1, pageSize: plansQuery.data.limit }}
        onPaginationChange={(state) => setPageIndex(state.pageIndex)}
      />
      <Dialog open={Boolean(selectedPlan)} onOpenChange={(nextOpen) => !nextOpen && setSelectedPlan(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fee plan detail</DialogTitle>
            <DialogDescription>Review the recurring billing setup for this student.</DialogDescription>
          </DialogHeader>
          {selectedPlan ? (
            <div className="space-y-3 text-sm">
              <p><span className="font-medium">Student:</span> {studentMap.get(selectedPlan.studentId)?.fullName ?? "Unknown student"}</p>
              <p><span className="font-medium">Batch:</span> {selectedPlan.batchId ? batchMap.get(selectedPlan.batchId)?.name ?? "Unassigned" : "Unassigned"}</p>
              <p><span className="font-medium">Monthly fee:</span> {formatCurrency(selectedPlan.monthlyFee)}</p>
              <p><span className="font-medium">Due day:</span> {selectedPlan.dueDay}</p>
              <p><span className="font-medium">Status:</span> {selectedPlan.isActive ? "Active" : "Inactive"}</p>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
