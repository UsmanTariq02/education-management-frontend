"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { activityLogsApi } from "@/features/activity-logs/api/activity-logs-api";
import { usePermission } from "@/hooks/use-permission";
import { useSavedFilterPresets } from "@/hooks/use-saved-filter-presets";
import { formatCurrency } from "@/lib/formatters";
import { exportRowsToCsv } from "@/lib/utils/export";
import { useAuth } from "@/providers/auth-provider";
import { metricCardData } from "@/lib/utils/dashboard";
import { getChartColor } from "@/lib/constants/chart-colors";
import type { ActivityLog, WeeklyPrincipalSummary } from "@/types/domain";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ReportsPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.roles.includes("SUPER_ADMIN") ?? false;
  const canReadActivityLogs = usePermission("activity-logs.read");
  const [selectedSection, setSelectedSection] = useState("all");
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const savedReportPresets = useSavedFilterPresets<{
    section: string;
  }>("reports-section-presets");
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
  const activityLogsQuery = useQuery({
    queryKey: ["reports", "activity-logs", "snapshot"],
    queryFn: () =>
      activityLogsApi.list({
        page: 1,
        limit: 20,
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
    enabled: canReadActivityLogs,
  });
  const organizationsQuery = useQuery({
    queryKey: ["organizations", "reports-growth"],
    queryFn: () => organizationsApi.list({ page: 1, limit: 100 }),
    enabled: isSuperAdmin,
  });
  const tenantSettingsQuery = useQuery({
    queryKey: ["organization-settings", "reports-page"],
    queryFn: organizationsApi.currentSettings,
    enabled: Boolean(user?.organizationId),
  });
  const weeklyPrincipalSummaryMutation = useMutation({
    mutationFn: async () => reportsApi.weeklyPrincipalSummary(),
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not generate weekly summary"),
  });
  const dashboardSummary = summaryQuery.data ?? {
    totalStudents: 0,
    activeStudents: 0,
    monthlyFeeCollection: 0,
    unpaidFeeCount: 0,
    presentAttendanceCount: 0,
  };
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

  useEffect(() => {
    const target = selectedSection === "all" ? null : document.getElementById(`report-section-${selectedSection}`);
    if (!target) {
      return;
    }

    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selectedSection]);

  const feeOverview = feeCollectionOverviewQuery.data;
  const feeComparison = feePeriodComparisonQuery.data ?? [];
  const academicSummary = academicSummaryQuery.data;
  const tenantSettings = tenantSettingsQuery.data ?? null;
  const weeklyPrincipalSummary = weeklyPrincipalSummaryMutation.data ?? null;
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
  const financeSnapshotRows = useMemo<Array<Record<string, string | number>>>(() => {
    if (!feeOverview) {
      return [];
    }

    const rows: Array<Record<string, string | number>> = [
      {
        Section: "Finance overview",
        Period: "Current month",
        Billed: formatCurrency(feeOverview.currentMonth.billed),
        Collected: formatCurrency(feeOverview.currentMonth.collected),
        Pending: formatCurrency(feeOverview.currentMonth.pending),
        Overdue: formatCurrency(feeOverview.currentMonth.overdue),
        "Collection Rate": `${feeOverview.currentMonth.collectionRate}%`,
      },
      {
        Section: "Finance overview",
        Period: "Current quarter",
        Billed: formatCurrency(feeOverview.currentQuarter.billed),
        Collected: formatCurrency(feeOverview.currentQuarter.collected),
        Pending: formatCurrency(feeOverview.currentQuarter.pending),
        Overdue: formatCurrency(feeOverview.currentQuarter.overdue),
        "Collection Rate": `${feeOverview.currentQuarter.collectionRate}%`,
      },
      {
        Section: "Finance overview",
        Period: "Current year",
        Billed: formatCurrency(feeOverview.currentYear.billed),
        Collected: formatCurrency(feeOverview.currentYear.collected),
        Pending: formatCurrency(feeOverview.currentYear.pending),
        Overdue: formatCurrency(feeOverview.currentYear.overdue),
        "Collection Rate": `${feeOverview.currentYear.collectionRate}%`,
      },
    ];

    feeComparison.forEach((item) => {
      rows.push({
        Section: "Finance comparison",
        Period: item.period,
        "Current Collected": formatCurrency(item.currentCollected),
        "Previous Collected": formatCurrency(item.previousCollected),
        "Current Pending": formatCurrency(item.currentPending),
        "Previous Pending": formatCurrency(item.previousPending),
      });
    });

    return rows;
  }, [feeComparison, feeOverview]);
  const academicSnapshotRows = useMemo<Array<Record<string, string | number>>>(() => {
    if (!academicSummary) {
      return [];
    }

    const rows: Array<Record<string, string | number>> = [
      { Section: "Academic summary", Metric: "Total exams", Value: academicSummary.totalExams },
      { Section: "Academic summary", Metric: "Published exams", Value: academicSummary.publishedExams },
      { Section: "Academic summary", Metric: "Total results", Value: academicSummary.totalResults },
      { Section: "Academic summary", Metric: "Published results", Value: academicSummary.publishedResults },
      { Section: "Academic summary", Metric: "Average percentage", Value: `${academicSummary.averagePercentage.toFixed(1)}%` },
    ];

    (gradeDistributionQuery.data ?? []).forEach((item) => {
      rows.push({
        Section: "Grade distribution",
        Metric: item.grade,
        Value: item.total,
      });
    });

    (batchPerformanceQuery.data ?? []).forEach((item) => {
      rows.push({
        Section: "Batch performance",
        Metric: `${item.batchCode} - ${item.batchName}`,
        Value: `${item.averagePercentage.toFixed(1)}%`,
      });
    });

    (resultStatusQuery.data ?? []).forEach((item) => {
      rows.push({
        Section: "Result status",
        Metric: item.status,
        Value: item.total,
      });
    });

    (examScheduleTrendQuery.data ?? []).forEach((item) => {
      rows.push({
        Section: "Exam schedule trend",
        Metric: item.month,
        Value: item.count,
      });
    });

    return rows;
  }, [academicSummary, batchPerformanceQuery.data, examScheduleTrendQuery.data, gradeDistributionQuery.data, resultStatusQuery.data]);
  const activityLogSnapshotRows = useMemo<Array<Record<string, string | number>>>(() => {
    return (activityLogsQuery.data?.items ?? []).map((log) => ({
      When: formatShortDateTime(log.createdAt),
      Actor: log.actorUser ? `${log.actorUser.firstName} ${log.actorUser.lastName}` : "System / Anonymous",
      ActorEmail: log.actorUser?.email ?? "",
      Module: log.module,
      Action: log.action,
      Target: log.targetId ?? "General",
      Details: summarizeMetadata(log),
    }));
  }, [activityLogsQuery.data]);
  const handleExportOverview = () => {
    if (!feeOverview) {
      toast.error("Fee collection overview is not available yet.");
      return;
    }

    exportRowsToCsv({
      filename: "fee-collection-overview",
      rows: financeSnapshotRows.slice(0, 3),
    });
    toast.success("Finance overview exported");
  };
  const handleExportComparison = () => {
    if (feeComparison.length === 0) {
      toast.error("Period comparison data is not available yet.");
      return;
    }

    exportRowsToCsv({
      filename: "fee-period-comparison",
      rows: financeSnapshotRows.slice(3),
    });
    toast.success("Period comparison exported");
  };
  const handleExportFinanceSnapshot = () => {
    if (financeSnapshotRows.length === 0) {
      toast.error("Finance snapshot is not available yet.");
      return;
    }

    exportRowsToCsv({
      filename: "finance-report-snapshot",
      rows: financeSnapshotRows,
    });
    toast.success("Finance snapshot exported");
  };
  const handleExportAcademicSnapshot = () => {
    if (academicSnapshotRows.length === 0) {
      toast.error("Academic snapshot is not available yet.");
      return;
    }

    exportRowsToCsv({
      filename: "academic-report-snapshot",
      rows: academicSnapshotRows,
    });
    toast.success("Academic snapshot exported");
  };
  const handleExportActivitySnapshot = () => {
    if (!canReadActivityLogs) {
      toast.error("You do not have permission to export activity logs.");
      return;
    }

    if (activityLogSnapshotRows.length === 0) {
      toast.error("Activity log snapshot is not available yet.");
      return;
    }

    exportRowsToCsv({
      filename: "activity-log-snapshot",
      rows: activityLogSnapshotRows,
    });
    toast.success("Activity log snapshot exported");
  };
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
  const monthComparison = feeComparison.find((item) => item.period === "MONTH") ?? null;
  const enrollmentTrendPoints = enrollmentTrendQuery.data ?? [];
  const previousEnrollmentPoint = enrollmentTrendPoints.at(-2) ?? null;
  const currentEnrollmentPoint = enrollmentTrendPoints.at(-1) ?? null;
  const enrollmentTrendComparison =
    currentEnrollmentPoint && previousEnrollmentPoint
      ? {
          current: currentEnrollmentPoint.count,
          previous: previousEnrollmentPoint.count,
          delta: currentEnrollmentPoint.count - previousEnrollmentPoint.count,
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
  const moduleAdoption = useMemo(() => {
    const items = organizationsQuery.data?.items ?? [];
    const byModule = new Map<string, number>();
    for (const organization of items) {
      for (const moduleName of organization.enabledModules) {
        byModule.set(moduleName, (byModule.get(moduleName) ?? 0) + 1);
      }
    }
    return Array.from(byModule.entries())
      .sort((left, right) => right[1] - left[1])
      .map(([moduleName, total]) => ({ moduleName: moduleName.replaceAll("_", " "), total }));
  }, [organizationsQuery.data]);
  const kpiComparisonCards = [
    monthComparison
      ? {
          title: "Monthly collections",
          current: formatCurrency(monthComparison.currentCollected),
          previous: formatCurrency(monthComparison.previousCollected),
          delta: monthComparison.currentCollected - monthComparison.previousCollected,
          deltaLabel: "collected vs previous month",
          tone: monthComparison.currentCollected >= monthComparison.previousCollected ? ("emerald" as const) : ("rose" as const),
        }
      : null,
    monthComparison
      ? {
          title: "Monthly pending",
          current: formatCurrency(monthComparison.currentPending),
          previous: formatCurrency(monthComparison.previousPending),
          delta: monthComparison.currentPending - monthComparison.previousPending,
          deltaLabel: "pending vs previous month",
          tone: monthComparison.currentPending <= monthComparison.previousPending ? ("emerald" as const) : ("amber" as const),
        }
      : null,
    enrollmentTrendComparison
      ? {
          title: "Student growth",
          current: String(enrollmentTrendComparison.current),
          previous: String(enrollmentTrendComparison.previous),
          delta: enrollmentTrendComparison.delta,
          deltaLabel: "new enrollments vs previous month",
          tone: enrollmentTrendComparison.delta >= 0 ? ("emerald" as const) : ("rose" as const),
        }
      : null,
    {
      title: "Attendance present",
      current: String(dashboardSummary.presentAttendanceCount),
      previous: "Previous month baseline",
      delta: undefined as number | undefined,
      deltaLabel: "current attendance snapshot",
      tone: "sky" as const,
    },
  ].filter(Boolean) as Array<{
    title: string;
    current: string;
    previous: string;
    delta: number | undefined;
    deltaLabel: string;
    tone: "sky" | "emerald" | "amber" | "rose" | "violet";
  }>;
  const attendanceTotals = useMemo(() => {
    const totals = (attendanceStatusQuery.data ?? []).reduce(
      (acc, item) => {
        if (item.status === "PRESENT") acc.present += item.total;
        if (item.status === "ABSENT") acc.absent += item.total;
        if (item.status === "LATE") acc.late += item.total;
        if (item.status === "LEAVE") acc.leave += item.total;
        return acc;
      },
      { present: 0, absent: 0, late: 0, leave: 0 },
    );
    return totals;
  }, [attendanceStatusQuery.data]);
  const coreModules = ["USERS", "STUDENTS", "FEES", "ATTENDANCE", "ACADEMICS", "SETTINGS"] as const;
  const missingCoreModules = useMemo(() => {
    const enabled = tenantSettings?.enabledModules ?? user?.enabledModules ?? [];
    return coreModules.filter((module) => !enabled.includes(module));
  }, [tenantSettings?.enabledModules, user?.enabledModules]);
  const topRisks = useMemo(() => {
    const risks: Array<{
      title: string;
      description: string;
      tone: "rose" | "amber" | "sky";
      action: string;
      actionLabel: string;
      detail: string;
    }> = [];

    if (tenantSettings) {
      const trialExpired =
        tenantSettings.subscriptionStatus === "TRIAL" &&
        tenantSettings.trialEndsAt !== null &&
        new Date(tenantSettings.trialEndsAt).getTime() <= Date.now();
      const trialExpiringSoon =
        tenantSettings.subscriptionStatus === "TRIAL" &&
        tenantSettings.trialEndsAt !== null &&
        !trialExpired &&
        new Date(tenantSettings.trialEndsAt).getTime() - Date.now() <= 7 * 24 * 60 * 60 * 1000;

      if (trialExpired || trialExpiringSoon || tenantSettings.subscriptionStatus === "PAST_DUE" || tenantSettings.subscriptionStatus === "SUSPENDED") {
        risks.push({
          title: trialExpired ? "Trial expired" : "Billing needs attention",
          description: trialExpired
            ? "The workspace trial has ended and access should be reviewed."
            : "The workspace is close to a billing or access boundary.",
          tone: trialExpired ? "rose" : "amber",
          action: "/settings",
          actionLabel: "Open settings",
          detail: trialExpired
            ? "Access and billing state are already beyond the trial window."
            : "A billing status change is approaching.",
        });
      }

      if (missingCoreModules.length > 0) {
        risks.push({
          title: "Inactive modules",
          description: `${missingCoreModules.length} core modules are not enabled in this tenant.`,
          tone: "sky",
          action: "/settings",
          actionLabel: "Review modules",
          detail: missingCoreModules.map((module) => module.replaceAll("_", " ")).join(", "),
        });
      }
    }

    const overdue = feeOverview?.currentMonth.overdue ?? 0;
    if (overdue > 0) {
      risks.push({
        title: "Overdue fees",
        description: `${formatCurrency(overdue)} is overdue this month.`,
        tone: overdue > 0 ? "rose" : "amber",
        action: "/fees?status=OVERDUE",
        actionLabel: "Open overdue fees",
        detail: "Follow up before the overdue balance grows further.",
      });
    }

    const followUp = attendanceTotals.absent + attendanceTotals.late;
    if (followUp > 0) {
      const isSevere = attendanceTotals.present > 0 ? followUp >= attendanceTotals.present : followUp >= 10;
      risks.push({
        title: "Attendance follow-up",
        description: `${followUp} attendance records need attention.`,
        tone: isSevere ? "rose" : "amber",
        action: "/attendance",
        actionLabel: "Open attendance",
        detail: `${attendanceTotals.present} present, ${attendanceTotals.absent} absent, ${attendanceTotals.late} late, ${attendanceTotals.leave} on leave.`,
      });
    }

    return risks.slice(0, 4);
  }, [attendanceTotals.absent, attendanceTotals.late, attendanceTotals.leave, attendanceTotals.present, feeOverview, missingCoreModules, tenantSettings]);
  const exportPresets = [
    {
      title: "Overview pack",
      description: "Summary KPIs and the current workspace overview.",
      action: handleExportOverview,
      available: true,
    },
    {
      title: "Finance pack",
      description: "Fee overview, period comparison, and collection snapshots.",
      action: handleExportFinanceSnapshot,
      available: Boolean(feeOverview),
    },
    {
      title: "Academic pack",
      description: "Academic summary, grades, results, and batch performance.",
      action: handleExportAcademicSnapshot,
      available: Boolean(academicSummary),
    },
    {
      title: "Activity pack",
      description: "Operational audit snapshot for users with log access.",
      action: handleExportActivitySnapshot,
      available: canReadActivityLogs,
    },
    {
      title: "Tenant pack",
      description: "Tenant growth and module adoption for super admins.",
      action: () => {
        exportRowsToCsv({
          filename: "tenant-growth-snapshot",
          rows: organizationGrowth.map((item) => ({
            Month: item.month,
            Organizations: item.organizations,
            Students: item.students,
          })),
        });
        toast.success("Tenant growth exported");
      },
      available: isSuperAdmin && organizationGrowth.length > 0,
    },
  ].filter((preset) => preset.available);
  const sectionOptions = [
    { value: "all", label: "All" },
    { value: "finance", label: "Finance" },
    { value: "academics", label: "Academics" },
    { value: "operations", label: "Operations" },
    { value: "tenancy", label: "Tenancy" },
    { value: "activity", label: "Activity" },
  ];
  const homeInsights = [
    {
      title: "Finance pulse",
      value: feeOverview ? formatCurrency(feeOverview.currentMonth.pending) : "—",
      helper: feeOverview ? "Open this month" : "Finance data is still loading",
      action: "/fees?status=PENDING",
      actionLabel: "Review pending fees",
    },
    {
      title: "Attendance pulse",
      value: String(dashboardSummary.presentAttendanceCount),
      helper: "Present today across the workspace",
      action: "/attendance",
      actionLabel: "Open attendance",
    },
    {
      title: "Academic pulse",
      value: academicSummary ? `${academicSummary.averagePercentage.toFixed(1)}%` : "—",
      helper: academicSummary ? "Average result percentage" : "Academic data is still loading",
      action: "/exam-results",
      actionLabel: "Open results",
    },
    ...(isSuperAdmin
      ? [
          {
            title: "Tenant pulse",
            value: organizationsQuery.data ? String(organizationsQuery.data.total) : "—",
            helper: "Organizations in scope",
            action: "/organizations",
            actionLabel: "Open organizations",
          },
        ]
      : []),
  ];

  const dailyDigest = useMemo(() => {
    const financeLine = feeOverview
      ? `${formatCurrency(feeOverview.currentMonth.pending)} pending and ${formatCurrency(feeOverview.currentMonth.overdue)} overdue this month.`
      : "Finance data is still loading.";
    const attendanceLine = `Present attendance count in the current summary is ${dashboardSummary.presentAttendanceCount}.`;
    const reminderLine = reminderStatusQuery.data
      ? `${reminderStatusQuery.data.reduce((sum, item) => sum + item.total, 0)} reminder logs are visible in the current reporting window.`
      : "Reminder data is still loading.";
    const academicLine = academicSummary
      ? `Academic average stands at ${academicSummary.averagePercentage.toFixed(1)}%.`
      : "Academic summary is still loading.";

    return [
      `Daily admin digest for ${user?.organizationName ?? "the current organization"}`,
      financeLine,
      attendanceLine,
      reminderLine,
      academicLine,
      feeOverview ? `Follow up overdue balances first: ${formatCurrency(feeOverview.currentMonth.overdue)} is already overdue.` : "No fee follow-up risk data available yet.",
      "Recommended action: review overdue fees, attendance exceptions, and reminder delivery before the end of the day.",
    ].join("\n");
  }, [academicSummary, dashboardSummary.presentAttendanceCount, feeOverview, reminderStatusQuery.data, user?.organizationName]);

  const copyDailyDigest = async () => {
    try {
      await navigator.clipboard.writeText(dailyDigest);
      toast.success("Daily digest copied");
    } catch {
      toast.error("Could not copy daily digest");
    }
  };

  const runWeeklyPrincipalSummary = async () => {
    try {
      await weeklyPrincipalSummaryMutation.mutateAsync();
      toast.success("Weekly principal summary generated");
    } catch {
      // handled in onError
    }
  };

  if (summaryQuery.isLoading) return <LoadingState rows={6} />;
  if (summaryQuery.isError || !summaryQuery.data) return <ErrorState description="Reports summary could not be loaded." />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Analytics home"
        title="Reports and analytics"
        description="A single workspace for finance, attendance, academics, reminders, and tenant growth."
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
            <Button variant="outline" onClick={handleExportOverview}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export overview
            </Button>
            <Button variant="outline" onClick={handleExportComparison}>
              <Download className="mr-2 h-4 w-4" />
              Export comparison
            </Button>
            <Button variant="outline" onClick={handleExportFinanceSnapshot}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export finance snapshot
            </Button>
            <Button variant="outline" onClick={handleExportAcademicSnapshot}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export academics snapshot
            </Button>
            {canReadActivityLogs ? (
              <Button variant="outline" onClick={handleExportActivitySnapshot}>
                <Download className="mr-2 h-4 w-4" />
                Export activity snapshot
              </Button>
            ) : null}
            <Button asChild>
              <Link href="/fees?status=OVERDUE">
                <CircleAlert className="mr-2 h-4 w-4" />
                Review overdue fees
              </Link>
            </Button>
          </div>
        }
      />
      <div className="grid gap-4 lg:grid-cols-4">
        {homeInsights.map((insight) => (
          <Card key={insight.title} className="border-border/70 bg-card/80 shadow-sm backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{insight.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-3xl font-semibold tracking-tight">{insight.value}</p>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">{insight.helper}</p>
              </div>
              <Button asChild variant="outline" className="w-full">
                <Link href={insight.action}>{insight.actionLabel}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="border-border/70 bg-card/80 shadow-sm backdrop-blur" id="report-section-digest">
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle>Daily admin digest</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">A short operational summary you can copy into a team update or morning brief.</p>
          </div>
          <Button variant="outline" onClick={copyDailyDigest}>
            Copy digest
          </Button>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap rounded-2xl border border-border/70 bg-muted/30 p-4 text-sm leading-7 text-foreground shadow-sm">{dailyDigest}</pre>
        </CardContent>
      </Card>
      <Card className="border-border/70 bg-card/80 shadow-sm backdrop-blur" id="report-section-weekly-summary">
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle>Weekly principal summary</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Generate a leadership-ready summary from current report signals.</p>
          </div>
          <Button variant="outline" onClick={() => runWeeklyPrincipalSummary()} disabled={weeklyPrincipalSummaryMutation.isPending}>
            {weeklyPrincipalSummaryMutation.isPending ? "Generating..." : "Generate summary"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {weeklyPrincipalSummary ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Headline</p>
                <p className="mt-2 text-sm font-medium text-foreground">{weeklyPrincipalSummary.headline}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Overview</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-foreground">{weeklyPrincipalSummary.overview}</p>
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Highlights</p>
                  <ul className="mt-3 space-y-2 text-sm text-foreground">
                    {weeklyPrincipalSummary.highlights.map((item) => (
                      <li key={item} className="rounded-xl border border-border/60 bg-background px-3 py-2 shadow-sm">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Risks</p>
                  <ul className="mt-3 space-y-2 text-sm text-foreground">
                    {weeklyPrincipalSummary.risks.map((item) => (
                      <li key={item} className="rounded-xl border border-border/60 bg-background px-3 py-2 shadow-sm">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Next actions</p>
                  <ul className="mt-3 space-y-2 text-sm text-foreground">
                    {weeklyPrincipalSummary.nextActions.map((item) => (
                      <li key={item} className="rounded-xl border border-border/60 bg-background px-3 py-2 shadow-sm">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Generated for {weeklyPrincipalSummary.organizationName} on {new Date(weeklyPrincipalSummary.generatedAt).toLocaleString()}.
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Run the generator to produce a short weekly summary for principals or leadership meetings.
            </p>
          )}
        </CardContent>
      </Card>
      {kpiComparisonCards.length ? (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {kpiComparisonCards.map((card) => (
            <Card key={card.title} className="border-border/70 bg-card/80 shadow-sm backdrop-blur">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{card.title}</CardTitle>
                  <Badge variant={card.tone === "rose" ? "danger" : card.tone === "amber" ? "warning" : "outline"}>{card.deltaLabel}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-3xl font-semibold tracking-tight">{card.current}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Previous: {card.previous}</p>
                  </div>
                  {card.delta !== undefined ? (
                    <Badge variant={card.delta >= 0 ? "success" : "danger"}>{card.delta >= 0 ? "+" : ""}
                      {card.delta}</Badge>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
      {topRisks.length ? (
        <Card className="border-rose-200 bg-rose-50/70">
          <CardHeader>
            <CardTitle>Top risks</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-2">
            {topRisks.map((risk) => (
              <div key={risk.title} className="rounded-[1.75rem] border border-rose-200 bg-white/80 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <Badge variant={risk.tone === "rose" ? "danger" : risk.tone === "amber" ? "warning" : "outline"}>{risk.title}</Badge>
                    <p className="text-sm text-muted-foreground">{risk.description}</p>
                    <p className="text-xs text-muted-foreground">{risk.detail}</p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={risk.action}>{risk.actionLabel}</Link>
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
      {exportPresets.length ? (
        <Card className="border-sky-200 bg-sky-50/70">
          <CardHeader>
            <CardTitle>Role-aware export presets</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {exportPresets.map((preset) => (
              <div key={preset.title} className="rounded-[1.75rem] border border-sky-200 bg-white/80 p-4 shadow-sm">
                <p className="font-medium">{preset.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{preset.description}</p>
                <Button className="mt-4 w-full" variant="outline" onClick={preset.action}>
                  Export preset
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.75rem] border border-border/70 bg-card/85 px-4 py-3 text-sm shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground">Focused section</span>
          <Select
            value={selectedSection}
            onValueChange={(value) => setSelectedSection(value)}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select section" />
            </SelectTrigger>
            <SelectContent>
              {sectionOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {sectionOptions.filter((option) => option.value !== "all").map((option) => (
            <Button key={option.value} variant={selectedSection === option.value ? "default" : "outline"} size="sm" onClick={() => setSelectedSection(option.value)}>
              {option.label}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const name = window.prompt("Save this report section as:");
              const preset = name ? savedReportPresets.savePreset(name, { section: selectedSection }) : null;
              if (preset) {
                setSelectedPresetId(preset.id);
                toast.success(`Saved view "${preset.name}"`);
              }
            }}
          >
            Save current view
          </Button>
          <Select
            value={selectedPresetId}
            onValueChange={(presetId) => {
              const preset = savedReportPresets.presets.find((item) => item.id === presetId);
              if (!preset) return;
              setSelectedSection(preset.value.section);
              setSelectedPresetId(preset.id);
            }}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Load saved view" />
            </SelectTrigger>
            <SelectContent>
              {savedReportPresets.presets.length === 0 ? (
                <SelectItem value="__none" disabled>
                  No saved views yet
                </SelectItem>
              ) : (
                savedReportPresets.presets.map((preset) => (
                  <SelectItem key={preset.id} value={preset.id}>
                    {preset.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            onClick={() => {
              savedReportPresets.clearPresets();
              setSelectedPresetId("");
              toast.success("Saved report views cleared");
            }}
            disabled={savedReportPresets.presets.length === 0}
          >
            Clear saved views
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setSelectedSection("finance")}>Jump to finance</Button>
        <Button variant="outline" size="sm" onClick={() => setSelectedSection("academics")}>Jump to academics</Button>
        <Button variant="outline" size="sm" onClick={() => setSelectedSection("operations")}>Jump to operations</Button>
        <Button variant="outline" size="sm" onClick={() => setSelectedSection("tenancy")}>Jump to tenancy</Button>
        <Button variant="outline" size="sm" onClick={() => setSelectedSection("activity")}>Jump to activity</Button>
      </div>
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4" id="report-section-activity">
        <Button variant="outline" asChild>
          <Link href={buildActivityLogsHref({ action: "bulk-delete" })}>Audit bulk deletes</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={buildActivityLogsHref({ action: "bulk-status" })}>Audit bulk status</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={buildActivityLogsHref({ action: "bulk-publish" })}>Audit bulk publish</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={buildActivityLogsHref({ module: "fees" })}>Audit billing activity</Link>
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" id="report-section-overview">
        {metricCardData(dashboardSummary).map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>
      {feeOverview ? (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5" id="report-section-finance-cards">
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
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" id="report-section-academics">
          {academicCards.map((metric) => (
            <MetricCard key={metric.title} title={metric.title} value={metric.value} helper={metric.helper} icon={metric.icon} tone={metric.tone} />
          ))}
        </div>
      ) : null}
      {feeOverview ? (
        <div className="grid gap-6 2xl:grid-cols-2" id="report-section-finance-charts">
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
              <div key={item.label} className="rounded-2xl border border-border/60 bg-muted/35 p-4 shadow-sm">
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
                    <div className="rounded-2xl border border-border/60 bg-white/80 p-3 shadow-sm">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Pending</p>
                      <p className="mt-1 font-semibold text-amber-600">{formatCurrency(item.pending)}</p>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-white/80 p-3 shadow-sm">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Overdue</p>
                      <p className="mt-1 font-semibold text-rose-600">{formatCurrency(item.overdue)}</p>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-white/80 p-3 shadow-sm">
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
        <div className="grid gap-4 lg:grid-cols-3" id="report-section-operations">
          <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-5 shadow-sm">
            <p className="text-sm font-semibold text-sky-900">Pending collection action</p>
            <p className="mt-2 text-sm text-sky-800">
              {formatCurrency(feeOverview.currentMonth.pending)} is still open this month. Jump into fee records with the pending filter applied.
            </p>
            <Button asChild variant="outline" className="mt-4 border-sky-300 bg-white/80 text-sky-900 hover:bg-white">
              <Link href="/fees?status=PENDING">Open pending fees</Link>
            </Button>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 shadow-sm">
            <p className="text-sm font-semibold text-amber-900">Quarter follow-up queue</p>
            <p className="mt-2 text-sm text-amber-800">
              {formatCurrency(feeOverview.currentQuarter.pending)} remains pending this quarter. Use operations to follow up before it shifts into overdue exposure.
            </p>
            <Button asChild variant="outline" className="mt-4 border-amber-300 bg-white/80 text-amber-900 hover:bg-white">
              <Link href="/fees?status=PARTIAL">Open partial payments</Link>
            </Button>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-5 shadow-sm">
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

      <div className="grid gap-4 lg:grid-cols-4" id="report-section-operations-links">
        <Button variant="outline" asChild>
          <Link href="/fees?status=OVERDUE">Drill into overdue fees</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/fees?status=PENDING">Drill into pending fees</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/students">Drill into students</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/attendance">Drill into attendance</Link>
        </Button>
      </div>
      <div className="grid gap-6 2xl:grid-cols-2" id="report-section-academics-charts-1">
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
      <div className="grid gap-6 2xl:grid-cols-2" id="report-section-academics-charts-2">
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
      <div className="grid gap-6 2xl:grid-cols-2">
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
      <div className="grid gap-6 2xl:grid-cols-2">
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
      <div className="grid gap-6 2xl:grid-cols-3" id="report-section-reminders">
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
      <div className="grid gap-6 2xl:grid-cols-2" id="report-section-activity">
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
      <div className="grid gap-6 2xl:grid-cols-3">
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
      <div className="grid gap-6 2xl:grid-cols-2">
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
      <div className="grid gap-6 2xl:grid-cols-2">
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
      <div className="grid gap-6 2xl:grid-cols-2">
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
        <div className="grid gap-6 2xl:grid-cols-2" id="report-section-tenancy">
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
      {isSuperAdmin && moduleAdoption.length ? (
        <ChartCard title="Module adoption by organization" description="Which SaaS modules are enabled most often across the tenant base.">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={moduleAdoption.slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="moduleName" width={130} />
                <Tooltip />
                <Bar dataKey="total" radius={[0, 10, 10, 0]}>
                  {moduleAdoption.slice(0, 8).map((item, index) => (
                    <Cell key={item.moduleName} fill={getChartColor(index)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      ) : null}
    </div>
  );
}

function summarizeMetadata(log: ActivityLog) {
  if (!log.metadata) {
    return "No additional metadata";
  }

  const entries = Object.entries(log.metadata)
    .filter(([, value]) => value !== null && value !== undefined)
    .slice(0, 4)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}: ${value.join(", ")}`;
      }

      if (typeof value === "object") {
        return `${key}: [object]`;
      }

      return `${key}: ${String(value)}`;
    });

  return entries.length > 0 ? entries.join(" | ") : "No additional metadata";
}

function formatShortDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
