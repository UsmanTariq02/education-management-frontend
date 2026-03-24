import { formatCurrency } from "@/lib/formatters";
import type { DashboardSummary } from "@/types/domain";

export function metricCardData(summary: DashboardSummary) {
  return [
    {
      title: "Active students",
      value: String(summary.activeStudents),
      helper: `${summary.totalStudents} total enrolled`,
      trend: 8,
    },
    {
      title: "Monthly collections",
      value: formatCurrency(summary.monthlyFeeCollection),
      helper: "Current month fee intake",
      trend: 12,
    },
    {
      title: "Unpaid fee records",
      value: String(summary.unpaidFeeCount),
      helper: "Pending, partial, and overdue",
      trend: -6,
    },
    {
      title: "Present attendance",
      value: String(summary.presentAttendanceCount),
      helper: "Current attendance count",
      trend: 4,
    },
  ];
}
