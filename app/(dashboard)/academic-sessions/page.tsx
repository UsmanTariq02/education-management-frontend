"use client";

import { useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, GraduationCap, TimerReset } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { MetricCard } from "@/components/cards/metric-card";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { FormField } from "@/components/forms/form-field";
import { FilterBar } from "@/components/shared/filter-bar";
import { OrganizationScopeBanner } from "@/components/shared/organization-scope-banner";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { academicSessionsApi } from "@/features/academic-sessions/api/academic-sessions-api";
import {
  academicSessionSchema,
  type AcademicSessionSchema,
} from "@/features/academic-sessions/schemas/academic-session-schema";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { usePermission } from "@/hooks/use-permission";
import { normalizeApiError } from "@/lib/api/errors";
import { formatDate } from "@/lib/formatters";
import { useAuth } from "@/providers/auth-provider";
import type { AcademicSession } from "@/types/domain";

export default function AcademicSessionsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [pageIndex, setPageIndex] = useState(0);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [open, setOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<AcademicSession | null>(null);
  const [selectedSession, setSelectedSession] = useState<AcademicSession | null>(null);
  const canCreate = usePermission("academic-sessions.create");
  const canManage = usePermission("academic-sessions.update");
  const query = useQuery({
    queryKey: ["academic-sessions", debouncedSearch, pageIndex],
    queryFn: () => academicSessionsApi.list({ page: pageIndex + 1, limit: 10, search: debouncedSearch }),
  });

  const form = useForm<AcademicSessionSchema>({
    resolver: zodResolver(academicSessionSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      startDate: "",
      endDate: "",
      isCurrent: false,
      isActive: true,
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: AcademicSessionSchema) => {
      if (editingSession) {
        return academicSessionsApi.update(editingSession.id, values);
      }
      return academicSessionsApi.create(values);
    },
    onSuccess: () => {
      toast.success(editingSession ? "Academic session updated" : "Academic session created");
      queryClient.invalidateQueries({ queryKey: ["academic-sessions"] });
      setOpen(false);
      setEditingSession(null);
      form.reset();
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const filteredItems = useMemo(() => {
    const items = query.data?.items ?? [];
    if (statusFilter === "ACTIVE") {
      return items.filter((item) => item.isActive);
    }
    if (statusFilter === "INACTIVE") {
      return items.filter((item) => !item.isActive);
    }
    if (statusFilter === "CURRENT") {
      return items.filter((item) => item.isCurrent);
    }
    return items;
  }, [query.data, statusFilter]);

  const stats = useMemo(
    () => ({
      total: filteredItems.length,
      current: filteredItems.filter((item) => item.isCurrent).length,
      active: filteredItems.filter((item) => item.isActive).length,
      archived: filteredItems.filter((item) => !item.isActive).length,
    }),
    [filteredItems],
  );

  const columns = useMemo<Array<ColumnDef<AcademicSession>>>(
    () => [
      {
        accessorKey: "name",
        header: "Session",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">{row.original.code}</p>
          </div>
        ),
      },
      ...(user?.roles.includes("SUPER_ADMIN")
        ? [
            {
              accessorKey: "organizationName",
              header: "Organization",
            } satisfies ColumnDef<AcademicSession>,
          ]
        : []),
      {
        accessorKey: "startDate",
        header: "Duration",
        cell: ({ row }) => `${formatDate(row.original.startDate)} - ${formatDate(row.original.endDate)}`,
      },
      {
        accessorKey: "isCurrent",
        header: "Current",
        cell: ({ row }) => <Badge variant={row.original.isCurrent ? "success" : "secondary"}>{row.original.isCurrent ? "Current" : "Reference"}</Badge>,
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => <Badge variant={row.original.isActive ? "success" : "warning"}>{row.original.isActive ? "Active" : "Inactive"}</Badge>,
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedSession(row.original)}>
              View
            </Button>
            {canManage ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingSession(row.original);
                  form.reset({
                    name: row.original.name,
                    code: row.original.code,
                    description: row.original.description ?? "",
                    startDate: row.original.startDate.slice(0, 10),
                    endDate: row.original.endDate.slice(0, 10),
                    isCurrent: row.original.isCurrent,
                    isActive: row.original.isActive,
                  });
                  setOpen(true);
                }}
              >
                Edit
              </Button>
            ) : null}
          </div>
        ),
      },
    ],
    [canManage, form, user?.roles],
  );

  if (query.isLoading) return <LoadingState rows={6} />;
  if (query.isError || !query.data) {
    return <ErrorState description="Academic sessions could not be loaded." onRetry={() => query.refetch()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Academics"
        title="Academic sessions"
        description="Define yearly or term-based academic periods so exams, timetables, and promotions can anchor to a real session."
      />
      <OrganizationScopeBanner moduleLabel="Academic operations" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Visible sessions" value={String(stats.total)} helper="Sessions within the current table scope" icon={GraduationCap} tone="sky" />
        <MetricCard title="Current sessions" value={String(stats.current)} helper="Active default session markers" icon={CheckCircle2} tone="emerald" />
        <MetricCard title="Active sessions" value={String(stats.active)} helper="Sessions available for scheduling" icon={CalendarDays} tone="violet" />
        <MetricCard title="Archived sessions" value={String(stats.archived)} helper="Historical or disabled sessions" icon={TimerReset} tone="amber" />
      </div>
      <FilterBar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPageIndex(0);
        }}
        searchPlaceholder="Search sessions by name or code..."
        filters={
          <select
            className="h-10 rounded-xl border bg-background px-3 text-sm"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPageIndex(0);
            }}
          >
            <option value="ALL">All sessions</option>
            <option value="CURRENT">Current only</option>
            <option value="ACTIVE">Active only</option>
            <option value="INACTIVE">Inactive only</option>
          </select>
        }
        action={
          canCreate ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button disabled={!user?.organizationId}>Create session</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingSession ? "Edit academic session" : "Create academic session"}</DialogTitle>
                  <DialogDescription>Only one session should normally be flagged as current for each organization.</DialogDescription>
                </DialogHeader>
                <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
                  <FormField label="Session name" required error={form.formState.errors.name}>
                    <Input {...form.register("name")} />
                  </FormField>
                  <FormField label="Code" required error={form.formState.errors.code}>
                    <Input {...form.register("code")} />
                  </FormField>
                  <FormField label="Start date" required error={form.formState.errors.startDate}>
                    <Input type="date" {...form.register("startDate")} />
                  </FormField>
                  <FormField label="End date" required error={form.formState.errors.endDate}>
                    <Input type="date" {...form.register("endDate")} />
                  </FormField>
                  <FormField label="Description" error={form.formState.errors.description} className="md:col-span-2">
                    <Input {...form.register("description")} />
                  </FormField>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" {...form.register("isCurrent")} />
                    Mark as current session
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" {...form.register("isActive")} />
                    Keep session active
                  </label>
                  <div className="md:col-span-2 flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={mutation.isPending}>
                      {editingSession ? "Save changes" : "Create session"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />
      <DataTable
        data={filteredItems}
        columns={columns}
        pageCount={Math.ceil(query.data.total / query.data.limit)}
        pagination={{ pageIndex, pageSize: query.data.limit }}
        onPaginationChange={(state) => setPageIndex(state.pageIndex)}
      />
      <Dialog open={Boolean(selectedSession)} onOpenChange={(nextOpen) => !nextOpen && setSelectedSession(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Academic session detail</DialogTitle>
            <DialogDescription>Review the session timeline and default academic state.</DialogDescription>
          </DialogHeader>
          {selectedSession ? (
            <div className="space-y-3 text-sm">
              <p><span className="font-medium">Name:</span> {selectedSession.name}</p>
              <p><span className="font-medium">Code:</span> {selectedSession.code}</p>
              <p><span className="font-medium">Duration:</span> {formatDate(selectedSession.startDate)} - {formatDate(selectedSession.endDate)}</p>
              <p><span className="font-medium">Current:</span> {selectedSession.isCurrent ? "Yes" : "No"}</p>
              <p><span className="font-medium">Status:</span> {selectedSession.isActive ? "Active" : "Inactive"}</p>
              <p><span className="font-medium">Description:</span> {selectedSession.description ?? "—"}</p>
              {user?.roles.includes("SUPER_ADMIN") ? <p><span className="font-medium">Organization:</span> {selectedSession.organizationName}</p> : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
