"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Banknote, Coins, Receipt } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, BarChart } from "recharts";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { aiApi } from "@/features/ai/api/ai-api";
import { feesApi } from "@/features/fees/api/fees-api";
import { remindersApi } from "@/features/reminders/api/reminders-api";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { NativeSelect } from "@/components/ui/native-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/forms/form-field";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { getFeeStatusBadgeVariant } from "@/lib/constants/status-colors";
import { getChartColor } from "@/lib/constants/chart-colors";
import { OrganizationScopeBanner } from "@/components/shared/organization-scope-banner";
import { useAuth } from "@/providers/auth-provider";
import { MetricCard } from "@/components/cards/metric-card";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useSavedFilterPresets } from "@/hooks/use-saved-filter-presets";
import { exportRowsToCsv } from "@/lib/utils/export";
import { hasAiAccess } from "@/lib/ai/access";
import type { AiFeeCollectionPlan, FeeEscalationAutomationSummary } from "@/types/domain";

function buildFeeRecommendationContext({
  selectedRecord,
  filteredRecords,
  studentMap,
  feeStats,
}: {
  selectedRecord: FeeRecord | null;
  filteredRecords: FeeRecord[];
  studentMap: Map<string, { fullName: string; guardianName: string; phone: string }>;
  feeStats: {
    totalRecords: number;
    collected: number;
    outstanding: number;
    unpaidCount: number;
  };
}) {
  const focusRecord = selectedRecord ?? filteredRecords.find((record) => record.status === "OVERDUE" || record.status === "PENDING") ?? filteredRecords[0] ?? null;
  const overdueRecords = filteredRecords.filter((record) => record.status === "OVERDUE");
  const unpaidRecords = filteredRecords.filter((record) => record.status === "PENDING" || record.status === "OVERDUE");

  const focusStudent = focusRecord ? studentMap.get(focusRecord.studentId) : null;

  return [
    `Ledger summary: ${feeStats.totalRecords} records, collected ${formatCurrency(feeStats.collected)}, outstanding ${formatCurrency(feeStats.outstanding)}, unpaid records ${feeStats.unpaidCount}`,
    `Focus record: ${focusRecord ? `${focusStudent?.fullName ?? "Unknown student"} ${focusRecord.month}/${focusRecord.year} status ${focusRecord.status} due ${formatCurrency(focusRecord.amountDue)} paid ${formatCurrency(focusRecord.amountPaid)}` : "None"}`,
    `Overdue records: ${overdueRecords.length}`,
    `Unpaid records: ${unpaidRecords.length}`,
    focusRecord
      ? `Guardian contact: ${focusStudent?.guardianName ?? "Unknown guardian"} · ${focusStudent?.phone ?? "No phone"}`
      : null,
    filteredRecords
      .slice(0, 8)
      .map((record) => {
        const student = studentMap.get(record.studentId);
        return `${student?.fullName ?? "Unknown student"} | ${record.month}/${record.year} | ${record.status} | due ${formatCurrency(record.amountDue)} | paid ${formatCurrency(record.amountPaid)} | ${record.paymentMethod ?? "No payment method"}`;
      })
      .join("\n"),
  ]
    .filter(Boolean)
    .join("\n\n");
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/70 px-4 py-3 shadow-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export default function FeesPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialSearch = searchParams?.get("search") ?? "";
  const initialStatusFilter = searchParams?.get("status") ?? "ALL";
  const [search, setSearch] = useState(initialSearch);
  const debouncedSearch = useDebouncedValue(search);
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const pageSize = 12;
  const [recordOpen, setRecordOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FeeRecord | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<FeeRecord | null>(null);
  const [feeCollectionPlan, setFeeCollectionPlan] = useState<AiFeeCollectionPlan | null>(null);
  const canCreate = usePermission("fees.create");
  const canManage = usePermission("fees.update");
  const canMutateWithinScope = Boolean(user?.organizationId);
  const aiReady = hasAiAccess(user);
  const queryClient = useQueryClient();
  const savedFeeFilterPresets = useSavedFilterPresets<{
    search: string;
    statusFilter: string;
  }>("fees-filter-presets");
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

  useEffect(() => {
    setSearch(searchParams?.get("search") ?? "");
    setStatusFilter(searchParams?.get("status") ?? "ALL");
    setSelectedPresetId("");
    setPageIndex(0);
  }, [searchParams]);

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

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => feesApi.bulkRemoveRecords(ids),
    onSuccess: () => {
      toast.success("Selected fee records deleted");
      queryClient.invalidateQueries({ queryKey: ["fees"] });
      setRowSelection({});
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
              <Button variant="outline" size="sm" className="rounded-full px-3 shadow-sm hover:border-primary/40 hover:bg-primary/5" onClick={() => setSelectedRecord(row.original)}>
                View
              </Button>
              {canManage ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full px-3 shadow-sm hover:border-primary/40 hover:bg-primary/5"
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

  const selectedRecordIds = Object.entries(rowSelection)
    .filter(([, selected]) => selected)
    .map(([id]) => id);

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
  const selectedRecordExportRows = useMemo(
    () =>
      filteredRecords
        .filter((record) => selectedRecordIds.includes(record.id))
        .map((record) => ({
          Student: studentMap.get(record.studentId)?.fullName ?? "Unknown student",
          Status: record.status,
          BillingCycle: `${record.month}/${record.year}`,
          AmountDue: formatCurrency(record.amountDue),
          AmountPaid: formatCurrency(record.amountPaid),
          PaymentMethod: record.paymentMethod ?? "",
          PaidAt: formatDate(record.paidAt),
        })),
    [filteredRecords, selectedRecordIds, studentMap],
  );

  const feeStats = useMemo(() => {
    return {
      totalRecords: filteredRecords.length,
      collected: filteredRecords.reduce((sum, item) => sum + Number(item.amountPaid), 0),
      outstanding: filteredRecords.reduce((sum, item) => sum + Math.max(Number(item.amountDue) - Number(item.amountPaid), 0), 0),
      unpaidCount: filteredRecords.filter((item) => item.status === "PENDING" || item.status === "OVERDUE").length,
    };
  }, [filteredRecords]);

  const feeRecommendationContext = useMemo(
    () =>
      buildFeeRecommendationContext({
        selectedRecord,
        filteredRecords,
        studentMap,
        feeStats,
      }),
    [feeStats, filteredRecords, selectedRecord, studentMap],
  );

  const feeCollectionMutation = useMutation({
    mutationFn: async () =>
      aiApi.generateFeeCollectionPlan({
        studentName:
          selectedRecord ? studentMap.get(selectedRecord.studentId)?.fullName ?? "Selected student" : "Current fee ledger",
        context: feeRecommendationContext,
      }),
    onSuccess: (data) => {
      setFeeCollectionPlan(data);
      toast.success("Fee collection plan generated");
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const feeReminderMutation = useMutation({
    mutationFn: async () => {
      const targetRecords = filteredRecords.filter(
        (record) =>
          selectedRecordIds.includes(record.id) && (record.status === "PENDING" || record.status === "OVERDUE" || record.status === "PARTIAL"),
      );

      if (targetRecords.length === 0) {
        throw new Error("Select at least one pending, partial, or overdue fee record");
      }

      const messageTemplate = feeCollectionPlan?.parentMessageDraft?.trim();

      const results = await Promise.all(
        targetRecords.map((record) => {
          const student = studentMap.get(record.studentId);
          const amountDue = formatCurrency(record.amountDue);
          const amountPaid = formatCurrency(record.amountPaid);
          const balance = formatCurrency(Math.max(Number(record.amountDue) - Number(record.amountPaid), 0));
          const message =
            messageTemplate ??
            `Fee follow-up for ${student?.fullName ?? "the student"} for ${record.month}/${record.year}.\n\nStatus: ${record.status}\nAmount due: ${amountDue}\nAmount paid: ${amountPaid}\nPending balance: ${balance}\n\nPlease review the payment with the school office.`;

          return remindersApi.create({
            studentId: record.studentId,
            channel: "MANUAL",
            message,
            status: "SENT",
          });
        }),
      );

      return results.length;
    },
    onSuccess: (createdCount) => {
      toast.success(`Created ${createdCount} fee reminder${createdCount === 1 ? "" : "s"}`);
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      queryClient.invalidateQueries({ queryKey: ["fees"] });
      setRowSelection({});
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const feeEscalationMutation = useMutation({
    mutationFn: async () => feesApi.processEscalations(),
    onSuccess: (summary: FeeEscalationAutomationSummary) => {
      toast.success(
        `Processed ${summary.processedOrganizations} organization${summary.processedOrganizations === 1 ? "" : "s"} and created ${summary.remindersCreated} fee escalation reminder${summary.remindersCreated === 1 ? "" : "s"}.`,
      );
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      queryClient.invalidateQueries({ queryKey: ["fees"] });
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

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
      <Card className="border-border/70 bg-card/85 shadow-sm backdrop-blur">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-xl">AI collection assistant</CardTitle>
              <CardDescription>Turn the current fee context into a collection strategy, parent message draft, and follow-up actions.</CardDescription>
            </div>
            <Button onClick={() => feeCollectionMutation.mutate()} disabled={feeCollectionMutation.isPending || !aiReady}>
              {feeCollectionMutation.isPending ? "Generating..." : "Generate collection plan"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!aiReady ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              AI access is not enabled for this account. Add a tenant key or use the trial AI window to enable fee collection guidance.
            </div>
          ) : null}
          {feeCollectionPlan ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                <SummaryRow label="Risk level" value={feeCollectionPlan.riskLevel} />
                <SummaryRow label="Confidence" value={`${Math.round(feeCollectionPlan.confidence * 100)}%`} />
                <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Overview</p>
                  <p className="mt-2 text-sm text-foreground">{feeCollectionPlan.overview}</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Key signals</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {feeCollectionPlan.keySignals.map((signal) => (
                      <Badge key={signal} variant="outline">
                        {signal}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="rounded-2xl border bg-muted/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Collection strategy</p>
                  <p className="mt-2 text-sm text-foreground">{feeCollectionPlan.collectionStrategy}</p>
                </div>
                <div className="rounded-2xl border bg-muted/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Recommended actions</p>
                  <div className="mt-3 space-y-2">
                    {feeCollectionPlan.recommendedActions.map((action) => (
                      <p key={action} className="rounded-2xl border border-border/70 bg-background px-3 py-2 text-sm shadow-sm">
                        {action}
                      </p>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Parent message draft</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{feeCollectionPlan.parentMessageDraft}</p>
                </div>
                <div className="rounded-2xl border bg-muted/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Internal note</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{feeCollectionPlan.internalNote}</p>
                  <Badge className="mt-3" variant={feeCollectionPlan.escalationNeeded ? "warning" : "success"}>
                    {feeCollectionPlan.escalationNeeded ? "Escalation recommended" : "No escalation required"}
                  </Badge>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Generate a collection plan using the current filter set or the selected record to see a suggested outreach path.
            </p>
          )}
        </CardContent>
      </Card>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => feeEscalationMutation.mutate()} disabled={feeEscalationMutation.isPending}>
          {feeEscalationMutation.isPending ? "Running escalations..." : "Run fee escalations"}
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={buildActivityLogsHref({ module: "fees" })}>Audit fee activity</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={buildActivityLogsHref({ action: "create-record" })}>Audit record creation</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={buildActivityLogsHref({ action: "delete-record" })}>Audit record deletions</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={buildActivityLogsHref({ action: "bulk-delete-records" })}>Audit bulk deletes</Link>
        </Button>
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
          setSelectedPresetId("");
          setPageIndex(0);
        }}
        searchPlaceholder="Search fee records by student or billing cycle..."
        filters={
          <NativeSelect
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setSelectedPresetId("");
              setPageIndex(0);
            }}
          >
            <option value="ALL">All statuses</option>
            {["PENDING", "PARTIAL", "PAID", "OVERDUE", "WAIVED"].map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </NativeSelect>
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
                    <NativeSelect {...form.register("studentId")}>
                      <option value="">Select student</option>
                      {(studentsQuery.data?.items ?? []).map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.fullName}
                        </option>
                      ))}
                    </NativeSelect>
                  </FormField>
                  <FormField label="Fee plan" required error={form.formState.errors.feePlanId}>
                    <NativeSelect {...form.register("feePlanId")}>
                      <option value="">Select fee plan</option>
                      {(plansQuery.data?.items ?? []).map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {(studentMap.get(plan.studentId)?.fullName ?? "Student")} / due day {plan.dueDay} / {formatCurrency(plan.monthlyFee)} / {plan.isActive ? "Active" : "Inactive"}
                        </option>
                      ))}
                    </NativeSelect>
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
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.75rem] border border-border/70 bg-card/85 px-4 py-3 text-sm shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground">Saved views</span>
          <Select
            value={selectedPresetId}
            onValueChange={(presetId) => {
              const preset = savedFeeFilterPresets.presets.find((item) => item.id === presetId);
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
              {savedFeeFilterPresets.presets.length === 0 ? (
                <SelectItem value="__none" disabled>
                  No saved views yet
                </SelectItem>
              ) : (
                savedFeeFilterPresets.presets.map((preset) => (
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
              const name = window.prompt("Save the current fee filters as:");
              const preset = name
                ? savedFeeFilterPresets.savePreset(name, {
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
              savedFeeFilterPresets.clearPresets();
              setSelectedPresetId("");
              toast.success("Saved fee views cleared");
            }}
            disabled={savedFeeFilterPresets.presets.length === 0}
          >
            Clear saved views
          </Button>
        </div>
      </div>

      {selectedRecordIds.length > 0 && canManage ? (
        <div className="flex items-center justify-between rounded-[1.75rem] border border-sky-200 bg-sky-50/70 px-4 py-3 text-sm shadow-sm">
          <p>
            {selectedRecordIds.length} fee record{selectedRecordIds.length === 1 ? "" : "s"} selected
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setRowSelection({})}>
              Clear selection
            </Button>
            <Button
              variant="outline"
              onClick={() => exportRowsToCsv({ filename: "fee-records-selected", rows: selectedRecordExportRows })}
              disabled={selectedRecordExportRows.length === 0}
            >
              Export selected
            </Button>
            <Button
              variant="destructive"
              onClick={() => bulkDeleteMutation.mutate(selectedRecordIds)}
              disabled={bulkDeleteMutation.isPending || feeReminderMutation.isPending}
            >
              {bulkDeleteMutation.isPending ? "Deleting..." : "Delete selected"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => feeReminderMutation.mutate()}
              disabled={feeReminderMutation.isPending || bulkDeleteMutation.isPending}
            >
              {feeReminderMutation.isPending ? "Creating..." : "Create fee reminders"}
            </Button>
          </div>
        </div>
      ) : null}

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
        enableRowSelection
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
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
