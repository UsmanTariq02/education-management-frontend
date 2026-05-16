"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { useSearchParams } from "next/navigation";
import { Banknote, BookOpen, Repeat, ShieldCheck } from "lucide-react";
import { activityLogsApi } from "@/features/activity-logs/api/activity-logs-api";
import { MetricCard } from "@/components/cards/metric-card";
import { usePermission } from "@/hooks/use-permission";
import type { ActivityLog } from "@/types/domain";
import { DataTable } from "@/components/tables/data-table";
import { DetailItem } from "@/components/shared/detail-item";
import { FilterBar } from "@/components/shared/filter-bar";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDate } from "@/lib/formatters";
import { useAuth } from "@/providers/auth-provider";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

const MODULE_OPTIONS = [
  "auth",
  "users",
  "roles",
  "students",
  "batches",
  "fees",
  "attendance",
  "reminders",
  "assignments",
  "assessments",
  "exams",
  "exam-results",
  "timetables",
  "online-classes",
  "organizations",
  "media",
  "academic-sessions",
  "batch-subject-assignments",
] as const;
const ACTION_OPTIONS = [
  "login",
  "login-failed",
  "login-blocked",
  "refresh",
  "logout",
  "create",
  "update",
  "delete",
  "create-plan",
  "create-record",
  "update-record",
  "delete-record",
  "session-revoked",
  "portal-access-upsert",
  "import",
  "status-update",
  "bulk-delete",
  "bulk-delete-records",
  "bulk-status",
  "bulk-publish",
  "publish",
  "unpublish",
  "create-billing-entry",
  "update-current",
  "upload",
  "generate-meet-link",
  "google-meet-sync",
  "participants-upsert",
  "attendance-processed",
  "reset-defaults",
  "process-due-schedules",
  "automation-cycle",
  "automation-generated",
] as const;

