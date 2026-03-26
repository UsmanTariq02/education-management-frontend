"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Banknote, CalendarDays, CircleAlert, Download, FileSpreadsheet, Landmark, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { reportsApi } from "@/features/reports/api/reports-api";
import { organizationsApi } from "@/features/organizations/api/organizations-api";
import { BoxPlotSummary } from "@/components/charts/box-plot-summary";
import { ChartCard } from "@/components/charts/chart-card";
import { HeatmapGrid } from "@/components/charts/heatmap-grid";
import { MetricCard } from "@/components/cards/metric-card";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";
import { useAuth } from "@/providers/auth-provider";
import { metricCardData } from "@/lib/utils/dashboard";
import { getChartColor } from "@/lib/constants/chart-colors";

export default function ReportsPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.roles.includes("SUPER_ADMIN") ?? false;
  const summaryQuery = useQuery({ queryKey: ["reports", "summary", "page"], queryFn: reportsApi.summary });
  const feeCollectionOverviewQuery = useQuery({
    queryKey: ["reports", "fees", "collection-overview"],
    queryFn: reportsApi.feeCollectionOverview,
  });
  const feePeriodComparisonQuery = useQuery({
    queryKey: ["reports", "fees", "period-comparison"],
    queryFn: reportsApi.feePeriodComparison,
  });
  const enrollmentTrendQuery = useQuery({ queryKey: ["reports", "students", "enrollment-trend"], queryFn: reportsApi.enrollmentTrend });
  const batchCollectionQuery = useQuery({ queryKey: ["reports", "fees", "batch-collection"], queryFn: reportsApi.batchCollection });
  const attendanceStatusQuery = useQuery({
    queryKey: ["reports", "attendance", "status-breakdown", "page"],
    queryFn: reportsApi.attendanceStatusBreakdown,
  });
  const attendanceDailyTrendQuery = useQuery({
    queryKey: ["reports", "attendance", "daily-trend"],
    queryFn: reportsApi.attendanceDailyTrend,
  });
  const reminderChannelQuery = useQuery({
    queryKey: ["reports", "reminders", "channel-breakdown", "page"],
    queryFn: reportsApi.reminderChannelBreakdown,
  });
  const reminderStatusQuery = useQuery({
    queryKey: ["reports", "reminders", "status-breakdown", "page"],
    queryFn: reportsApi.reminderStatusBreakdown,
  });
  const reminderDailyTrendQuery = useQuery({
    queryKey: ["reports", "reminders", "daily-trend", "page"],
    queryFn: reportsApi.reminderDailyTrend,
  });
  const feeStatusQuery = useQuery({
    queryKey: ["reports", "fees", "status-breakdown", "page"],
    queryFn: reportsApi.feeStatusBreakdown,
  });
  const studentStatusQuery = useQuery({
    queryKey: ["reports", "students", "status-breakdown", "page"],
    queryFn: reportsApi.studentStatusBreakdown,
  });
  const studentBatchDistributionQuery = useQuery({
    queryKey: ["reports", "students", "batch-distribution", "page"],
    queryFn: reportsApi.studentBatchDistribution,
  });
  const userRoleDistributionQuery = useQuery({
    queryKey: ["reports", "users", "role-distribution", "page"],
    queryFn: reportsApi.userRoleDistribution,
  });
  const userStatusQuery = useQuery({
    queryKey: ["reports", "users", "status-summary", "page"],
    queryFn: reportsApi.userStatusSummary,
  });
  const batchStatusQuery = useQuery({
    queryKey: ["reports", "batches", "status-summary", "page"],
    queryFn: reportsApi.batchStatusSummary,
  });
  const academicSummaryQuery = useQuery({
    queryKey: ["reports", "academics", "summary"],
    queryFn: reportsApi.academicSummary,
  });
  const gradeDistributionQuery = useQuery({
    queryKey: ["reports", "academics", "grade-distribution"],
    queryFn: reportsApi.gradeDistribution,
  });
  const examScheduleTrendQuery = useQuery({
    queryKey: ["reports", "academics", "exam-schedule-trend"],
    queryFn: reportsApi.examScheduleTrend,
  });
  const batchPerformanceQuery = useQuery({
    queryKey: ["reports", "academics", "batch-performance"],
    queryFn: reportsApi.batchPerformance,
  });
  const resultStatusQuery = useQuery({
    queryKey: ["reports", "academics", "result-status"],
    queryFn: reportsApi.resultStatusSummary,
  });
  const organizationsQuery = useQuery({
    queryKey: ["organizations", "reports-growth"],
    queryFn: () => organizationsApi.list({ page: 1, limit: 100 }),
    enabled: isSuperAdmin,
  });

  if (summaryQuery.isLoading) return <LoadingState rows={6} />;
  if (summaryQuery.isError || !summaryQuery.data) return <ErrorState description="Reports summary could not be loaded." />;

  const feeOverview = feeCollectionOverviewQuery.data;
  const feeComparison = feePeriodComparisonQuery.data ?? [];
  const toTrend = (currentValue: number, previousValue: number): number | undefined => {
    if (previousValue <= 0) {
      return currentValue > 0 ? 100 : undefined;
    }

    return Math.round(((currentValue - previousValue) / previousValue) * 100);
  };
  const feePeriodCards = feeOverview
    ? [
        {
          title: "Month collection",
          value: formatCurrency(feeOverview.currentMonth.collected),
          helper: `${formatCurrency(feeOverview.currentMonth.pending)} pending · ${feeOverview.currentMonth.collectionRate}% collection rate`,
          trend: toTrend(
            feeComparison.find((item) => item.period === "MONTH")?.currentCollected ?? 0,
            feeComparison.find((item) => item.period === "MONTH")?.previousCollected ?? 0,
          ),
          icon: CalendarDays,
          tone: "sky" as const,
        },
        {
          title: "Quarter collection",
          value: formatCurrency(feeOverview.currentQuarter.collected),
          helper: `${formatCurrency(feeOverview.currentQuarter.pending)} pending · ${feeOverview.currentQuarter.collectionRate}% collection rate`,
          trend: toTrend(
            feeComparison.find((item) => item.period === "QUARTER")?.currentCollected ?? 0,
            feeComparison.find((item) => item.period === "QUARTER")?.previousCollected ?? 0,
          ),
          icon: Landmark,
          tone: "emerald" as const,
        },
        {
          title: "Year collection",
          value: formatCurrency(feeOverview.currentYear.collected),
          helper: `${formatCurrency(feeOverview.currentYear.pending)} pending · ${feeOverview.currentYear.collectionRate}% collection rate`,
          trend: toTrend(
            feeComparison.find((item) => item.period === "YEAR")?.currentCollected ?? 0,
            feeComparison.find((item) => item.period === "YEAR")?.previousCollected ?? 0,
          ),
          icon: TrendingUp,
          tone: "violet" as const,
        },
        {
          title: "Overdue exposure",
          value: formatCurrency(
            feeOverview.currentMonth.overdue + feeOverview.currentQuarter.overdue + feeOverview.currentYear.overdue,
          ),
          helper: `Month ${formatCurrency(feeOverview.currentMonth.overdue)} · Quarter ${formatCurrency(feeOverview.currentQuarter.overdue)}`,
          icon: CircleAlert,
          tone: "rose" as const,
        },
        {
          title: "Current year billed",
          value: formatCurrency(feeOverview.currentYear.billed),
          helper: `${formatCurrency(feeOverview.currentYear.collected)} collected out of billed value`,
          icon: Banknote,
          tone: "amber" as const,
        },
      ]
    : [];
  const collectionRateData = feeOverview
    ? [
        {
          name: "Month",
          value: feeOverview.currentMonth.collectionRate,
          fill: "#0ea5e9",
        },
        {
          name: "Quarter",
          value: feeOverview.currentQuarter.collectionRate,
          fill: "#10b981",
        },
        {
          name: "Year",
          value: feeOverview.currentYear.collectionRate,
          fill: "#8b5cf6",
        },
      ]
    : [];
  const periodFinanceRows = feeOverview
    ? [
        {
          label: "Current month",
          billed: feeOverview.currentMonth.billed,
          collected: feeOverview.currentMonth.collected,
          pending: feeOverview.currentMonth.pending,
          overdue: feeOverview.currentMonth.overdue,
          rate: feeOverview.currentMonth.collectionRate,
        },
        {
          label: "Current quarter",
          billed: feeOverview.currentQuarter.billed,
          collected: feeOverview.currentQuarter.collected,
          pending: feeOverview.currentQuarter.pending,
          overdue: feeOverview.currentQuarter.overdue,
          rate: feeOverview.currentQuarter.collectionRate,
        },
        {
          label: "Current year",
          billed: feeOverview.currentYear.billed,
          collected: feeOverview.currentYear.collected,
          pending: feeOverview.currentYear.pending,
          overdue: feeOverview.currentYear.overdue,
          rate: feeOverview.currentYear.collectionRate,
        },
      ]
    : [];
  const downloadCsv = (filename: string, rows: string[][]) => {
    const csvContent = rows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };
  const handleExportOverview = () => {
    if (!feeOverview) {
      toast.error("Fee collection overview is not available yet.");
      return;
    }

    downloadCsv("fee-collection-overview.csv", [
      ["Period", "Billed", "Collected", "Pending", "Overdue", "Collection Rate"],
      [
        "Month",
        String(feeOverview.currentMonth.billed),
        String(feeOverview.currentMonth.collected),
        String(feeOverview.currentMonth.pending),
        String(feeOverview.currentMonth.overdue),
        `${feeOverview.currentMonth.collectionRate}%`,
      ],
      [
        "Quarter",
        String(feeOverview.currentQuarter.billed),
        String(feeOverview.currentQuarter.collected),
        String(feeOverview.currentQuarter.pending),
        String(feeOverview.currentQuarter.overdue),
        `${feeOverview.currentQuarter.collectionRate}%`,
      ],
      [
        "Year",
        String(feeOverview.currentYear.billed),
        String(feeOverview.currentYear.collected),
        String(feeOverview.currentYear.pending),
        String(feeOverview.currentYear.overdue),
        `${feeOverview.currentYear.collectionRate}%`,
      ],
    ]);
    toast.success("Finance overview exported");
  };
  const handleExportComparison = () => {
    if (feeComparison.length === 0) {
      toast.error("Period comparison data is not available yet.");
      return;
    }

    downloadCsv("fee-period-comparison.csv", [
      ["Period", "Current Collected", "Previous Collected", "Current Pending", "Previous Pending"],
      ...feeComparison.map((item) => [
        item.period,
        String(item.currentCollected),
        String(item.previousCollected),
        String(item.currentPending),
        String(item.previousPending),
      ]),
    ]);
    toast.success("Period comparison exported");
  };
  const academicSummary = academicSummaryQuery.data;
  const academicCards = academicSummary
    ? [
        {
          title: "Academic exams",
          value: String(academicSummary.totalExams),
          helper: `${academicSummary.publishedExams} published`,
          icon: CalendarDays,
          tone: "sky" as const,
        },
        {
          title: "Result records",
          value: String(academicSummary.totalResults),
          helper: `${academicSummary.publishedResults} published`,
          icon: FileSpreadsheet,
          tone: "emerald" as const,
        },
        {
          title: "Average performance",
          value: `${academicSummary.averagePercentage.toFixed(1)}%`,
          helper: "Across recorded student results",
          icon: TrendingUp,
          tone: "violet" as const,
        },
      ]
    : [];
  const academicRadarData = useMemo(
    () =>
      academicSummary
        ? [
            { metric: "Exams", value: academicSummary.totalExams },
            { metric: "Published exams", value: academicSummary.publishedExams },
            { metric: "Results", value: academicSummary.totalResults },
            { metric: "Published results", value: academicSummary.publishedResults },
            { metric: "Average %", value: Math.round(academicSummary.averagePercentage) },
          ]
        : [],
    [academicSummary],
  );
  const attendanceHeatmapCells = useMemo(
    () =>
      (attendanceDailyTrendQuery.data ?? []).map((item) => ({
        label: item.date.slice(5),
        value: item.present,
        hint: `${item.present} present`,
      })),
    [attendanceDailyTrendQuery.data],
  );
  const batchPerformanceValues = (batchPerformanceQuery.data ?? []).map((item) => item.averagePercentage).sort((a, b) => a - b);
  const getQuantile = (values: number[], q: number) => {
    if (values.length === 0) return 0;
    const position = (values.length - 1) * q;
    const base = Math.floor(position);
    const remainder = position - base;
    const next = values[base + 1] ?? values[base];
    return values[base] + remainder * (next - values[base]);
  };
  const batchPerformanceSpread = batchPerformanceValues.length
    ? {
        min: batchPerformanceValues[0],
        q1: getQuantile(batchPerformanceValues, 0.25),
        median: getQuantile(batchPerformanceValues, 0.5),
        q3: getQuantile(batchPerformanceValues, 0.75),
        max: batchPerformanceValues[batchPerformanceValues.length - 1],
      }
    : null;
  const organizationGrowth = useMemo(() => {
    const items = organizationsQuery.data?.items ?? [];
    const byMonth = new Map<string, { month: string; organizations: number; students: number }>();
    for (const organization of items) {
      const month = new Date(organization.createdAt).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      const current = byMonth.get(month) ?? { month, organizations: 0, students: 0 };
      current.organizations += 1;
      current.students += organization.totalStudents;
      byMonth.set(month, current);
    }
    return Array.from(byMonth.values());
  }, [organizationsQuery.data]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Analytics"
        title="Reports and analytics"
        description="Organization-level collection, pending dues, attendance, student growth, and reminder performance in one reporting workspace."
        actions={
          <>
            <Button variant="outline" onClick={handleExportOverview}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export overview
            </Button>
            <Button variant="outline" onClick={handleExportComparison}>
              <Download className="mr-2 h-4 w-4" />
              Export comparison
            </Button>
            <Button asChild>
              <Link href="/fees?status=OVERDUE">
                <CircleAlert className="mr-2 h-4 w-4" />
                Review overdue fees
              </Link>
            </Button>
          </>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCardData(summaryQuery.data).map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>
      {feeOverview ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {feePeriodCards.map((metric) => (
            <MetricCard
              key={metric.title}
              title={metric.title}
              value={metric.value}
              helper={metric.helper}
              trend={metric.trend}
              icon={metric.icon}
              tone={metric.tone}
            />
          ))}
        </div>
      ) : null}
      {academicSummary ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {academicCards.map((metric) => (
            <MetricCard key={metric.title} title={metric.title} value={metric.value} helper={metric.helper} icon={metric.icon} tone={metric.tone} />
          ))}
        </div>
      ) : null}
      {feeOverview ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <ChartCard
            title="Collection rate by period"
            description="A quick visual read on how efficiently the organization is converting billed fees into collected revenue."
          >
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  innerRadius="18%"
                  outerRadius="90%"
                  data={collectionRateData}
                  startAngle={180}
                  endAngle={0}
                  barSize={28}
                >
                  <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                  <RadialBar background dataKey="value" cornerRadius={14} />
                  <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" />
                  <Tooltip formatter={(value: number) => `${value}%`} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
          <ChartCard
            title="Period finance snapshot"
            description="Billed, collected, pending, and overdue values summarised per active reporting window."
          >
            <div className="space-y-5">
              {periodFinanceRows.map((item) => (
                <div key={item.label} className="rounded-2xl border border-border/60 bg-muted/35 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold">{item.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(item.collected)} collected from {formatCurrency(item.billed)} billed
                      </p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{item.rate}% rate</span>
                  </div>
                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(item.rate, 100)}%` }} />
                  </div>
                  <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                    <div className="rounded-xl bg-white/80 p-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Pending</p>
                      <p className="mt-1 font-semibold text-amber-600">{formatCurrency(item.pending)}</p>
                    </div>
                    <div className="rounded-xl bg-white/80 p-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Overdue</p>
                      <p className="mt-1 font-semibold text-rose-600">{formatCurrency(item.overdue)}</p>
                    </div>
                    <div className="rounded-xl bg-white/80 p-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Collected</p>
                      <p className="mt-1 font-semibold text-emerald-600">{formatCurrency(item.collected)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      ) : null}
      {feeOverview ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-5">
            <p className="text-sm font-semibold text-sky-900">Pending collection action</p>
            <p className="mt-2 text-sm text-sky-800">
              {formatCurrency(feeOverview.currentMonth.pending)} is still open this month. Jump into fee records with the pending filter applied.
            </p>
            <Button asChild variant="outline" className="mt-4 border-sky-300 bg-white/80 text-sky-900 hover:bg-white">
              <Link href="/fees?status=PENDING">Open pending fees</Link>
            </Button>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
            <p className="text-sm font-semibold text-amber-900">Quarter follow-up queue</p>
            <p className="mt-2 text-sm text-amber-800">
              {formatCurrency(feeOverview.currentQuarter.pending)} remains pending this quarter. Use operations to follow up before it shifts into overdue exposure.
            </p>
            <Button asChild variant="outline" className="mt-4 border-amber-300 bg-white/80 text-amber-900 hover:bg-white">
              <Link href="/fees?status=PARTIAL">Open partial payments</Link>
            </Button>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-5">
            <p className="text-sm font-semibold text-rose-900">Overdue recovery focus</p>
            <p className="mt-2 text-sm text-rose-800">
              {formatCurrency(feeOverview.currentMonth.overdue)} is already overdue this month. Route the team directly into the overdue fee list for recovery work.
            </p>
            <Button asChild variant="outline" className="mt-4 border-rose-300 bg-white/80 text-rose-900 hover:bg-white">
              <Link href="/fees?status=OVERDUE">Open overdue fees</Link>
            </Button>
          </div>
        </div>
      ) : null}
      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard
          title="Collection performance by period"
          description="Current month, quarter, and year billed amounts split against collected, pending, and overdue fee positions."
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={
                  feeOverview
                    ? [
                        {
                          period: "Month",
                          billed: feeOverview.currentMonth.billed,
                          collected: feeOverview.currentMonth.collected,
                          pending: feeOverview.currentMonth.pending,
                          overdue: feeOverview.currentMonth.overdue,
                        },
                        {
                          period: "Quarter",
                          billed: feeOverview.currentQuarter.billed,
                          collected: feeOverview.currentQuarter.collected,
                          pending: feeOverview.currentQuarter.pending,
                          overdue: feeOverview.currentQuarter.overdue,
                        },
                        {
                          period: "Year",
                          billed: feeOverview.currentYear.billed,
                          collected: feeOverview.currentYear.collected,
                          pending: feeOverview.currentYear.pending,
                          overdue: feeOverview.currentYear.overdue,
                        },
                      ]
                    : []
                }
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="billed" fill="#cbd5e1" />
                <Bar dataKey="collected" fill="#10b981" />
                <Bar dataKey="pending" fill="#f59e0b" />
                <Bar dataKey="overdue" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard
          title="Current vs previous collection"
          description="Period-over-period comparison for collected revenue and current open balances."
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={feeComparison.map((item) => ({
                  period: item.period === "MONTH" ? "Month" : item.period === "QUARTER" ? "Quarter" : "Year",
                  currentCollected: item.currentCollected,
                  previousCollected: item.previousCollected,
                  currentPending: item.currentPending,
                  previousPending: item.previousPending,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="currentCollected" fill="#0ea5e9" />
                <Bar dataKey="previousCollected" fill="#94a3b8" />
                <Line type="monotone" dataKey="currentPending" stroke="#f59e0b" strokeWidth={3} dot={{ fill: "#f59e0b" }} />
                <Line type="monotone" dataKey="previousPending" stroke="#fcd34d" strokeWidth={3} dot={{ fill: "#fcd34d" }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Academic operations radar" description="A broader shape of current academic activity instead of another linear chart.">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={academicRadarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <Radar dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.32} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Attendance heatmap" description="Daily presence intensity shown as a heatmap-style grid for faster operational scanning.">
          <HeatmapGrid cells={attendanceHeatmapCells} columns={7} />
        </ChartCard>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Student growth trend">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={enrollmentTrendQuery.data ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <defs>
                  <linearGradient id="reportsEnrollmentStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#0ea5e9" />
                    <stop offset="50%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
                <Line dataKey="count" stroke="url(#reportsEnrollmentStroke)" strokeWidth={3} dot={{ fill: "#10b981" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Batch-wise collection comparison">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={(batchCollectionQuery.data ?? []).map((item) => ({ batch: item.batchCode, total: item.total }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="batch" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total">
                  {(batchCollectionQuery.data ?? []).map((item, index) => (
                    <Cell key={item.batchCode} fill={getChartColor(index)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Attendance summary">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceStatusQuery.data ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total">
                  {(attendanceStatusQuery.data ?? []).map((entry, index) => (
                    <Cell key={entry.status} fill={getChartColor(index)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Attendance daily trend">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceDailyTrendQuery.data ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="present" stackId="1" stroke="#10b981" fill="#10b98155" />
                <Area type="monotone" dataKey="absent" stackId="1" stroke="#ef4444" fill="#ef444455" />
                <Area type="monotone" dataKey="late" stackId="1" stroke="#f59e0b" fill="#f59e0b55" />
                <Area type="monotone" dataKey="leave" stackId="1" stroke="#8b5cf6" fill="#8b5cf655" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <ChartCard title="Reminder channels">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reminderChannelQuery.data ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="channel" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count">
                  {(reminderChannelQuery.data ?? []).map((entry, index) => (
                    <Cell key={entry.channel} fill={getChartColor(index)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Reminder statuses">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={reminderStatusQuery.data ?? []} dataKey="total" nameKey="status" innerRadius={55} outerRadius={95}>
                  {(reminderStatusQuery.data ?? []).map((entry, index) => (
                    <Cell key={entry.status} fill={["#0ea5e9", "#10b981", "#ef4444"][index % 3]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Reminder daily trend">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reminderDailyTrendQuery.data ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <defs>
                  <linearGradient id="reminderDailyStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#0284c7" />
                    <stop offset="50%" stopColor="#14b8a6" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                </defs>
                <Line dataKey="total" stroke="url(#reminderDailyStroke)" strokeWidth={3} dot={{ fill: "#14b8a6" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Fee status breakdown">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={feeStatusQuery.data ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total">
                  {(feeStatusQuery.data ?? []).map((entry, index) => (
                    <Cell key={entry.status} fill={getChartColor(index)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Student status breakdown">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={studentStatusQuery.data ?? []} dataKey="total" nameKey="status" innerRadius={55} outerRadius={100}>
                  {(studentStatusQuery.data ?? []).map((entry, index) => (
                    <Cell key={entry.status} fill={["#10b981", "#f59e0b", "#ef4444", "#64748b"][index % 4]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <ChartCard title="Student batch distribution">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={(studentBatchDistributionQuery.data ?? []).map((item) => ({ batch: item.batchCode, total: item.total }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="batch" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total">
                  {(studentBatchDistributionQuery.data ?? []).map((item, index) => (
                    <Cell key={item.batchCode} fill={getChartColor(index)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="User role distribution">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={(userRoleDistributionQuery.data ?? []).map((item) => ({ role: item.roleName, total: item.total }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="role" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total">
                  {(userRoleDistributionQuery.data ?? []).map((item, index) => (
                    <Cell key={item.roleName} fill={getChartColor(index)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="User and batch status">
          <div className="space-y-6">
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userStatusQuery.data ?? []}>
                  <XAxis dataKey="status" />
                  <Tooltip />
                  <Bar dataKey="total">
                    {(userStatusQuery.data ?? []).map((item, index) => (
                      <Cell key={item.status} fill={getChartColor(index)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={batchStatusQuery.data ?? []}>
                  <XAxis dataKey="status" />
                  <Tooltip />
                  <Bar dataKey="total">
                    {(batchStatusQuery.data ?? []).map((item, index) => (
                      <Cell key={item.status} fill={getChartColor(index)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </ChartCard>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Academic Performance By Batch" description="Average result percentage by batch">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={(batchPerformanceQuery.data ?? []).map((item) => ({ batch: item.batchCode, average: item.averagePercentage }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="batch" />
                <YAxis />
                <Tooltip formatter={(value: number | string) => `${value}%`} />
                <Area type="monotone" dataKey="average" stroke={getChartColor(0)} fill={getChartColor(0)} fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Exam Calendar Trend" description="Exam planning load by month">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={examScheduleTrendQuery.data ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke={getChartColor(1)} strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Batch performance spread" description="A box-plot-style summary of result variability across batches.">
          {batchPerformanceSpread ? (
            <BoxPlotSummary
              min={batchPerformanceSpread.min}
              q1={batchPerformanceSpread.q1}
              median={batchPerformanceSpread.median}
              q3={batchPerformanceSpread.q3}
              max={batchPerformanceSpread.max}
              formatValue={(value) => `${value.toFixed(1)}%`}
            />
          ) : (
            <p className="text-sm text-muted-foreground">No batch performance spread is available yet.</p>
          )}
        </ChartCard>
        <ChartCard title="Grade radar" description="Grade concentration shown through a radar profile instead of another flat bar chart.">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={(gradeDistributionQuery.data ?? []).map((item) => ({ metric: item.grade, value: item.total }))}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <Radar dataKey="value" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.3} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Grade Distribution" description="Outcome mix across recorded academic results">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeDistributionQuery.data ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="grade" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" radius={[10, 10, 0, 0]}>
                  {(gradeDistributionQuery.data ?? []).map((item, index) => (
                    <Cell key={item.grade} fill={getChartColor(index)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Result Publication Status" description="Draft versus published academic outcomes">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={resultStatusQuery.data ?? []} dataKey="total" nameKey="status" innerRadius={60} outerRadius={100}>
                  {(resultStatusQuery.data ?? []).map((item, index) => (
                    <Cell key={item.status} fill={getChartColor(index)} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
      {isSuperAdmin ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <ChartCard title="Organization growth" description="Tenant onboarding growth and linked student footprint over time.">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={organizationGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="organizations" fill="#0ea5e9" />
                  <Line type="monotone" dataKey="students" stroke="#10b981" strokeWidth={3} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
          <ChartCard title="Tenant student heatmap" description="Student footprint intensity across onboarded organizations.">
            <HeatmapGrid
              cells={(organizationsQuery.data?.items ?? [])
                .slice()
                .sort((left, right) => right.totalStudents - left.totalStudents)
                .slice(0, 12)
                .map((item) => ({
                  label: item.slug.slice(0, 8),
                  value: item.totalStudents,
                  hint: `${item.name}: ${item.totalStudents} students`,
                }))}
              columns={4}
            />
          </ChartCard>
        </div>
      ) : null}
    </div>
  );
}
