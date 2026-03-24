export const CHART_COLORS = [
  "#0284c7",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#14b8a6",
  "#f97316",
  "#64748b",
] as const;

export function getChartColor(index: number) {
  return CHART_COLORS[index % CHART_COLORS.length];
}