export default function ActivityLogsPage() {
  const { user } = useAuth();
  const canRead = usePermission("activity-logs.read");
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(() => searchParams?.get("search") ?? "");
  const debouncedSearch = useDebouncedValue(search);
  const [moduleFilter, setModuleFilter] = useState(() => searchParams?.get("module") ?? "");
  const [actionFilter, setActionFilter] = useState(() => searchParams?.get("action") ?? "");
  const [pageIndex, setPageIndex] = useState(0);
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const pageSize = 12;

  useEffect(() => {
    setSearch(searchParams?.get("search") ?? "");
    setModuleFilter(searchParams?.get("module") ?? "");
    setActionFilter(searchParams?.get("action") ?? "");
    setPageIndex(0);
  }, [searchParams]);

  const logsQuery = useQuery({
    queryKey: ["activity-logs", debouncedSearch, moduleFilter, actionFilter, pageIndex, pageSize, sorting],
    queryFn: () =>
      activityLogsApi.list({
        page: pageIndex + 1,
        limit: pageSize,
        search: debouncedSearch,
        module: moduleFilter || undefined,
        action: actionFilter || undefined,
        sortBy: sorting[0]?.id ?? "createdAt",
        sortOrder: sorting[0]?.desc ? "desc" : "asc",
      }),
    enabled: canRead,
  });

  const columns = useMemo<Array<ColumnDef<ActivityLog>>>(
    () => {
      const baseColumns: Array<ColumnDef<ActivityLog>> = [
        {
        accessorKey: "createdAt",
        header: "When",
        cell: ({ row }) => formatDate(row.original.createdAt),
        },
        ...(user?.roles.includes("SUPER_ADMIN")
          ? [
              {
                accessorKey: "organizationName",
                header: "Organization",
                cell: ({ row }) => row.original.organizationName ?? "Platform",
              } satisfies ColumnDef<ActivityLog>,
            ]
          : []),
        {
        accessorKey: "actorUser",
        header: "Actor",
        cell: ({ row }) => {
          const actor = row.original.actorUser;
          return actor ? (
            <div>
              <p className="font-medium">{`${actor.firstName} ${actor.lastName}`}</p>
              <p className="text-xs text-muted-foreground">{actor.email}</p>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">System / Anonymous</span>
          );
        },
        },
        {
        accessorKey: "module",
        header: "Module",
        cell: ({ row }) => <Badge variant="secondary">{row.original.module}</Badge>,
        },
        {
        accessorKey: "action",
        header: "Action",
        cell: ({ row }) => <Badge>{row.original.action}</Badge>,
        },
        {
        accessorKey: "targetId",
        header: "Target",
        cell: ({ row }) => {
          const metadata = row.original.metadata;
          const label =
            getStringValue(metadata, "fullName") ??
            getStringValue(metadata, "name") ??
            getStringValue(metadata, "email") ??
            getStringValue(metadata, "studentId") ??
            row.original.targetId ??
            "General";
          return <span className="text-sm">{label}</span>;
        },
        },
        {
        accessorKey: "metadata",
        header: "Details",
        cell: ({ row }) => (
          <p className="max-w-[420px] truncate text-sm text-muted-foreground">{summarizeMetadata(row.original)}</p>
        ),
        },
        {
        id: "view",
        header: "View",
        cell: ({ row }) => (
          <Button variant="outline" size="sm" className="rounded-full px-3 shadow-sm hover:border-primary/40 hover:bg-primary/5" onClick={() => setSelectedLog(row.original)}>
            View
          </Button>
        ),
        },
      ];

      return baseColumns;
    },
    [user?.roles],
  );

  const exportRows = useMemo(
    () =>
      (logsQuery.data?.items ?? []).map((log) => ({
        When: formatDate(log.createdAt),
        Actor: log.actorUser ? `${log.actorUser.firstName} ${log.actorUser.lastName}` : "System / Anonymous",
        ActorEmail: log.actorUser?.email ?? "",
        Module: log.module,
        Action: log.action,
        Target: log.targetId ?? "",
        Details: summarizeMetadata(log),
      })),
    [logsQuery.data],
  );
  const activityPulse = useMemo(() => {
    const items = logsQuery.data?.items ?? [];
    return {
      total: items.length,
      bulkActions: items.filter((item) => item.action.startsWith("bulk-")).length,
      authEvents: items.filter((item) => item.module === "auth").length,
      billingEvents: items.filter((item) => item.module === "fees").length,
      academicEvents: items.filter((item) =>
        ["students", "batches", "academic-sessions", "subjects", "teachers", "batch-subject-assignments", "timetables", "exams", "assessments", "assignments", "exam-results"].includes(item.module),
      ).length,
    };
  }, [logsQuery.data]);

  if (!canRead) {
    return <ErrorState title="Access denied" description="You do not have permission to review activity logs." />;
  }

  if (logsQuery.isLoading) return <LoadingState rows={8} />;
  if (logsQuery.isError || !logsQuery.data) {
    return <ErrorState description="Activity logs could not be loaded." onRetry={() => logsQuery.refetch()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Audit trail"
        title="Activity logs"
        description="Review authentication events and mutating actions across users, students, batches, fees, attendance, and reminders."
      />
      <FilterBar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPageIndex(0);
        }}
        searchPlaceholder="Search logs by actor, target, or metadata..."
        exportConfig={{ filename: "activity-logs", rows: exportRows }}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="h-10 rounded-2xl border border-border/70 bg-background px-3 text-sm shadow-sm"
              value={moduleFilter}
              onChange={(event) => {
                setModuleFilter(event.target.value);
                setPageIndex(0);
              }}
            >
              <option value="">All modules</option>
              {MODULE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select
              className="h-10 rounded-2xl border border-border/70 bg-background px-3 text-sm shadow-sm"
              value={actionFilter}
              onChange={(event) => {
                setActionFilter(event.target.value);
                setPageIndex(0);
              }}
            >
              <option value="">All actions</option>
              {ACTION_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        }
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setModuleFilter("auth");
            setActionFilter("");
            setPageIndex(0);
          }}
        >
          Auth events
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setModuleFilter("");
            setActionFilter("bulk-delete");
            setPageIndex(0);
          }}
        >
          Bulk deletes
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setModuleFilter("");
            setActionFilter("bulk-status");
            setPageIndex(0);
          }}
        >
          Bulk status
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setModuleFilter("");
            setActionFilter("bulk-publish");
            setPageIndex(0);
          }}
        >
          Bulk publish
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setModuleFilter("fees");
            setActionFilter("");
            setPageIndex(0);
          }}
        >
          Billing events
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setModuleFilter("");
            setActionFilter("");
            setSearch("");
            setPageIndex(0);
          }}
        >
          Reset filters
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard title="Loaded logs" value={String(activityPulse.total)} helper="Current page records" icon={ShieldCheck} tone="sky" />
        <MetricCard title="Bulk actions" value={String(activityPulse.bulkActions)} helper="bulk-* events on this page" icon={Repeat} tone="violet" />
        <MetricCard title="Auth events" value={String(activityPulse.authEvents)} helper="login, logout, refresh, and session events" icon={ShieldCheck} tone="emerald" />
        <MetricCard title="Billing events" value={String(activityPulse.billingEvents)} helper="Fee-plan and fee-record activity" icon={Banknote} tone="amber" />
        <MetricCard title="Academic events" value={String(activityPulse.academicEvents)} helper="Academic module activity on this page" icon={BookOpen} tone="amber" />
      </div>
      <DataTable
        data={logsQuery.data.items}
        columns={columns}
        pageCount={Math.ceil(logsQuery.data.total / logsQuery.data.limit)}
        pagination={{ pageIndex: logsQuery.data.page - 1, pageSize: logsQuery.data.limit }}
        sorting={sorting}
        onSortingChange={(state) => {
          setSorting(state);
          setPageIndex(0);
        }}
        onPaginationChange={(state) => setPageIndex(state.pageIndex)}
      />
      <Dialog open={Boolean(selectedLog)} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Activity log detail</DialogTitle>
          </DialogHeader>
          {selectedLog ? (
            <div className="space-y-4 text-sm">
              <div className="grid gap-3 md:grid-cols-2">
                <DetailItem label="When" value={formatDate(selectedLog.createdAt)} />
                <DetailItem label="Module" value={selectedLog.module} />
                <DetailItem label="Action" value={selectedLog.action} />
                <DetailItem
                  label="Actor"
                  value={
                    selectedLog.actorUser
                      ? `${selectedLog.actorUser.firstName} ${selectedLog.actorUser.lastName} (${selectedLog.actorUser.email})`
                      : "System / Anonymous"
                  }
                />
                <DetailItem label="Target" value={selectedLog.targetId ?? "General"} />
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 shadow-sm">
                <p className="mb-2 font-medium">Complete details</p>
                <pre className="whitespace-pre-wrap break-all text-xs text-muted-foreground">
                  {JSON.stringify(selectedLog.metadata ?? {}, null, 2)}
                </pre>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getStringValue(metadata: Record<string, unknown> | null, key: string) {
  const value = metadata?.[key];
  return typeof value === "string" && value.length > 0 ? value : null;
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
