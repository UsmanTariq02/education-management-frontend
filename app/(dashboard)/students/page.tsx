"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BookOpenCheck, GraduationCap, Trash2, UserRoundCheck, UsersRound } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { batchesApi } from "@/features/batches/api/batches-api";
import { studentsApi } from "@/features/students/api/students-api";
import { studentSchema, type StudentSchema } from "@/features/students/schemas/student-schema";
import { normalizeApiError } from "@/lib/api/errors";
import type { Student } from "@/types/domain";
import { usePermission } from "@/hooks/use-permission";
import { DataTable } from "@/components/tables/data-table";
import { FilterBar } from "@/components/shared/filter-bar";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { NativeSelect } from "@/components/ui/native-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/forms/form-field";
import { formatDate } from "@/lib/formatters";
import { writePortalSession } from "@/lib/auth/portal-session";
import { OrganizationScopeBanner } from "@/components/shared/organization-scope-banner";
import { useAuth } from "@/providers/auth-provider";
import { MetricCard } from "@/components/cards/metric-card";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useSavedFilterPresets } from "@/hooks/use-saved-filter-presets";
import { exportRowsToCsv } from "@/lib/utils/export";
import { StudentBulkImportDialog } from "@/features/students/components/student-bulk-import-dialog";

export default function StudentsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [batchFilter, setBatchFilter] = useState("ALL");
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const pageSize = 10;
  const [open, setOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const canManage = usePermission("students.update");
  const canDelete = usePermission("students.delete");
  const canCreate = usePermission("students.create");
  const canManagePortalAccess = usePermission("portal-access.manage");
  const portalsEnabled = user?.enabledModules.includes("PORTALS") ?? false;
  const canMutateWithinScope = Boolean(user?.organizationId);
  const isTenantUser = Boolean(user?.organizationId) && !user?.roles.includes("SUPER_ADMIN");
  const queryClient = useQueryClient();
  const savedStudentFilterPresets = useSavedFilterPresets<{
    search: string;
    statusFilter: string;
    batchFilter: string;
  }>("students-filter-presets");
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

  const studentsQuery = useQuery({
    queryKey: ["students", debouncedSearch, pageIndex, pageSize],
    queryFn: () => studentsApi.list({ page: pageIndex + 1, limit: pageSize, search: debouncedSearch }),
  });
  const batchesQuery = useQuery({ queryKey: ["batches", "students-page"], queryFn: () => batchesApi.list({ page: 1, limit: 100 }) });

  const form = useForm<StudentSchema>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      guardianName: "",
      guardianEmail: "",
      guardianPhone: "",
      address: "",
      dateOfBirth: "",
      admissionDate: "",
      status: "ACTIVE",
      batchIds: [],
      createStudentPortal: false,
      studentPortalPassword: "",
      createParentPortal: false,
      parentPortalPassword: "",
    },
  });

  const createStudentPortal = form.watch("createStudentPortal");
  const createParentPortal = form.watch("createParentPortal");

  const mutation = useMutation({
    mutationFn: async (values: StudentSchema) => {
      const {
        createStudentPortal,
        studentPortalPassword,
        createParentPortal,
        parentPortalPassword,
        ...studentPayload
      } = values;

      if (editingStudent) return studentsApi.update(editingStudent.id, studentPayload);

      const student = await studentsApi.create(studentPayload);

      if (canManagePortalAccess && portalsEnabled && (createStudentPortal || createParentPortal)) {
        await studentsApi.upsertPortalAccess({
          id: student.id,
          payload: {
            studentEnabled: createStudentPortal || undefined,
            studentPassword: createStudentPortal ? studentPortalPassword : undefined,
            parentEnabled: createParentPortal || undefined,
            parentPassword: createParentPortal ? parentPortalPassword : undefined,
          },
        });
      }

      return student;
    },
    onSuccess: () => {
      toast.success(editingStudent ? "Student updated" : "Student created");
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setOpen(false);
      setEditingStudent(null);
      form.reset();
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => studentsApi.bulkRemove(ids),
    onSuccess: () => {
      toast.success("Selected students deleted");
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setRowSelection({});
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (targetStudent: Student) => studentsApi.remove(targetStudent.id),
    onSuccess: () => {
      toast.success("Student deleted");
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const bulkStatusMutation = useMutation({
    mutationFn: async (payload: { ids: string[]; isActive: boolean }) => studentsApi.bulkUpdateStatus(payload.ids, payload.isActive),
    onSuccess: (_, variables) => {
      toast.success(variables.isActive ? "Selected students activated" : "Selected students deactivated");
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setRowSelection({});
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const openPortalMutation = useMutation({
    mutationFn: (studentId: string) => studentsApi.portalLogin(studentId),
    onSuccess: (response) => {
      writePortalSession(response);
      toast.success("Student portal session started");
      router.push("/portal/student");
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const openParentPortalMutation = useMutation({
    mutationFn: (studentId: string) => studentsApi.parentPortalLogin(studentId),
    onSuccess: (response) => {
      writePortalSession(response);
      toast.success("Parent portal session started");
      router.push("/portal/parent");
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  useEffect(() => {
    if (!canCreate || searchParams?.get("create") !== "1" || open) {
      return;
    }

    setEditingStudent(null);
    form.reset({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      guardianName: "",
      guardianEmail: "",
      guardianPhone: "",
      address: "",
      dateOfBirth: "",
      admissionDate: "",
      status: "ACTIVE",
      batchIds: [],
      createStudentPortal: false,
      studentPortalPassword: "",
      createParentPortal: false,
      parentPortalPassword: "",
    });
    setOpen(true);
    router.replace(pathname ?? "/students", { scroll: false });
  }, [canCreate, form, open, pathname, router, searchParams]);

  const columns = useMemo<Array<ColumnDef<Student>>>(
    () => {
      const baseColumns: Array<ColumnDef<Student>> = [
        {
          accessorKey: "fullName",
          header: "Student",
          cell: ({ row }) => (
            <div>
              <Link href={`/students/${row.original.id}`} className="font-medium hover:text-primary">
                {row.original.fullName}
              </Link>
              <p className="text-xs text-muted-foreground">{row.original.phone}</p>
            </div>
          ),
        },
        {
          accessorKey: "guardianName",
          header: "Guardian",
        },
        ...(user?.roles.includes("SUPER_ADMIN")
          ? [
              {
                accessorKey: "organizationName",
                header: "Organization",
                cell: ({ row }) => row.original.organizationName,
              } satisfies ColumnDef<Student>,
            ]
          : []),
        {
          accessorKey: "batches",
          header: "Batches",
          cell: ({ row }) => (
            <div className="flex flex-wrap gap-1">
              {row.original.batches.map((batch) => (
                <Badge key={batch.id} variant="outline">
                  {batch.name}
                </Badge>
              ))}
            </div>
          ),
        },
        {
          accessorKey: "admissionDate",
          header: "Admission",
          cell: ({ row }) => formatDate(row.original.admissionDate),
        },
        {
          accessorKey: "status",
          header: "Status",
          cell: ({ row }) => <Badge variant={row.original.status === "ACTIVE" ? "success" : "warning"}>{row.original.status}</Badge>,
        },
        {
          id: "actions",
          header: "Actions",
          cell: ({ row }) => (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="rounded-full px-3 shadow-sm hover:border-primary/40 hover:bg-primary/5" asChild>
                <Link href={`/students/${row.original.id}`}>View</Link>
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
              {user?.roles.includes("SUPER_ADMIN") ? (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="rounded-full px-3 shadow-sm"
                    onClick={() => openPortalMutation.mutate(row.original.id)}
                    disabled={openPortalMutation.isPending || !row.original.email}
                  >
                    Open student portal
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="rounded-full px-3 shadow-sm"
                    onClick={() => openParentPortalMutation.mutate(row.original.id)}
                    disabled={openParentPortalMutation.isPending || !row.original.guardianEmail}
                  >
                    Open parent portal
                  </Button>
                </>
              ) : null}
              {canManage ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full px-3 shadow-sm hover:border-primary/40 hover:bg-primary/5"
                  onClick={() => {
                    setEditingStudent(row.original);
                    form.reset({
                      firstName: row.original.firstName,
                      lastName: row.original.lastName,
                      email: row.original.email ?? "",
                      phone: row.original.phone,
                      guardianName: row.original.guardianName,
                      guardianEmail: row.original.guardianEmail ?? "",
                      guardianPhone: row.original.guardianPhone,
                      address: row.original.address ?? "",
                      dateOfBirth: row.original.dateOfBirth?.slice(0, 10) ?? "",
                      admissionDate: row.original.admissionDate.slice(0, 10),
                      status: row.original.status,
                      batchIds: row.original.batches.map((batch) => batch.id),
                      createStudentPortal: false,
                      studentPortalPassword: "",
                      createParentPortal: false,
                      parentPortalPassword: "",
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
    [canManage, form, openParentPortalMutation, openPortalMutation, user?.roles],
  );

  const filteredStudents = useMemo(() => {
    const items = studentsQuery.data?.items ?? [];

    return items.filter((item) => {
      const matchesStatus = statusFilter === "ALL" ? true : item.status === statusFilter;
      const matchesBatch =
        batchFilter === "ALL" ? true : item.batches.some((batch) => batch.id === batchFilter);

      return matchesStatus && matchesBatch;
    });
  }, [batchFilter, statusFilter, studentsQuery.data]);

  const hasLocalFilters = statusFilter !== "ALL" || batchFilter !== "ALL";
  const selectedStudentIds = Object.entries(rowSelection)
    .filter(([, selected]) => selected)
    .map(([id]) => id);
  const selectedStudentExportRows = useMemo(
    () =>
      filteredStudents
        .filter((student) => selectedStudentIds.includes(student.id))
        .map((student) => ({
          Student: student.fullName,
          Phone: student.phone,
          Guardian: student.guardianName,
          GuardianEmail: student.guardianEmail ?? "",
          GuardianPhone: student.guardianPhone,
          Batches: student.batches.map((batch) => batch.name).join(", "),
          AdmissionDate: formatDate(student.admissionDate),
          Status: student.status,
        })),
    [filteredStudents, selectedStudentIds],
  );

  const exportRows = useMemo(
    () =>
      filteredStudents.map((student) => ({
        Student: student.fullName,
        Phone: student.phone,
        Guardian: student.guardianName,
        GuardianEmail: student.guardianEmail ?? "",
        GuardianPhone: student.guardianPhone,
        Batches: student.batches.map((batch) => batch.name).join(", "),
        AdmissionDate: formatDate(student.admissionDate),
        Status: student.status,
      })),
    [filteredStudents],
  );

  const studentStats = useMemo(() => {
    return {
      totalStudents: filteredStudents.length,
      activeStudents: filteredStudents.filter((item) => item.status === "ACTIVE").length,
      graduatedStudents: filteredStudents.filter((item) => item.status === "GRADUATED").length,
      batchLinks: filteredStudents.reduce((sum, item) => sum + item.batches.length, 0),
    };
  }, [filteredStudents]);
  const studentLimitReached =
    isTenantUser && user?.studentLimit !== null ? (studentsQuery.data?.total ?? 0) >= (user?.studentLimit ?? 0) : false;
  const studentCapacityText =
    isTenantUser && user?.studentLimit !== null && studentsQuery.data
      ? `${studentsQuery.data.total}/${user?.studentLimit ?? 0} student slots used for this organization`
      : "Students in the current page scope";

  if (studentsQuery.isLoading || batchesQuery.isLoading) return <LoadingState rows={6} />;
  if (studentsQuery.isError || batchesQuery.isError || !studentsQuery.data || !batchesQuery.data) {
    return <ErrorState description="Students or batches could not be loaded." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Core records"
        title="Students management"
        description="Manage admissions, guardians, batch enrollment, and operational status with search and detail views."
        actions={
          canCreate ? (
            <div className="flex flex-wrap gap-2">
              <StudentBulkImportDialog
                canCreate={canCreate}
                canMutateWithinScope={canMutateWithinScope}
                studentLimitReached={studentLimitReached}
                batches={batchesQuery.data.items}
              />
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button disabled={!canMutateWithinScope || studentLimitReached}>Create student</Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>{editingStudent ? "Edit student" : "Create student"}</DialogTitle>
                    <DialogDescription>Fields align with `CreateStudentDto` including optional batch enrollment.</DialogDescription>
                  </DialogHeader>
                  <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
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
                    <FormField label="Guardian name" required error={form.formState.errors.guardianName}>
                      <Input {...form.register("guardianName")} />
                    </FormField>
                    <FormField label="Guardian email" error={form.formState.errors.guardianEmail}>
                      <Input type="email" {...form.register("guardianEmail")} />
                    </FormField>
                    <FormField label="Guardian phone" required error={form.formState.errors.guardianPhone}>
                      <Input {...form.register("guardianPhone")} />
                    </FormField>
                    <FormField label="Date of birth" error={form.formState.errors.dateOfBirth}>
                      <Input type="date" {...form.register("dateOfBirth")} />
                    </FormField>
                    <FormField label="Admission date" required error={form.formState.errors.admissionDate}>
                      <Input type="date" {...form.register("admissionDate")} />
                    </FormField>
                    <FormField label="Address" error={form.formState.errors.address} className="md:col-span-2">
                      <Input {...form.register("address")} />
                    </FormField>
                    <div className="space-y-2 md:col-span-2">
                      <p className="text-sm font-medium">Batch enrollment</p>
                      <div className="grid gap-2 rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm sm:grid-cols-2">
                        {batchesQuery.data.items.map((batch) => (
                          <Checkbox
                            key={batch.id}
                            label={batch.name}
                            checked={form.watch("batchIds").includes(batch.id)}
                            onChange={(event) => {
                              const current = form.getValues("batchIds");
                              form.setValue(
                                "batchIds",
                                event.target.checked ? [...current, batch.id] : current.filter((item) => item !== batch.id),
                              );
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    {!editingStudent && canManagePortalAccess && portalsEnabled ? (
                      <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 shadow-sm md:col-span-2">
                        <p className="text-sm font-medium">Portal access</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Provision student and parent portal credentials during admission instead of doing it later from the student detail page.
                        </p>
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <div className="space-y-3 rounded-2xl border border-border/70 bg-background p-4 shadow-sm">
                            <Checkbox label="Create student portal now" {...form.register("createStudentPortal")} />
                            {createStudentPortal ? (
                              <FormField label="Student portal password" required error={form.formState.errors.studentPortalPassword}>
                                <Input type="password" {...form.register("studentPortalPassword")} />
                              </FormField>
                            ) : null}
                          </div>
                          <div className="space-y-3 rounded-2xl border border-border/70 bg-background p-4 shadow-sm">
                            <Checkbox label="Create parent portal now" {...form.register("createParentPortal")} />
                            {createParentPortal ? (
                              <FormField label="Parent portal password" required error={form.formState.errors.parentPortalPassword}>
                                <Input type="password" {...form.register("parentPortalPassword")} />
                              </FormField>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ) : null}
                    <div className="md:col-span-2 flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={mutation.isPending}>
                        {mutation.isPending ? "Saving..." : editingStudent ? "Update student" : "Create student"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          ) : undefined
        }
      />
      <OrganizationScopeBanner moduleLabel="Student operations" />
      <div className="rounded-[1.75rem] border border-border/70 bg-muted/30 p-4 text-sm shadow-sm">
        <p className="font-medium">Recommended use</p>
        <p className="mt-1 text-muted-foreground">
          Use this area for admissions, guardians, and batch enrollment. If the learner or parent needs portal access, provision it during admission or from the student detail page instead of creating a dashboard user.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Visible students" value={String(studentStats.totalStudents)} helper={studentCapacityText} icon={UsersRound} tone="sky" />
        <MetricCard title="Active students" value={String(studentStats.activeStudents)} helper="Currently active enrollments" icon={UserRoundCheck} tone="emerald" />
        <MetricCard title="Graduated" value={String(studentStats.graduatedStudents)} helper="Students marked as graduated" icon={GraduationCap} tone="violet" />
        <MetricCard title="Batch links" value={String(studentStats.batchLinks)} helper="Enrollment links across listed students" icon={BookOpenCheck} tone="amber" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={buildActivityLogsHref({ module: "students" })}>Audit student events</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={buildActivityLogsHref({ action: "bulk-status" })}>Audit bulk status</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={buildActivityLogsHref({ action: "bulk-delete" })}>Audit bulk deletes</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={buildActivityLogsHref({ action: "portal-access-upsert" })}>Audit portal access</Link>
        </Button>
      </div>
      {studentLimitReached ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900">
          Student limit reached for this organization. Increase the tenant student limit from the super admin organizations module before adding or importing more students.
        </div>
      ) : null}
      <FilterBar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setSelectedPresetId("");
          setPageIndex(0);
        }}
        searchPlaceholder="Search students by name, phone, or guardian..."
        filters={
          <>
            <NativeSelect
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setSelectedPresetId("");
                setPageIndex(0);
              }}
            >
              <option value="ALL">All statuses</option>
              {["ACTIVE", "INACTIVE", "SUSPENDED", "GRADUATED"].map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </NativeSelect>
            <NativeSelect
              value={batchFilter}
              onChange={(event) => {
                setBatchFilter(event.target.value);
                setSelectedPresetId("");
                setPageIndex(0);
              }}
            >
              <option value="ALL">All batches</option>
              {batchesQuery.data.items.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name}
                </option>
              ))}
            </NativeSelect>
          </>
        }
        exportConfig={{ filename: "students-management", rows: exportRows }}
      />
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.75rem] border border-border/70 bg-card/85 px-4 py-3 text-sm shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground">Saved views</span>
          <Select
            value={selectedPresetId}
            onValueChange={(presetId) => {
              const preset = savedStudentFilterPresets.presets.find((item) => item.id === presetId);
              if (!preset) {
                return;
              }

              setSearch(preset.value.search);
              setStatusFilter(preset.value.statusFilter);
              setBatchFilter(preset.value.batchFilter);
              setSelectedPresetId(preset.id);
              setPageIndex(0);
            }}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select saved view" />
            </SelectTrigger>
            <SelectContent>
              {savedStudentFilterPresets.presets.length === 0 ? (
                <SelectItem value="__none" disabled>
                  No saved views yet
                </SelectItem>
              ) : (
                savedStudentFilterPresets.presets.map((preset) => (
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
              const name = window.prompt("Save the current student filters as:");
              const preset = name
                ? savedStudentFilterPresets.savePreset(name, {
                    search,
                    statusFilter,
                    batchFilter,
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
              savedStudentFilterPresets.clearPresets();
              setSelectedPresetId("");
              toast.success("Saved student views cleared");
            }}
            disabled={savedStudentFilterPresets.presets.length === 0}
          >
            Clear saved views
          </Button>
        </div>
      </div>
      {selectedStudentIds.length > 0 && (canManage || canDelete) ? (
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-[1.75rem] border border-sky-200 bg-sky-50/90 px-4 py-3 text-sm shadow-sm backdrop-blur">
          <p>
            {selectedStudentIds.length} student{selectedStudentIds.length === 1 ? "" : "s"} selected
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setRowSelection({})}>
              Clear selection
            </Button>
            <Button
              variant="outline"
              onClick={() => exportRowsToCsv({ filename: "students-selected", rows: selectedStudentExportRows })}
              disabled={selectedStudentExportRows.length === 0}
            >
              Export selected
            </Button>
            {canManage ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => bulkStatusMutation.mutate({ ids: selectedStudentIds, isActive: true })}
                  disabled={bulkStatusMutation.isPending || bulkDeleteMutation.isPending}
                >
                  Activate selected
                </Button>
                <Button
                  variant="outline"
                  onClick={() => bulkStatusMutation.mutate({ ids: selectedStudentIds, isActive: false })}
                  disabled={bulkStatusMutation.isPending || bulkDeleteMutation.isPending}
                >
                  Deactivate selected
                </Button>
              </>
            ) : null}
            {canDelete ? (
              <Button
                variant="destructive"
                onClick={() => bulkDeleteMutation.mutate(selectedStudentIds)}
                disabled={bulkDeleteMutation.isPending || bulkStatusMutation.isPending}
              >
                {bulkDeleteMutation.isPending ? "Deleting..." : "Delete selected"}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
      <DataTable
        data={filteredStudents}
        columns={columns}
        pageCount={hasLocalFilters ? 1 : Math.ceil(studentsQuery.data.total / studentsQuery.data.limit)}
        pagination={{ pageIndex: hasLocalFilters ? 0 : studentsQuery.data.page - 1, pageSize: studentsQuery.data.limit }}
        onPaginationChange={(state) => {
          if (!hasLocalFilters) {
            setPageIndex(state.pageIndex);
          }
        }}
        enableRowSelection
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
      />
    </div>
  );
}
