"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/forms/form-field";
import { useAuth } from "@/providers/auth-provider";

export default function RolesPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.roles.includes("SUPER_ADMIN") ?? false;
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const canManage = usePermission("users.update") && isSuperAdmin;
  const queryClient = useQueryClient();
  const rolesQuery = useQuery({ queryKey: ["roles"], queryFn: rolesApi.list, enabled: isSuperAdmin });
  const permissionsQuery = useQuery({ queryKey: ["permissions", "roles-page"], queryFn: rolesApi.permissions, enabled: isSuperAdmin });

  const form = useForm<RoleSchema>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      description: "",
      permissionIds: [],
    },
  });

  const filteredRoles = rolesQuery.data?.filter((role) => role.name.toLowerCase().includes(search.toLowerCase())) ?? [];

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
          <div>
            <p className="font-medium">{row.original.name}</p>
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
            <Button variant="ghost" size="sm" onClick={() => setSelectedRole(row.original)}>
              View
            </Button>
            {canManage ? (
              <Button
                variant="ghost"
                size="sm"
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
      <FilterBar
        search={search}
        onSearchChange={setSearch}
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
                    <div className="grid max-h-72 gap-2 overflow-y-auto rounded-xl border p-4">
                      {permissionsQuery.data.map((permission) => (
                        <label key={permission.id} className="flex items-center gap-3 text-sm">
                          <input
                            type="checkbox"
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
                          />
                          <span>{permission.name}</span>
                        </label>
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
      <DataTable data={filteredRoles} columns={columns} />
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
