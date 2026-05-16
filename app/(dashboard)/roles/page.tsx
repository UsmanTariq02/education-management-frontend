"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { rolesApi } from "@/features/roles/api/roles-api";
import { roleSchema, type RoleSchema } from "@/features/roles/schemas/role-schema";
import { normalizeApiError } from "@/lib/api/errors";
import type { Role } from "@/types/domain";
import { usePermission } from "@/hooks/use-permission";
import { DataTable } from "@/components/tables/data-table";
import { FilterBar } from "@/components/shared/filter-bar";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/forms/form-field";
import { useAuth } from "@/providers/auth-provider";

const buildActivityLogsHref = (params: Record<string, string | undefined>) => {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      query.set(key, value);
    }
  }

  return query.toString() ? `/activity-logs?${query.toString()}` : "/activity-logs";
};

const roleTemplateDefinitions = [
  {
    key: "school-admin",
    name: "School Admin",
    description: "Full operational access for day-to-day school administration without platform-wide privileges.",
    starterDescription: "Covers users, students, finance, academics, and operational logs.",
    permissionNames: [
      "users.create",
      "users.read",
      "users.update",
      "students.create",
      "students.read",
      "students.update",
      "portal-access.read",
      "portal-access.manage",
      "student-documents.read",
      "student-documents.manage",
      "organization-assets.read",
      "organization-assets.manage",
      "batches.create",
      "batches.read",
      "batches.update",
      "academic-sessions.create",
      "academic-sessions.read",
      "academic-sessions.update",
      "subjects.create",
      "subjects.read",
      "subjects.update",
      "teachers.create",
      "teachers.read",
      "teachers.update",
      "batch-subject-assignments.create",
      "batch-subject-assignments.read",
      "batch-subject-assignments.update",
      "timetables.create",
      "timetables.read",
      "timetables.update",
      "online-classes.create",
      "online-classes.read",
      "online-classes.update",
      "exams.create",
      "exams.read",
      "exams.update",
      "assignments.create",
      "assignments.read",
      "assignments.update",
      "assessments.create",
      "assessments.read",
      "assessments.update",
      "exam-results.create",
      "exam-results.read",
      "exam-results.update",
      "fees.create",
      "fees.read",
      "fees.update",
      "attendance.create",
      "attendance.read",
      "attendance.update",
      "mail.create",
      "mail.read",
      "mail.update",
      "reminders.create",
      "reminders.read",
      "reminders.update",
      "reports.read",
      "activity-logs.read",
      "settings.update",
    ],
  },
  {
    key: "admissions",
    name: "Admissions Officer",
    description: "Focused on intake, learner records, and portal onboarding.",
    starterDescription: "Good for admissions desks and front-office teams.",
    permissionNames: [
      "users.read",
      "students.create",
      "students.read",
      "students.update",
      "portal-access.read",
      "portal-access.manage",
      "student-documents.read",
      "student-documents.manage",
      "batches.read",
      "academic-sessions.read",
      "reports.read",
      "activity-logs.read",
    ],
  },
  {
    key: "accountant",
    name: "Accountant",
    description: "Controls fee collection, reminders, and billing visibility.",
    starterDescription: "Best for finance and collections teams.",
    permissionNames: [
      "students.read",
      "fees.create",
      "fees.read",
      "fees.update",
      "attendance.read",
      "reminders.create",
      "reminders.read",
      "reminders.update",
      "reports.read",
      "activity-logs.read",
      "portal-fees.read",
    ],
  },
  {
    key: "teacher",
    name: "Teacher",
    description: "Supports teaching, attendance, assessments, and class delivery.",
    starterDescription: "Ideal for classroom staff and subject teachers.",
    permissionNames: [
      "students.read",
      "batches.read",
      "academic-sessions.read",
      "subjects.read",
      "teachers.read",
      "attendance.create",
      "attendance.read",
      "attendance.update",
      "assessments.create",
      "assessments.read",
      "assessments.update",
      "exams.read",
      "assignments.create",
      "assignments.read",
      "assignments.update",
      "exam-results.read",
      "portal-timetable.read",
      "portal-results.read",
      "portal-attendance.read",
    ],
  },
] as const;

