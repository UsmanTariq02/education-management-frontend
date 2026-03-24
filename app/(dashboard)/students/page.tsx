"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BookOpenCheck, GraduationCap, UserRoundCheck, UsersRound } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/forms/form-field";
import { formatDate } from "@/lib/formatters";
import { OrganizationScopeBanner } from "@/components/shared/organization-scope-banner";
import { useAuth } from "@/providers/auth-provider";
import { MetricCard } from "@/components/cards/metric-card";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

export default function StudentsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [batchFilter, setBatchFilter] = useState("ALL");
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 10;
  const [open, setOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const canManage = usePermission("students.update");
  const canCreate = usePermission("students.create");
  const canMutateWithinScope = Boolean(user?.organizationId);
  const queryClient = useQueryClient();

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
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: StudentSchema) => {
      if (editingStudent) return studentsApi.update(editingStudent.id, values);
      return studentsApi.create(values);
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
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/students/${row.original.id}`}>View</Link>
              </Button>
              {canManage ? (
                <Button
                  variant="ghost"
                  size="sm"
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
    [canManage, form, user?.roles],
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
      />
      <OrganizationScopeBanner moduleLabel="Student operations" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Visible students" value={String(studentStats.totalStudents)} helper="Students in the current page scope" icon={UsersRound} tone="sky" />
        <MetricCard title="Active students" value={String(studentStats.activeStudents)} helper="Currently active enrollments" icon={UserRoundCheck} tone="emerald" />
        <MetricCard title="Graduated" value={String(studentStats.graduatedStudents)} helper="Students marked as graduated" icon={GraduationCap} tone="violet" />
        <MetricCard title="Batch links" value={String(studentStats.batchLinks)} helper="Enrollment links across listed students" icon={BookOpenCheck} tone="amber" />
      </div>
      <FilterBar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPageIndex(0);
        }}
        searchPlaceholder="Search students by name, phone, or guardian..."
        filters={
          <>
            <select
              className="h-10 rounded-xl border bg-background px-3 text-sm"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPageIndex(0);
              }}
            >
              <option value="ALL">All statuses</option>
              {["ACTIVE", "INACTIVE", "SUSPENDED", "GRADUATED"].map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <select
              className="h-10 rounded-xl border bg-background px-3 text-sm"
              value={batchFilter}
              onChange={(event) => {
                setBatchFilter(event.target.value);
                setPageIndex(0);
              }}
            >
              <option value="ALL">All batches</option>
              {batchesQuery.data.items.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name}
                </option>
              ))}
            </select>
          </>
        }
        exportConfig={{ filename: "students-management", rows: exportRows }}
        action={
          canCreate ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button disabled={!canMutateWithinScope}>Create student</Button>
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
                    <div className="grid gap-2 rounded-xl border p-4 sm:grid-cols-2">
                      {batchesQuery.data.items.map((batch) => (
                        <label key={batch.id} className="flex items-center gap-3 text-sm">
                          <input
                            type="checkbox"
                            checked={form.watch("batchIds").includes(batch.id)}
                            onChange={(event) => {
                              const current = form.getValues("batchIds");
                              form.setValue(
                                "batchIds",
                                event.target.checked ? [...current, batch.id] : current.filter((item) => item !== batch.id),
                              );
                            }}
                          />
                          <span>{batch.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
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
          ) : null
        }
      />
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
      />
    </div>
  );
}
