"use client";
import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Banknote, BookOpenCheck, CalendarDays, CircleAlert, ClipboardCheck, Clock3, Landmark, Presentation, Video } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar, Line, LineChart, CartesianGrid, Area, AreaChart, RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend } from "recharts";
import { reportsApi } from "@/features/reports/api/reports-api";
import { activityLogsApi } from "@/features/activity-logs/api/activity-logs-api";
import { onlineClassesApi } from "@/features/online-classes/api/online-classes-api";
import { organizationsApi } from "@/features/organizations/api/organizations-api";
import { usersApi } from "@/features/users/api/users-api";
import { batchesApi } from "@/features/batches/api/batches-api";
import { academicSessionsApi } from "@/features/academic-sessions/api/academic-sessions-api";
import { teachersApi } from "@/features/teachers/api/teachers-api";
import { timetablesApi } from "@/features/timetables/api/timetables-api";
import { batchSubjectAssignmentsApi } from "@/features/batch-subject-assignments/api/batch-subject-assignments-api";
import { examsApi } from "@/features/exams/api/exams-api";
import { examResultsApi } from "@/features/exam-results/api/exam-results-api";
import { feesApi } from "@/features/fees/api/fees-api";
import { usePermission } from "@/hooks/use-permission";
import { useAuth } from "@/providers/auth-provider";
import { metricCardData } from "@/lib/utils/dashboard";
import { ChartCard } from "@/components/charts/chart-card";
import { HeatmapGrid } from "@/components/charts/heatmap-grid";
import { MetricCard } from "@/components/cards/metric-card";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { getChartColor } from "@/lib/constants/chart-colors";
import { Skeleton } from "@/components/ui/skeleton";
import { hasModule } from "@/lib/permissions/access";

