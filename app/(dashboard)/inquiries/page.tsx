"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Mail, Phone, PhoneCall, UserRoundSearch } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/tables/data-table";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { PageHeader } from "@/components/shared/page-header";
import { MetricCard } from "@/components/cards/metric-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { inquiriesApi } from "@/features/inquiries/api/inquiries-api";
import { normalizeApiError } from "@/lib/api/errors";
import { formatDate } from "@/lib/formatters";
import { useAuth } from "@/providers/auth-provider";
import type { ContactInquiry, ContactInquiryStatus } from "@/types/domain";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

const statusOptions: ContactInquiryStatus[] = ["NEW", "REVIEWED", "CONTACTED"];

export default function InquiriesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [statusFilter, setStatusFilter] = useState<ContactInquiryStatus | "ALL">("ALL");
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedInquiry, setSelectedInquiry] = useState<ContactInquiry | null>(null);
  const pageSize = 12;

  const inquiriesQuery = useQuery({
    queryKey: ["inquiries", debouncedSearch, pageIndex, pageSize],
    queryFn: () => inquiriesApi.list({ page: pageIndex + 1, limit: pageSize, search: debouncedSearch }),
    enabled: user?.roles.includes("SUPER_ADMIN") ?? false,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ContactInquiryStatus }) => inquiriesApi.updateStatus(id, { status }),
    onSuccess: () => {
      toast.success("Inquiry status updated");
      queryClient.invalidateQueries({ queryKey: ["inquiries"] });
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const columns = useMemo<Array<ColumnDef<ContactInquiry>>>(
    () => [
      {
        accessorKey: "fullName",
        header: "Contact",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.fullName}</p>
            <p className="text-xs text-muted-foreground">{row.original.email}</p>
          </div>
        ),
      },
      {
        accessorKey: "institutionName",
        header: "Institution",
        cell: ({ row }) => (
          <div>
            <p>{row.original.institutionName}</p>
            <p className="text-xs text-muted-foreground">{row.original.institutionType ?? "Institution"}</p>
          </div>
        ),
      },
      {
        accessorKey: "requestedModules",
        header: "Modules",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.requestedModules.slice(0, 3).map((module) => (
              <Badge key={module} variant="outline">
                {module}
              </Badge>
            ))}
            {row.original.requestedModules.length > 3 ? <Badge variant="secondary">+{row.original.requestedModules.length - 3}</Badge> : null}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <select
            className="h-9 rounded-lg border bg-background px-3 text-sm"
            value={row.original.status}
            onChange={(event) =>
              statusMutation.mutate({ id: row.original.id, status: event.target.value as ContactInquiryStatus })
            }
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Received",
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedInquiry(row.original)}>
              View
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <a href={`mailto:${row.original.email}`} aria-label="Send email">
                <Mail className="h-4 w-4" />
              </a>
            </Button>
            {row.original.phone ? (
              <Button variant="ghost" size="icon" asChild>
                <a href={`tel:${row.original.phone}`} aria-label="Call inquiry contact">
                  <Phone className="h-4 w-4" />
                </a>
              </Button>
            ) : null}
          </div>
        ),
      },
    ],
    [statusMutation],
  );

  const filteredInquiries = useMemo(() => {
    const items = inquiriesQuery.data?.items ?? [];

    return items.filter((item) => (statusFilter === "ALL" ? true : item.status === statusFilter));
  }, [inquiriesQuery.data, statusFilter]);

  const hasLocalFilters = statusFilter !== "ALL";

  const inquiryStats = useMemo(() => {
    const items = filteredInquiries;
    return {
      totalInquiries: items.length,
      newCount: items.filter((item) => item.status === "NEW").length,
      reviewedCount: items.filter((item) => item.status === "REVIEWED").length,
      contactedCount: items.filter((item) => item.status === "CONTACTED").length,
    };
  }, [filteredInquiries]);

  if (!user?.roles.includes("SUPER_ADMIN")) {
    return <ErrorState title="Access restricted" description="Only the super admin can review contact inquiries." />;
  }

  if (inquiriesQuery.isLoading) {
    return <LoadingState rows={6} />;
  }

  if (inquiriesQuery.isError || !inquiriesQuery.data) {
    return <ErrorState description="Contact inquiries could not be loaded." onRetry={() => inquiriesQuery.refetch()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pipeline"
        title="Contact inquiries"
        description="Review inbound demo and pricing leads, update follow-up status, and contact prospects directly from the super admin console."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Visible inquiries" value={String(inquiryStats.totalInquiries)} helper="Lead records in the current page scope" icon={UserRoundSearch} tone="sky" />
        <MetricCard title="New" value={String(inquiryStats.newCount)} helper="Fresh leads waiting for review" icon={Eye} tone="amber" />
        <MetricCard title="Reviewed" value={String(inquiryStats.reviewedCount)} helper="Leads already triaged by super admin" icon={Mail} tone="violet" />
        <MetricCard title="Contacted" value={String(inquiryStats.contactedCount)} helper="Leads already reached out to" icon={PhoneCall} tone="emerald" />
      </div>
      <FilterBar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPageIndex(0);
        }}
        searchPlaceholder="Search inquiries by contact or institution..."
        filters={
          <select
            className="h-10 rounded-xl border bg-background px-3 text-sm"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as ContactInquiryStatus | "ALL");
              setPageIndex(0);
            }}
          >
            <option value="ALL">All statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        }
      />
      <DataTable
        data={filteredInquiries}
        columns={columns}
        pageCount={hasLocalFilters ? 1 : Math.ceil(inquiriesQuery.data.total / inquiriesQuery.data.limit)}
        pagination={{ pageIndex: hasLocalFilters ? 0 : inquiriesQuery.data.page - 1, pageSize: inquiriesQuery.data.limit }}
        onPaginationChange={(state) => {
          if (!hasLocalFilters) {
            setPageIndex(state.pageIndex);
          }
        }}
      />
      <Dialog open={Boolean(selectedInquiry)} onOpenChange={(nextOpen) => !nextOpen && setSelectedInquiry(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Inquiry detail</DialogTitle>
            <DialogDescription>Review full inquiry context and use direct actions to follow up quickly.</DialogDescription>
          </DialogHeader>
          {selectedInquiry ? (
            <div className="space-y-4 text-sm">
              <p><span className="font-medium">Contact:</span> {selectedInquiry.fullName}</p>
              <p><span className="font-medium">Email:</span> {selectedInquiry.email}</p>
              <p><span className="font-medium">Phone:</span> {selectedInquiry.phone ?? "N/A"}</p>
              <p><span className="font-medium">Institution:</span> {selectedInquiry.institutionName}</p>
              <p><span className="font-medium">Type:</span> {selectedInquiry.institutionType ?? "N/A"}</p>
              <p><span className="font-medium">Expected users:</span> {selectedInquiry.expectedUserCount ?? "N/A"}</p>
              <p><span className="font-medium">Inquiry type:</span> {selectedInquiry.inquiryType ?? "N/A"}</p>
              <div>
                <p className="font-medium">Requested modules</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedInquiry.requestedModules.map((module) => (
                    <Badge key={module} variant="outline">
                      {module}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border bg-muted/30 p-4">
                <p className="mb-2 font-medium">Message</p>
                <p className="whitespace-pre-wrap text-muted-foreground">{selectedInquiry.message}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <a href={`mailto:${selectedInquiry.email}`}>Email contact</a>
                </Button>
                {selectedInquiry.phone ? (
                  <Button asChild variant="outline">
                    <a href={`tel:${selectedInquiry.phone}`}>Call contact</a>
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
