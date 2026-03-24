"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Banknote, Coins, Receipt } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, BarChart } from "recharts";
import { toast } from "sonner";
import { feesApi } from "@/features/fees/api/fees-api";
import { studentsApi } from "@/features/students/api/students-api";
import { feeRecordSchema, type FeeRecordSchema } from "@/features/fees/schemas/fee-record-schema";
import { normalizeApiError } from "@/lib/api/errors";
import type { FeeRecord } from "@/types/domain";
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
import { FormField } from "@/components/forms/form-field";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { getFeeStatusBadgeVariant } from "@/lib/constants/status-colors";
import { getChartColor } from "@/lib/constants/chart-colors";
import { OrganizationScopeBanner } from "@/components/shared/organization-scope-banner";
import { useAuth } from "@/providers/auth-provider";
import { MetricCard } from "@/components/cards/metric-card";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

export default function FeesPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 12;
  const [recordOpen, setRecordOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FeeRecord | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<FeeRecord | null>(null);
  const canCreate = usePermission("fees.create");
  const canManage = usePermission("fees.update");
  const canMutateWithinScope = Boolean(user?.organizationId);
  const queryClient = useQueryClient();
  const recordsQuery = useQuery({
    queryKey: ["fees", "records", debouncedSearch, pageIndex, pageSize],
    queryFn: () => feesApi.listRecords({ page: pageIndex + 1, limit: pageSize, search: debouncedSearch }),
  });
  const shouldLoadReferenceData =
    recordOpen || Boolean(selectedRecord) || (recordsQuery.data?.items.length ?? 0) > 0;
  const plansQuery = useQuery({
    queryKey: ["fees", "plans"],
    queryFn: () => feesApi.listPlans({ page: 1, limit: 100 }),
    enabled: shouldLoadReferenceData,
  });
  const studentsQuery = useQuery({
    queryKey: ["students", "fees-page"],
    queryFn: () => studentsApi.list({ page: 1, limit: 100 }),
    enabled: shouldLoadReferenceData,
  });
  const studentMap = useMemo(() => new Map((studentsQuery.data?.items ?? []).map((student) => [student.id, student])), [studentsQuery.data]);
  const planMap = useMemo(() => new Map((plansQuery.data?.items ?? []).map((plan) => [plan.id, plan])), [plansQuery.data]);

  const form = useForm<FeeRecordSchema>({
    resolver: zodResolver(feeRecordSchema),
    defaultValues: {
      studentId: "",
      batchId: "",
      feePlanId: "",
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      amountDue: 0,
      amountPaid: 0,
      status: "PENDING",
      paymentMethod: "CASH",
      remarks: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: FeeRecordSchema) => {
      if (editingRecord) return feesApi.updateRecord(editingRecord.id, values);
      return feesApi.createRecord({
        ...values,
        batchId: values.batchId || undefined,
      });
    },
    onSuccess: () => {
      toast.success(editingRecord ? "Fee record updated" : "Fee record created");
      queryClient.invalidateQueries({ queryKey: ["fees"] });
      setRecordOpen(false);
      setEditingRecord(null);
      form.reset();
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const columns = useMemo<Array<ColumnDef<FeeRecord>>>(
    () => {
      const baseColumns: Array<ColumnDef<FeeRecord>> = [
        {
          accessorKey: "studentId",
          header: "Student",
          cell: ({ row }) => (
            <div>
              <p className="font-medium">{studentMap.get(row.original.studentId)?.fullName ?? "Unknown student"}</p>
              <p className="text-xs text-muted-foreground">
                {studentMap.get(row.original.studentId)?.guardianName ?? "Guardian"} · {studentMap.get(row.original.studentId)?.phone ?? "No phone"}
              </p>
            </div>
          ),
        },
        ...(user?.roles.includes("SUPER_ADMIN")
          ? [
              {
                id: "organization",
                header: "Organization",
                cell: ({ row }) => studentMap.get(row.original.studentId)?.organizationName ?? "Unknown organization",
              } satisfies ColumnDef<FeeRecord>,
            ]
          : []),
        {
          accessorKey: "status",
          header: "Status",
          cell: ({ row }) => (
            <Badge variant={getFeeStatusBadgeVariant(row.original.status)}>
              {row.original.status}
            </Badge>
          ),
        },
        {
          accessorKey: "feePlanId",
          header: "Plan",
          cell: ({ row }) => {
            const plan = planMap.get(row.original.feePlanId);
            return plan ? `Due day ${plan.dueDay} · ${formatCurrency(plan.monthlyFee)} · ${plan.isActive ? "Active" : "Inactive"}` : "Unknown plan";
          },
        },
        {
          accessorKey: "month",
          header: "Billing cycle",
          cell: ({ row }) => `${row.original.month}/${row.original.year}`,
        },
        {
          accessorKey: "amountDue",
          header: "Amount due",
          cell: ({ row }) => formatCurrency(row.original.amountDue),
        },
        {
          accessorKey: "amountPaid",
          header: "Amount paid",
          cell: ({ row }) => formatCurrency(row.original.amountPaid),
        },
        {
          accessorKey: "paidAt",
          header: "Paid at",
          cell: ({ row }) => formatDate(row.original.paidAt),
        },
        {
          id: "actions",
          header: "Actions",
          cell: ({ row }) => (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelectedRecord(row.original)}>
                View
              </Button>
              {canManage ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingRecord(row.original);
                    form.reset({
                      studentId: row.original.studentId,
                      batchId: row.original.batchId ?? "",
                      feePlanId: row.original.feePlanId,
                      month: row.original.month,
                      year: row.original.year,
                      amountDue: Number(row.original.amountDue),
                      amountPaid: Number(row.original.amountPaid),
                      status: row.original.status,
                      paymentMethod: row.original.paymentMethod ?? undefined,
                      remarks: row.original.remarks ?? "",
                    });
                    setRecordOpen(true);
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
    [canManage, form, planMap, studentMap, user?.roles],
  );

  const filteredRecords = useMemo(() => {
    const items = recordsQuery.data?.items ?? [];

    return items.filter((item) => (statusFilter === "ALL" ? true : item.status === statusFilter));
  }, [recordsQuery.data, statusFilter]);

  const hasLocalFilters = statusFilter !== "ALL";

  const statusData = useMemo(() => {
    const counts = new Map<string, number>();
    filteredRecords.forEach((record) => counts.set(record.status, (counts.get(record.status) ?? 0) + 1));
    return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredRecords]);

  const monthlyData = useMemo(() => {
    const counts = new Map<string, number>();
    filteredRecords.forEach((record) => {
      const label = `${record.month}/${record.year}`;
      counts.set(label, (counts.get(label) ?? 0) + Number(record.amountPaid));
    });
    return Array.from(counts.entries()).map(([month, total]) => ({ month, total }));
  }, [filteredRecords]);

  const exportRows = useMemo(
    () =>
      filteredRecords.map((record) => ({
        Student: studentMap.get(record.studentId)?.fullName ?? "Unknown student",
        Status: record.status,
        BillingCycle: `${record.month}/${record.year}`,
        AmountDue: formatCurrency(record.amountDue),
        AmountPaid: formatCurrency(record.amountPaid),
        PaymentMethod: record.paymentMethod ?? "",
        PaidAt: formatDate(record.paidAt),
      })),
    [filteredRecords, studentMap],
  );

  const feeStats = useMemo(() => {
    return {
      totalRecords: filteredRecords.length,
      collected: filteredRecords.reduce((sum, item) => sum + Number(item.amountPaid), 0),
      outstanding: filteredRecords.reduce((sum, item) => sum + Math.max(Number(item.amountDue) - Number(item.amountPaid), 0), 0),
      unpaidCount: filteredRecords.filter((item) => item.status === "PENDING" || item.status === "OVERDUE").length,
    };
  }, [filteredRecords]);

  if (recordsQuery.isLoading || (shouldLoadReferenceData && (plansQuery.isLoading || studentsQuery.isLoading))) return <LoadingState rows={6} />;
  if (
    recordsQuery.isError ||
    (shouldLoadReferenceData && (plansQuery.isError || studentsQuery.isError)) ||
    !recordsQuery.data ||
    (shouldLoadReferenceData && (!plansQuery.data || !studentsQuery.data))
  ) {
    return <ErrorState description="Fee records could not be loaded." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Revenue operations"
        title="Fees management"
        description="Track fee records, paid and unpaid distribution, collection progress, and payment updates."
      />
      <OrganizationScopeBanner moduleLabel="Fee operations" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Visible fee records" value={String(feeStats.totalRecords)} helper="Records in the current page scope" icon={Receipt} tone="sky" />
        <MetricCard title="Collected" value={formatCurrency(feeStats.collected)} helper="Amount paid across listed records" icon={Banknote} tone="emerald" />
        <MetricCard title="Outstanding" value={formatCurrency(feeStats.outstanding)} helper="Remaining balance across listed records" icon={Coins} tone="amber" />
        <MetricCard title="Unpaid records" value={String(feeStats.unpaidCount)} helper="Pending or overdue fee records" icon={AlertCircle} tone="rose" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Paid vs unpaid distribution">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100}>
                  {statusData.map((entry, index) => (
                    <Cell key={entry.name} fill={getChartColor(index)} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Monthly collection">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total">
                  {monthlyData.map((entry, index) => (
                    <Cell key={entry.month} fill={getChartColor(index)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
      <FilterBar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPageIndex(0);
        }}
        searchPlaceholder="Search fee records by student or billing cycle..."
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
            {["PENDING", "PARTIAL", "PAID", "OVERDUE", "WAIVED"].map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        }
        exportConfig={{ filename: "fee-records", rows: exportRows }}
        action={
          canCreate ? (
            <Dialog open={recordOpen} onOpenChange={setRecordOpen}>
              <DialogTrigger asChild>
                <Button disabled={!canMutateWithinScope}>Create fee record</Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>{editingRecord ? "Edit fee record" : "Create fee record"}</DialogTitle>
                  <DialogDescription>Supports exact DTO fields used by the backend, including `amountPaid` and `paymentMethod`.</DialogDescription>
                </DialogHeader>
                <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
                  <FormField label="Student" required error={form.formState.errors.studentId}>
                    <select className="h-10 rounded-xl border px-3" {...form.register("studentId")}>
                      <option value="">Select student</option>
                      {(studentsQuery.data?.items ?? []).map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.fullName}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Fee plan" required error={form.formState.errors.feePlanId}>
                    <select className="h-10 rounded-xl border px-3" {...form.register("feePlanId")}>
                      <option value="">Select fee plan</option>
                      {(plansQuery.data?.items ?? []).map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {(studentMap.get(plan.studentId)?.fullName ?? "Student")} / due day {plan.dueDay} / {formatCurrency(plan.monthlyFee)} / {plan.isActive ? "Active" : "Inactive"}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Month" required error={form.formState.errors.month}>
                    <Input type="number" {...form.register("month", { valueAsNumber: true })} />
                  </FormField>
                  <FormField label="Year" required error={form.formState.errors.year}>
                    <Input type="number" {...form.register("year", { valueAsNumber: true })} />
                  </FormField>
                  <FormField label="Amount due" required error={form.formState.errors.amountDue}>
                    <Input type="number" step="0.01" {...form.register("amountDue", { valueAsNumber: true })} />
                  </FormField>
                  <FormField label="Amount paid" error={form.formState.errors.amountPaid}>
                    <Input type="number" step="0.01" {...form.register("amountPaid", { valueAsNumber: true })} />
                  </FormField>
                  <div className="md:col-span-2 flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setRecordOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={mutation.isPending}>
                      {mutation.isPending ? "Saving..." : editingRecord ? "Update record" : "Create record"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />
      <DataTable
        data={filteredRecords}
        columns={columns}
        pageCount={hasLocalFilters ? 1 : Math.ceil(recordsQuery.data.total / recordsQuery.data.limit)}
        pagination={{ pageIndex: hasLocalFilters ? 0 : recordsQuery.data.page - 1, pageSize: recordsQuery.data.limit }}
        onPaginationChange={(state) => {
          if (!hasLocalFilters) {
            setPageIndex(state.pageIndex);
          }
        }}
      />
      <Dialog open={Boolean(selectedRecord)} onOpenChange={(nextOpen) => !nextOpen && setSelectedRecord(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fee record detail</DialogTitle>
            <DialogDescription>Review the full billing record and payment context.</DialogDescription>
          </DialogHeader>
          {selectedRecord ? (
            <div className="space-y-3 text-sm">
              <p><span className="font-medium">Student:</span> {studentMap.get(selectedRecord.studentId)?.fullName ?? "Unknown student"}</p>
              <p><span className="font-medium">Status:</span> {selectedRecord.status}</p>
              <p><span className="font-medium">Billing cycle:</span> {selectedRecord.month}/{selectedRecord.year}</p>
              <p><span className="font-medium">Amount due:</span> {formatCurrency(selectedRecord.amountDue)}</p>
              <p><span className="font-medium">Amount paid:</span> {formatCurrency(selectedRecord.amountPaid)}</p>
              <p><span className="font-medium">Payment method:</span> {selectedRecord.paymentMethod ?? "N/A"}</p>
              <p><span className="font-medium">Remarks:</span> {selectedRecord.remarks ?? "N/A"}</p>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