export default function DashboardPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.roles.includes("SUPER_ADMIN") ?? false;
  const isTeacher = user?.roles.includes("TEACHER") ?? false;
  const canReadActivityLogs = usePermission("activity-logs.read");
  const canReadOnlineClasses = usePermission("online-classes.read");
  const canReadTeachers = usePermission("teachers.read");
  const canReadUsers = usePermission("users.read");
  const canReadStudents = usePermission("students.read");
  const canReadBatches = usePermission("batches.read");
  const canReadAcademicSessions = usePermission("academic-sessions.read");
  const canReadFeePlans = usePermission("fees.read");
  const canReadTimetables = usePermission("timetables.read");
  const canReadAssignments = usePermission("batch-subject-assignments.read");
  const canReadExams = usePermission("exams.read");
  const canReadExamResults = usePermission("exam-results.read");
  const isTeacherWorkspace = isTeacher && !isSuperAdmin;
  const canViewTenantSettings = Boolean(user?.roles.includes("ADMIN")) && hasModule(user, "SETTINGS");
  const summaryQuery = useQuery({ queryKey: ["reports", "summary"], queryFn: reportsApi.summary, enabled: !isTeacherWorkspace });
  const shouldLoadSecondaryCharts = !isTeacherWorkspace && Boolean(summaryQuery.data);
  const currentSettingsQuery = useQuery({
    queryKey: ["organization-settings", "dashboard-banner"],
    queryFn: organizationsApi.currentSettings,
    enabled: !isTeacherWorkspace && canViewTenantSettings,
  });
  const feeCollectionOverviewQuery = useQuery({
    queryKey: ["reports", "fees", "collection-overview", "dashboard"],
    queryFn: reportsApi.feeCollectionOverview,
    enabled: shouldLoadSecondaryCharts,
  });
  const feePeriodComparisonQuery = useQuery({
    queryKey: ["reports", "fees", "period-comparison", "dashboard"],
    queryFn: reportsApi.feePeriodComparison,
    enabled: shouldLoadSecondaryCharts,
  });
  const feeTrendQuery = useQuery({
    queryKey: ["reports", "fees", "collection-trend"],
    queryFn: reportsApi.feeCollectionTrend,
    enabled: shouldLoadSecondaryCharts,
  });
  const attendanceBreakdownQuery = useQuery({
    queryKey: ["reports", "attendance", "status-breakdown"],
    queryFn: reportsApi.attendanceStatusBreakdown,
    enabled: shouldLoadSecondaryCharts,
  });
  const reminderBreakdownQuery = useQuery({
    queryKey: ["reports", "reminders", "channel-breakdown"],
    queryFn: reportsApi.reminderChannelBreakdown,
    enabled: shouldLoadSecondaryCharts,
  });
  const feeStatusQuery = useQuery({
    queryKey: ["reports", "fees", "status-breakdown"],
    queryFn: reportsApi.feeStatusBreakdown,
    enabled: shouldLoadSecondaryCharts,
  });
  const academicSummaryQuery = useQuery({
    queryKey: ["reports", "academics", "summary", "dashboard"],
    queryFn: reportsApi.academicSummary,
    enabled: isSuperAdmin && shouldLoadSecondaryCharts,
  });
  const userRoleDistributionQuery = useQuery({
    queryKey: ["reports", "users", "role-distribution", "dashboard"],
    queryFn: reportsApi.userRoleDistribution,
    enabled: isSuperAdmin && shouldLoadSecondaryCharts,
  });
  const userStatusSummaryQuery = useQuery({
    queryKey: ["reports", "users", "status-summary", "dashboard"],
    queryFn: reportsApi.userStatusSummary,
    enabled: isSuperAdmin && shouldLoadSecondaryCharts,
  });
  const batchStatusSummaryQuery = useQuery({
    queryKey: ["reports", "batches", "status-summary", "dashboard"],
    queryFn: reportsApi.batchStatusSummary,
    enabled: isSuperAdmin && shouldLoadSecondaryCharts,
  });
  const resultStatusSummaryQuery = useQuery({
    queryKey: ["reports", "academics", "result-status", "dashboard"],
    queryFn: reportsApi.resultStatusSummary,
    enabled: isSuperAdmin && shouldLoadSecondaryCharts,
  });
  const enrollmentTrendQuery = useQuery({
    queryKey: ["reports", "students", "enrollment-trend", "dashboard"],
    queryFn: reportsApi.enrollmentTrend,
    enabled: shouldLoadSecondaryCharts,
  });
  const activityLogsQuery = useQuery({
    queryKey: ["activity-logs", "dashboard"],
    queryFn: () => activityLogsApi.list({ page: 1, limit: 5, sortBy: "createdAt", sortOrder: "desc" }),
    enabled: canReadActivityLogs && shouldLoadSecondaryCharts,
  });
  const onlineClassesSummaryQuery = useQuery({
    queryKey: ["online-classes", "automation-summary", "dashboard"],
    queryFn: onlineClassesApi.getAutomationSummary,
    enabled: canReadOnlineClasses && (shouldLoadSecondaryCharts || isTeacherWorkspace),
  });
  const organizationsQuery = useQuery({
    queryKey: ["organizations", "dashboard-growth"],
    queryFn: () => organizationsApi.list({ page: 1, limit: 100 }),
    enabled: isSuperAdmin && shouldLoadSecondaryCharts,
  });
  const teacherProfileQuery = useQuery({
    queryKey: ["teachers", "self-profile", user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const result = await teachersApi.list({ page: 1, limit: 100, search: user.email });
      return result.items.find((item) => item.email?.toLowerCase() === user.email.toLowerCase()) ?? null;
    },
    enabled: isTeacherWorkspace && canReadTeachers && Boolean(user?.email),
  });
  const teacherTimetablesQuery = useQuery({
    queryKey: ["timetables", "teacher-workspace"],
    queryFn: () => timetablesApi.list({ page: 1, limit: 100 }),
    enabled: isTeacherWorkspace && canReadTimetables,
  });
  const teacherAssignmentsQuery = useQuery({
    queryKey: ["batch-subject-assignments", "teacher-workspace"],
    queryFn: () => batchSubjectAssignmentsApi.list({ page: 1, limit: 100 }),
    enabled: isTeacherWorkspace && canReadAssignments,
  });
  const teacherExamsQuery = useQuery({
    queryKey: ["exams", "teacher-workspace"],
    queryFn: () => examsApi.list({ page: 1, limit: 100 }),
    enabled: isTeacherWorkspace && canReadExams,
  });
  const teacherExamResultsQuery = useQuery({
    queryKey: ["exam-results", "teacher-workspace"],
    queryFn: () => examResultsApi.list({ page: 1, limit: 100 }),
    enabled: isTeacherWorkspace && canReadExamResults,
  });
  const academicSessionsReadyQuery = useQuery({
    queryKey: ["academic-sessions", "dashboard-checklist"],
    queryFn: () => academicSessionsApi.list({ page: 1, limit: 1 }),
    enabled: !isTeacherWorkspace && !isSuperAdmin && canReadAcademicSessions && Boolean(summaryQuery.data),
  });
  const usersReadyQuery = useQuery({
    queryKey: ["users", "dashboard-checklist"],
    queryFn: () => usersApi.list({ page: 1, limit: 1 }),
    enabled: !isTeacherWorkspace && !isSuperAdmin && canReadUsers && Boolean(summaryQuery.data),
  });
  const batchesReadyQuery = useQuery({
    queryKey: ["batches", "dashboard-checklist"],
    queryFn: () => batchesApi.list({ page: 1, limit: 1 }),
    enabled: !isTeacherWorkspace && !isSuperAdmin && canReadBatches && Boolean(summaryQuery.data),
  });
  const feePlansReadyQuery = useQuery({
    queryKey: ["fees", "plans", "dashboard-checklist"],
    queryFn: () => feesApi.listPlans({ page: 1, limit: 1 }),
    enabled: !isTeacherWorkspace && !isSuperAdmin && canReadFeePlans && Boolean(summaryQuery.data),
  });
  const feeOverview = feeCollectionOverviewQuery.data;

  if (!isTeacherWorkspace && summaryQuery.isError) {
    return <ErrorState description="Dashboard summary could not be loaded from the reports API." onRetry={() => summaryQuery.refetch()} />;
  }

  const teacherProfile = teacherProfileQuery.data;
  const teacherTimetableItems = useMemo(() => {
    const teacherId = teacherProfile?.id;
    if (!teacherId) return [];
    return (teacherTimetablesQuery.data?.items ?? []).filter((item) => item.teacherId === teacherId);
  }, [teacherProfile?.id, teacherTimetablesQuery.data?.items]);
  const teacherAssignmentItems = useMemo(() => {
    const teacherId = teacherProfile?.id;
    if (!teacherId) return [];
    return (teacherAssignmentsQuery.data?.items ?? []).filter((item) => item.teacherId === teacherId);
  }, [teacherAssignmentsQuery.data?.items, teacherProfile?.id]);
  const teacherExamItems = useMemo(() => {
    const teacherId = teacherProfile?.id;
    if (!teacherId) return [];
    return (teacherExamsQuery.data?.items ?? []).filter((item) => item.teacherId === teacherId);
  }, [teacherExamsQuery.data?.items, teacherProfile?.id]);
  const teacherExamResults = useMemo(() => {
    const teacherExamIds = new Set(teacherExamItems.map((item) => item.id));
    return (teacherExamResultsQuery.data?.items ?? []).filter((item) => teacherExamIds.has(item.examId));
  }, [teacherExamItems, teacherExamResultsQuery.data?.items]);
  const teacherTodayClasses = useMemo(() => {
    const currentDay = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date()).toUpperCase();
    return teacherTimetableItems
      .filter((item) => item.dayOfWeek === currentDay)
      .slice()
      .sort((left, right) => left.startTime.localeCompare(right.startTime));
  }, [teacherTimetableItems]);
  const teacherBatchLoad = useMemo(
    () =>
      teacherAssignmentItems.map((item) => ({
        name: item.batchCode,
        classes: item.weeklyClasses,
      })),
    [teacherAssignmentItems],
  );
  const teacherSubjectCoverage = useMemo(
    () =>
      teacherAssignmentItems.map((item) => ({
        metric: item.subjectCode,
        value: item.weeklyClasses,
      })),
    [teacherAssignmentItems],
  );
  const teacherExamStatus = useMemo(
    () => [
      { name: "Published", value: teacherExamItems.filter((item) => item.isPublished).length },
      { name: "Draft", value: teacherExamItems.filter((item) => !item.isPublished).length },
    ].filter((item) => item.value > 0),
    [teacherExamItems],
  );
  const teacherResultSnapshot = useMemo(() => {
    const totalResults = teacherExamResults.length;
    const publishedResults = teacherExamResults.filter((item) => item.status === "PUBLISHED").length;
    const averagePercentage = totalResults
      ? Math.round(teacherExamResults.reduce((sum, item) => sum + item.percentage, 0) / totalResults)
      : 0;
    const batches = new Set(teacherAssignmentItems.map((item) => item.batchId)).size;
    return { totalResults, publishedResults, averagePercentage, batches };
  }, [teacherAssignmentItems, teacherExamResults]);
  const teacherQuickLinks = [
    { href: "/attendance", label: "Mark attendance", helper: "Update today’s classroom attendance." },
    { href: "/exam-results", label: "Enter results", helper: "Publish marks against your exams." },
    { href: "/online-classes", label: "Open online classes", helper: "Launch, sync, or review class occurrences." },
    { href: "/timetables", label: "Review timetable", helper: "Check your weekly teaching schedule." },
  ];

  const adminPulse = useMemo(() => {
    if (!isSuperAdmin) {
      return null;
    }

    const userStatuses = userStatusSummaryQuery.data ?? [];
    const batchStatuses = batchStatusSummaryQuery.data ?? [];
    const resultStatuses = resultStatusSummaryQuery.data ?? [];
    const roleDistribution = (userRoleDistributionQuery.data ?? []).slice().sort((left, right) => right.total - left.total);

    return {
      activeUsers: userStatuses.find((item) => item.status === "ACTIVE")?.total ?? 0,
      inactiveUsers: userStatuses.find((item) => item.status === "INACTIVE")?.total ?? 0,
      activeBatches: batchStatuses.find((item) => item.status === "ACTIVE")?.total ?? 0,
      inactiveBatches: batchStatuses.find((item) => item.status === "INACTIVE")?.total ?? 0,
      publishedExams: academicSummaryQuery.data?.publishedExams ?? 0,
      finalizedResults: academicSummaryQuery.data?.publishedResults ?? resultStatuses.find((item) => item.status === "FINALIZED")?.total ?? 0,
      averagePercentage: academicSummaryQuery.data?.averagePercentage ?? 0,
      topRole: roleDistribution[0] ?? null,
    };
  }, [
    academicSummaryQuery.data,
    batchStatusSummaryQuery.data,
    isSuperAdmin,
    resultStatusSummaryQuery.data,
    userRoleDistributionQuery.data,
    userStatusSummaryQuery.data,
  ]);

  const tenantHealthBanner = useMemo(() => {
    if (!currentSettingsQuery.data || isSuperAdmin) {
      return null;
    }

    const organization = currentSettingsQuery.data;
    const trialExpired =
      organization.subscriptionStatus === "TRIAL" &&
      organization.trialEndsAt !== null &&
      new Date(organization.trialEndsAt).getTime() <= Date.now();
    const trialExpiringSoon =
      organization.subscriptionStatus === "TRIAL" &&
      organization.trialEndsAt !== null &&
      !trialExpired &&
      new Date(organization.trialEndsAt).getTime() - Date.now() <= 7 * 24 * 60 * 60 * 1000;

    if (!trialExpired && !trialExpiringSoon && organization.subscriptionStatus === "ACTIVE") {
      return null;
    }

    const label = trialExpired
      ? "Trial expired"
      : trialExpiringSoon
        ? "Trial ending soon"
        : organization.subscriptionStatus.replaceAll("_", " ");

    const description = trialExpired
      ? "The current trial period has ended. Access is now limited until the subscription state is restored."
      : trialExpiringSoon
        ? `The trial ends on ${formatDate(organization.trialEndsAt as string, "MMM d, yyyy")}. Review billing and module readiness now.`
        : organization.subscriptionStatus === "PAST_DUE"
          ? "The organization is past due. Update billing to restore normal operations."
          : "The subscription requires attention before the workspace is blocked.";

    return {
      label,
      description,
      tone: trialExpired || organization.subscriptionStatus === "PAST_DUE" || organization.subscriptionStatus === "SUSPENDED" ? ("rose" as const) : ("amber" as const),
    };
  }, [currentSettingsQuery.data, isSuperAdmin]);

  const setupChecklist = useMemo(() => {
    if (!summaryQuery.data && !isSuperAdmin && !isTeacherWorkspace) {
      return [];
    }

    const items: Array<{
      label: string;
      description: string;
      href: string;
      done: boolean;
    }> = [];

    if (isSuperAdmin) {
      items.push(
        {
          label: "Onboard an organization",
          description: "Create the tenant boundary before assigning staff and students.",
          href: "/organizations",
          done: (organizationsQuery.data?.total ?? 0) > 0,
        },
        {
          label: "Review roles and permissions",
          description: "Keep role templates aligned with your deployment model.",
          href: "/roles",
          done: false,
        },
        {
          label: "Inspect live inquiries",
          description: "Track incoming leads and support requests from the platform inbox.",
          href: "/inquiries",
          done: false,
        },
      );
      return items;
    }

    if (isTeacherWorkspace) {
      items.push(
        {
          label: "Link your teacher profile",
          description: "Make sure the login is mapped to a teacher record for workload visibility.",
          href: "/teachers",
          done: Boolean(teacherProfile),
        },
        {
          label: "Check your timetable",
          description: "Confirm today's classes and upcoming schedule blocks.",
          href: "/timetables",
          done: teacherTodayClasses.length > 0,
        },
        {
          label: "Review result entries",
          description: "Publish or update the exams you manage.",
          href: "/exam-results",
          done: teacherResultSnapshot.totalResults > 0,
        },
      );
      return items;
    }

    const summary = summaryQuery.data;
    if (!summary) return items;

    const isAdminOrCoordinator = user?.roles.includes("ADMIN") || user?.roles.includes("ACADEMIC_COORDINATOR");
    const hasUsers = (usersReadyQuery.data?.total ?? 0) > 0;
    const hasStudents = summary.totalStudents > 0;
    const hasBatches = (batchesReadyQuery.data?.total ?? 0) > 0;
    const hasSessions = (academicSessionsReadyQuery.data?.total ?? 0) > 0;
    const hasFeePlans = (feePlansReadyQuery.data?.total ?? 0) > 0;

    if (isAdminOrCoordinator) {
      if (canReadUsers) {
        items.push({
          label: "Add staff accounts",
          description: "Create users for admins, coordinators, and office staff.",
          href: "/users",
          done: hasUsers,
        });
      }
      if (canReadStudents) {
        items.push({
          label: "Register students",
          description: "Capture admissions and guardian details before portal provisioning.",
          href: "/students",
          done: hasStudents,
        });
      }
      if (canReadBatches) {
        items.push({
          label: "Build batch structure",
          description: "Groups must exist before attendance, timetable, and exams are productive.",
          href: "/batches",
          done: hasBatches,
        });
      }
      if (canReadFeePlans) {
        items.push({
          label: "Publish fee plans",
          description: "Set up the billing plan before collecting or reconciling fees.",
          href: "/fee-plans",
          done: hasFeePlans,
        });
      }
      if (canReadAcademicSessions) {
        items.push({
          label: "Define academic years / terms",
          description: "Periods keep timetable, exams, and reports organized.",
          href: "/academic-sessions",
          done: hasSessions,
        });
      }
    }

    return items.slice(0, 5);
  }, [
    academicSessionsReadyQuery.data?.total,
    feePlansReadyQuery.data?.total,
    batchesReadyQuery.data?.total,
    usersReadyQuery.data?.total,
    isSuperAdmin,
    isTeacherWorkspace,
    canReadAcademicSessions,
    canReadBatches,
    canReadFeePlans,
    canReadStudents,
    canReadUsers,
    organizationsQuery.data?.total,
    summaryQuery.data,
    teacherProfile,
    teacherResultSnapshot.totalResults,
    teacherTodayClasses.length,
    user?.roles,
  ]);
  const setupCompleteCount = setupChecklist.filter((item) => item.done).length;
  const setupCompletionRate = setupChecklist.length ? Math.round((setupCompleteCount / setupChecklist.length) * 100) : 0;
  const nextSetupItem = setupChecklist.find((item) => !item.done) ?? setupChecklist[0] ?? null;

  if (isTeacherWorkspace) {
    const teacherQueries = [teacherProfileQuery, teacherTimetablesQuery, teacherAssignmentsQuery, teacherExamsQuery, teacherExamResultsQuery];
    if (teacherQueries.some((query) => query.isLoading)) {
      return <LoadingState rows={6} />;
    }
    if (teacherProfileQuery.isError || teacherTimetablesQuery.isError || teacherAssignmentsQuery.isError || teacherExamsQuery.isError || teacherExamResultsQuery.isError) {
      return <ErrorState description="Teacher workspace could not be prepared from timetable, exam, and online class data." onRetry={() => {
        teacherProfileQuery.refetch();
        teacherTimetablesQuery.refetch();
        teacherAssignmentsQuery.refetch();
        teacherExamsQuery.refetch();
        teacherExamResultsQuery.refetch();
        onlineClassesSummaryQuery.refetch();
      }} />;
    }

    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Teacher Workspace"
          title={`Welcome back, ${user?.firstName ?? "Teacher"}`}
          description="Your classes, timetable, exam workload, and online teaching queue in one teacher-focused view."
        />

        {teacherProfile ? (
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Teacher profile</p>
                <p className="mt-1 text-xl font-semibold">{teacherProfile.fullName}</p>
                <p className="text-sm text-muted-foreground">
                  {teacherProfile.specialization ?? "General instruction"} · Employee ID {teacherProfile.employeeId}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{teacherProfile.isActive ? "Active" : "Inactive"}</Badge>
                <Badge variant="outline">{teacherProfile.qualification ?? "Qualification pending"}</Badge>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <EmptyState
              title="Teacher profile not linked"
              description="This login is not matched to a teacher record yet. Create or link the teacher profile to unlock full workload insights."
            />
            {canReadTeachers ? (
              <div className="flex justify-center">
                <Button asChild>
                  <Link href="/teachers">Open teachers</Link>
                </Button>
              </div>
            ) : null}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Today's classes" value={String(teacherTodayClasses.length)} helper="Scheduled classes for today" icon={Presentation} tone="sky" />
          <MetricCard title="Assigned batches" value={String(teacherResultSnapshot.batches)} helper="Distinct batches currently mapped to you" icon={BookOpenCheck} tone="emerald" />
          <MetricCard title="Managed exams" value={String(teacherExamItems.length)} helper={`${teacherExamStatus.find((item) => item.name === "Published")?.value ?? 0} already published`} icon={ClipboardCheck} tone="violet" />
          <MetricCard title="Online classes" value={String(onlineClassesSummaryQuery.data?.upcomingSessions.length ?? 0)} helper="Upcoming live or scheduled classes" icon={Video} tone="amber" />
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Today's schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {teacherTodayClasses.length ? (
                teacherTodayClasses.map((entry) => (
                  <div key={entry.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm">
                    <div>
                      <p className="font-medium">{entry.subjectName} · {entry.batchName}</p>
                      <p className="text-sm text-muted-foreground">{entry.startTime} - {entry.endTime}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.deliveryMode === "ONLINE" ? `${entry.onlineClassProvider ?? "Online"} class` : entry.room ?? "Room pending"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/timetables">Full timetable</Link>
                      </Button>
                      {entry.deliveryMode === "ONLINE" ? (
                        <Button size="sm" asChild>
                          <Link href="/online-classes">Open online classes</Link>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState title="No classes today" description="Your timetable is clear for today." />
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Action queue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {teacherQuickLinks.map((item) => (
                <div key={item.href} className="rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm">
                  <p className="font-medium">{item.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.helper}</p>
                  <Button variant="outline" size="sm" className="mt-3" asChild>
                    <Link href={item.href}>Open</Link>
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <ChartCard title="Batch teaching load" description="Weekly planned classes by batch, based on subject assignments.">
            {teacherBatchLoad.length ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teacherBatchLoad}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="classes" radius={[8, 8, 0, 0]}>
                      {teacherBatchLoad.map((item, index) => (
                        <Cell key={item.name} fill={getChartColor(index)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState title="No teaching load yet" description="Subject assignments have not been mapped to this teacher yet." />
            )}
          </ChartCard>
          <ChartCard title="Subject coverage radar" description="Weekly teaching intensity across your assigned subjects.">
            {teacherSubjectCoverage.length ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={teacherSubjectCoverage}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <Radar dataKey="value" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.35} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState title="No assigned subjects" description="Your subject coverage will appear here once the coordinator maps subjects to you." />
            )}
          </ChartCard>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <ChartCard title="Exam publication status" description="Your managed exams split by draft and published state.">
            {teacherExamStatus.length ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={teacherExamStatus} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95}>
                      {teacherExamStatus.map((item, index) => (
                        <Cell key={item.name} fill={getChartColor(index)} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState title="No exams yet" description="Assigned exams will appear here once the academic team schedules them under your name." />
            )}
          </ChartCard>
          <Card>
            <CardHeader>
              <CardTitle>Result workload</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm">
                <p className="font-medium">Results prepared</p>
                <p className="mt-1 text-muted-foreground">{teacherResultSnapshot.totalResults}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm">
                <p className="font-medium">Published results</p>
                <p className="mt-1 text-muted-foreground">{teacherResultSnapshot.publishedResults}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm">
                <p className="font-medium">Average learner score</p>
                <p className="mt-1 text-muted-foreground">{teacherResultSnapshot.averagePercentage}%</p>
              </div>
              <Button className="w-full" variant="outline" asChild>
                <Link href="/exam-results">Review results</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>My online classes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {onlineClassesSummaryQuery.data?.upcomingSessions.length ? (
                onlineClassesSummaryQuery.data.upcomingSessions.slice(0, 3).map((session) => (
                  <div key={session.id} className="rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm">
                    <p className="font-medium">{session.subjectName} · {session.batchCode}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{formatDate(session.scheduledStartAt, "MMM d, yyyy p")}</p>
                    <div className="mt-3 flex gap-2">
                      {session.meetingUrl ? (
                        <Button size="sm" variant="outline" asChild>
                          <a href={session.meetingUrl} target="_blank" rel="noreferrer">Join</a>
                        </Button>
                      ) : null}
                      <Button size="sm" asChild>
                        <Link href="/online-classes">Manage</Link>
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState title="No online classes queued" description="Your next online sessions will appear here." />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const metrics = summaryQuery.data ? metricCardData(summaryQuery.data) : [];
  const feeComparison = feePeriodComparisonQuery.data ?? [];
  const toTrend = (currentValue: number, previousValue: number): number | undefined => {
    if (previousValue <= 0) {
      return currentValue > 0 ? 100 : undefined;
    }

    return Math.round(((currentValue - previousValue) / previousValue) * 100);
  };
  const collectionMetrics = feeOverview
    ? [
        {
          title: "Month collected",
          value: formatCurrency(feeOverview.currentMonth.collected),
          helper: `${formatCurrency(feeOverview.currentMonth.pending)} pending this month`,
          trend: toTrend(
            feeComparison.find((item) => item.period === "MONTH")?.currentCollected ?? 0,
            feeComparison.find((item) => item.period === "MONTH")?.previousCollected ?? 0,
          ),
          icon: CalendarDays,
          tone: "sky" as const,
        },
        {
          title: "Quarter collected",
          value: formatCurrency(feeOverview.currentQuarter.collected),
          helper: `${feeOverview.currentQuarter.collectionRate}% of billed value collected`,
          trend: toTrend(
            feeComparison.find((item) => item.period === "QUARTER")?.currentCollected ?? 0,
            feeComparison.find((item) => item.period === "QUARTER")?.previousCollected ?? 0,
          ),
          icon: Landmark,
          tone: "emerald" as const,
        },
        {
          title: "Year collected",
          value: formatCurrency(feeOverview.currentYear.collected),
          helper: `${formatCurrency(feeOverview.currentYear.pending)} still open this year`,
          trend: toTrend(
            feeComparison.find((item) => item.period === "YEAR")?.currentCollected ?? 0,
            feeComparison.find((item) => item.period === "YEAR")?.previousCollected ?? 0,
          ),
          icon: Banknote,
          tone: "violet" as const,
        },
        {
          title: "Overdue amount",
          value: formatCurrency(feeOverview.currentMonth.overdue),
          helper: "Current month exposure already past due",
          icon: CircleAlert,
          tone: "rose" as const,
        },
      ]
    : [];
  const operationsRadar = useMemo(() => {
    if (!summaryQuery.data) return [];
    const reminderTotal = (reminderBreakdownQuery.data ?? []).reduce((sum, item) => sum + item.count, 0);
    const attendanceTotal = (attendanceBreakdownQuery.data ?? []).reduce((sum, item) => sum + item.total, 0);
    const collectionRate = feeOverview?.currentMonth.collectionRate ?? 0;

    return [
      { metric: "Students", value: summaryQuery.data.totalStudents },
      { metric: "Active", value: summaryQuery.data.activeStudents },
      { metric: "Attendance", value: attendanceTotal },
      { metric: "Reminders", value: reminderTotal },
      { metric: "Collection", value: collectionRate },
    ];
  }, [attendanceBreakdownQuery.data, feeOverview, reminderBreakdownQuery.data, summaryQuery.data]);
  const enrollmentHeatmap = useMemo(
    () =>
      (enrollmentTrendQuery.data ?? []).map((entry) => ({
        label: entry.month,
        value: entry.count,
        hint: `${entry.count} admissions`,
      })),
    [enrollmentTrendQuery.data],
  );
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
  const tenantInsights = useMemo(() => {
    const items = organizationsQuery.data?.items ?? [];
    const activeOrganizations = items.filter((item) => item.isActive).length;
    const totalStudents = items.reduce((sum, item) => sum + item.totalStudents, 0);
    const avgStudents = items.length ? Math.round(totalStudents / items.length) : 0;
    const moduleAdoption = new Map<string, number>();
    for (const organization of items) {
      for (const moduleName of organization.enabledModules) {
        moduleAdoption.set(moduleName, (moduleAdoption.get(moduleName) ?? 0) + 1);
      }
    }
    const topModules = Array.from(moduleAdoption.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 5)
      .map(([moduleName, count]) => ({ moduleName, count }));
    const subscriptionMix = [
      { name: "Trial", value: items.filter((item) => item.subscriptionStatus === "TRIAL").length },
      { name: "Active", value: items.filter((item) => item.subscriptionStatus === "ACTIVE").length },
      { name: "Past due", value: items.filter((item) => item.subscriptionStatus === "PAST_DUE").length },
      { name: "Suspended", value: items.filter((item) => item.subscriptionStatus === "SUSPENDED").length },
      { name: "Cancelled", value: items.filter((item) => item.subscriptionStatus === "CANCELLED").length },
    ].filter((item) => item.value > 0);
    const expiringTrials = items
      .filter((item) => item.subscriptionStatus === "TRIAL" && item.trialEndsAt)
      .filter((item) => {
        const diff = new Date(item.trialEndsAt as string).getTime() - Date.now();
        return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
      })
      .sort((left, right) => new Date(left.trialEndsAt as string).getTime() - new Date(right.trialEndsAt as string).getTime())
      .slice(0, 5);
    return { activeOrganizations, avgStudents, topModules, subscriptionMix, expiringTrials };
  }, [organizationsQuery.data]);
  const adminRoleDistribution = userRoleDistributionQuery.data ?? [];
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

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Overview"
        title="Operational dashboard"
        description="Fee collection, pending dues, attendance, reminders, and recent operational activity drawn from the live backend contract."
      />

      {tenantHealthBanner ? (
        <Card className={tenantHealthBanner.tone === "rose" ? "border-rose-200 bg-rose-50/70" : "border-amber-200 bg-amber-50/70"}>
          <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
            <div className="space-y-1">
              <Badge variant={tenantHealthBanner.tone === "rose" ? "danger" : "warning"}>{tenantHealthBanner.label}</Badge>
              <p className="text-sm text-muted-foreground">{tenantHealthBanner.description}</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/settings">Open settings</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {setupChecklist.length ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
            <div>
              <CardTitle>Onboarding tracker</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Track workspace readiness by role and move directly to the next missing setup step.
              </p>
            </div>
            <Badge variant={setupCompletionRate === 100 ? "success" : "outline"}>{setupCompletionRate}% complete</Badge>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-2xl border bg-muted/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Workspace readiness</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {setupCompleteCount} of {setupChecklist.length} setup steps are complete.
                    </p>
                  </div>
                  <Badge variant={setupCompletionRate === 100 ? "success" : setupCompletionRate >= 50 ? "warning" : "secondary"}>
                    {setupCompletionRate >= 50 ? "Healthy" : "Needs setup"}
                  </Badge>
                </div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-gradient-to-r from-sky-500 via-emerald-500 to-violet-500" style={{ width: `${setupCompletionRate}%` }} />
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
                  <p className="text-muted-foreground">
                    {nextSetupItem ? `Next step: ${nextSetupItem.label}` : "Everything is set up."}
                  </p>
                  {nextSetupItem ? (
                    <Button asChild size="sm" variant="outline">
                      <Link href={nextSetupItem.href}>{nextSetupItem.done ? "Review" : "Open next step"}</Link>
                    </Button>
                  ) : null}
                </div>
              </div>
              <div className="grid gap-3">
                <div className="rounded-2xl border bg-muted/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Completed</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight">{setupCompleteCount}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Steps already finished and ready for review.</p>
                </div>
                <div className="rounded-2xl border bg-muted/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Remaining</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight">{setupChecklist.length - setupCompleteCount}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Missing setup items that still need attention.</p>
                </div>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {setupChecklist.map((item) => (
                <div key={item.label} className="flex h-full flex-col justify-between rounded-2xl border bg-muted/20 p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{item.label}</p>
                      <Badge variant={item.done ? "success" : "secondary"}>{item.done ? "Done" : "Pending"}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <Button className="mt-4 w-full" variant={item.done ? "outline" : "default"} size="sm" asChild>
                    <Link href={item.href}>{item.done ? "Review" : "Open"}</Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {summaryQuery.isLoading || !summaryQuery.data ? (
        <LoadingState rows={4} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.title} {...metric} />
          ))}
        </div>
      )}

      {collectionMetrics.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {collectionMetrics.map((metric) => (
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
      ) : summaryQuery.data ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-32 rounded-3xl" />
          ))}
        </div>
      ) : null}

      {isSuperAdmin ? (
        <div className="space-y-4 rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-sky-50/60 p-5 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Admin reporting</p>
              <p className="mt-1 text-sm text-muted-foreground">A compact view of platform health, role mix, and operational throughput.</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/reports">Open full reports</Link>
            </Button>
          </div>
          {adminPulse ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard title="Active users" value={String(adminPulse.activeUsers)} helper="Enabled user accounts" icon={ClipboardCheck} tone="sky" />
              <MetricCard title="Active batches" value={String(adminPulse.activeBatches)} helper="Batches available for planning" icon={BookOpenCheck} tone="emerald" />
              <MetricCard title="Published exams" value={String(adminPulse.publishedExams)} helper="Exam records already live" icon={Video} tone="violet" />
              <MetricCard title="Published results" value={String(adminPulse.finalizedResults)} helper={`Avg ${adminPulse.averagePercentage}% across academic results`} icon={Clock3} tone="amber" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-32 rounded-3xl" />
              ))}
            </div>
          )}
          <div className="grid gap-6 xl:grid-cols-3">
            <Card className="xl:col-span-1">
              <CardHeader>
                <CardTitle>Role mix</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {adminRoleDistribution.length ? (
                  adminRoleDistribution
                    .slice()
                    .sort((left, right) => right.total - left.total)
                    .slice(0, 5)
                    .map((item) => (
                      <div key={item.roleId} className="flex items-center justify-between rounded-2xl border px-3 py-2 text-sm">
                        <span className="font-medium">{item.roleName}</span>
                        <Badge variant="outline">{item.total}</Badge>
                      </div>
                    ))
              ) : (
                  <EmptyState title="No role data" description="Role distribution will appear once the platform has active users." />
                )}
                <div className="pt-2">
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href={buildActivityLogsHref({ module: "users" })}>Open user activity logs</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>Recent activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {activityLogsQuery.data?.items?.length ? (
                  activityLogsQuery.data.items.map((log) => (
                    <div key={log.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3">
                      <div>
                        <p className="font-medium">
                          {log.module} · {log.action.replaceAll("-", " ")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {log.actorUser ? `${log.actorUser.firstName} ${log.actorUser.lastName}` : "System"} · {formatDate(log.createdAt, "MMM d, yyyy p")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {log.organizationName ? <Badge variant="outline">{log.organizationName}</Badge> : null}
                        {log.targetId ? <Badge variant="secondary">Target {log.targetId.slice(0, 8)}</Badge> : null}
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState title="No recent activity" description="Recent audit events will appear here once the platform is in use." />
                )}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={buildActivityLogsHref({ action: "bulk-delete" })}>Bulk deletes</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={buildActivityLogsHref({ action: "bulk-status" })}>Bulk status changes</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={buildActivityLogsHref({ module: "fees" })}>Billing activity</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ChartCard title="Monthly fee collection trend" description="Directly backed by the reports API collection trend endpoint.">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={feeTrendQuery.data ?? []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <defs>
                    <linearGradient id="feeTrendStroke" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#0284c7" />
                      <stop offset="50%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                  </defs>
                  <Line type="monotone" dataKey="collected" stroke="url(#feeTrendStroke)" strokeWidth={3} dot={{ fill: "#10b981" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
        <ChartCard title="Attendance status distribution" description="Current attendance mix across fetched records.">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={(attendanceBreakdownQuery.data ?? []).map((entry) => ({ name: entry.status, value: entry.total }))} dataKey="value" nameKey="name" innerRadius={70} outerRadius={100}>
                  {(attendanceBreakdownQuery.data ?? []).map((entry, index) => (
                    <Cell key={entry.status} fill={["#0ea5e9", "#ef4444", "#f59e0b", "#10b981"][index % 4]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Operational radar" description="A fast comparative view of activity across core operational areas.">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={operationsRadar}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <Radar dataKey="value" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.35} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Enrollment heatmap" description="Month-by-month intake intensity, shown as a heatmap-style grid instead of another line chart.">
          <HeatmapGrid cells={enrollmentHeatmap} columns={Math.min(Math.max(enrollmentHeatmap.length, 1), 6)} />
        </ChartCard>
      </div>

      {isSuperAdmin ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <ChartCard title="Organization growth" description="New organizations and total student footprint across the onboarded tenant base.">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={organizationGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="organizations" stroke="#0ea5e9" fill="#0ea5e955" />
                  <Area type="monotone" dataKey="students" stroke="#10b981" fill="#10b98133" />
                  <Legend />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
          <ChartCard title="Top tenant student bases" description="Largest organizations by current student footprint.">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={(organizationsQuery.data?.items ?? [])
                    .slice()
                    .sort((left, right) => right.totalStudents - left.totalStudents)
                    .slice(0, 8)
                    .map((item) => ({ name: item.name, students: item.totalStudents }))}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={110} />
                  <Tooltip />
                  <Bar dataKey="students" radius={[0, 10, 10, 0]}>
                    {(organizationsQuery.data?.items ?? [])
                      .slice()
                      .sort((left, right) => right.totalStudents - left.totalStudents)
                      .slice(0, 8)
                      .map((item, index) => <Cell key={item.id} fill={getChartColor(index)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      ) : null}

      {isSuperAdmin ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Active tenants" value={String(tenantInsights.activeOrganizations)} helper="Currently active organizations" icon={Landmark} tone="sky" />
          <MetricCard title="Average tenant size" value={String(tenantInsights.avgStudents)} helper="Average students per organization" icon={CalendarDays} tone="emerald" />
          <MetricCard
            title="Most adopted module"
            value={tenantInsights.topModules[0]?.moduleName.replaceAll("_", " ") ?? "N/A"}
            helper={tenantInsights.topModules[0] ? `${tenantInsights.topModules[0].count} organizations` : "No tenant data"}
            icon={CircleAlert}
            tone="violet"
          />
          <MetricCard
            title="Trials expiring soon"
            value={String(tenantInsights.expiringTrials.length)}
            helper={tenantInsights.expiringTrials[0]?.name ? `Next: ${tenantInsights.expiringTrials[0].name}` : "No near trial expiries"}
            icon={Clock3}
            tone="amber"
          />
        </div>
      ) : null}

      {isSuperAdmin ? (
        <div className="grid gap-6 xl:grid-cols-3">
          <ChartCard title="Subscription mix" description="Trial and subscription health across onboarded organizations.">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={tenantInsights.subscriptionMix} dataKey="value" nameKey="name" innerRadius={65} outerRadius={100}>
                    {tenantInsights.subscriptionMix.map((item, index) => (
                      <Cell key={item.name} fill={getChartColor(index)} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Trial watchlist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tenantInsights.expiringTrials.length ? (
                tenantInsights.expiringTrials.map((organization) => (
                  <div key={organization.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm">
                    <div>
                      <p className="font-medium">{organization.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Trial ends {formatDate(organization.trialEndsAt, "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{organization.subscriptionStatus}</Badge>
                      <Button size="sm" variant="outline" asChild>
                        <Link href="/organizations">Open billing</Link>
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState title="No trials expiring soon" description="No trial organization is due within the next 7 days." />
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <ChartCard title="Reminder channel activity" description="Recent reminder volume by channel.">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reminderBreakdownQuery.data ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="channel" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {(reminderBreakdownQuery.data ?? []).map((entry, index) => (
                    <Cell key={entry.channel} fill={getChartColor(index)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Enrollment trend" description="Monthly admissions trend from reports.">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={enrollmentTrendQuery.data ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <defs>
                  <linearGradient id="enrollmentFill" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.65} />
                    <stop offset="50%" stopColor="#0ea5e9" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.15} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="count" stroke="#10b981" fill="url(#enrollmentFill)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Fee status breakdown" description="Paid, overdue, pending, partial, and waived records.">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={feeStatusQuery.data ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                  {(feeStatusQuery.data ?? []).map((entry, index) => (
                    <Cell key={entry.status} fill={getChartColor(index)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {canReadOnlineClasses ? (
        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>{isTeacher ? "My upcoming online classes" : "Upcoming online classes"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {onlineClassesSummaryQuery.data?.upcomingSessions.length ? (
                onlineClassesSummaryQuery.data.upcomingSessions.map((session) => (
                  <div key={session.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm">
                    <div>
                      <p className="font-medium">{session.subjectName} · {session.batchName}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(session.scheduledStartAt, "MMM d, yyyy p")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isTeacher ? `${session.provider}` : `${session.teacherName ?? "Teacher pending"} · ${session.provider}`}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {session.meetingUrl ? (
                        <Button size="sm" variant="outline" asChild>
                          <a href={session.meetingUrl} target="_blank" rel="noreferrer">Open class</a>
                        </Button>
                      ) : null}
                      <Button size="sm" asChild>
                        <Link href="/online-classes">Open module</Link>
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No upcoming online classes"
                  description={isTeacher ? "No online classes are assigned to you yet." : "No upcoming online classes are scheduled yet."}
                />
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Online class health</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {onlineClassesSummaryQuery.data?.lastRun ? (
                <div className="rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm">
                  <p className="font-medium">Last automation run</p>
                  <p className="mt-1 text-muted-foreground">
                    {`${onlineClassesSummaryQuery.data.lastRun.status} · ${formatDate(onlineClassesSummaryQuery.data.lastRun.startedAt, "MMM d, yyyy p")}`}
                  </p>
                </div>
              ) : (
                <EmptyState title="No automation run yet" description="Online class automation has not recorded a run yet." />
              )}
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm">
                <p className="font-medium">Failed sync attempts</p>
                <p className="mt-1 text-muted-foreground">{onlineClassesSummaryQuery.data?.failedSessionsCount ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm">
                <p className="font-medium">Pending attendance records</p>
                <p className="mt-1 text-muted-foreground">{onlineClassesSummaryQuery.data?.pendingAttendanceCount ?? 0}</p>
              </div>
              <Button className="w-full" variant="outline" asChild>
                <Link href="/online-classes">Review online classes</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {feeOverview ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <ChartCard
            title="Collection performance snapshot"
            description="Current month, quarter, and year billed totals compared against collected and pending amounts."
          >
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    {
                      period: "Month",
                      billed: feeOverview.currentMonth.billed,
                      collected: feeOverview.currentMonth.collected,
                      pending: feeOverview.currentMonth.pending,
                    },
                    {
                      period: "Quarter",
                      billed: feeOverview.currentQuarter.billed,
                      collected: feeOverview.currentQuarter.collected,
                      pending: feeOverview.currentQuarter.pending,
                    },
                    {
                      period: "Year",
                      billed: feeOverview.currentYear.billed,
                      collected: feeOverview.currentYear.collected,
                      pending: feeOverview.currentYear.pending,
                    },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="billed" fill="#cbd5e1" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="collected" fill="#10b981" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="pending" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
          <ChartCard
            title="Collection vs previous period"
            description="Current period collection compared against the previous month, quarter, and year."
          >
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={feeComparison.map((item) => ({
                    period: item.period === "MONTH" ? "Month" : item.period === "QUARTER" ? "Quarter" : "Year",
                    currentCollected: item.currentCollected,
                    previousCollected: item.previousCollected,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="currentCollected" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="previousCollected" fill="#94a3b8" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Quick drilldowns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/fees?status=OVERDUE">Open overdue fee records</Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/fees?status=PENDING">Open pending fee records</Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/attendance">Open attendance operations</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Communication follow-up</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/reminders">Open reminder center</Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/reports">Open full reports workspace</Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href={buildActivityLogsHref({ module: "auth" })}>Review authentication trail</Link>
            </Button>
            {canReadOnlineClasses ? (
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/online-classes">Open online class operations</Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
        {isSuperAdmin ? (
          <Card>
            <CardHeader>
              <CardTitle>Tenant module adoption</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {tenantInsights.topModules.map((moduleItem) => (
                <div key={moduleItem.moduleName} className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/70 px-4 py-3 shadow-sm">
                  <span className="text-muted-foreground">{moduleItem.moduleName.replaceAll("_", " ")}</span>
                  <span className="font-medium">{moduleItem.count}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Academic follow-up</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/exam-results">Open exam results</Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/report-cards">Open report cards</Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/students">Review student records</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Finance pulse</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="rounded-2xl border border-border/70 bg-muted/70 p-4 shadow-sm">
              {summaryQuery.data?.totalStudents ?? 0} total students currently tracked in the active tenant scope.
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/70 p-4 shadow-sm">
              {feeOverview
                ? `${formatCurrency(feeOverview.currentMonth.collected)} collected against ${formatCurrency(feeOverview.currentMonth.billed)} billed this month.`
                : `${(attendanceBreakdownQuery.data ?? []).reduce((total, entry) => total + entry.total, 0)} attendance rows contributing to today’s distribution.`}
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/70 p-4 shadow-sm">
              {feeOverview
                ? `${formatCurrency(feeOverview.currentYear.pending)} still pending this year, with ${formatCurrency(feeOverview.currentMonth.overdue)} already overdue for the current month.`
                : `${(reminderBreakdownQuery.data ?? []).reduce((total, entry) => total + entry.count, 0)} reminders reflected in the current analytics snapshot.`}
            </div>
          </CardContent>
        </Card>
        {canReadActivityLogs ? (
          <Card>
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {(activityLogsQuery.data?.items ?? []).slice(0, 5).map((log) => (
                <div key={log.id} className="rounded-2xl border border-border/70 bg-muted/70 p-4 shadow-sm">
                  <p className="font-medium">
                    {log.actorUser ? `${log.actorUser.firstName} ${log.actorUser.lastName}` : "System"} · {log.module} · {log.action}
                  </p>
                  <p className="text-muted-foreground">{formatDate(log.createdAt)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
