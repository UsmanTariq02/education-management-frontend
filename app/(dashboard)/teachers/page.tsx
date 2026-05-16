"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BriefcaseBusiness, GraduationCap, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { teachersApi } from "@/features/teachers/api/teachers-api";
import { teacherSchema, type TeacherSchema } from "@/features/teachers/schemas/teacher-schema";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { usePermission } from "@/hooks/use-permission";
import { useSavedFilterPresets } from "@/hooks/use-saved-filter-presets";
import { normalizeApiError } from "@/lib/api/errors";
import { formatDate } from "@/lib/formatters";
import { exportRowsToCsv } from "@/lib/utils/export";
import { useAuth } from "@/providers/auth-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Teacher } from "@/types/domain";

export default function TeachersPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [pageIndex, setPageIndex] = useState(0);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [open, setOpen] = useState(false);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const canCreate = usePermission("teachers.create");
  const canManage = usePermission("teachers.update");
  const canDelete = usePermission("teachers.delete");
  const savedTeacherFilterPresets = useSavedFilterPresets<{
    search: string;
    statusFilter: string;
  }>("teachers-filter-presets");

  const query = useQuery({
    queryKey: ["teachers", debouncedSearch, pageIndex],
    queryFn: () => teachersApi.list({ page: pageIndex + 1, limit: 10, search: debouncedSearch }),
  });

  const form = useForm<TeacherSchema>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      employeeId: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      qualification: "",
      specialization: "",
      joinedAt: "",
      isActive: true,
      createLoginAccess: false,
      accessPassword: "",
      accessIsActive: true,
    },
  });

  const createLoginAccess = form.watch("createLoginAccess");

  const mutation = useMutation({
    mutationFn: async (values: TeacherSchema) => {
      const payload = {
        ...values,
        email: values.email || undefined,
        qualification: values.qualification || undefined,
        specialization: values.specialization || undefined,
        accessPassword: values.createLoginAccess ? values.accessPassword : undefined,
        accessIsActive: values.createLoginAccess ? values.accessIsActive : undefined,
        createLoginAccess: editingTeacher ? false : values.createLoginAccess,
      };
      if (editingTeacher) {
        return teachersApi.update(editingTeacher.id, payload);
      }
      return teachersApi.create(payload);
    },
    onSuccess: () => {
      toast.success(editingTeacher ? "Teacher updated" : "Teacher created");
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      setOpen(false);
      setEditingTeacher(null);
      form.reset();
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => teachersApi.bulkRemove(ids),
    onSuccess: () => {
      toast.success("Selected teachers deleted");
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      setRowSelection({});
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (targetTeacher: Teacher) => teachersApi.remove(targetTeacher.id),
    onSuccess: () => {
      toast.success("Teacher deleted");
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const bulkStatusMutation = useMutation({
    mutationFn: async (payload: { ids: string[]; isActive: boolean }) => teachersApi.bulkUpdateStatus(payload.ids, payload.isActive),
    onSuccess: (_, variables) => {
      toast.success(variables.isActive ? "Selected teachers activated" : "Selected teachers deactivated");
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      setRowSelection({});
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const filteredItems = useMemo(() => {
    const items = query.data?.items ?? [];
    if (statusFilter === "ACTIVE") return items.filter((item) => item.isActive);
    if (statusFilter === "INACTIVE") return items.filter((item) => !item.isActive);
    return items;
  }, [query.data, statusFilter]);

  const stats = useMemo(
    () => ({
      total: filteredItems.length,
      active: filteredItems.filter((item) => item.isActive).length,
      specialized: filteredItems.filter((item) => item.specialization).length,
      qualified: filteredItems.filter((item) => item.qualification).length,
    }),
    [filteredItems],
  );
  const selectedTeacherIds = Object.entries(rowSelection)
    .filter(([, selected]) => selected)
    .map(([id]) => id);
  const selectedTeacherExportRows = useMemo(
    () =>
      filteredItems
        .filter((teacher) => selectedTeacherIds.includes(teacher.id))
        .map((teacher) => ({
          Teacher: teacher.fullName,
          EmployeeId: teacher.employeeId,
          Email: teacher.email ?? "",
          Phone: teacher.phone,
          Qualification: teacher.qualification ?? "",
          Specialization: teacher.specialization ?? "",
          Joined: formatDate(teacher.joinedAt),
          Status: teacher.isActive ? "Active" : "Inactive",
          Organization: teacher.organizationName ?? "",
        })),
    [filteredItems, selectedTeacherIds],
  );
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

  const columns = useMemo<Array<ColumnDef<Teacher>>>(
    () => [
      {
        accessorKey: "fullName",
        header: "Teacher",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.fullName}</p>
            <p className="text-xs text-muted-foreground">{row.original.employeeId}</p>
          </div>
        ),
      },
      ...(user?.roles.includes("SUPER_ADMIN")
        ? [{ accessorKey: "organizationName", header: "Organization" } satisfies ColumnDef<Teacher>]
        : []),
      {
        accessorKey: "specialization",
        header: "Specialization",
        cell: ({ row }) => row.original.specialization ?? "General faculty",
      },
      {
        accessorKey: "joinedAt",
        header: "Joined",
        cell: ({ row }) => formatDate(row.original.joinedAt),
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
            <Button variant="outline" size="sm" className="rounded-full border-primary/15 bg-background/80 px-3 font-medium shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/10" onClick={() => setSelectedTeacher(row.original)}>
              View
            </Button>
            {canDelete ? (
              <Button
                variant="destructive"
                size="sm"
                className="rounded-full px-3 shadow-sm"
                onClick={() => {
                  if (window.confirm(`Delete ${row.original.fullName}? This cannot be undone.`)) {
                    deleteMutation.mutate(row.original);
                  }
                }}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            ) : null}
            {canManage ? (
              <Button
                variant="outline"
                size="sm"
                className="rounded-full border-primary/15 bg-background/80 px-3 font-medium shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/10"
                onClick={() => {
                  setEditingTeacher(row.original);
                  form.reset({
                    employeeId: row.original.employeeId,
                    firstName: row.original.firstName,
                    lastName: row.original.lastName,
                    email: row.original.email ?? "",
                    phone: row.original.phone,
                    qualification: row.original.qualification ?? "",
                    specialization: row.original.specialization ?? "",
                    joinedAt: row.original.joinedAt.slice(0, 10),
                    isActive: row.original.isActive,
                    createLoginAccess: false,
                    accessPassword: "",
                    accessIsActive: true,
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
    [canDelete, canManage, deleteMutation, form, user?.roles],
  );

  if (query.isLoading) return <LoadingState rows={6} />;
  if (query.isError || !query.data) return <ErrorState description="Teachers could not be loaded." onRetry={() => query.refetch()} />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Academics"
        title="Teachers"
        description="Maintain the teaching roster before timetable planning, subject allocation, and assessment ownership are introduced."
      />
      <OrganizationScopeBanner moduleLabel="Academic operations" />
      <div className="rounded-2xl border bg-muted/30 p-4 text-sm">
        <p className="font-medium">Recommended use</p>
        <p className="mt-1 text-muted-foreground">
          Use this area for teacher profiles, academic identity, and classroom ownership. If the teacher also needs dashboard access, enable login access during creation instead of creating a separate user manually.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Visible teachers" value={String(stats.total)} helper="Teachers in the current table scope" icon={UserRound} tone="sky" />
        <MetricCard title="Active teachers" value={String(stats.active)} helper="Faculty available for planning" icon={ShieldCheck} tone="emerald" />
        <MetricCard title="Specialized" value={String(stats.specialized)} helper="Teachers with a named specialization" icon={GraduationCap} tone="violet" />
        <MetricCard title="Qualified profiles" value={String(stats.qualified)} helper="Teachers with recorded qualifications" icon={BriefcaseBusiness} tone="amber" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={buildActivityLogsHref({ module: "teachers" })}>Audit teacher events</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={buildActivityLogsHref({ action: "bulk-status" })}>Audit bulk status</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={buildActivityLogsHref({ action: "bulk-delete" })}>Audit bulk deletes</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={buildActivityLogsHref({ action: "create" })}>Audit teacher creation</Link>
        </Button>
      </div>
      <FilterBar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPageIndex(0);
        }}
        searchPlaceholder="Search teachers by name, employee ID, or email..."
        filters={
          <NativeSelect value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="ALL">All teachers</option>
            <option value="ACTIVE">Active only</option>
            <option value="INACTIVE">Inactive only</option>
          </NativeSelect>
        }
        action={
          canCreate || canManage ? (
            <Dialog open={open} onOpenChange={setOpen}>
              {canCreate ? (
                <DialogTrigger asChild>
                  <Button disabled={!user?.organizationId}>Create teacher</Button>
                </DialogTrigger>
              ) : null}
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>{editingTeacher ? "Edit teacher" : "Create teacher"}</DialogTitle>
                  <DialogDescription>Teacher records will later drive subject allocations, timetable ownership, and exam evaluation workflows.</DialogDescription>
                </DialogHeader>
                <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
                  <FormField label="Employee ID" required error={form.formState.errors.employeeId}>
                    <Input {...form.register("employeeId")} />
                  </FormField>
                  <FormField label="Joined date" required error={form.formState.errors.joinedAt}>
                    <Input type="date" {...form.register("joinedAt")} />
                  </FormField>
                  <FormField label="First name" required error={form.formState.errors.firstName}>
                    <Input {...form.register("firstName")} />
                  </FormField>
                  <FormField label="Last name" required error={form.formState.errors.lastName}>
                    <Input {...form.register("lastName")} />
                  </FormField>
                  <FormField label="Email" error={form.formState.errors.email}>
                    <Input type="email" {...form.register("email")} />
                  </FormField>
                  <FormField label="Phone" required error={form.formState.errors.phone}>
                    <Input {...form.register("phone")} />
                  </FormField>
                  <FormField label="Qualification" error={form.formState.errors.qualification}>
                    <Input {...form.register("qualification")} />
                  </FormField>
                  <FormField label="Specialization" error={form.formState.errors.specialization}>
                    <Input {...form.register("specialization")} />
                  </FormField>
                  {!editingTeacher ? (
                    <div className="rounded-2xl border bg-muted/30 p-4 md:col-span-2">
                      <p className="text-sm font-medium">Dashboard access</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Provision the teacher&apos;s `TEACHER` login in the same step instead of creating it separately from Users.
                      </p>
                      <Checkbox containerClassName="mt-4" label="Create teacher login access now" {...form.register("createLoginAccess")} />
                      {createLoginAccess ? (
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <FormField label="Access password" required error={form.formState.errors.accessPassword}>
                            <Input type="password" {...form.register("accessPassword")} />
                          </FormField>
                          <Checkbox containerClassName="self-end" label="Keep login active" {...form.register("accessIsActive")} />
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  <Checkbox containerClassName="md:col-span-2" label="Keep teacher active" {...form.register("isActive")} />
                  <div className="md:col-span-2 flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={mutation.isPending}>
                      {editingTeacher ? "Save changes" : "Create teacher"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.75rem] border border-border/70 bg-card/85 px-4 py-3 text-sm shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground">Saved views</span>
          <Select
            value={selectedPresetId}
            onValueChange={(presetId) => {
              const preset = savedTeacherFilterPresets.presets.find((item) => item.id === presetId);
              if (!preset) return;

              setSearch(preset.value.search);
              setStatusFilter(preset.value.statusFilter);
              setSelectedPresetId(preset.id);
              setPageIndex(0);
            }}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select saved view" />
            </SelectTrigger>
            <SelectContent>
              {savedTeacherFilterPresets.presets.length === 0 ? (
                <SelectItem value="__none" disabled>
                  No saved views yet
                </SelectItem>
              ) : (
                savedTeacherFilterPresets.presets.map((preset) => (
                  <SelectItem key={preset.id} value={preset.id}>
                    {preset.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const name = window.prompt("Save the current teacher filters as:");
              const preset = name
                ? savedTeacherFilterPresets.savePreset(name, {
                    search,
                    statusFilter,
                  })
                : null;

              if (preset) {
                setSelectedPresetId(preset.id);
                toast.success(`Saved view "${preset.name}"`);
              }
            }}
          >
            Save current view
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              savedTeacherFilterPresets.clearPresets();
              setSelectedPresetId("");
              toast.success("Saved teacher views cleared");
            }}
            disabled={savedTeacherFilterPresets.presets.length === 0}
          >
            Clear saved views
          </Button>
        </div>
      </div>
      {selectedTeacherIds.length > 0 && (canManage || canDelete) ? (
        <div className="flex items-center justify-between rounded-[1.75rem] border border-sky-200 bg-sky-50/70 px-4 py-3 text-sm shadow-sm">
          <p>
            {selectedTeacherIds.length} teacher{selectedTeacherIds.length === 1 ? "" : "s"} selected
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setRowSelection({})}>
              Clear selection
            </Button>
            <Button
              variant="outline"
              onClick={() => exportRowsToCsv({ filename: "teachers-selected", rows: selectedTeacherExportRows })}
              disabled={selectedTeacherExportRows.length === 0}
            >
              Export selected
            </Button>
            {canManage ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => bulkStatusMutation.mutate({ ids: selectedTeacherIds, isActive: true })}
                  disabled={bulkStatusMutation.isPending || bulkDeleteMutation.isPending}
                >
                  Activate selected
                </Button>
                <Button
                  variant="outline"
                  onClick={() => bulkStatusMutation.mutate({ ids: selectedTeacherIds, isActive: false })}
                  disabled={bulkStatusMutation.isPending || bulkDeleteMutation.isPending}
                >
                  Deactivate selected
                </Button>
              </>
            ) : null}
            {canDelete ? (
              <Button
                variant="destructive"
                onClick={() => bulkDeleteMutation.mutate(selectedTeacherIds)}
                disabled={bulkDeleteMutation.isPending || bulkStatusMutation.isPending}
              >
                {bulkDeleteMutation.isPending ? "Deleting..." : "Delete selected"}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
      <DataTable
        data={filteredItems}
        columns={columns}
        pageCount={Math.ceil(query.data.total / query.data.limit)}
        pagination={{ pageIndex, pageSize: query.data.limit }}
        onPaginationChange={(state) => setPageIndex(state.pageIndex)}
        enableRowSelection
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
      />
      <Dialog open={Boolean(selectedTeacher)} onOpenChange={(nextOpen) => !nextOpen && setSelectedTeacher(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Teacher detail</DialogTitle>
            <DialogDescription>Review the faculty profile, specialization, and employment details.</DialogDescription>
          </DialogHeader>
          {selectedTeacher ? (
            <div className="space-y-3 text-sm">
              <p><span className="font-medium">Name:</span> {selectedTeacher.fullName}</p>
              <p><span className="font-medium">Employee ID:</span> {selectedTeacher.employeeId}</p>
              <p><span className="font-medium">Email:</span> {selectedTeacher.email ?? "—"}</p>
              <p><span className="font-medium">Phone:</span> {selectedTeacher.phone}</p>
              <p><span className="font-medium">Qualification:</span> {selectedTeacher.qualification ?? "—"}</p>
              <p><span className="font-medium">Specialization:</span> {selectedTeacher.specialization ?? "—"}</p>
              <p><span className="font-medium">Joined:</span> {formatDate(selectedTeacher.joinedAt)}</p>
              <p><span className="font-medium">Status:</span> {selectedTeacher.isActive ? "Active" : "Inactive"}</p>
              {user?.roles.includes("SUPER_ADMIN") ? <p><span className="font-medium">Organization:</span> {selectedTeacher.organizationName}</p> : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
