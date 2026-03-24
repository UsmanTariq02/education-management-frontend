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
import { FilterBar } from "@/components/shared/filter-bar";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { organizationsApi } from "@/features/organizations/api/organizations-api";
import { organizationSchema, type OrganizationSchema } from "@/features/organizations/schemas/organization-schema";
import { normalizeApiError } from "@/lib/api/errors";
import { formatDate } from "@/lib/formatters";
import { useAuth } from "@/providers/auth-provider";
import type { Organization } from "@/types/domain";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

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
              });
              setOpen(true);
            }}
          >
            Edit
          </Button>
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
            <DialogContent>
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
                <FormField label="Address" className="md:col-span-2" error={form.formState.errors.address}>
                  <Textarea rows={4} {...form.register("address")} />
                </FormField>
                <label className="flex items-center gap-3 text-sm md:col-span-2">
                  <input type="checkbox" {...form.register("isActive")} />
                  <span>Organization is active</span>
                </label>
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
    </div>
  );
}
