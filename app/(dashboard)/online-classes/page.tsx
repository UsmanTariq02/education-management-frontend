"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarCheck2, PlayCircle, RefreshCcw, Users, Video, WandSparkles } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { onlineClassesApi } from "@/features/online-classes/api/online-classes-api";
import { timetablesApi } from "@/features/timetables/api/timetables-api";
import { MetricCard } from "@/components/cards/metric-card";
import { DataTable } from "@/components/tables/data-table";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { FormField } from "@/components/forms/form-field";
import { FilterBar } from "@/components/shared/filter-bar";
import { OrganizationScopeBanner } from "@/components/shared/organization-scope-banner";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { NativeSelect } from "@/components/ui/native-select";
import { normalizeApiError } from "@/lib/api/errors";
import { formatDate } from "@/lib/formatters";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { usePermission } from "@/hooks/use-permission";
import type { OnlineClassSession, TimetableEntry } from "@/types/domain";

const sessionSchema = z.object({
  timetableEntryId: z.string().uuid("Select an online timetable entry"),
  scheduledStartAt: z.string().min(1, "Start datetime is required"),
  scheduledEndAt: z.string().min(1, "End datetime is required"),
});

type SessionSchema = z.infer<typeof sessionSchema>;

export default function OnlineClassesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [pageIndex, setPageIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<OnlineClassSession | null>(null);
  const canCreate = usePermission("online-classes.create");
  const canUpdate = usePermission("online-classes.update");
  const canSync = usePermission("online-classes.sync");
  const canProcessAttendance = usePermission("online-classes.attendance");

  const sessionsQuery = useQuery({
    queryKey: ["online-classes", debouncedSearch, pageIndex],
    queryFn: () => onlineClassesApi.list({ page: pageIndex + 1, limit: 10, search: debouncedSearch }),
  });
  const shouldLoadTimetableOptions = open;
  const automationSummaryQuery = useQuery({
    queryKey: ["online-classes", "automation-summary"],
    queryFn: onlineClassesApi.getAutomationSummary,
  });
  const timetablesQuery = useQuery({
    queryKey: ["timetables", "online-class-options"],
    queryFn: () => timetablesApi.list({ page: 1, limit: 100 }),
    enabled: shouldLoadTimetableOptions,
  });

  const form = useForm<SessionSchema>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      timetableEntryId: "",
      scheduledStartAt: "",
      scheduledEndAt: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: onlineClassesApi.create,
    onSuccess: () => {
      toast.success("Online class session scheduled");
      void queryClient.invalidateQueries({ queryKey: ["online-classes"] });
      setOpen(false);
      form.reset();
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const processAttendanceMutation = useMutation({
    mutationFn: onlineClassesApi.processAttendance,
    onSuccess: (result) => {
      toast.success(`Attendance processed. Created ${result.createdCount}, skipped ${result.skippedCount}.`);
      void queryClient.invalidateQueries({ queryKey: ["online-classes"] });
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });
  const generateMeetMutation = useMutation({
    mutationFn: onlineClassesApi.generateMeet,
    onSuccess: (session) => {
      toast.success(`Meet link generated for ${session.subjectName}.`);
      void queryClient.invalidateQueries({ queryKey: ["online-classes"] });
      setSelectedSession(session);
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });
  const syncGoogleMeetMutation = useMutation({
    mutationFn: onlineClassesApi.syncGoogleMeet,
    onSuccess: (session) => {
      toast.success(`Synced ${session.participantSessions.length} participant session rows.`);
      void queryClient.invalidateQueries({ queryKey: ["online-classes"] });
      setSelectedSession(session);
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });
  const runAutomationMutation = useMutation({
    mutationFn: onlineClassesApi.runAutomation,
    onSuccess: (result) => {
      toast.success(
        `Automation complete. Generated ${result.generatedCount}, synced ${result.syncedCount}, processed ${result.attendanceProcessedCount}.`,
      );
      void queryClient.invalidateQueries({ queryKey: ["online-classes"] });
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const sessions = sessionsQuery.data?.items ?? [];
  const onlineTimetables = (timetablesQuery.data?.items ?? []).filter(
    (item: TimetableEntry) => item.deliveryMode !== "OFFLINE",
  );
  const stats = useMemo(
    () => ({
      total: sessions.length,
      live: sessions.filter((item: OnlineClassSession) => item.status === "LIVE").length,
      processed: sessions.filter((item: OnlineClassSession) => item.attendanceProcessedAt).length,
      participants: sessions.reduce(
        (sum: number, item: OnlineClassSession) => sum + item.participantSessions.length,
        0,
      ),
    }),
    [sessions],
  );
  const automationSummary = automationSummaryQuery.data;

  const columns = useMemo<Array<ColumnDef<OnlineClassSession>>>(
    () => [
      {
        accessorKey: "subjectName",
        header: "Class",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.subjectName}</p>
            <p className="text-xs text-muted-foreground">{row.original.batchName}</p>
          </div>
        ),
      },
      {
        accessorKey: "provider",
        header: "Provider",
      },
      {
        accessorKey: "scheduledStartAt",
        header: "Scheduled",
        cell: ({ row }) => formatDate(row.original.scheduledStartAt, "MMM d, yyyy p"),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.status === "COMPLETED" ? "success" : row.original.status === "LIVE" ? "warning" : "outline"}>
            {row.original.status}
          </Badge>
        ),
      },
      {
        id: "participants",
        header: "Participants",
        cell: ({ row }) => String(row.original.participantSessions.length),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedSession(row.original)}>
              View
            </Button>
            {row.original.meetingUrl ? (
              <Button variant="ghost" size="sm" asChild>
                <a href={row.original.meetingUrl} target="_blank" rel="noreferrer">
                  Open class
                </a>
              </Button>
            ) : null}
            {canUpdate && row.original.provider === "GOOGLE_MEET" ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => generateMeetMutation.mutate(row.original.id)}
                disabled={generateMeetMutation.isPending}
              >
                Generate Meet
              </Button>
            ) : null}
            {canSync && row.original.provider === "GOOGLE_MEET" ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => syncGoogleMeetMutation.mutate(row.original.id)}
                disabled={syncGoogleMeetMutation.isPending}
              >
                Sync Meet
              </Button>
            ) : null}
            {canProcessAttendance ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => processAttendanceMutation.mutate(row.original.id)}
                disabled={processAttendanceMutation.isPending}
              >
                Process attendance
              </Button>
            ) : null}
          </div>
        ),
      },
    ],
    [canProcessAttendance, canSync, canUpdate, generateMeetMutation, processAttendanceMutation, syncGoogleMeetMutation],
  );

  if (sessionsQuery.isLoading) return <LoadingState rows={6} />;
  if (sessionsQuery.isError || !sessionsQuery.data) {
    return <ErrorState description="Online classes could not be loaded." onRetry={() => sessionsQuery.refetch()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Academics"
        title="Online classes"
        description="Schedule online class sessions from timetable entries, review participant sessions, and process attendance from actual joins."
      />
      <OrganizationScopeBanner moduleLabel="Academic operations" />
      <div className="rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Google Meet workflow</p>
        <p className="mt-1">
          Configure delegated Workspace access in <Link href="/settings" className="underline underline-offset-4">Settings</Link>,
          generate a Meet link for a scheduled class, sync participants, then process attendance from actual joins.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Visible sessions" value={String(stats.total)} helper="Scheduled online sessions in current scope" icon={Video} tone="sky" />
        <MetricCard title="Live sessions" value={String(stats.live)} helper="Sessions currently marked live" icon={PlayCircle} tone="amber" />
        <MetricCard title="Attendance processed" value={String(stats.processed)} helper="Sessions already converted into attendance" icon={CalendarCheck2} tone="emerald" />
        <MetricCard title="Participant rows" value={String(stats.participants)} helper="Stored participant join sessions" icon={Users} tone="violet" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Last automation run"
          value={automationSummary?.lastRun ? automationSummary.lastRun.status : "No runs"}
          helper={automationSummary?.lastRun ? formatDate(automationSummary.lastRun.startedAt, "MMM d, yyyy p") : "Automation has not run yet"}
          icon={RefreshCcw}
          tone={automationSummary?.lastRun?.status === "FAILED" ? "rose" : automationSummary?.lastRun?.status === "SUCCESS" ? "emerald" : "amber"}
        />
        <MetricCard
          title="Failed sync sessions"
          value={String(automationSummary?.failedSessionsCount ?? 0)}
          helper="Sessions with a stored participant sync failure"
          icon={Users}
          tone={(automationSummary?.failedSessionsCount ?? 0) > 0 ? "rose" : "emerald"}
        />
        <MetricCard
          title="Pending attendance"
          value={String(automationSummary?.pendingAttendanceCount ?? 0)}
          helper="Sessions ended but attendance is still not processed"
          icon={CalendarCheck2}
          tone={(automationSummary?.pendingAttendanceCount ?? 0) > 0 ? "amber" : "emerald"}
        />
        <MetricCard
          title="Recent runs"
          value={String(automationSummary?.recentRuns.length ?? 0)}
          helper="Latest automation cycles stored for auditability"
          icon={Video}
          tone="violet"
        />
      </div>
      <FilterBar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPageIndex(0);
        }}
        searchPlaceholder="Search by batch, subject, teacher, or meeting code..."
        action={
          canCreate ? (
            <div className="flex flex-wrap gap-2">
              {canSync ? (
                <Button variant="outline" onClick={() => runAutomationMutation.mutate()} disabled={runAutomationMutation.isPending}>
                  Run automation
                </Button>
              ) : null}
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button>Schedule online class</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Schedule online class session</DialogTitle>
                    <DialogDescription>Create one online class occurrence from an online-enabled timetable entry.</DialogDescription>
                  </DialogHeader>
                  <form className="grid gap-4" onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}>
                    <FormField label="Online timetable entry" required error={form.formState.errors.timetableEntryId}>
                      <NativeSelect {...form.register("timetableEntryId")}>
                        <option value="">Select entry</option>
                        {onlineTimetables.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.batchName} · {item.subjectName} · {item.onlineClassProvider ?? item.deliveryMode}
                          </option>
                        ))}
                      </NativeSelect>
                    </FormField>
                    <FormField label="Scheduled start" required error={form.formState.errors.scheduledStartAt}>
                      <input className="h-10 rounded-xl border bg-background px-3 text-sm" type="datetime-local" {...form.register("scheduledStartAt")} />
                    </FormField>
                    <FormField label="Scheduled end" required error={form.formState.errors.scheduledEndAt}>
                      <input className="h-10 rounded-xl border bg-background px-3 text-sm" type="datetime-local" {...form.register("scheduledEndAt")} />
                    </FormField>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createMutation.isPending}>
                        Create session
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          ) : null
        }
      />
      <DataTable
        data={sessions}
        columns={columns}
        pageCount={Math.ceil(sessionsQuery.data.total / sessionsQuery.data.limit)}
        pagination={{ pageIndex, pageSize: sessionsQuery.data.limit }}
        onPaginationChange={(state) => setPageIndex(state.pageIndex)}
      />
      <Card>
        <CardHeader>
          <CardTitle>Automation health</CardTitle>
          <CardDescription>Recent scheduler runs and their result counts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {automationSummaryQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading automation history...</p>
          ) : automationSummary?.recentRuns.length ? (
            automationSummary.recentRuns.map((run) => (
              <div key={run.id} className="rounded-2xl border p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={run.status === "FAILED" ? "danger" : run.status === "SUCCESS" ? "success" : "outline"}>
                      {run.status}
                    </Badge>
                    <span className="text-muted-foreground">{formatDate(run.startedAt, "MMM d, yyyy p")}</span>
                  </div>
                  <span className="text-muted-foreground">
                    Generated {run.generatedCount} · Synced {run.syncedCount} · Attendance {run.attendanceProcessedCount}
                  </span>
                </div>
                {run.errorMessage ? <p className="mt-2 text-rose-600">{run.errorMessage}</p> : null}
              </div>
            ))
          ) : (
            <EmptyState title="No automation runs yet" description="Run the automation cycle once to start generating history here." />
          )}
        </CardContent>
      </Card>
      <Dialog open={Boolean(selectedSession)} onOpenChange={(nextOpen) => !nextOpen && setSelectedSession(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Online class session</DialogTitle>
            <DialogDescription>Review provider, meeting context, and participant activity before processing attendance.</DialogDescription>
          </DialogHeader>
          {selectedSession ? (
            <div className="space-y-4 text-sm">
              <p><span className="font-medium">Class:</span> {selectedSession.subjectName} · {selectedSession.batchName}</p>
              <p><span className="font-medium">Provider:</span> {selectedSession.provider}</p>
              <p><span className="font-medium">Status:</span> {selectedSession.status}</p>
              <p><span className="font-medium">Scheduled:</span> {formatDate(selectedSession.scheduledStartAt, "MMM d, yyyy p")} - {formatDate(selectedSession.scheduledEndAt, "MMM d, yyyy p")}</p>
              <p><span className="font-medium">Meeting URL:</span> {selectedSession.meetingUrl ?? "—"}</p>
              <p><span className="font-medium">Meeting code:</span> {selectedSession.meetingCode ?? "—"}</p>
              <p><span className="font-medium">Calendar event:</span> {selectedSession.externalCalendarEventId ?? "—"}</p>
              <p><span className="font-medium">Conference record:</span> {selectedSession.externalConferenceRecordId ?? "—"}</p>
              <p>
                <span className="font-medium">Last sync:</span>{" "}
                {selectedSession.lastParticipantSyncAt
                  ? `${formatDate(selectedSession.lastParticipantSyncAt, "MMM d, yyyy p")} (${selectedSession.lastParticipantSyncStatus})`
                  : "Not synced yet"}
              </p>
              {selectedSession.lastParticipantSyncError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700">
                  {selectedSession.lastParticipantSyncError}
                </div>
              ) : null}
              <p><span className="font-medium">Attendance processed:</span> {selectedSession.attendanceProcessedAt ? formatDate(selectedSession.attendanceProcessedAt, "MMM d, yyyy p") : "Not yet"}</p>
              <div className="flex flex-wrap gap-2">
                {selectedSession.meetingUrl ? (
                  <Button size="sm" variant="outline" asChild>
                    <a href={selectedSession.meetingUrl} target="_blank" rel="noreferrer">
                      Open class
                    </a>
                  </Button>
                ) : null}
                {canUpdate && selectedSession.provider === "GOOGLE_MEET" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => generateMeetMutation.mutate(selectedSession.id)}
                    disabled={generateMeetMutation.isPending}
                  >
                    <WandSparkles className="mr-2 h-4 w-4" />
                    Generate Meet
                  </Button>
                ) : null}
                {canSync && selectedSession.provider === "GOOGLE_MEET" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => syncGoogleMeetMutation.mutate(selectedSession.id)}
                    disabled={syncGoogleMeetMutation.isPending}
                  >
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Sync participants
                  </Button>
                ) : null}
                {canProcessAttendance ? (
                  <Button
                    size="sm"
                    onClick={() => processAttendanceMutation.mutate(selectedSession.id)}
                    disabled={processAttendanceMutation.isPending}
                  >
                    <CalendarCheck2 className="mr-2 h-4 w-4" />
                    Process attendance
                  </Button>
                ) : null}
              </div>
              <div className="space-y-2">
                <p className="font-medium">Participants</p>
                {selectedSession.participantSessions.length ? (
                  selectedSession.participantSessions.map((participant) => (
                    <div key={participant.id} className="rounded-2xl border p-3">
                      <p>{participant.studentName ?? participant.participantName ?? "Unknown participant"}</p>
                      <p className="text-muted-foreground">{participant.participantEmail ?? "No email"} · {participant.totalMinutes} minutes</p>
                      <p className="text-muted-foreground">
                        {formatDate(participant.joinedAt, "MMM d, yyyy p")}
                        {participant.leftAt ? ` - ${formatDate(participant.leftAt, "MMM d, yyyy p")}` : ""}
                      </p>
                    </div>
                  ))
                ) : (
                  <EmptyState title="No participants synced" description="Sync the provider session to pull join activity and auto-attendance evidence." />
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
