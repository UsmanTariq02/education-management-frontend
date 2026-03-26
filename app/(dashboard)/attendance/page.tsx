"use client";

import { useMemo, useState } from "react";
import { BadgeCheck, Clock3, UserMinus, Users } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { toast } from "sonner";
import { attendanceApi } from "@/features/attendance/api/attendance-api";
import { attendanceSchema, type AttendanceSchema } from "@/features/attendance/schemas/attendance-schema";
import { batchesApi } from "@/features/batches/api/batches-api";
import { studentsApi } from "@/features/students/api/students-api";
import { normalizeApiError } from "@/lib/api/errors";
import type { AttendanceRecord } from "@/types/domain";
import { usePermission } from "@/hooks/use-permission";
import { ChartCard } from "@/components/charts/chart-card";
import { DataTable } from "@/components/tables/data-table";
import { FilterBar } from "@/components/shared/filter-bar";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { NativeSelect } from "@/components/ui/native-select";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/forms/form-field";
import { formatDate } from "@/lib/formatters";
import { getAttendanceBadgeVariant, getAttendanceColor } from "@/lib/constants/status-colors";
import { getChartColor } from "@/lib/constants/chart-colors";
import { OrganizationScopeBanner } from "@/components/shared/organization-scope-banner";
import { useAuth } from "@/providers/auth-provider";
import { MetricCard } from "@/components/cards/metric-card";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

