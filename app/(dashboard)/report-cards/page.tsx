"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, FileBadge2, Printer, Trophy } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { examResultsApi } from "@/features/exam-results/api/exam-results-api";
import { MetricCard } from "@/components/cards/metric-card";
import { ChartCard } from "@/components/charts/chart-card";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { DetailItem } from "@/components/shared/detail-item";
import { FilterBar } from "@/components/shared/filter-bar";
import { OrganizationScopeBanner } from "@/components/shared/organization-scope-banner";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { getChartColor } from "@/lib/constants/chart-colors";
import { formatDate } from "@/lib/formatters";
import { exportRowsToCsv } from "@/lib/utils/export";

export default function ReportCardsPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const resultsQuery = useQuery({
    queryKey: ["report-cards", debouncedSearch],
    queryFn: () => examResultsApi.list({ page: 1, limit: 100, search: debouncedSearch }),
  });

  const selected = useMemo(
    () => (resultsQuery.data?.items ?? []).find((item) => item.id === selectedId) ?? null,
    [resultsQuery.data?.items, selectedId],
  );

  const stats = useMemo(() => {
    const items = resultsQuery.data?.items ?? [];
    const published = items.filter((item) => item.status === "PUBLISHED").length;
    const average = items.length ? items.reduce((sum, item) => sum + item.percentage, 0) / items.length : 0;
    const topGrade = items.filter((item) => item.grade === "A+" || item.grade === "A").length;
    return {
      total: items.length,
      published,
      average: Number(average.toFixed(1)),
      topGrade,
    };
  }, [resultsQuery.data?.items]);

  const exportRows = useMemo(
    () =>
      (resultsQuery.data?.items ?? []).map((item) => ({
        Student: item.studentName,
        Exam: item.examName,
        Batch: item.batchName,
        Percentage: `${item.percentage}%`,
        Grade: item.grade ?? "",
        Status: item.status,
      })),
    [resultsQuery.data?.items],
  );

  const gradeDistribution = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of resultsQuery.data?.items ?? []) {
      const grade = item.grade ?? "N/A";
      counts.set(grade, (counts.get(grade) ?? 0) + 1);
    }

    return Array.from(counts.entries()).map(([grade, total], index) => ({
      grade,
      total,
      fill: getChartColor(index),
    }));
  }, [resultsQuery.data?.items]);

  const resultPerformance = useMemo(
    () =>
      (resultsQuery.data?.items ?? []).slice(0, 8).map((item, index) => ({
        name: item.studentName,
        percentage: item.percentage,
        fill: getChartColor(index),
      })),
    [resultsQuery.data?.items],
  );

  const printSelectedCard = () => {
    if (!selected || typeof window === "undefined") {
      return;
    }

    const rows = selected.items
      .map(
        (item) =>
          `<tr><td style="padding:8px;border:1px solid #ddd;">${item.subjectName}</td><td style="padding:8px;border:1px solid #ddd;">${item.obtainedMarks}</td><td style="padding:8px;border:1px solid #ddd;">${item.totalMarks}</td><td style="padding:8px;border:1px solid #ddd;">${item.passMarks}</td><td style="padding:8px;border:1px solid #ddd;">${item.grade ?? "N/A"}</td></tr>`,
      )
      .join("");

    const popup = window.open("", "_blank", "width=900,height=700");
    if (!popup) {
      toast.error("Print window could not be opened");
      return;
    }

    popup.document.write(`
      <html>
        <head>
          <title>Report Card - ${selected.studentName}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
            h1,h2,p { margin: 0 0 12px; }
            .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin: 16px 0 24px; }
            .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; }
            table { width: 100%; border-collapse: collapse; }
            th { text-align: left; background: #f3f4f6; }
          </style>
        </head>
        <body>
          <h1>Report Card</h1>
          <p>${selected.studentName} · ${selected.examName}</p>
          <div class="grid">
            <div class="card"><strong>Batch</strong><br />${selected.batchName}</div>
            <div class="card"><strong>Percentage</strong><br />${selected.percentage}%</div>
            <div class="card"><strong>Grade</strong><br />${selected.grade ?? "N/A"}</div>
            <div class="card"><strong>Status</strong><br />${selected.status}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="padding:8px;border:1px solid #ddd;">Subject</th>
                <th style="padding:8px;border:1px solid #ddd;">Obtained</th>
                <th style="padding:8px;border:1px solid #ddd;">Total</th>
                <th style="padding:8px;border:1px solid #ddd;">Pass</th>
                <th style="padding:8px;border:1px solid #ddd;">Grade</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `);
    popup.document.close();
    popup.focus();
    popup.print();
  };

  if (resultsQuery.isLoading) return <LoadingState rows={6} />;
  if (resultsQuery.isError || !resultsQuery.data) {
    return <ErrorState description="Report cards could not be loaded." onRetry={() => resultsQuery.refetch()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Academics"
        title="Report cards"
        description="Review student outcomes in a printable report-card style and export academic summaries."
        actions={
          <Button
            variant="outline"
            onClick={() => {
              exportRowsToCsv({ filename: "report-cards", rows: exportRows });
              toast.success("Report cards exported");
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        }
      />
      <OrganizationScopeBanner moduleLabel="Academic operations" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Visible cards" value={String(stats.total)} helper="Academic cards in the current scope" icon={FileBadge2} tone="sky" />
        <MetricCard title="Published cards" value={String(stats.published)} helper="Ready to share finalized outcomes" icon={Printer} tone="emerald" />
        <MetricCard title="Average score" value={`${stats.average}%`} helper="Average result percentage" icon={Trophy} tone="violet" />
        <MetricCard title="Top grades" value={String(stats.topGrade)} helper="A and A+ outcomes in view" icon={FileBadge2} tone="amber" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Grade distribution" description="Overall grade mix across visible report cards.">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={gradeDistribution} dataKey="total" nameKey="grade" outerRadius={110}>
                  {gradeDistribution.map((entry) => (
                    <Cell key={entry.grade} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Recent performance" description="Latest visible percentages across report cards in scope.">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resultPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
                <Bar dataKey="percentage" radius={[10, 10, 0, 0]}>
                  {resultPerformance.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
      <FilterBar search={search} onSearchChange={setSearch} searchPlaceholder="Search by student, exam, or batch..." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {resultsQuery.data.items.map((item) => (
          <div key={item.id} className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold">{item.studentName}</p>
                <p className="text-sm text-muted-foreground">{item.batchName} · {item.examName}</p>
              </div>
              <Badge variant={item.status === "PUBLISHED" ? "success" : "warning"}>{item.status}</Badge>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-xl bg-muted p-3">
                <p className="text-xs text-muted-foreground">Percentage</p>
                <p className="text-base font-semibold">{item.percentage}%</p>
              </div>
              <div className="rounded-xl bg-muted p-3">
                <p className="text-xs text-muted-foreground">Grade</p>
                <p className="text-base font-semibold">{item.grade ?? "N/A"}</p>
              </div>
              <div className="rounded-xl bg-muted p-3">
                <p className="text-xs text-muted-foreground">Published</p>
                <p className="text-base font-semibold">{item.publishedAt ? formatDate(item.publishedAt) : "Draft"}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{item.items.length} subject entries</p>
              <Dialog open={selectedId === item.id} onOpenChange={(nextOpen) => setSelectedId(nextOpen ? item.id : null)}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">View card</Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Report card</DialogTitle>
                    <DialogDescription>{item.studentName} · {item.examName}</DialogDescription>
                  </DialogHeader>
                  {selected ? (
                    <div className="space-y-4">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            exportRowsToCsv({
                              filename: `report-card-${selected.studentName.toLowerCase().replace(/\s+/g, "-")}`,
                              rows: selected.items.map((resultItem) => ({
                                Subject: resultItem.subjectName,
                                Obtained: resultItem.obtainedMarks,
                                Total: resultItem.totalMarks,
                                Pass: resultItem.passMarks,
                                Grade: resultItem.grade ?? "N/A",
                              })),
                            });
                            toast.success("Report card exported");
                          }}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Export card
                        </Button>
                        <Button variant="outline" size="sm" onClick={printSelectedCard}>
                          <Printer className="mr-2 h-4 w-4" />
                          Print card
                        </Button>
                      </div>
                      <div className="grid gap-4 md:grid-cols-4">
                        <DetailItem label="Student" value={selected.studentName} />
                        <DetailItem label="Batch" value={selected.batchName} />
                        <DetailItem label="Percentage" value={`${selected.percentage}%`} />
                        <DetailItem label="Grade" value={selected.grade ?? "N/A"} />
                      </div>
                      <div className="overflow-hidden rounded-2xl border">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/70">
                            <tr>
                              <th className="px-4 py-3 text-left">Subject</th>
                              <th className="px-4 py-3 text-left">Obtained</th>
                              <th className="px-4 py-3 text-left">Total</th>
                              <th className="px-4 py-3 text-left">Pass</th>
                              <th className="px-4 py-3 text-left">Grade</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selected.items.map((resultItem) => (
                              <tr key={resultItem.id} className="border-t">
                                <td className="px-4 py-3">{resultItem.subjectName}</td>
                                <td className="px-4 py-3">{resultItem.obtainedMarks}</td>
                                <td className="px-4 py-3">{resultItem.totalMarks}</td>
                                <td className="px-4 py-3">{resultItem.passMarks}</td>
                                <td className="px-4 py-3">{resultItem.grade ?? "N/A"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : null}
                </DialogContent>
              </Dialog>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
