"use client";

import { useMemo, useState } from "react";
import { ShieldCheck, UserCheck, UserCog, UserX } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { organizationsApi } from "@/features/organizations/api/organizations-api";
import { rolesApi } from "@/features/roles/api/roles-api";
import { usersApi } from "@/features/users/api/users-api";
import { userSchema, type UserSchema } from "@/features/users/schemas/user-schema";
import { normalizeApiError } from "@/lib/api/errors";
import type { UpdateUserDto } from "@/types/dto";
import type { User } from "@/types/domain";
import { usePermission } from "@/hooks/use-permission";
import { DataTable } from "@/components/tables/data-table";
import { FilterBar } from "@/components/shared/filter-bar";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/forms/form-field";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/formatters";
import { useAuth } from "@/providers/auth-provider";
import { OrganizationScopeBanner } from "@/components/shared/organization-scope-banner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MetricCard } from "@/components/cards/metric-card";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

export default function UsersPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 10;
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [rolePresetName, setRolePresetName] = useState<string | null>(null);
  const canManage = usePermission("users.update");
  const canCreate = usePermission("users.create");
  const queryClient = useQueryClient();
  const isTenantAdmin = Boolean(user?.organizationId) && !user?.roles.includes("SUPER_ADMIN");
  const assignableRoleNames = useMemo(() => {
    if (user?.roles.includes("SUPER_ADMIN")) {
      return new Set(["SUPER_ADMIN", "ADMIN", "ACADEMIC_COORDINATOR", "TEACHER", "STAFF"]);
    }

    if (user?.roles.includes("ADMIN")) {
      return new Set(["ADMIN", "ACADEMIC_COORDINATOR", "TEACHER", "STAFF"]);
    }

    if (user?.roles.includes("ACADEMIC_COORDINATOR")) {
      return new Set(["TEACHER", "STAFF"]);
    }

    return new Set(["STAFF"]);
  }, [user?.roles]);

  const usersQuery = useQuery({
    queryKey: ["users", user?.id ?? "guest", user?.organizationId ?? "platform", debouncedSearch, pageIndex, pageSize],
    queryFn: () => usersApi.list({ page: pageIndex + 1, limit: pageSize, search: debouncedSearch }),
  });
  const shouldLoadReferenceData = open || Boolean(selectedUser) || Boolean(editingUser);
  const rolesQuery = useQuery({
    queryKey: ["roles", "users-page"],
    queryFn: rolesApi.list,
    enabled: shouldLoadReferenceData,
  });
  const organizationsQuery = useQuery({
    queryKey: ["organizations", "users-page"],
    queryFn: () => organizationsApi.list({ page: 1, limit: 100 }),
    enabled: (user?.roles.includes("SUPER_ADMIN") ?? false) && shouldLoadReferenceData,
  });

  const form = useForm<UserSchema>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      organizationId: undefined,
      isActive: true,
      roleIds: [],
    },
  });

  const mutation = useMutation<unknown, Error, UserSchema>({
    mutationFn: async (values: UserSchema) => {
      if (!editingUser && !values.password) {
        throw new Error("Password is required for new users");
      }

      const payload: UpdateUserDto = {
        ...values,
        password: values.password || undefined,
      };

      if (editingUser) {
        return usersApi.update(editingUser.id, payload);
      }
      return usersApi.create({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        organizationId: values.organizationId,
        isActive: values.isActive,
        roleIds: values.roleIds,
        password: values.password ?? "",
      });
    },
    onSuccess: () => {
      toast.success(editingUser ? "User updated" : "User created");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setOpen(false);
      setEditingUser(null);
      form.reset();
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ targetUser, isActive }: { targetUser: User; isActive: boolean }) =>
      usersApi.update(targetUser.id, { isActive }),
    onSuccess: (_, variables) => {
      toast.success(variables.isActive ? "User activated" : "User deactivated");
      void queryClient.invalidateQueries({ queryKey: ["users"] });
      if (selectedUser?.id === variables.targetUser.id) {
        setSelectedUser({
          ...variables.targetUser,
          isActive: variables.isActive,
        });
      }
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const assignableRoles = useMemo(
    () => (rolesQuery.data ?? []).filter((role) => assignableRoleNames.has(role.name)),
    [assignableRoleNames, rolesQuery.data],
  );
  const academicCoordinatorRole = useMemo(
    () => assignableRoles.find((role) => role.name === "ACADEMIC_COORDINATOR") ?? null,
    [assignableRoles],
  );
  const adminRole = useMemo(
    () => assignableRoles.find((role) => role.name === "ADMIN") ?? null,
    [assignableRoles],
  );
  const staffRole = useMemo(
    () => assignableRoles.find((role) => role.name === "STAFF") ?? null,
    [assignableRoles],
  );
  const selectedRoleNames = useMemo(
    () =>
      assignableRoles
        .filter((role) => form.watch("roleIds").includes(role.id))
        .map((role) => role.name),
    [assignableRoles, form],
  );
  const isAcademicCoordinatorFlow = selectedRoleNames.includes("ACADEMIC_COORDINATOR");
  const isAdminFlow = selectedRoleNames.includes("ADMIN");
  const isStaffFlow = selectedRoleNames.includes("STAFF");

  const canManageTargetUser = (targetUser: User): boolean => targetUser.roles.every((role) => assignableRoleNames.has(role));

  const openCreateUserDialog = (presetRoleName?: string) => {
    setEditingUser(null);
    setRolePresetName(presetRoleName ?? null);

    const presetRoleIds = presetRoleName
      ? assignableRoles.filter((role) => role.name === presetRoleName).map((role) => role.id)
      : [];

    form.reset({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      organizationId: user?.roles.includes("SUPER_ADMIN") ? undefined : user?.organizationId ?? undefined,
      isActive: true,
      roleIds: presetRoleIds,
    });
    setOpen(true);
  };

  const columns = useMemo<Array<ColumnDef<User>>>(
    () => [
      {
        accessorKey: "firstName",
        header: "User",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{`${row.original.firstName} ${row.original.lastName}`}</p>
            <p className="text-xs text-muted-foreground">{row.original.email}</p>
          </div>
        ),
      },
      {
        accessorKey: "organizationName",
        header: "Organization",
        cell: ({ row }) => row.original.organizationName ?? <span className="text-muted-foreground">Platform</span>,
      },
      {
        accessorKey: "roles",
        header: "Roles",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.roles.map((role) => (
              <Badge key={role} variant="outline">
                {role}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => <Badge variant={row.original.isActive ? "success" : "warning"}>{row.original.isActive ? "Active" : "Inactive"}</Badge>,
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedUser(row.original)}>
              View
            </Button>
            {canManage ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!canManageTargetUser(row.original)}
                  onClick={() => {
                    if (!canManageTargetUser(row.original)) {
                      return;
                    }
                    setEditingUser(row.original);
                    setRolePresetName(null);
                    form.reset({
                      firstName: row.original.firstName,
                      lastName: row.original.lastName,
                      email: row.original.email,
                      password: "",
                      organizationId: row.original.organizationId ?? undefined,
                      isActive: row.original.isActive,
                      roleIds: rolesQuery.data
                        ?.filter((role) => row.original.roles.includes(role.name))
                        .map((role) => role.id) ?? [],
                    });
                    setOpen(true);
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!canManageTargetUser(row.original) || toggleActiveMutation.isPending}
                  onClick={() => {
                    if (!canManageTargetUser(row.original)) {
                      return;
                    }
                    toggleActiveMutation.mutate({
                      targetUser: row.original,
                      isActive: !row.original.isActive,
                    });
                  }}
                >
                  {row.original.isActive ? "Deactivate" : "Activate"}
                </Button>
              </>
            ) : null}
          </div>
        ),
      },
    ],
    [assignableRoleNames, canManage, form, rolesQuery.data],
  );

  const filteredUsers = useMemo(() => {
    const items = usersQuery.data?.items ?? [];

    return items.filter((item) => {
      const matchesStatus =
        statusFilter === "ALL" ? true : statusFilter === "ACTIVE" ? item.isActive : !item.isActive;
      const matchesRole = roleFilter === "ALL" ? true : item.roles.includes(roleFilter);

      return matchesStatus && matchesRole;
    });
  }, [roleFilter, statusFilter, usersQuery.data]);

  const hasLocalFilters = statusFilter !== "ALL" || roleFilter !== "ALL";

  const exportRows = useMemo(
    () =>
      filteredUsers.map((user) => ({
        Name: `${user.firstName} ${user.lastName}`,
        Email: user.email,
        Roles: user.roles.join(", "),
        Status: user.isActive ? "Active" : "Inactive",
        Created: formatDate(user.createdAt),
      })),
    [filteredUsers],
  );

  const userStats = useMemo(() => {
    return {
      totalUsers: filteredUsers.length,
      activeUsers: filteredUsers.filter((item) => item.isActive).length,
      inactiveUsers: filteredUsers.filter((item) => !item.isActive).length,
      totalRolesAssigned: filteredUsers.reduce((sum, item) => sum + item.roles.length, 0),
    };
  }, [filteredUsers]);
  const userLimitReached =
    isTenantAdmin && user?.userLimit !== null ? (usersQuery.data?.total ?? 0) >= (user?.userLimit ?? 0) : false;
  const userCapacityText =
    isTenantAdmin && user?.userLimit !== null && usersQuery.data
      ? `${usersQuery.data.total}/${user?.userLimit ?? 0} user slots used for this organization`
      : "Users in the current page scope";

  if (usersQuery.isLoading) return <LoadingState rows={6} />;
  if (usersQuery.isError || !usersQuery.data) return <ErrorState description="Users could not be loaded." onRetry={() => usersQuery.refetch()} />;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Access control" title="Users management" description="Manage user accounts, activation states, and role assignment." />
      <OrganizationScopeBanner moduleLabel="User access control" />
      <div className="rounded-2xl border bg-muted/30 p-4 text-sm">
        <p className="font-medium">Recommended use</p>
        <p className="mt-1 text-muted-foreground">
          Use this area for organization access roles like admins, academic coordinators, and staff. For faculty onboarding, create the teacher profile first and provision login there. For learners, create the student record first and enable portal access there.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Visible users" value={String(userStats.totalUsers)} helper={userCapacityText} icon={UserCog} tone="sky" />
        <MetricCard title="Active users" value={String(userStats.activeUsers)} helper="Accounts currently enabled" icon={UserCheck} tone="emerald" />
        <MetricCard title="Inactive users" value={String(userStats.inactiveUsers)} helper="Accounts blocked from login" icon={UserX} tone="amber" />
        <MetricCard title="Role assignments" value={String(userStats.totalRolesAssigned)} helper="Total role entries across listed users" icon={ShieldCheck} tone="violet" />
      </div>
      {userLimitReached ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900">
          User limit reached for this organization. Increase the tenant user limit from the super admin organizations module before adding more users.
        </div>
      ) : null}
      <FilterBar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPageIndex(0);
        }}
        searchPlaceholder="Search users by name or email..."
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
              <option value="ACTIVE">Active only</option>
              <option value="INACTIVE">Inactive only</option>
            </select>
            <select
              className="h-10 rounded-xl border bg-background px-3 text-sm"
              value={roleFilter}
              onChange={(event) => {
                setRoleFilter(event.target.value);
                setPageIndex(0);
              }}
            >
              <option value="ALL">All roles</option>
              {assignableRoles.map((role) => (
                <option key={role.id} value={role.name}>
                  {role.name}
                </option>
              ))}
            </select>
          </>
        }
        exportConfig={{ filename: "users-management", rows: exportRows }}
        action={
          canCreate ? (
            <Dialog
              open={open}
              onOpenChange={(nextOpen) => {
                setOpen(nextOpen);
                if (!nextOpen) {
                  setEditingUser(null);
                  setRolePresetName(null);
                  form.reset();
                }
              }}
            >
              <div className="flex flex-wrap items-center gap-2">
                {adminRole ? (
                  <Button variant="outline" disabled={userLimitReached} onClick={() => openCreateUserDialog("ADMIN")}>
                    Create admin
                  </Button>
                ) : null}
                {academicCoordinatorRole ? (
                  <Button variant="outline" disabled={userLimitReached} onClick={() => openCreateUserDialog("ACADEMIC_COORDINATOR")}>
                    Create academic coordinator
                  </Button>
                ) : null}
                {staffRole ? (
                  <Button variant="outline" disabled={userLimitReached} onClick={() => openCreateUserDialog("STAFF")}>
                    Create staff
                  </Button>
                ) : null}
                <DialogTrigger asChild>
                  <Button disabled={userLimitReached} onClick={() => openCreateUserDialog()}>
                    Create user
                  </Button>
                </DialogTrigger>
              </div>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingUser
                      ? "Edit user"
                      : rolePresetName === "ADMIN"
                        ? "Create admin"
                        : rolePresetName === "ACADEMIC_COORDINATOR"
                          ? "Create academic coordinator"
                          : rolePresetName === "STAFF"
                            ? "Create staff"
                            : "Create user"}
                  </DialogTitle>
                  <DialogDescription>
                    {rolePresetName === "ADMIN"
                      ? "This guided flow provisions an organization admin account without manually assembling the role assignment."
                      : rolePresetName === "ACADEMIC_COORDINATOR"
                        ? "This guided flow provisions an academic coordinator account without manually assembling the role assignment."
                        : rolePresetName === "STAFF"
                          ? "This guided flow provisions a staff account without manually assembling the role assignment."
                          : "Fields align with `CreateUserDto` and `UpdateUserDto` from the NestJS backend."}
                  </DialogDescription>
                </DialogHeader>
                <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
                  <FormField label="First name" required error={form.formState.errors.firstName}>
                    <Input {...form.register("firstName")} />
                  </FormField>
                  <FormField label="Last name" required error={form.formState.errors.lastName}>
                    <Input {...form.register("lastName")} />
                  </FormField>
                  <FormField label="Email" required error={form.formState.errors.email} className="md:col-span-2">
                    <Input type="email" {...form.register("email")} />
                  </FormField>
                  {user?.roles.includes("SUPER_ADMIN") ? (
                    <div className="space-y-2 md:col-span-2">
                      <p className="text-sm font-medium">Organization</p>
                      <Select value={form.watch("organizationId")} onValueChange={(value) => form.setValue("organizationId", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select organization" />
                        </SelectTrigger>
                        <SelectContent>
                          {organizationsQuery.data?.items.map((organization) => (
                            <SelectItem key={organization.id} value={organization.id}>
                              {organization.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.organizationId ? (
                        <p className="text-xs text-destructive">{form.formState.errors.organizationId.message}</p>
                      ) : null}
                    </div>
                  ) : null}
                  <FormField label="Password" required={!editingUser} error={form.formState.errors.password} className="md:col-span-2">
                    <Input type="password" {...form.register("password")} />
                  </FormField>
                  <div className="space-y-2 md:col-span-2">
                    <p className="text-sm font-medium">Roles</p>
                    {rolePresetName ? (
                      <div className="rounded-xl border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                        Role preset: <span className="font-medium text-foreground">{rolePresetName.replaceAll("_", " ")}</span>
                      </div>
                    ) : null}
                    <div className="grid gap-2 rounded-xl border p-4">
                      {assignableRoles.map((role) => (
                        <Checkbox
                          key={role.id}
                          checked={form.watch("roleIds").includes(role.id)}
                          onChange={(event) => {
                            const current = form.getValues("roleIds");
                            form.setValue(
                              "roleIds",
                              event.target.checked ? [...current, role.id] : current.filter((item) => item !== role.id),
                              { shouldValidate: true, shouldDirty: true },
                            );
                          }}
                          label={role.name}
                        />
                      ))}
                    </div>
                    {form.formState.errors.roleIds ? <p className="text-xs text-destructive">{form.formState.errors.roleIds.message}</p> : null}
                  </div>
                  {(isAdminFlow || isAcademicCoordinatorFlow || isStaffFlow) && !editingUser ? (
                    <div className="rounded-2xl border bg-muted/30 p-4 text-sm md:col-span-2">
                      {isAdminFlow
                        ? "Admins are best used for organization-wide operations, access control, student records, academics, and tenant settings."
                        : isAcademicCoordinatorFlow
                          ? "Academic coordinators are best used for academic operations oversight, including subjects, teachers, timetables, exams, and report workflows."
                          : "Staff accounts are best used for day-to-day support work with restricted permissions and no platform governance access."}
                    </div>
                  ) : null}
                  <Checkbox
                    checked={form.watch("isActive")}
                    onChange={(event) => form.setValue("isActive", event.target.checked, { shouldDirty: true })}
                    label="User account is active"
                    containerClassName="md:col-span-2"
                  />
                  <div className="md:col-span-2 flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={mutation.isPending}>
                      {mutation.isPending ? "Saving..." : editingUser ? "Update user" : "Create user"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />
      <DataTable
        data={filteredUsers}
        columns={columns}
        pageCount={hasLocalFilters ? 1 : Math.ceil(usersQuery.data.total / usersQuery.data.limit)}
        pagination={{ pageIndex: hasLocalFilters ? 0 : usersQuery.data.page - 1, pageSize: usersQuery.data.limit }}
        onPaginationChange={(state) => {
          if (!hasLocalFilters) {
            setPageIndex(state.pageIndex);
          }
        }}
      />
      <Dialog open={Boolean(selectedUser)} onOpenChange={(nextOpen) => !nextOpen && setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User detail</DialogTitle>
            <DialogDescription>Review the complete user record and role assignment.</DialogDescription>
          </DialogHeader>
          {selectedUser ? (
            <div className="space-y-3 text-sm">
              <p><span className="font-medium">Name:</span> {selectedUser.firstName} {selectedUser.lastName}</p>
              <p><span className="font-medium">Email:</span> {selectedUser.email}</p>
              <p><span className="font-medium">Organization:</span> {selectedUser.organizationName ?? "Platform"}</p>
              <p><span className="font-medium">Status:</span> {selectedUser.isActive ? "Active" : "Inactive"}</p>
              <p><span className="font-medium">Roles:</span> {selectedUser.roles.join(", ") || "No roles"}</p>
              <p><span className="font-medium">Permissions:</span> {selectedUser.permissions.join(", ") || "No permissions"}</p>
              <p><span className="font-medium">Created:</span> {formatDate(selectedUser.createdAt)}</p>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