export default function AttendancePage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 12;
  const [open, setOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const canCreate = usePermission("attendance.create");
  const canManage = usePermission("attendance.update");
  const canMutateWithinScope = Boolean(user?.organizationId);
  const queryClient = useQueryClient();

  const attendanceQuery = useQuery({
    queryKey: ["attendance", debouncedSearch, pageIndex, pageSize],
    queryFn: () => attendanceApi.list({ page: pageIndex + 1, limit: pageSize, search: debouncedSearch }),
  });
  const studentsQuery = useQuery({ queryKey: ["students", "attendance"], queryFn: () => studentsApi.list({ page: 1, limit: 100 }) });
  const batchesQuery = useQuery({ queryKey: ["batches", "attendance"], queryFn: () => batchesApi.list({ page: 1, limit: 100 }) });
  const studentMap = useMemo(() => new Map((studentsQuery.data?.items ?? []).map((student) => [student.id, student])), [studentsQuery.data]);
  const batchMap = useMemo(() => new Map((batchesQuery.data?.items ?? []).map((batch) => [batch.id, batch])), [batchesQuery.data]);

  const form = useForm<AttendanceSchema>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      studentId: "",
      batchId: "",
      attendanceDate: "",
      status: "PRESENT",
      remarks: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: AttendanceSchema) => {
      if (editingRecord) return attendanceApi.update(editingRecord.id, values);
      return attendanceApi.create(values);
    },
    onSuccess: () => {
      toast.success(editingRecord ? "Attendance updated" : "Attendance recorded");
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      setOpen(false);
      setEditingRecord(null);
      form.reset();
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const filteredAttendance = useMemo(() => {
    const items = attendanceQuery.data?.items ?? [];

    return items.filter((item) => (statusFilter === "ALL" ? true : item.status === statusFilter));
  }, [attendanceQuery.data, statusFilter]);

  const hasLocalFilters = statusFilter !== "ALL";

  const summaryData = useMemo(() => {
    const counts = new Map<string, number>();
    filteredAttendance.forEach((record) => counts.set(record.status, (counts.get(record.status) ?? 0) + 1));
    return Array.from(counts.entries()).map(([status, total]) => ({ status, total }));
  }, [filteredAttendance]);

  const columns = useMemo<Array<ColumnDef<AttendanceRecord>>>(
    () => {
      const baseColumns: Array<ColumnDef<AttendanceRecord>> = [
        {
          accessorKey: "studentId",
          header: "Student",
          cell: ({ row }) => studentMap.get(row.original.studentId)?.fullName ?? "Unknown student",
        },
        ...(user?.roles.includes("SUPER_ADMIN")
          ? [
              {
                id: "organization",
                header: "Organization",
                cell: ({ row }) =>
                  studentMap.get(row.original.studentId)?.organizationName ??
                  batchMap.get(row.original.batchId)?.organizationName ??
                  "Unknown organization",
              } satisfies ColumnDef<AttendanceRecord>,
            ]
          : []),
        {
          accessorKey: "batchId",
          header: "Batch",
          cell: ({ row }) => batchMap.get(row.original.batchId)?.name ?? "Unknown batch",
        },
        { accessorKey: "attendanceDate", header: "Date", cell: ({ row }) => formatDate(row.original.attendanceDate) },
        { accessorKey: "status", header: "Status", cell: ({ row }) => <Badge variant={getAttendanceBadgeVariant(row.original.status)}>{row.original.status}</Badge> },
        {
          id: "actions",
          header: "Actions",
          cell: ({ row }) => (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelectedRecord(row.original)}>
                View
              </Button>
              {canManage ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingRecord(row.original);
                    form.reset({
                      studentId: row.original.studentId,
                      batchId: row.original.batchId,
                      attendanceDate: row.original.attendanceDate.slice(0, 10),
                      status: row.original.status,
                      remarks: row.original.remarks ?? "",
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
      ];

      return baseColumns;
    },
    [batchMap, canManage, form, studentMap, user?.roles],
  );

  const exportRows = useMemo(
    () =>
      filteredAttendance.map((record) => ({
        Student: studentMap.get(record.studentId)?.fullName ?? "Unknown student",
        Batch: batchMap.get(record.batchId)?.name ?? "Unknown batch",
        Date: formatDate(record.attendanceDate),
        Status: record.status,
        Remarks: record.remarks ?? "",
      })),
    [batchMap, filteredAttendance, studentMap],
  );

  const attendanceStats = useMemo(() => {
    return {
      totalRecords: filteredAttendance.length,
      presentCount: filteredAttendance.filter((item) => item.status === "PRESENT").length,
      absentCount: filteredAttendance.filter((item) => item.status === "ABSENT").length,
      lateOrLeaveCount: filteredAttendance.filter((item) => item.status === "LATE" || item.status === "LEAVE").length,
    };
  }, [filteredAttendance]);

  if (attendanceQuery.isLoading || studentsQuery.isLoading || batchesQuery.isLoading) return <LoadingState rows={6} />;
  if (attendanceQuery.isError || studentsQuery.isError || batchesQuery.isError || !attendanceQuery.data || !studentsQuery.data || !batchesQuery.data) {
    return <ErrorState description="Attendance data could not be loaded." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Daily control" title="Attendance management" description="Capture attendance, review trends, and filter operational records by date and cohort." />
      <OrganizationScopeBanner moduleLabel="Attendance tracking" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Visible records" value={String(attendanceStats.totalRecords)} helper="Attendance entries in the current page scope" icon={Users} tone="sky" />
        <MetricCard title="Present" value={String(attendanceStats.presentCount)} helper="Students marked present" icon={BadgeCheck} tone="emerald" />
        <MetricCard title="Absent" value={String(attendanceStats.absentCount)} helper="Students marked absent" icon={UserMinus} tone="rose" />
        <MetricCard title="Late or leave" value={String(attendanceStats.lateOrLeaveCount)} helper="Operational exceptions requiring review" icon={Clock3} tone="amber" />
      </div>
      <ChartCard title="Attendance distribution">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={summaryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total">
                {summaryData.map((entry) => (
                  <Cell key={entry.status} fill={getChartColor(indexOfStatus(entry.status))} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
      <FilterBar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPageIndex(0);
        }}
        searchPlaceholder="Search attendance by student or batch..."
        filters={
          <NativeSelect
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPageIndex(0);
            }}
          >
            <option value="ALL">All statuses</option>
            {["PRESENT", "ABSENT", "LATE", "LEAVE"].map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </NativeSelect>
        }
        exportConfig={{ filename: "attendance-records", rows: exportRows }}
        action={
          canCreate ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button disabled={!canMutateWithinScope}>Mark attendance</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingRecord ? "Edit attendance" : "Mark attendance"}</DialogTitle>
                  <DialogDescription>Attendance records use the backend DTO fields directly.</DialogDescription>
                </DialogHeader>
                <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
                  <FormField label="Student" required error={form.formState.errors.studentId}>
                    <NativeSelect {...form.register("studentId")}>
                      <option value="">Select student</option>
                      {studentsQuery.data.items.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.fullName}
                        </option>
                      ))}
                    </NativeSelect>
                  </FormField>
                  <FormField label="Batch" required error={form.formState.errors.batchId}>
                    <NativeSelect {...form.register("batchId")}>
                      <option value="">Select batch</option>
                      {batchesQuery.data.items.map((batch) => (
                        <option key={batch.id} value={batch.id}>
                          {batch.name}
                        </option>
                      ))}
                    </NativeSelect>
                  </FormField>
                  <FormField label="Attendance date" required error={form.formState.errors.attendanceDate}>
                    <Input type="date" {...form.register("attendanceDate")} />
                  </FormField>
                  <FormField label="Status" required error={form.formState.errors.status}>
                    <NativeSelect {...form.register("status")}>
                      {["PRESENT", "ABSENT", "LATE", "LEAVE"].map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </NativeSelect>
                  </FormField>
                  <div className="md:col-span-2 flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={mutation.isPending}>
                      {mutation.isPending ? "Saving..." : editingRecord ? "Update attendance" : "Save attendance"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />
      <DataTable
        data={filteredAttendance}
        columns={columns}
        pageCount={hasLocalFilters ? 1 : Math.ceil(attendanceQuery.data.total / attendanceQuery.data.limit)}
        pagination={{ pageIndex: hasLocalFilters ? 0 : attendanceQuery.data.page - 1, pageSize: attendanceQuery.data.limit }}
        onPaginationChange={(state) => {
          if (!hasLocalFilters) {
            setPageIndex(state.pageIndex);
          }
        }}
      />
      <Dialog open={Boolean(selectedRecord)} onOpenChange={(nextOpen) => !nextOpen && setSelectedRecord(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Attendance detail</DialogTitle>
            <DialogDescription>Review the full attendance record.</DialogDescription>
          </DialogHeader>
          {selectedRecord ? (
            <div className="space-y-3 text-sm">
              <p><span className="font-medium">Student:</span> {studentMap.get(selectedRecord.studentId)?.fullName ?? "Unknown student"}</p>
              <p><span className="font-medium">Batch:</span> {batchMap.get(selectedRecord.batchId)?.name ?? "Unknown batch"}</p>
              <p><span className="font-medium">Date:</span> {formatDate(selectedRecord.attendanceDate)}</p>
              <p><span className="font-medium">Status:</span> {selectedRecord.status}</p>
              <p><span className="font-medium">Remarks:</span> {selectedRecord.remarks ?? "N/A"}</p>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function indexOfStatus(status: string) {
  return ["PRESENT", "ABSENT", "LATE", "LEAVE"].indexOf(status);
}
