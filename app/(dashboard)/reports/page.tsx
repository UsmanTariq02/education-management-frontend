"use client";

import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, AreaChart, Area } from "recharts";
import { reportsApi } from "@/features/reports/api/reports-api";
import { ChartCard } from "@/components/charts/chart-card";
import { MetricCard } from "@/components/cards/metric-card";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { metricCardData } from "@/lib/utils/dashboard";
import { getChartColor } from "@/lib/constants/chart-colors";

export default function ReportsPage() {
  const summaryQuery = useQuery({ queryKey: ["reports", "summary", "page"], queryFn: reportsApi.summary });
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

  if (summaryQuery.isLoading) return <LoadingState rows={6} />;
  if (summaryQuery.isError || !summaryQuery.data) return <ErrorState description="Reports summary could not be loaded." />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Analytics"
        title="Reports and analytics"
        description="Combined operational analytics across students, fees, attendance, and reminder-driven workflows."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCardData(summaryQuery.data).map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
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
    </div>
  );
}
