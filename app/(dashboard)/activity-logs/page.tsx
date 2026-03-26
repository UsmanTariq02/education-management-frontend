"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { activityLogsApi } from "@/features/activity-logs/api/activity-logs-api";
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

const MODULE_OPTIONS = ["auth", "users", "roles", "students", "batches", "fees", "attendance", "reminders"] as const;
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
] as const;

export default function ActivityLogsPage() {
  const { user } = useAuth();
  const canRead = usePermission("activity-logs.read");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [moduleFilter, setModuleFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const pageSize = 12;

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
          <Button variant="ghost" size="sm" onClick={() => setSelectedLog(row.original)}>
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
              className="h-10 rounded-xl border bg-background px-3 text-sm"
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
              className="h-10 rounded-xl border bg-background px-3 text-sm"
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
              <div className="rounded-xl border bg-muted/30 p-4">
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
