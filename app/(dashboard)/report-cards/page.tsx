"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, FileBadge2, Printer, Trophy } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChartCard } from "@/components/charts/chart-card";
import { MetricCard } from "@/components/cards/metric-card";
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
import { exportRowsToCsv } from "@/lib/utils/export";
import { reportsApi } from "@/features/reports/api/reports-api";
import type { UnifiedReportCard } from "@/types/domain";

function printSelectedCard(selected: UnifiedReportCard) {
  if (typeof window === "undefined") {
    return;
  }

  const rows = selected.subjectBreakdown
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px;border:1px solid #ddd;">${item.subjectName}</td>
          <td style="padding:8px;border:1px solid #ddd;">${item.examPercentage !== null ? `${item.examPercentage}%` : "—"}</td>
          <td style="padding:8px;border:1px solid #ddd;">${item.assessmentPercentage !== null ? `${item.assessmentPercentage}%` : "—"}</td>
          <td style="padding:8px;border:1px solid #ddd;">${item.assignmentPercentage !== null ? `${item.assignmentPercentage}%` : "—"}</td>
          <td style="padding:8px;border:1px solid #ddd;">${item.combinedPercentage !== null ? `${item.combinedPercentage}%` : "—"}</td>
        </tr>`,
    )
    .join("");

  const popup = window.open("", "_blank", "width=960,height=760");
  if (!popup) {
    toast.error("Print window could not be opened");
    return;
  }

  popup.document.write(`
    <html>
      <head>
        <title>Unified Report Card - ${selected.studentName}</title>
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
        <h1>Unified Report Card</h1>
        <p>${selected.studentName} · ${selected.batchName}</p>
        <div class="grid">
          <div class="card"><strong>Overall</strong><br />${selected.overallPercentage}%</div>
          <div class="card"><strong>Grade</strong><br />${selected.overallGrade}</div>
          <div class="card"><strong>Exams</strong><br />${selected.examPercentage !== null ? `${selected.examPercentage}%` : "—"}</div>
          <div class="card"><strong>Assessments + Assignments</strong><br />${selected.assessmentPercentage !== null || selected.assignmentPercentage !== null ? `${selected.assessmentPercentage ?? 0}% / ${selected.assignmentPercentage ?? 0}%` : "—"}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="padding:8px;border:1px solid #ddd;">Subject</th>
              <th style="padding:8px;border:1px solid #ddd;">Exams</th>
              <th style="padding:8px;border:1px solid #ddd;">Assessments</th>
              <th style="padding:8px;border:1px solid #ddd;">Assignments</th>
              <th style="padding:8px;border:1px solid #ddd;">Combined</th>
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
}

