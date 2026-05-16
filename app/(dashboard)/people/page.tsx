"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, BriefcaseBusiness, GraduationCap, ShieldCheck, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { MetricCard } from "@/components/cards/metric-card";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { OrganizationScopeBanner } from "@/components/shared/organization-scope-banner";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { studentsApi } from "@/features/students/api/students-api";
import { teachersApi } from "@/features/teachers/api/teachers-api";
import { usersApi } from "@/features/users/api/users-api";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useAnyPermission, usePermission } from "@/hooks/use-permission";
import { useSavedFilterPresets } from "@/hooks/use-saved-filter-presets";
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
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 12;
  const canReadUsers = useAnyPermission(["users.read"]);
  const canReadTeachers = useAnyPermission(["teachers.read"]);
  const canReadStudents = useAnyPermission(["students.read"]);
  const canCreateUsers = usePermission("users.create");
  const canCreateStudents = usePermission("students.create");
  const canManageUsers = usePermission("users.update");
  const canManageTeachers = usePermission("teachers.update");
  const canManageStudents = usePermission("students.update");
  const savedPeopleFilterPresets = useSavedFilterPresets<{
    search: string;
    typeFilter: string;
  }>("people-filter-presets");

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

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const pagedRows = useMemo(
    () => filteredRows.slice(pageIndex * pageSize, pageIndex * pageSize + pageSize),
    [filteredRows, pageIndex, pageSize],
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
        header: "Action",
        cell: ({ row }) => {
          if (!row.original.href) return null;

          const label =
            row.original.type === "STUDENT"
              ? canManageStudents
                ? "View Profile"
                : "Open"
              : row.original.type === "TEACHER"
                ? canManageTeachers
                  ? "Manage"
                  : "Open"
                : canManageUsers
                  ? "Manage"
                  : "Open";

          return (
            <Button variant="outline" size="sm" className="rounded-full px-3 shadow-sm hover:border-primary/40 hover:bg-primary/5" asChild>
              <Link href={row.original.href}>
                {label}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          );
        },
      },
    ],
    [canManageStudents, canManageTeachers, canManageUsers, user?.roles],
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
      <div className="rounded-[1.75rem] border border-border/70 bg-muted/30 p-4 text-sm shadow-sm">
        <p className="font-medium">Recommended use</p>
        <p className="mt-1 text-muted-foreground">
          Use this directory to search across the whole tenant workforce and learner base. Creation still stays separated: users for access roles, teachers for faculty, and students for admissions and portal provisioning.
        </p>
      </div>
      {canCreateUsers || canCreateStudents ? (
        <div className="flex flex-wrap items-center gap-2 rounded-[1.75rem] border border-border/70 bg-card/85 px-4 py-3 shadow-sm backdrop-blur">
          <span className="text-sm font-medium text-muted-foreground">Quick create</span>
          {canCreateUsers ? (
            <Button variant="outline" size="sm" asChild>
              <Link href="/users?create=1">Add user</Link>
            </Button>
          ) : null}
          {canCreateStudents ? (
            <Button variant="outline" size="sm" asChild>
              <Link href="/students?create=1">Add student</Link>
            </Button>
          ) : null}
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Visible people" value={String(stats.total)} helper="Combined users, teachers, and students" icon={Users} tone="sky" />
        <MetricCard title="Users" value={String(stats.users)} helper="Access-role identities" icon={ShieldCheck} tone="emerald" />
        <MetricCard title="Teachers" value={String(stats.teachers)} helper="Academic faculty records" icon={BriefcaseBusiness} tone="violet" />
        <MetricCard title="Students" value={String(stats.students)} helper="Admissions and learner records" icon={GraduationCap} tone="amber" />
      </div>
      <FilterBar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPageIndex(0);
        }}
        searchPlaceholder="Search across users, teachers, and students..."
        filters={
          <NativeSelect
            value={typeFilter}
            onChange={(event) => {
              setTypeFilter(event.target.value);
              setPageIndex(0);
            }}
            className="min-w-[180px]"
          >
            <option value="ALL">All people</option>
            <option value="USER">Users</option>
            <option value="TEACHER">Teachers</option>
            <option value="STUDENT">Students</option>
          </NativeSelect>
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.75rem] border border-border/70 bg-card/85 px-4 py-3 text-sm shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground">Saved views</span>
          <Select
            value={selectedPresetId}
            onValueChange={(presetId) => {
              const preset = savedPeopleFilterPresets.presets.find((item) => item.id === presetId);
              if (!preset) return;
              setSearch(preset.value.search);
              setTypeFilter(preset.value.typeFilter);
              setSelectedPresetId(preset.id);
              setPageIndex(0);
            }}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select saved view" />
            </SelectTrigger>
            <SelectContent>
              {savedPeopleFilterPresets.presets.length === 0 ? (
                <SelectItem value="__none" disabled>
                  No saved views yet
                </SelectItem>
              ) : (
                savedPeopleFilterPresets.presets.map((preset) => (
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
              const name = window.prompt("Save the current people search as:");
              const preset = name ? savedPeopleFilterPresets.savePreset(name, { search, typeFilter }) : null;
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
              savedPeopleFilterPresets.clearPresets();
              setSelectedPresetId("");
              toast.success("Saved people views cleared");
            }}
            disabled={savedPeopleFilterPresets.presets.length === 0}
          >
            Clear saved views
          </Button>
        </div>
      </div>
      <DataTable
        data={pagedRows}
        columns={columns}
        pageCount={pageCount}
        pagination={{ pageIndex, pageSize }}
        onPaginationChange={(state) => setPageIndex(Math.min(state.pageIndex, pageCount - 1))}
      />
    </div>
  );
}
