"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BriefcaseBusiness, GraduationCap, ShieldCheck, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { MetricCard } from "@/components/cards/metric-card";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { OrganizationScopeBanner } from "@/components/shared/organization-scope-banner";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { studentsApi } from "@/features/students/api/students-api";
import { teachersApi } from "@/features/teachers/api/teachers-api";
import { usersApi } from "@/features/users/api/users-api";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useAnyPermission } from "@/hooks/use-permission";
import { useAuth } from "@/providers/auth-provider";

type DirectoryPerson = {
  id: string;
  href: string | null;
  type: "USER" | "TEACHER" | "STUDENT";
  fullName: string;
  email: string | null;
  phone: string | null;
  organizationName: string | null;
  status: string;
  secondary: string | null;
};

export default function PeopleDirectoryPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const canReadUsers = useAnyPermission(["users.read"]);
  const canReadTeachers = useAnyPermission(["teachers.read"]);
  const canReadStudents = useAnyPermission(["students.read"]);

  const usersQuery = useQuery({
    queryKey: ["people-directory", "users", debouncedSearch, user?.id ?? "guest", user?.organizationId ?? "platform"],
    queryFn: () => usersApi.list({ page: 1, limit: 100, search: debouncedSearch }),
    enabled: canReadUsers,
  });
  const teachersQuery = useQuery({
    queryKey: ["people-directory", "teachers", debouncedSearch, user?.id ?? "guest", user?.organizationId ?? "platform"],
    queryFn: () => teachersApi.list({ page: 1, limit: 100, search: debouncedSearch }),
    enabled: canReadTeachers,
  });
  const studentsQuery = useQuery({
    queryKey: ["people-directory", "students", debouncedSearch, user?.id ?? "guest", user?.organizationId ?? "platform"],
    queryFn: () => studentsApi.list({ page: 1, limit: 100, search: debouncedSearch }),
    enabled: canReadStudents,
  });

  const rows = useMemo<DirectoryPerson[]>(() => {
    const userRows =
      usersQuery.data?.items.map((item) => ({
        id: `user-${item.id}`,
        href: "/users",
        type: "USER" as const,
        fullName: `${item.firstName} ${item.lastName}`,
        email: item.email,
        phone: null,
        organizationName: item.organizationName,
        status: item.isActive ? "Active" : "Inactive",
        secondary: item.roles.join(", "),
      })) ?? [];

    const teacherRows =
      teachersQuery.data?.items.map((item) => ({
        id: `teacher-${item.id}`,
        href: "/teachers",
        type: "TEACHER" as const,
        fullName: item.fullName,
        email: item.email,
        phone: item.phone,
        organizationName: item.organizationName,
        status: item.isActive ? "Active" : "Inactive",
        secondary: item.specialization ?? item.employeeId,
      })) ?? [];

    const studentRows =
      studentsQuery.data?.items.map((item) => ({
        id: `student-${item.id}`,
        href: `/students/${item.id}`,
        type: "STUDENT" as const,
        fullName: item.fullName,
        email: item.email,
        phone: item.phone,
        organizationName: item.organizationName,
        status: item.status,
        secondary: item.guardianName,
      })) ?? [];

    return [...userRows, ...teacherRows, ...studentRows];
  }, [studentsQuery.data?.items, teachersQuery.data?.items, usersQuery.data?.items]);

  const filteredRows = useMemo(
    () => (typeFilter === "ALL" ? rows : rows.filter((row) => row.type === typeFilter)),
    [rows, typeFilter],
  );

  const stats = useMemo(
    () => ({
      total: filteredRows.length,
      users: filteredRows.filter((row) => row.type === "USER").length,
      teachers: filteredRows.filter((row) => row.type === "TEACHER").length,
      students: filteredRows.filter((row) => row.type === "STUDENT").length,
    }),
    [filteredRows],
  );

  const columns = useMemo<Array<ColumnDef<DirectoryPerson>>>(
    () => [
      {
        accessorKey: "fullName",
        header: "Person",
        cell: ({ row }) => (
          <div>
            {row.original.href ? (
              <Link href={row.original.href} className="font-medium hover:text-primary">
                {row.original.fullName}
              </Link>
            ) : (
              <p className="font-medium">{row.original.fullName}</p>
            )}
            <p className="text-xs text-muted-foreground">{row.original.email ?? row.original.phone ?? "No contact recorded"}</p>
          </div>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => <Badge variant="outline">{row.original.type}</Badge>,
      },
      ...(user?.roles.includes("SUPER_ADMIN")
        ? [
            {
              accessorKey: "organizationName",
              header: "Organization",
              cell: ({ row }) => row.original.organizationName ?? "Platform",
            } satisfies ColumnDef<DirectoryPerson>,
          ]
        : []),
      {
        accessorKey: "secondary",
        header: "Context",
        cell: ({ row }) => row.original.secondary ?? "—",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <Badge variant={row.original.status === "Active" || row.original.status === "ACTIVE" ? "success" : "warning"}>{row.original.status}</Badge>,
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) =>
          row.original.href ? (
            <Button variant="ghost" size="sm" asChild>
              <Link href={row.original.href}>
                {row.original.type === "STUDENT" ? "View" : "Open"}
              </Link>
            </Button>
          ) : null,
      },
    ],
    [user?.roles],
  );

  const isLoading = [usersQuery, teachersQuery, studentsQuery].some((query) => query.isLoading);
  const isError = [usersQuery, teachersQuery, studentsQuery].some((query) => query.isError);
  const noAccess = !canReadUsers && !canReadTeachers && !canReadStudents;

  if (noAccess) {
    return <ErrorState description="You do not have access to any people directory data." />;
  }

  if (isLoading) return <LoadingState rows={6} />;
  if (isError) return <ErrorState description="The people directory could not be loaded." />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Directory"
        title="People"
        description="Browse users, teachers, and students from one operational directory without mixing their creation flows."
      />
      <OrganizationScopeBanner moduleLabel="Unified people directory" />
      <div className="rounded-2xl border bg-muted/30 p-4 text-sm">
        <p className="font-medium">Recommended use</p>
        <p className="mt-1 text-muted-foreground">
          Use this directory to search across the whole tenant workforce and learner base. Creation still stays separated: users for access roles, teachers for faculty, and students for admissions and portal provisioning.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Visible people" value={String(stats.total)} helper="Combined users, teachers, and students" icon={Users} tone="sky" />
        <MetricCard title="Users" value={String(stats.users)} helper="Access-role identities" icon={ShieldCheck} tone="emerald" />
        <MetricCard title="Teachers" value={String(stats.teachers)} helper="Academic faculty records" icon={BriefcaseBusiness} tone="violet" />
        <MetricCard title="Students" value={String(stats.students)} helper="Admissions and learner records" icon={GraduationCap} tone="amber" />
      </div>
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search across users, teachers, and students..."
        filters={
          <select className="h-10 rounded-xl border bg-background px-3 text-sm" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            <option value="ALL">All people</option>
            <option value="USER">Users</option>
            <option value="TEACHER">Teachers</option>
            <option value="STUDENT">Students</option>
          </select>
        }
      />
      <DataTable data={filteredRows} columns={columns} />
    </div>
  );
}
