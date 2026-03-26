"use client";

import { useMemo, useState } from "react";
import { CalendarClock, DoorOpen, TableProperties, UserRound } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { batchesApi } from "@/features/batches/api/batches-api";
import { academicSessionsApi } from "@/features/academic-sessions/api/academic-sessions-api";
import { subjectsApi } from "@/features/subjects/api/subjects-api";
import { teachersApi } from "@/features/teachers/api/teachers-api";
import { timetablesApi } from "@/features/timetables/api/timetables-api";
import { timetableSchema, type TimetableSchema } from "@/features/timetables/schemas/timetable-schema";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { NativeSelect } from "@/components/ui/native-select";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { usePermission } from "@/hooks/use-permission";
import { normalizeApiError } from "@/lib/api/errors";
import { useAuth } from "@/providers/auth-provider";
import type { TimetableEntry, TimetableDayOfWeek } from "@/types/domain";

const days: TimetableDayOfWeek[] = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

export default function TimetablesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [pageIndex, setPageIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TimetableEntry | null>(null);
  const [selectedItem, setSelectedItem] = useState<TimetableEntry | null>(null);
  const canCreate = usePermission("timetables.create");
  const canManage = usePermission("timetables.update");

  const query = useQuery({
    queryKey: ["timetables", debouncedSearch, pageIndex],
    queryFn: () => timetablesApi.list({ page: pageIndex + 1, limit: 10, search: debouncedSearch }),
  });
  const shouldLoadReferenceData = open || Boolean(editingItem) || Boolean(selectedItem);
  const sessionsQuery = useQuery({
    queryKey: ["academic-sessions", "options"],
    queryFn: () => academicSessionsApi.list({ page: 1, limit: 100 }),
    enabled: shouldLoadReferenceData,
  });
  const batchesQuery = useQuery({
    queryKey: ["batches", "options"],
    queryFn: () => batchesApi.list({ page: 1, limit: 100 }),
    enabled: shouldLoadReferenceData,
  });
  const subjectsQuery = useQuery({
    queryKey: ["subjects", "options"],
    queryFn: () => subjectsApi.list({ page: 1, limit: 100 }),
    enabled: shouldLoadReferenceData,
  });
  const teachersQuery = useQuery({
    queryKey: ["teachers", "options"],
    queryFn: () => teachersApi.list({ page: 1, limit: 100 }),
    enabled: shouldLoadReferenceData,
  });

  const form = useForm<TimetableSchema>({
    resolver: zodResolver(timetableSchema),
    defaultValues: {
      academicSessionId: "",
      batchId: "",
      subjectId: "",
      teacherId: "",
      dayOfWeek: "MONDAY",
      startTime: "",
      endTime: "",
      deliveryMode: "OFFLINE",
      onlineClassProvider: "",
      onlineMeetingUrl: "",
      onlineMeetingCode: "",
      externalCalendarEventId: "",
      autoAttendanceEnabled: false,
      attendanceJoinThresholdMinutes: 5,
      room: "",
      notes: "",
      isActive: true,
    },
  });
  const deliveryMode = form.watch("deliveryMode");

  const mutation = useMutation({
    mutationFn: async (values: TimetableSchema) => {
      const payload = {
        ...values,
        academicSessionId: values.academicSessionId || undefined,
        teacherId: values.teacherId || undefined,
        onlineClassProvider: values.onlineClassProvider || undefined,
        onlineMeetingUrl: values.onlineMeetingUrl || undefined,
        onlineMeetingCode: values.onlineMeetingCode || undefined,
        externalCalendarEventId: values.externalCalendarEventId || undefined,
        room: values.room || undefined,
        notes: values.notes || undefined,
      };
      if (editingItem) {
        return timetablesApi.update(editingItem.id, payload);
      }
      return timetablesApi.create(payload);
    },
    onSuccess: () => {
      toast.success(editingItem ? "Timetable entry updated" : "Timetable entry created");
      queryClient.invalidateQueries({ queryKey: ["timetables"] });
      setOpen(false);
      setEditingItem(null);
      form.reset();
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const items = query.data?.items ?? [];
  const stats = useMemo(
    () => ({
      total: items.length,
      rooms: new Set(items.map((item) => item.room).filter(Boolean)).size,
      teacherMapped: items.filter((item) => item.teacherId).length,
      active: items.filter((item) => item.isActive).length,
    }),
    [items],
  );

  const columns = useMemo<Array<ColumnDef<TimetableEntry>>>(
    () => [
      {
        accessorKey: "dayOfWeek",
        header: "Day",
      },
      {
        accessorKey: "batchName",
        header: "Batch",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.batchName}</p>
            <p className="text-xs text-muted-foreground">{row.original.batchCode}</p>
          </div>
        ),
      },
      {
        accessorKey: "subjectName",
        header: "Subject",
      },
      {
        accessorKey: "teacherName",
        header: "Teacher",
        cell: ({ row }) => row.original.teacherName ?? <span className="text-muted-foreground">Unassigned</span>,
      },
      {
        accessorKey: "startTime",
        header: "Time",
        cell: ({ row }) => `${row.original.startTime} - ${row.original.endTime}`,
      },
      {
        accessorKey: "deliveryMode",
        header: "Mode",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.deliveryMode}</p>
            <p className="text-xs text-muted-foreground">{row.original.onlineClassProvider ?? "No provider"}</p>
          </div>
        ),
      },
      {
        accessorKey: "room",
        header: "Room",
        cell: ({ row }) => row.original.deliveryMode === "ONLINE" ? "Online" : row.original.room ?? "N/A",
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedItem(row.original)}>
              View
            </Button>
            {canManage ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingItem(row.original);
                  form.reset({
                    academicSessionId: row.original.academicSessionId ?? "",
                    batchId: row.original.batchId,
                    subjectId: row.original.subjectId,
                    teacherId: row.original.teacherId ?? "",
                    dayOfWeek: row.original.dayOfWeek,
                    startTime: row.original.startTime,
                    endTime: row.original.endTime,
                    deliveryMode: row.original.deliveryMode,
                    onlineClassProvider: row.original.onlineClassProvider ?? "",
                    onlineMeetingUrl: row.original.onlineMeetingUrl ?? "",
                    onlineMeetingCode: row.original.onlineMeetingCode ?? "",
                    externalCalendarEventId: row.original.externalCalendarEventId ?? "",
                    autoAttendanceEnabled: row.original.autoAttendanceEnabled,
                    attendanceJoinThresholdMinutes: row.original.attendanceJoinThresholdMinutes,
                    room: row.original.room ?? "",
                    notes: row.original.notes ?? "",
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
    [canManage, form],
  );

  if (query.isLoading) {
    return <LoadingState rows={6} />;
  }
  if (query.isError || !query.data) {
    return <ErrorState description="Timetable data could not be loaded." onRetry={() => query.refetch()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Academics"
        title="Timetable planner"
        description="Create timetable slots tied to batches, subjects, teachers, and academic sessions so the academic calendar becomes operational."
      />
      <OrganizationScopeBanner moduleLabel="Academic operations" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Visible slots" value={String(stats.total)} helper="Timetable entries in the current scope" icon={TableProperties} tone="sky" />
        <MetricCard title="Distinct rooms" value={String(stats.rooms)} helper="Rooms currently referenced in timetable planning" icon={DoorOpen} tone="violet" />
        <MetricCard title="Teacher mapped" value={String(stats.teacherMapped)} helper="Entries already tied to a teacher" icon={UserRound} tone="emerald" />
        <MetricCard title="Active entries" value={String(stats.active)} helper="Entries considered part of the live timetable" icon={CalendarClock} tone="amber" />
      </div>
      <FilterBar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPageIndex(0);
        }}
        searchPlaceholder="Search by batch, subject, teacher, or room..."
        action={
          canCreate ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button disabled={!user?.organizationId}>Create timetable entry</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingItem ? "Edit timetable entry" : "Create timetable entry"}</DialogTitle>
                  <DialogDescription>Each slot should align with a subject assignment and reflect an actual daily classroom schedule.</DialogDescription>
                </DialogHeader>
                <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
                  <FormField label="Academic session" className="md:col-span-2">
                    <NativeSelect {...form.register("academicSessionId")}>
                      <option value="">General / all sessions</option>
                      {sessionsQuery.data?.items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </NativeSelect>
                  </FormField>
                  <FormField label="Batch" required error={form.formState.errors.batchId}>
                    <NativeSelect {...form.register("batchId")}>
                      <option value="">Select batch</option>
                      {batchesQuery.data?.items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </NativeSelect>
                  </FormField>
                  <FormField label="Subject" required error={form.formState.errors.subjectId}>
                    <NativeSelect {...form.register("subjectId")}>
                      <option value="">Select subject</option>
                      {subjectsQuery.data?.items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </NativeSelect>
                  </FormField>
                  <FormField label="Teacher">
                    <NativeSelect {...form.register("teacherId")}>
                      <option value="">Unassigned</option>
                      {teachersQuery.data?.items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.fullName}
                        </option>
                      ))}
                    </NativeSelect>
                  </FormField>
                  <FormField label="Day" required error={form.formState.errors.dayOfWeek}>
                    <NativeSelect {...form.register("dayOfWeek")}>
                      {days.map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </NativeSelect>
                  </FormField>
                  <FormField label="Start time" required error={form.formState.errors.startTime}>
                    <input className="h-10 rounded-xl border bg-background px-3 text-sm" type="time" {...form.register("startTime")} />
                  </FormField>
                  <FormField label="End time" required error={form.formState.errors.endTime}>
                    <input className="h-10 rounded-xl border bg-background px-3 text-sm" type="time" {...form.register("endTime")} />
                  </FormField>
                  <FormField label="Delivery mode" required error={form.formState.errors.deliveryMode}>
                    <NativeSelect {...form.register("deliveryMode")}>
                      <option value="OFFLINE">OFFLINE</option>
                      <option value="ONLINE">ONLINE</option>
                      <option value="HYBRID">HYBRID</option>
                    </NativeSelect>
                  </FormField>
                  <FormField label="Room">
                    <input className="h-10 rounded-xl border bg-background px-3 text-sm" {...form.register("room")} />
                  </FormField>
                  {deliveryMode !== "OFFLINE" ? (
                    <>
                      <FormField label="Online provider">
                        <NativeSelect {...form.register("onlineClassProvider")}>
                          <option value="">Select provider</option>
                          <option value="GOOGLE_MEET">Google Meet</option>
                          <option value="ZOOM">Zoom</option>
                        </NativeSelect>
                      </FormField>
                      <FormField label="Meeting URL">
                        <input className="h-10 rounded-xl border bg-background px-3 text-sm" {...form.register("onlineMeetingUrl")} />
                      </FormField>
                      <FormField label="Meeting code">
                        <input className="h-10 rounded-xl border bg-background px-3 text-sm" {...form.register("onlineMeetingCode")} />
                      </FormField>
                      <FormField label="Calendar event ID">
                        <input className="h-10 rounded-xl border bg-background px-3 text-sm" {...form.register("externalCalendarEventId")} />
                      </FormField>
                      <FormField label="Join threshold (minutes)">
                        <input
                          className="h-10 rounded-xl border bg-background px-3 text-sm"
                          type="number"
                          min={1}
                          {...form.register("attendanceJoinThresholdMinutes", { valueAsNumber: true })}
                        />
                      </FormField>
                      <Checkbox label="Auto-mark attendance from actual joins" {...form.register("autoAttendanceEnabled")} />
                    </>
                  ) : null}
                  <FormField label="Notes" className="md:col-span-2">
                    <input className="h-10 rounded-xl border bg-background px-3 text-sm" {...form.register("notes")} />
                  </FormField>
                  <Checkbox containerClassName="md:col-span-2" label="Keep timetable entry active" {...form.register("isActive")} />
                  <div className="md:col-span-2 flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={mutation.isPending}>
                      {editingItem ? "Save changes" : "Create slot"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />
      <DataTable
        data={items}
        columns={columns}
        pageCount={Math.ceil(query.data.total / query.data.limit)}
        pagination={{ pageIndex, pageSize: query.data.limit }}
        onPaginationChange={(state) => setPageIndex(state.pageIndex)}
      />
      <Dialog open={Boolean(selectedItem)} onOpenChange={(nextOpen) => !nextOpen && setSelectedItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Timetable entry detail</DialogTitle>
            <DialogDescription>Review the classroom slot, teacher allocation, and session context.</DialogDescription>
          </DialogHeader>
          {selectedItem ? (
            <div className="space-y-3 text-sm">
              <p><span className="font-medium">Batch:</span> {selectedItem.batchName}</p>
              <p><span className="font-medium">Subject:</span> {selectedItem.subjectName}</p>
              <p><span className="font-medium">Teacher:</span> {selectedItem.teacherName ?? "Unassigned"}</p>
              <p><span className="font-medium">Session:</span> {selectedItem.academicSessionName ?? "General"}</p>
              <p><span className="font-medium">Day:</span> {selectedItem.dayOfWeek}</p>
              <p><span className="font-medium">Time:</span> {selectedItem.startTime} - {selectedItem.endTime}</p>
              <p><span className="font-medium">Delivery mode:</span> {selectedItem.deliveryMode}</p>
              <p><span className="font-medium">Provider:</span> {selectedItem.onlineClassProvider ?? "—"}</p>
              <p><span className="font-medium">Meeting URL:</span> {selectedItem.onlineMeetingUrl ?? "—"}</p>
              <p><span className="font-medium">Meeting code:</span> {selectedItem.onlineMeetingCode ?? "—"}</p>
              <p><span className="font-medium">Auto attendance:</span> {selectedItem.autoAttendanceEnabled ? `Yes, ${selectedItem.attendanceJoinThresholdMinutes} minute threshold` : "Disabled"}</p>
              <p><span className="font-medium">Room:</span> {selectedItem.room ?? "—"}</p>
              <p><span className="font-medium">Notes:</span> {selectedItem.notes ?? "—"}</p>
              <p><span className="font-medium">Status:</span> {selectedItem.isActive ? "Active" : "Inactive"}</p>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
