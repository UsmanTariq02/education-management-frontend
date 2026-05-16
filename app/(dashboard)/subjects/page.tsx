"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookText, CheckCircle2, Layers3, PauseCircle } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table";
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
import { useSavedFilterPresets } from "@/hooks/use-saved-filter-presets";
import { normalizeApiError } from "@/lib/api/errors";
import { exportRowsToCsv } from "@/lib/utils/export";
import { useAuth } from "@/providers/auth-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Subject } from "@/types/domain";

export default function SubjectsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [pageIndex, setPageIndex] = useState(0);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [open, setOpen] = useState(false);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const canCreate = usePermission("subjects.create");
  const canManage = usePermission("subjects.update");
  const canDelete = usePermission("subjects.delete");
  const savedSubjectFilterPresets = useSavedFilterPresets<{
    search: string;
    statusFilter: string;
  }>("subjects-filter-presets");

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

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => subjectsApi.bulkRemove(ids),
    onSuccess: () => {
      toast.success("Selected subjects deleted");
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      setRowSelection({});
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const bulkStatusMutation = useMutation({
    mutationFn: async (payload: { ids: string[]; isActive: boolean }) => subjectsApi.bulkUpdateStatus(payload.ids, payload.isActive),
    onSuccess: (_, variables) => {
      toast.success(variables.isActive ? "Selected subjects activated" : "Selected subjects deactivated");
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      setRowSelection({});
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
  const selectedSubjectIds = Object.entries(rowSelection)
    .filter(([, selected]) => selected)
    .map(([id]) => id);
  const selectedSubjectExportRows = useMemo(
    () =>
      filteredItems
        .filter((subject) => selectedSubjectIds.includes(subject.id))
        .map((subject) => ({
          Subject: subject.name,
          Code: subject.code,
          Description: subject.description ?? "",
          Status: subject.isActive ? "Active" : "Inactive",
          Organization: subject.organizationName ?? "",
        })),
    [filteredItems, selectedSubjectIds],
  );
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
            <Button variant="outline" size="sm" className="rounded-full border-primary/15 bg-background/80 px-3 font-medium shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/10" onClick={() => setSelectedSubject(row.original)}>
              View
            </Button>
            {canManage ? (
              <Button
                variant="outline"
                size="sm"
                className="rounded-full border-primary/15 bg-background/80 px-3 font-medium shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/10"
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
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={buildActivityLogsHref({ module: "subjects" })}>Audit subject events</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={buildActivityLogsHref({ action: "bulk-status" })}>Audit bulk status</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={buildActivityLogsHref({ action: "bulk-delete" })}>Audit bulk deletes</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={buildActivityLogsHref({ action: "create" })}>Audit subject creation</Link>
        </Button>
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
          canCreate || canManage ? (
            <Dialog open={open} onOpenChange={setOpen}>
              {canCreate ? (
                <DialogTrigger asChild>
                  <Button disabled={!user?.organizationId}>Create subject</Button>
                </DialogTrigger>
              ) : null}
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
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.75rem] border border-border/70 bg-card/85 px-4 py-3 text-sm shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground">Saved views</span>
          <Select
            value={selectedPresetId}
            onValueChange={(presetId) => {
              const preset = savedSubjectFilterPresets.presets.find((item) => item.id === presetId);
              if (!preset) return;

              setSearch(preset.value.search);
              setStatusFilter(preset.value.statusFilter);
              setSelectedPresetId(preset.id);
              setPageIndex(0);
            }}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select saved view" />
            </SelectTrigger>
            <SelectContent>
              {savedSubjectFilterPresets.presets.length === 0 ? (
                <SelectItem value="__none" disabled>
                  No saved views yet
                </SelectItem>
              ) : (
                savedSubjectFilterPresets.presets.map((preset) => (
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
              const name = window.prompt("Save the current subject filters as:");
              const preset = name
                ? savedSubjectFilterPresets.savePreset(name, {
                    search,
                    statusFilter,
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
              savedSubjectFilterPresets.clearPresets();
              setSelectedPresetId("");
              toast.success("Saved subject views cleared");
            }}
            disabled={savedSubjectFilterPresets.presets.length === 0}
          >
            Clear saved views
          </Button>
        </div>
      </div>
      {selectedSubjectIds.length > 0 && (canManage || canDelete) ? (
        <div className="flex items-center justify-between rounded-[1.75rem] border border-sky-200 bg-sky-50/70 px-4 py-3 text-sm shadow-sm">
          <p>
            {selectedSubjectIds.length} subject{selectedSubjectIds.length === 1 ? "" : "s"} selected
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setRowSelection({})}>
              Clear selection
            </Button>
            <Button
              variant="outline"
              onClick={() => exportRowsToCsv({ filename: "subjects-selected", rows: selectedSubjectExportRows })}
              disabled={selectedSubjectExportRows.length === 0}
            >
              Export selected
            </Button>
            {canManage ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => bulkStatusMutation.mutate({ ids: selectedSubjectIds, isActive: true })}
                  disabled={bulkStatusMutation.isPending || bulkDeleteMutation.isPending}
                >
                  Activate selected
                </Button>
                <Button
                  variant="outline"
                  onClick={() => bulkStatusMutation.mutate({ ids: selectedSubjectIds, isActive: false })}
                  disabled={bulkStatusMutation.isPending || bulkDeleteMutation.isPending}
                >
                  Deactivate selected
                </Button>
              </>
            ) : null}
            {canDelete ? (
              <Button
                variant="destructive"
                onClick={() => bulkDeleteMutation.mutate(selectedSubjectIds)}
                disabled={bulkDeleteMutation.isPending || bulkStatusMutation.isPending}
              >
                {bulkDeleteMutation.isPending ? "Deleting..." : "Delete selected"}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
      <DataTable
        data={filteredItems}
        columns={columns}
        pageCount={Math.ceil(query.data.total / query.data.limit)}
        pagination={{ pageIndex, pageSize: query.data.limit }}
        onPaginationChange={(state) => setPageIndex(state.pageIndex)}
        enableRowSelection
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
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
