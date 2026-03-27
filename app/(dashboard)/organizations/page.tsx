"use client";

import { useMemo, useState } from "react";
import { Building2, ShieldCheck, Users, UserSquare2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { DataTable } from "@/components/tables/data-table";
import { MetricCard } from "@/components/cards/metric-card";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { FormField } from "@/components/forms/form-field";
import { DetailItem } from "@/components/shared/detail-item";
import { FilterBar } from "@/components/shared/filter-bar";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { NativeSelect } from "@/components/ui/native-select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { organizationsApi } from "@/features/organizations/api/organizations-api";
import { organizationSchema, type OrganizationSchema } from "@/features/organizations/schemas/organization-schema";
import { normalizeApiError } from "@/lib/api/errors";
import { formatDate } from "@/lib/formatters";
import { useAuth } from "@/providers/auth-provider";
import type { Organization } from "@/types/domain";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

const organizationModules = [
  "USERS",
  "STUDENTS",
  "PORTALS",
  "BATCHES",
  "ACADEMICS",
  "FEES",
  "ATTENDANCE",
  "REMINDERS",
  "REPORTS",
  "ACTIVITY_LOGS",
  "SETTINGS",
  "MEDIA",
] as const;

export default function OrganizationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 12;
  const [open, setOpen] = useState(false);
  const [editingOrganization, setEditingOrganization] = useState<Organization | null>(null);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);

  const organizationsQuery = useQuery({
    queryKey: ["organizations", debouncedSearch, pageIndex, pageSize],
    queryFn: () => organizationsApi.list({ page: pageIndex + 1, limit: pageSize, search: debouncedSearch }),
    enabled: user?.roles.includes("SUPER_ADMIN") ?? false,
  });

  const form = useForm<OrganizationSchema>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: "",
      slug: "",
      email: "",
      phone: "",
      address: "",
      isActive: true,
      userLimit: 10,
      studentLimit: 500,
      enabledModules: [...organizationModules],
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: OrganizationSchema) => {
      const payload = {
        ...values,
        email: values.email || undefined,
        phone: values.phone || undefined,
        address: values.address || undefined,
      };

      if (editingOrganization) {
        return organizationsApi.update(editingOrganization.id, payload);
      }

      return organizationsApi.create(payload);
    },
    onSuccess: () => {
      toast.success(editingOrganization ? "Organization updated" : "Organization onboarded");
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      setOpen(false);
      setEditingOrganization(null);
      form.reset();
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const filteredOrganizations = useMemo(() => {
    const items = organizationsQuery.data?.items ?? [];

    return items.filter((item) => {
      if (statusFilter === "ALL") {
        return true;
      }

      return statusFilter === "ACTIVE" ? item.isActive : !item.isActive;
    });
  }, [organizationsQuery.data, statusFilter]);

  const hasLocalFilters = statusFilter !== "ALL";

  const organizationStats = useMemo(() => {
    const items = filteredOrganizations;

    return {
      totalOrganizations: items.length,
      totalAdmins: items.reduce((sum, item) => sum + item.totalAdmins, 0),
      totalStudents: items.reduce((sum, item) => sum + item.totalStudents, 0),
      totalUsers: items.reduce((sum, item) => sum + item.totalUsers, 0),
    };
  }, [filteredOrganizations]);

  const columns = useMemo<Array<ColumnDef<Organization>>>(
    () => [
      {
        accessorKey: "name",
        header: "Organization",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">{row.original.slug}</p>
          </div>
        ),
      },
      {
        accessorKey: "email",
        header: "Contact",
        cell: ({ row }) => (
          <div>
            <p>{row.original.email ?? "No email"}</p>
            <p className="text-xs text-muted-foreground">{row.original.phone ?? "No phone"}</p>
          </div>
        ),
      },
      {
        id: "tenant-stats",
        header: "Tenant summary",
        cell: ({ row }) => (
          <div className="space-y-1 text-sm">
            <p>{row.original.totalAdmins} admins · {row.original.totalStaff} staff · {row.original.totalUsers} users</p>
            <p className="text-xs text-muted-foreground">
              {row.original.totalStudents} students · {row.original.totalBatches} batches · {row.original.totalFeeRecords} fee records
            </p>
            <p className="text-xs text-muted-foreground">
              Limits: {row.original.totalUsers}/{row.original.userLimit} users · {row.original.totalStudents}/{row.original.studentLimit} students
            </p>
          </div>
        ),
      },
      {
        id: "operations",
        header: "Operations",
        cell: ({ row }) => (
          <div className="space-y-1 text-sm">
            <p>{row.original.totalFeePlans} fee plans · {row.original.totalAttendanceRecords} attendance entries</p>
            <p className="text-xs text-muted-foreground">{row.original.totalReminderLogs} reminders logged</p>
            <p className="text-xs text-muted-foreground">{row.original.enabledModules.map((module) => module.replaceAll("_", " ")).join(", ")}</p>
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
        header: "Onboarded",
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedOrganization(row.original)}>
              View
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditingOrganization(row.original);
                form.reset({
                  name: row.original.name,
                  slug: row.original.slug,
                  email: row.original.email ?? "",
                  phone: row.original.phone ?? "",
                  address: row.original.address ?? "",
                  isActive: row.original.isActive,
                  userLimit: row.original.userLimit,
                  studentLimit: row.original.studentLimit,
                  enabledModules: row.original.enabledModules,
                });
                setOpen(true);
              }}
            >
              Edit
            </Button>
          </div>
        ),
      },
    ],
    [form],
  );

  if (!user?.roles.includes("SUPER_ADMIN")) {
    return <ErrorState title="Access restricted" description="Only the super admin can manage onboarded organizations." />;
  }

  if (organizationsQuery.isLoading) {
    return <LoadingState rows={6} />;
  }

  if (organizationsQuery.isError || !organizationsQuery.data) {
    return <ErrorState description="Organizations could not be loaded." onRetry={() => organizationsQuery.refetch()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Platform tenancy"
        title="Organizations"
        description="Onboard schools and colleges, keep tenancy boundaries explicit, and manage the active roster of institutions."
      />
      <FilterBar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPageIndex(0);
        }}
        searchPlaceholder="Search organizations by name, slug, or contact..."
        filters={
          <NativeSelect
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPageIndex(0);
            }}
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active only</option>
            <option value="INACTIVE">Inactive only</option>
          </NativeSelect>
        }
        action={
          <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
              setOpen(nextOpen);
              if (!nextOpen) {
                setEditingOrganization(null);
                form.reset();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>Onboard organization</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingOrganization ? "Edit organization" : "Onboard organization"}</DialogTitle>
                <DialogDescription>Create a tenant boundary before assigning admins, staff, and students.</DialogDescription>
              </DialogHeader>
              <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
                <FormField label="Organization name" required error={form.formState.errors.name}>
                  <Input {...form.register("name")} />
                </FormField>
                <FormField label="Slug" required error={form.formState.errors.slug}>
                  <Input {...form.register("slug")} placeholder="green-valley-college" />
                </FormField>
                <FormField label="Email" error={form.formState.errors.email}>
                  <Input type="email" {...form.register("email")} />
                </FormField>
                <FormField label="Phone" error={form.formState.errors.phone}>
                  <Input {...form.register("phone")} />
                </FormField>
                <FormField label="User limit" required error={form.formState.errors.userLimit}>
                  <Input type="number" min={1} {...form.register("userLimit", { valueAsNumber: true })} />
                </FormField>
                <FormField label="Student limit" required error={form.formState.errors.studentLimit}>
                  <Input type="number" min={1} {...form.register("studentLimit", { valueAsNumber: true })} />
                </FormField>
                <FormField label="Address" className="md:col-span-2" error={form.formState.errors.address}>
                  <Textarea rows={4} {...form.register("address")} />
                </FormField>
                <div className="space-y-2 md:col-span-2">
                  <p className="text-sm font-medium">Enabled modules</p>
                  <div className="grid gap-2 rounded-xl border p-4 md:grid-cols-2">
                    {organizationModules.map((module) => (
                      <Checkbox
                        key={module}
                        checked={form.watch("enabledModules").includes(module)}
                        onChange={(event) => {
                          const current = form.getValues("enabledModules");
                          form.setValue(
                            "enabledModules",
                            event.target.checked ? [...current, module] : current.filter((item) => item !== module),
                            { shouldValidate: true, shouldDirty: true },
                          );
                        }}
                        label={module.replaceAll("_", " ")}
                      />
                    ))}
                  </div>
                  {form.formState.errors.enabledModules ? (
                    <p className="text-xs text-destructive">{form.formState.errors.enabledModules.message}</p>
                  ) : null}
                </div>
                <Checkbox {...form.register("isActive")} label="Organization is active" containerClassName="md:col-span-2" />
                <div className="md:col-span-2 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? "Saving..." : editingOrganization ? "Update organization" : "Create organization"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Organizations" value={String(organizationStats.totalOrganizations)} helper="Total onboarded institutions" icon={Building2} tone="sky" />
        <MetricCard title="Admins" value={String(organizationStats.totalAdmins)} helper="Tenant admins across all organizations" icon={ShieldCheck} tone="violet" />
        <MetricCard title="Users" value={String(organizationStats.totalUsers)} helper="Organization-scoped platform users" icon={Users} tone="emerald" />
        <MetricCard title="Students" value={String(organizationStats.totalStudents)} helper="Students across onboarded organizations" icon={UserSquare2} tone="amber" />
      </div>
      <DataTable
        data={filteredOrganizations}
        columns={columns}
        pageCount={hasLocalFilters ? 1 : Math.ceil(organizationsQuery.data.total / organizationsQuery.data.limit)}
        pagination={{ pageIndex: hasLocalFilters ? 0 : organizationsQuery.data.page - 1, pageSize: organizationsQuery.data.limit }}
        onPaginationChange={(state) => {
          if (!hasLocalFilters) {
            setPageIndex(state.pageIndex);
          }
        }}
      />
      <Dialog open={Boolean(selectedOrganization)} onOpenChange={(nextOpen) => !nextOpen && setSelectedOrganization(null)}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Organization detail</DialogTitle>
            <DialogDescription>Review tenant identity, capacity, modules, and operational totals before making platform changes.</DialogDescription>
          </DialogHeader>
          {selectedOrganization ? (
            <div className="space-y-4 text-sm">
              <div className="grid gap-3 md:grid-cols-2">
                <DetailItem label="Organization" value={selectedOrganization.name} />
                <DetailItem label="Slug" value={selectedOrganization.slug} />
                <DetailItem label="Status" value={`${selectedOrganization.isActive ? "Active" : "Inactive"} · Onboarded ${formatDate(selectedOrganization.createdAt)}`} />
                <DetailItem label="Contact" value={`${selectedOrganization.email ?? "No email"} · ${selectedOrganization.phone ?? "No phone"}`} />
                <DetailItem label="Users capacity" value={`${selectedOrganization.totalUsers}/${selectedOrganization.userLimit}`} />
                <DetailItem label="Students capacity" value={`${selectedOrganization.totalStudents}/${selectedOrganization.studentLimit}`} />
                <DetailItem label="Address" value={selectedOrganization.address ?? "No address recorded"} className="md:col-span-2" />
              </div>
              <div className="rounded-2xl border p-4">
                <p className="text-sm font-medium">Tenant summary</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <p><span className="font-medium">Admins:</span> {selectedOrganization.totalAdmins}</p>
                  <p><span className="font-medium">Users:</span> {selectedOrganization.totalUsers}</p>
                  <p><span className="font-medium">Students:</span> {selectedOrganization.totalStudents}</p>
                  <p><span className="font-medium">Batches:</span> {selectedOrganization.totalBatches}</p>
                  <p><span className="font-medium">Fee plans:</span> {selectedOrganization.totalFeePlans}</p>
                  <p><span className="font-medium">Fee records:</span> {selectedOrganization.totalFeeRecords}</p>
                  <p><span className="font-medium">Attendance records:</span> {selectedOrganization.totalAttendanceRecords}</p>
                  <p><span className="font-medium">Reminder logs:</span> {selectedOrganization.totalReminderLogs}</p>
                </div>
              </div>
              <div className="rounded-2xl border p-4">
                <p className="text-sm font-medium">Enabled modules</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedOrganization.enabledModules.map((module) => (
                    <Badge key={module} variant="outline">
                      {module.replaceAll("_", " ")}
                    </Badge>
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
