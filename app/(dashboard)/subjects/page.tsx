"use client";

import { useMemo, useState } from "react";
import { BookText, CheckCircle2, Layers3, PauseCircle } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
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
import { subjectSchema, type SubjectSchema } from "@/features/subjects/schemas/subject-schema";
import { subjectsApi } from "@/features/subjects/api/subjects-api";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { usePermission } from "@/hooks/use-permission";
import { normalizeApiError } from "@/lib/api/errors";
import { useAuth } from "@/providers/auth-provider";
import type { Subject } from "@/types/domain";

export default function SubjectsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [pageIndex, setPageIndex] = useState(0);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [open, setOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const canCreate = usePermission("subjects.create");
  const canManage = usePermission("subjects.update");

  const query = useQuery({
    queryKey: ["subjects", debouncedSearch, pageIndex],
    queryFn: () => subjectsApi.list({ page: pageIndex + 1, limit: 10, search: debouncedSearch }),
  });

  const form = useForm<SubjectSchema>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      isActive: true,
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: SubjectSchema) => {
      if (editingSubject) {
        return subjectsApi.update(editingSubject.id, values);
      }
      return subjectsApi.create(values);
    },
    onSuccess: () => {
      toast.success(editingSubject ? "Subject updated" : "Subject created");
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      setOpen(false);
      setEditingSubject(null);
      form.reset();
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
      inactive: filteredItems.filter((item) => !item.isActive).length,
      catalogued: filteredItems.filter((item) => item.description).length,
    }),
    [filteredItems],
  );

  const columns = useMemo<Array<ColumnDef<Subject>>>(
    () => [
      {
        accessorKey: "name",
        header: "Subject",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">{row.original.code}</p>
          </div>
        ),
      },
      ...(user?.roles.includes("SUPER_ADMIN")
        ? [{ accessorKey: "organizationName", header: "Organization" } satisfies ColumnDef<Subject>]
        : []),
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => row.original.description ?? "No description",
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
            <Button variant="ghost" size="sm" onClick={() => setSelectedSubject(row.original)}>
              View
            </Button>
            {canManage ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingSubject(row.original);
                  form.reset({
                    name: row.original.name,
                    code: row.original.code,
                    description: row.original.description ?? "",
                    isActive: row.original.isActive,
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
    [canManage, form, user?.roles],
  );

  if (query.isLoading) return <LoadingState rows={6} />;
  if (query.isError || !query.data) return <ErrorState description="Subjects could not be loaded." onRetry={() => query.refetch()} />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Academics"
        title="Subjects"
        description="Build the subject catalogue that teachers, timetables, results, and report cards will use."
      />
      <OrganizationScopeBanner moduleLabel="Academic operations" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Visible subjects" value={String(stats.total)} helper="Subjects in the current table scope" icon={BookText} tone="sky" />
        <MetricCard title="Active subjects" value={String(stats.active)} helper="Subjects available for assignments" icon={CheckCircle2} tone="emerald" />
        <MetricCard title="Inactive subjects" value={String(stats.inactive)} helper="Subjects hidden from future planning" icon={PauseCircle} tone="amber" />
        <MetricCard title="Documented subjects" value={String(stats.catalogued)} helper="Subjects carrying internal descriptions" icon={Layers3} tone="violet" />
      </div>
      <FilterBar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPageIndex(0);
        }}
        searchPlaceholder="Search subjects by name or code..."
        filters={
          <NativeSelect value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="ALL">All subjects</option>
            <option value="ACTIVE">Active only</option>
            <option value="INACTIVE">Inactive only</option>
          </NativeSelect>
        }
        action={
          canCreate ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button disabled={!user?.organizationId}>Create subject</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingSubject ? "Edit subject" : "Create subject"}</DialogTitle>
                  <DialogDescription>Keep codes stable. These will become the academic references for future timetable and result records.</DialogDescription>
                </DialogHeader>
                <form className="grid gap-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
                  <FormField label="Subject name" required error={form.formState.errors.name}>
                    <Input {...form.register("name")} />
                  </FormField>
                  <FormField label="Code" required error={form.formState.errors.code}>
                    <Input {...form.register("code")} />
                  </FormField>
                  <FormField label="Description" error={form.formState.errors.description}>
                    <Input {...form.register("description")} />
                  </FormField>
                  <Checkbox {...form.register("isActive")} label="Keep subject active" />
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={mutation.isPending}>
                      {editingSubject ? "Save changes" : "Create subject"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />
      <DataTable
        data={filteredItems}
        columns={columns}
        pageCount={Math.ceil(query.data.total / query.data.limit)}
        pagination={{ pageIndex, pageSize: query.data.limit }}
        onPaginationChange={(state) => setPageIndex(state.pageIndex)}
      />
      <Dialog open={Boolean(selectedSubject)} onOpenChange={(nextOpen) => !nextOpen && setSelectedSubject(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Subject detail</DialogTitle>
            <DialogDescription>Review the subject catalogue entry before assignments, exams, and reporting use it.</DialogDescription>
          </DialogHeader>
          {selectedSubject ? (
            <div className="space-y-3 text-sm">
              <p><span className="font-medium">Name:</span> {selectedSubject.name}</p>
              <p><span className="font-medium">Code:</span> {selectedSubject.code}</p>
              <p><span className="font-medium">Description:</span> {selectedSubject.description ?? "—"}</p>
              <p><span className="font-medium">Status:</span> {selectedSubject.isActive ? "Active" : "Inactive"}</p>
              {user?.roles.includes("SUPER_ADMIN") ? <p><span className="font-medium">Organization:</span> {selectedSubject.organizationName}</p> : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