export default function RolesPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.roles.includes("SUPER_ADMIN") ?? false;
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const pageSize = 10;
  const canManage = usePermission("users.update") && isSuperAdmin;
  const queryClient = useQueryClient();
  const rolesQuery = useQuery({ queryKey: ["roles"], queryFn: rolesApi.list, enabled: isSuperAdmin });
  const permissionsQuery = useQuery({ queryKey: ["permissions", "roles-page"], queryFn: rolesApi.permissions, enabled: isSuperAdmin });
  const roleTemplates = useMemo(
    () =>
      roleTemplateDefinitions.map((template) => {
        const permissionIds = template.permissionNames
          .map((permissionName) => permissionsQuery.data?.find((permission) => permission.name === permissionName)?.id)
          .filter((permissionId): permissionId is string => Boolean(permissionId));

        return {
          ...template,
          permissionIds,
        };
      }),
    [permissionsQuery.data],
  );

  const form = useForm<RoleSchema>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      description: "",
      permissionIds: [],
    },
  });

  const applyRoleTemplate = (templateKey: string) => {
    const template = roleTemplates.find((item) => item.key === templateKey);
    if (!template) {
      return;
    }

    setEditingRole(null);
    form.reset({
      name: template.name,
      description: template.starterDescription,
      permissionIds: template.permissionIds,
    });
    setOpen(true);
  };

  const filteredRoles = rolesQuery.data?.filter((role) => role.name.toLowerCase().includes(search.toLowerCase())) ?? [];
  const pageCount = Math.max(1, Math.ceil(filteredRoles.length / pageSize));
  const pagedRoles = useMemo(
    () => filteredRoles.slice(pageIndex * pageSize, pageIndex * pageSize + pageSize),
    [filteredRoles, pageIndex, pageSize],
  );

  const mutation = useMutation({
    mutationFn: async (values: RoleSchema) => {
      if (editingRole) return rolesApi.update(editingRole.id, values);
      return rolesApi.create(values);
    },
    onSuccess: () => {
      toast.success(editingRole ? "Role updated" : "Role created");
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setOpen(false);
      setEditingRole(null);
      form.reset();
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const columns = useMemo<Array<ColumnDef<Role>>>(
    () => [
      {
        accessorKey: "name",
        header: "Role",
        cell: ({ row }) => (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <p className="font-medium">{row.original.name}</p>
            </div>
            <p className="text-xs text-muted-foreground">{row.original.description}</p>
          </div>
        ),
      },
      {
        accessorKey: "rolePermissions",
        header: "Permission matrix",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.rolePermissions.map((entry) => (
              <Badge key={entry.permissionId} variant="outline">
                {entry.permission.name}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-full px-3 shadow-sm hover:border-primary/40 hover:bg-primary/5" onClick={() => setSelectedRole(row.original)}>
              View
              <ArrowUpRight className="h-4 w-4" />
            </Button>
            {canManage ? (
              <Button
                variant="outline"
                size="sm"
                className="rounded-full px-3 shadow-sm hover:border-primary/40 hover:bg-primary/5"
                onClick={() => {
                  setEditingRole(row.original);
                  form.reset({
                    name: row.original.name,
                    description: row.original.description ?? "",
                    permissionIds: row.original.rolePermissions.map((entry) => entry.permissionId),
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

  const exportRows = useMemo(
    () =>
      filteredRoles.map((role) => ({
        Role: role.name,
        Description: role.description ?? "",
        Permissions: role.rolePermissions.map((entry) => entry.permission.name).join(", "),
      })),
    [filteredRoles],
  );

  if (!isSuperAdmin) {
    return <ErrorState title="Access restricted" description="Roles management is available only in the super admin module." />;
  }

  if (rolesQuery.isLoading || permissionsQuery.isLoading) return <LoadingState rows={6} />;
  if (rolesQuery.isError || permissionsQuery.isError || !rolesQuery.data || !permissionsQuery.data) {
    return <ErrorState description="Roles or permissions could not be loaded." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Authorization" title="Roles management" description="Create operational roles and assign permission sets by module." />
      {canManage ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {roleTemplates.map((template) => (
            <Card key={template.key} className="border-slate-200 bg-slate-50/70">
              <CardHeader className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <Badge variant="outline">{template.permissionIds.length} permissions</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{template.description}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">{template.starterDescription}</p>
                <div className="flex flex-wrap gap-1">
                  {template.permissionNames.slice(0, 6).map((permissionName) => (
                    <Badge key={permissionName} variant="secondary">
                      {permissionName}
                    </Badge>
                  ))}
                  {template.permissionNames.length > 6 ? <Badge variant="outline">+{template.permissionNames.length - 6} more</Badge> : null}
                </div>
                <Button type="button" className="w-full" variant="outline" onClick={() => applyRoleTemplate(template.key)}>
                  Use template
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
          Role templates are available when the current super admin can manage roles.
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" asChild>
          <Link href={buildActivityLogsHref({ module: "roles" })}>Audit role events</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={buildActivityLogsHref({ module: "roles", action: "create" })}>Audit role creation</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={buildActivityLogsHref({ module: "roles", action: "update" })}>Audit role updates</Link>
        </Button>
      </div>
      <FilterBar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPageIndex(0);
        }}
        exportConfig={{ filename: "roles-management", rows: exportRows }}
        action={
          canManage ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>Create role</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingRole ? "Edit role" : "Create role"}</DialogTitle>
                  <DialogDescription>Use grouped permissions to build role-specific access boundaries.</DialogDescription>
                </DialogHeader>
                <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
                  <FormField label="Role name" required error={form.formState.errors.name}>
                    <Input {...form.register("name")} />
                  </FormField>
                  <FormField label="Description" error={form.formState.errors.description}>
                    <Input {...form.register("description")} />
                  </FormField>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Permissions</p>
                    <div className="grid max-h-72 gap-2 overflow-y-auto rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm">
                      {permissionsQuery.data.map((permission) => (
                        <Checkbox
                          key={permission.id}
                          checked={form.watch("permissionIds").includes(permission.id)}
                          onChange={(event) => {
                            const current = form.getValues("permissionIds");
                            form.setValue(
                              "permissionIds",
                              event.target.checked
                                ? [...current, permission.id]
                                : current.filter((item) => item !== permission.id),
                            );
                          }}
                          label={permission.name}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={mutation.isPending}>
                      {mutation.isPending ? "Saving..." : editingRole ? "Update role" : "Create role"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />
      <DataTable
        data={pagedRoles}
        columns={columns}
        pageCount={pageCount}
        pagination={{ pageIndex, pageSize }}
        onPaginationChange={(state) => setPageIndex(Math.min(state.pageIndex, pageCount - 1))}
      />
      <Dialog open={Boolean(selectedRole)} onOpenChange={(nextOpen) => !nextOpen && setSelectedRole(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Role detail</DialogTitle>
            <DialogDescription>Review the complete permission set assigned to this role.</DialogDescription>
          </DialogHeader>
          {selectedRole ? (
            <div className="space-y-3 text-sm">
              <p><span className="font-medium">Role:</span> {selectedRole.name}</p>
              <p><span className="font-medium">Description:</span> {selectedRole.description ?? "N/A"}</p>
              <div>
                <p className="mb-2 font-medium">Permissions</p>
                <div className="flex flex-wrap gap-2">
                  {selectedRole.rolePermissions.map((entry) => (
                    <Badge key={entry.permissionId} variant="outline">{entry.permission.name}</Badge>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