export default function ReportCardsPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const reportCardsQuery = useQuery({
    queryKey: ["report-cards", debouncedSearch],
    queryFn: () => reportsApi.unifiedReportCards({ page: 1, limit: 100, search: debouncedSearch }),
  });

  const selected = useMemo(
    () => (reportCardsQuery.data?.items ?? []).find((item) => item.studentId === selectedId) ?? null,
    [reportCardsQuery.data?.items, selectedId],
  );

  const stats = useMemo(() => {
    const items = reportCardsQuery.data?.items ?? [];
    const average = items.length ? items.reduce((sum, item) => sum + item.overallPercentage, 0) / items.length : 0;
    const topGrade = items.filter((item) => item.overallGrade === "A" || item.overallGrade === "B+").length;
    const withAssignments = items.filter((item) => item.reviewedAssignmentCount > 0).length;
    return {
      total: items.length,
      average: Number(average.toFixed(1)),
      topGrade,
      withAssignments,
    };
  }, [reportCardsQuery.data?.items]);

  const exportRows = useMemo(
    () =>
      (reportCardsQuery.data?.items ?? []).map((item) => ({
        Student: item.studentName,
        Batch: item.batchName,
        Overall: `${item.overallPercentage}%`,
        Grade: item.overallGrade,
        Exams: item.examPercentage !== null ? `${item.examPercentage}%` : "",
        Assessments: item.assessmentPercentage !== null ? `${item.assessmentPercentage}%` : "",
        Assignments: item.assignmentPercentage !== null ? `${item.assignmentPercentage}%` : "",
      })),
    [reportCardsQuery.data?.items],
  );

  const gradeDistribution = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of reportCardsQuery.data?.items ?? []) {
      counts.set(item.overallGrade, (counts.get(item.overallGrade) ?? 0) + 1);
    }

    return Array.from(counts.entries()).map(([grade, total], index) => ({
      grade,
      total,
      fill: getChartColor(index),
    }));
  }, [reportCardsQuery.data?.items]);

  const reportPerformance = useMemo(
    () =>
      (reportCardsQuery.data?.items ?? []).slice(0, 8).map((item, index) => ({
        name: item.studentName,
        percentage: item.overallPercentage,
        fill: getChartColor(index),
      })),
    [reportCardsQuery.data?.items],
  );

  if (reportCardsQuery.isLoading) return <LoadingState rows={6} />;
  if (reportCardsQuery.isError || !reportCardsQuery.data) {
    return <ErrorState description="Unified report cards could not be loaded." onRetry={() => reportCardsQuery.refetch()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Academics"
        title="Unified report cards"
        description="Review a combined academic summary per student across exams, assessments, and assignments."
        actions={
          <Button
            variant="outline"
            onClick={() => {
              exportRowsToCsv({ filename: "unified-report-cards", rows: exportRows });
              toast.success("Unified report cards exported");
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        }
      />
      <OrganizationScopeBanner moduleLabel="Academic operations" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Visible cards" value={String(stats.total)} helper="Students in the current report scope" icon={FileBadge2} tone="sky" />
        <MetricCard title="Average score" value={`${stats.average}%`} helper="Overall academic average across all components" icon={Trophy} tone="violet" />
        <MetricCard title="Strong standing" value={String(stats.topGrade)} helper="Students at A or B+ overall standing" icon={FileBadge2} tone="emerald" />
        <MetricCard title="Assignment-reviewed" value={String(stats.withAssignments)} helper="Students carrying reviewed assignment scores" icon={Printer} tone="amber" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Overall grade distribution" description="Grade mix after combining exams, assessments, and assignments.">
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
        <ChartCard title="Top visible performance" description="Overall percentages for the first visible report cards in scope.">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => [`${value}%`, "Overall"]} />
                <Bar dataKey="percentage" radius={[10, 10, 0, 0]}>
                  {reportPerformance.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
      <FilterBar search={search} onSearchChange={setSearch} searchPlaceholder="Search by student, email, or batch..." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reportCardsQuery.data.items.map((item) => (
          <div key={item.studentId} className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold">{item.studentName}</p>
                <p className="text-sm text-muted-foreground">{item.batchName}</p>
              </div>
              <Badge variant={item.overallPercentage >= 70 ? "success" : item.overallPercentage >= 50 ? "warning" : "danger"}>{item.overallGrade}</Badge>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-xl bg-muted p-3">
                <p className="text-xs text-muted-foreground">Overall</p>
                <p className="text-base font-semibold">{item.overallPercentage}%</p>
              </div>
              <div className="rounded-xl bg-muted p-3">
                <p className="text-xs text-muted-foreground">Exams</p>
                <p className="text-base font-semibold">{item.examPercentage !== null ? `${item.examPercentage}%` : "—"}</p>
              </div>
              <div className="rounded-xl bg-muted p-3">
                <p className="text-xs text-muted-foreground">Assignments</p>
                <p className="text-base font-semibold">{item.assignmentPercentage !== null ? `${item.assignmentPercentage}%` : "—"}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="outline">{item.publishedExamCount} exam results</Badge>
              <Badge variant="outline">{item.finalizedAssessmentCount} assessments</Badge>
              <Badge variant="outline">{item.reviewedAssignmentCount} assignments</Badge>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{item.subjectBreakdown.length} subject summaries</p>
              <Dialog open={selectedId === item.studentId} onOpenChange={(nextOpen) => setSelectedId(nextOpen ? item.studentId : null)}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">View card</Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Unified report card</DialogTitle>
                    <DialogDescription>{item.studentName} · {item.batchName}</DialogDescription>
                  </DialogHeader>
                  {selected ? (
                    <div className="space-y-4">
                      <div className="grid gap-3 md:grid-cols-4">
                        <DetailItem label="Overall score" value={`${selected.overallPercentage}%`} />
                        <DetailItem label="Grade" value={selected.overallGrade} />
                        <DetailItem label="Exams" value={selected.examPercentage !== null ? `${selected.examPercentage}%` : "—"} />
                        <DetailItem label="Assessments" value={selected.assessmentPercentage !== null ? `${selected.assessmentPercentage}%` : "—"} />
                      </div>
                      <div className="grid gap-3 md:grid-cols-3">
                        <DetailItem label="Assignments" value={selected.assignmentPercentage !== null ? `${selected.assignmentPercentage}%` : "—"} />
                        <DetailItem label="Batch" value={selected.batchName} />
                        <DetailItem label="Subject coverage" value={String(selected.subjectBreakdown.length)} />
                      </div>
                      <div className="overflow-hidden rounded-2xl border">
                        <table className="min-w-full divide-y divide-border text-sm">
                          <thead className="bg-muted/60">
                            <tr>
                              <th className="px-4 py-3 text-left font-medium">Subject</th>
                              <th className="px-4 py-3 text-left font-medium">Exams</th>
                              <th className="px-4 py-3 text-left font-medium">Assessments</th>
                              <th className="px-4 py-3 text-left font-medium">Assignments</th>
                              <th className="px-4 py-3 text-left font-medium">Combined</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {selected.subjectBreakdown.map((subject) => (
                              <tr key={subject.subjectId}>
                                <td className="px-4 py-3">
                                  <div>
                                    <p className="font-medium">{subject.subjectName}</p>
                                    <p className="text-xs text-muted-foreground">{subject.subjectCode}</p>
                                  </div>
                                </td>
                                <td className="px-4 py-3">{subject.examPercentage !== null ? `${subject.examPercentage}%` : "—"}</td>
                                <td className="px-4 py-3">{subject.assessmentPercentage !== null ? `${subject.assessmentPercentage}%` : "—"}</td>
                                <td className="px-4 py-3">{subject.assignmentPercentage !== null ? `${subject.assignmentPercentage}%` : "—"}</td>
                                <td className="px-4 py-3 font-medium">{subject.combinedPercentage !== null ? `${subject.combinedPercentage}%` : "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex justify-end">
                        <Button variant="outline" onClick={() => printSelectedCard(selected)}>
                          <Printer className="mr-2 h-4 w-4" />
                          Print card
                        </Button>
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
