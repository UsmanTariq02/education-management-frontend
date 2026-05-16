"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Archive, CheckCircle2, ClipboardList, Copy, Download, Filter, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { aiApi } from "@/features/ai/api/ai-api";
import { organizationsApi } from "@/features/organizations/api/organizations-api";
import { usersApi } from "@/features/users/api/users-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrganizationScopeBanner } from "@/components/shared/organization-scope-banner";
import { useAuth } from "@/providers/auth-provider";
import { normalizeApiError } from "@/lib/api/errors";
import { getAiAccessLabel } from "@/lib/ai/access";
import { cn } from "@/lib/utils";
import {
  createAiReviewItem,
  latestReviewItem,
  updateAiReviewItem,
  type AiReviewItem,
  type AiReviewKind,
} from "@/features/ai/utils/ai-review-queue";

const kindOptions: Array<{ value: "ALL" | AiReviewKind; label: string }> = [
  { value: "ALL", label: "All kinds" },
  { value: "NOTICE", label: "Notice" },
  { value: "MAIL", label: "Mail" },
  { value: "SUPPORT", label: "Support" },
  { value: "ADMISSION", label: "Admission" },
  { value: "RISK", label: "Risk" },
  { value: "FEES", label: "Fees" },
  { value: "ATTENDANCE", label: "Attendance" },
  { value: "REMINDER", label: "Reminder" },
];

const statusOptions: Array<{ value: "ALL" | AiReviewItem["status"]; label: string }> = [
  { value: "ALL", label: "All statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "APPROVED", label: "Approved" },
  { value: "ARCHIVED", label: "Archived" },
];

export default function AiQueuePage() {
  const { user } = useAuth();
  const isPlatformSession = Boolean(user && !user.organizationId);
  const organizationsQuery = useQuery({
    queryKey: ["ai-queue-organizations"],
    queryFn: () => organizationsApi.list({ page: 1, limit: 100 }),
    enabled: isPlatformSession,
  });
  const currentSettingsQuery = useQuery({
    queryKey: ["ai-queue-current-settings"],
    queryFn: organizationsApi.currentSettings,
    enabled: Boolean(user?.organizationId) && !isPlatformSession,
  });
  const canSwitchQueueUser = Boolean(user?.roles?.includes("SUPER_ADMIN"));
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | undefined>(user?.organizationId ?? undefined);
  const [selectedQueueUserId, setSelectedQueueUserId] = useState<string | undefined>(user?.id ?? undefined);
  const [queue, setQueue] = useState<AiReviewItem[]>([]);
  const lastSyncedQueueRef = useRef<string>("");
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<"ALL" | AiReviewKind>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | AiReviewItem["status"]>("ALL");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [updatedFrom, setUpdatedFrom] = useState("");
  const [updatedTo, setUpdatedTo] = useState("");
  const usersQuery = useQuery({
    queryKey: ["ai-queue-users", selectedOrganizationId],
    queryFn: () => usersApi.list({ page: 1, limit: 1000 }),
    enabled: Boolean(selectedOrganizationId && canSwitchQueueUser),
  });

  useEffect(() => {
    if (user?.organizationId) {
      setSelectedOrganizationId(user.organizationId);
      return;
    }

    if (!selectedOrganizationId) {
      const firstOrganization = organizationsQuery.data?.items?.[0];
      if (firstOrganization) {
        setSelectedOrganizationId(firstOrganization.id);
      }
    }
  }, [organizationsQuery.data?.items, selectedOrganizationId, user?.organizationId]);

  useEffect(() => {
    setSelectedQueueUserId(user?.id ?? undefined);
  }, [selectedOrganizationId, user?.id]);

  useEffect(() => {
    setQueue([]);
    lastSyncedQueueRef.current = "";
  }, [selectedOrganizationId, selectedQueueUserId]);

  const reviewQueueQuery = useQuery({
    queryKey: ["ai-review-queue", selectedOrganizationId, selectedQueueUserId],
    queryFn: () => aiApi.reviewQueue(selectedOrganizationId, selectedQueueUserId),
    enabled: Boolean(selectedOrganizationId),
  });
  const reviewQueueSummaryQuery = useQuery({
    queryKey: ["ai-review-queue-summary", selectedOrganizationId, selectedQueueUserId],
    queryFn: () => aiApi.reviewQueueSummary(selectedOrganizationId, selectedQueueUserId),
    enabled: Boolean(selectedOrganizationId),
  });

  useEffect(() => {
    if (!reviewQueueQuery.data) {
      return;
    }

    const serialized = JSON.stringify(reviewQueueQuery.data);
    lastSyncedQueueRef.current = serialized;
    setQueue(reviewQueueQuery.data);
  }, [reviewQueueQuery.data]);

  const saveReviewQueueMutation = useMutation({
    mutationFn: async (items: AiReviewItem[]) => aiApi.saveReviewQueue({ items }, selectedOrganizationId),
    onSuccess: (savedQueue) => {
      const serialized = JSON.stringify(savedQueue);
      lastSyncedQueueRef.current = serialized;
      setQueue(savedQueue);
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  useEffect(() => {
    if (!selectedOrganizationId || !reviewQueueQuery.isSuccess || selectedQueueUserId !== user?.id) {
      return;
    }

    const serialized = JSON.stringify(queue);
    if (serialized === lastSyncedQueueRef.current) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      saveReviewQueueMutation.mutate(queue);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [queue, reviewQueueQuery.isSuccess, saveReviewQueueMutation, selectedOrganizationId, selectedQueueUserId, user?.id]);

  const selectedOrganization =
    organizationsQuery.data?.items?.find((item) => item.id === selectedOrganizationId) ?? null;
  const approvalRequired = Boolean(selectedOrganization?.aiDraftApprovalRequired ?? currentSettingsQuery.data?.aiDraftApprovalRequired);
  const selectedQueueUser = useMemo(() => {
    if (!canSwitchQueueUser || !selectedQueueUserId) {
      return user ?? null;
    }

    return usersQuery.data?.items?.find((item) => item.id === selectedQueueUserId) ?? user ?? null;
  }, [canSwitchQueueUser, selectedQueueUserId, user, usersQuery.data?.items]);
  const isReadOnly = Boolean(canSwitchQueueUser && selectedQueueUserId && selectedQueueUserId !== user?.id);

  const visibleItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    const createdFromValue = createdFrom ? new Date(createdFrom).getTime() : null;
    const createdToValue = createdTo ? new Date(`${createdTo}T23:59:59.999`).getTime() : null;
    const updatedFromValue = updatedFrom ? new Date(updatedFrom).getTime() : null;
    const updatedToValue = updatedTo ? new Date(`${updatedTo}T23:59:59.999`).getTime() : null;

    return queue
      .slice()
      .reverse()
      .filter((item) => (kindFilter === "ALL" ? true : item.kind === kindFilter))
      .filter((item) => (statusFilter === "ALL" ? true : item.status === statusFilter))
      .filter((item) => {
        const createdAt = new Date(item.createdAt).getTime();
        const updatedAt = new Date(item.updatedAt).getTime();
        if (createdFromValue !== null && createdAt < createdFromValue) return false;
        if (createdToValue !== null && createdAt > createdToValue) return false;
        if (updatedFromValue !== null && updatedAt < updatedFromValue) return false;
        if (updatedToValue !== null && updatedAt > updatedToValue) return false;
        return true;
      })
      .filter((item) => {
        if (!term) return true;
        return [item.kind, item.title, item.summary, item.body, item.status].some((value) => value.toLowerCase().includes(term));
      });
  }, [createdFrom, createdTo, kindFilter, queue, search, statusFilter, updatedFrom, updatedTo]);

  const queueStats = useMemo(
    () => ({
      total: queue.length,
      draft: queue.filter((item) => item.status === "DRAFT").length,
      approved: queue.filter((item) => item.status === "APPROVED").length,
      archived: queue.filter((item) => item.status === "ARCHIVED").length,
    }),
    [queue],
  );

  const kindStats = useMemo(
    () =>
      kindOptions
        .filter((option) => option.value !== "ALL")
        .map((option) => ({
          kind: option.value,
          label: option.label,
          count: queue.filter((item) => item.kind === option.value).length,
        }))
        .filter((item) => item.count > 0),
    [queue],
  );

  const latestApproved = latestReviewItem(queue, undefined, "APPROVED");

  const mutateItem = (id: string, patch: Partial<Pick<AiReviewItem, "status" | "title" | "summary" | "body">>) => {
    if (isReadOnly) return;
    setQueue((current) => updateAiReviewItem(current, id, patch));
  };

  const createQueueItem = (kind: AiReviewKind) => {
    if (isReadOnly) return;
    const draft = createAiReviewItem({
      kind,
      title: `${kind} draft`,
      summary: "Created from the queue screen",
      body: "Use the AI Lab to generate richer content, then approve it here.",
      status: approvalRequired ? "DRAFT" : "APPROVED",
    });
    setQueue((current) => [...current, draft]);
    toast.message("Draft added to the queue");
  };

  const updateVisibleItems = (status: AiReviewItem["status"]) => {
    if (isReadOnly) return;
    setQueue((current) =>
      current.map((item) =>
        visibleItems.some((visibleItem) => visibleItem.id === item.id) ? { ...item, status } : item,
      ),
    );
  };

  const resetQueue = () => {
    if (isReadOnly) return;
    setQueue([]);
    lastSyncedQueueRef.current = "";
    saveReviewQueueMutation.mutate([]);
    toast.success("Queue cleared");
  };

  const removeArchivedItems = () => {
    if (isReadOnly) return;
    setQueue((current) => current.filter((item) => item.status !== "ARCHIVED"));
    toast.success("Archived items removed from the queue");
  };

  const exportVisibleItems = () => {
    if (!visibleItems.length) {
      toast.message("No filtered items to export");
      return;
    }

    const headers = ["id", "kind", "status", "title", "summary", "createdAt", "updatedAt", "archivedAt", "approvedAt", "body"];
    const rows = visibleItems.map((item) =>
      headers
        .map((key) => {
          const value = item[key as keyof AiReviewItem];
          const text = value === null || value === undefined ? "" : String(value);
          return `"${text.replace(/"/g, '""')}"`;
        })
        .join(","),
    );

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `ai-review-queue-${selectedOrganizationId ?? "organization"}-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Filtered queue exported");
  };

  const resetFilters = () => {
    setSearch("");
    setKindFilter("ALL");
    setStatusFilter("ALL");
    setCreatedFrom("");
    setCreatedTo("");
    setUpdatedFrom("");
    setUpdatedTo("");
  };

  if (isPlatformSession && !selectedOrganizationId) {
    return (
      <div className="space-y-6">
        <OrganizationScopeBanner moduleLabel="AI Queue" />
        <Card className="border-border/70 bg-card/85 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle>Select an organization</CardTitle>
            <CardDescription>Super admin sessions need an organization selected before opening the queue.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={selectedOrganizationId} onValueChange={setSelectedOrganizationId}>
              <SelectTrigger>
                <SelectValue placeholder={organizationsQuery.isLoading ? "Loading organizations..." : "Choose organization"} />
              </SelectTrigger>
              <SelectContent>
                {organizationsQuery.data?.items?.map((organization) => (
                  <SelectItem key={organization.id} value={organization.id}>
                    {organization.name} · {getAiAccessLabel(organization)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <OrganizationScopeBanner moduleLabel="AI Queue" />
      <Card className="overflow-hidden border-border/70 bg-card/85 shadow-sm backdrop-blur">
        <CardHeader className="space-y-3 border-b bg-[linear-gradient(135deg,#0f172a_0%,#134e4a_52%,#f59e0b_100%)] text-white">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">Approval inbox</Badge>
              <CardTitle className="text-3xl tracking-tight">AI review queue</CardTitle>
              <CardDescription className="max-w-2xl text-white/75">
                Search, approve, and archive generated drafts before they are used in mail, notices, reminders, or support follow-up.
              </CardDescription>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">
                  Org policy: {approvalRequired ? "Approval required" : "Auto use allowed"}
                </Badge>
                <span className="text-xs text-white/70">
                  {approvalRequired
                    ? "Drafts stay in review until an admin approves them."
                    : "Approved drafts can move directly into send flows."}
                </span>
              </div>
            </div>
            <Badge className={cn("border-white/20 bg-white/10 text-white hover:bg-white/10", approvalRequired ? "border-rose-300/40" : "")}>
              <Sparkles className="mr-2 h-4 w-4" />
              {approvalRequired ? "Approval required" : "Auto use allowed"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 p-6">
          <div className="grid gap-3 md:grid-cols-4">
            <Stat label="Total" value={queueStats.total} />
            <Stat label="Drafts" value={queueStats.draft} />
            <Stat label="Approved" value={queueStats.approved} />
            <Stat label="Archived" value={queueStats.archived} />
          </div>

          {reviewQueueSummaryQuery.data ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <SummaryStat label="Server total" value={reviewQueueSummaryQuery.data.totalItems} />
              <SummaryStat label="Waiting review" value={reviewQueueSummaryQuery.data.draftItems} />
              <SummaryStat label="Latest update" value={reviewQueueSummaryQuery.data.latestUpdatedAt ? new Date(reviewQueueSummaryQuery.data.latestUpdatedAt).toLocaleString() : "None"} />
              <SummaryStat label="Latest approval" value={reviewQueueSummaryQuery.data.latestApprovedAt ? new Date(reviewQueueSummaryQuery.data.latestApprovedAt).toLocaleString() : "None"} />
            </div>
          ) : null}

          {kindStats.length ? (
            <div className="flex flex-wrap gap-2 rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm">
              {kindStats.map((item) => (
                <Badge key={item.kind} variant="outline" className="gap-2">
                  <span>{item.label}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-foreground">{item.count}</span>
                </Badge>
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/80 p-4 shadow-sm">
            <div className="space-y-1">
              <p className="text-sm font-medium">Organization approval rule</p>
              <p className="text-xs text-muted-foreground">
                {approvalRequired
                  ? "Generated AI content stays in review until approved."
                  : "Approved items can be used directly in send flows."}
              </p>
            </div>
            <Button type="button" variant="outline" asChild>
              <a href="/settings">Manage in settings</a>
            </Button>
          </div>

          {canSwitchQueueUser ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/80 p-4 shadow-sm">
              <div className="space-y-1">
                <p className="text-sm font-medium">Queue owner</p>
                <p className="text-xs text-muted-foreground">
                  {isReadOnly
                    ? `Viewing ${selectedQueueUser?.firstName ?? "another user's"} queue. Editing is disabled.`
                    : "This queue is tied to your own account for saving changes."}
                </p>
              </div>
              <Select value={selectedQueueUserId} onValueChange={(value) => setSelectedQueueUserId(value)}>
                <SelectTrigger className="w-full min-w-[260px] md:w-[320px]">
                  <SelectValue placeholder={usersQuery.isLoading ? "Loading users..." : "Select queue owner"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={user?.id ?? ""}>My queue</SelectItem>
                  {usersQuery.data?.items
                    ?.filter((item) => item.organizationId === selectedOrganizationId && item.id !== user?.id)
                    .map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.firstName} {item.lastName} · {item.email}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Search title, summary, body..." />
            </div>
            <Select value={kindFilter} onValueChange={(value) => setKindFilter(value as typeof kindFilter)}>
              <SelectTrigger>
                <SelectValue placeholder="Kind" />
              </SelectTrigger>
              <SelectContent>
                {kindOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <Field label="Created from">
              <Input type="date" value={createdFrom} onChange={(event) => setCreatedFrom(event.target.value)} />
            </Field>
            <Field label="Created to">
              <Input type="date" value={createdTo} onChange={(event) => setCreatedTo(event.target.value)} />
            </Field>
            <Field label="Updated from">
              <Input type="date" value={updatedFrom} onChange={(event) => setUpdatedFrom(event.target.value)} />
            </Field>
            <Field label="Updated to">
              <Input type="date" value={updatedTo} onChange={(event) => setUpdatedTo(event.target.value)} />
            </Field>
            <div className="flex items-end">
              <Button type="button" variant="outline" className="w-full" onClick={resetFilters}>
                Reset filters
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => createQueueItem("MAIL")} disabled={isReadOnly}>
              <ClipboardList className="mr-2 h-4 w-4" />
              Seed mail draft
            </Button>
            <Button variant="outline" size="sm" onClick={() => createQueueItem("NOTICE")} disabled={isReadOnly}>
              <Filter className="mr-2 h-4 w-4" />
              Seed notice draft
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateVisibleItems("APPROVED")}
              disabled={isReadOnly || !visibleItems.some((item) => item.status === "DRAFT")}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Approve visible
            </Button>
            <Button variant="ghost" size="sm" onClick={() => updateVisibleItems("ARCHIVED")} disabled={isReadOnly || !visibleItems.length}>
              <Archive className="mr-2 h-4 w-4" />
              Archive visible
            </Button>
            <Button variant="ghost" size="sm" onClick={resetQueue} disabled={isReadOnly || !queue.length || saveReviewQueueMutation.isPending}>
              Clear queue
            </Button>
            <Button variant="ghost" size="sm" onClick={removeArchivedItems} disabled={isReadOnly || !queueStats.archived}>
              Remove archived
            </Button>
            <Button variant="ghost" size="sm" onClick={exportVisibleItems} disabled={!visibleItems.length}>
              <Download className="mr-2 h-4 w-4" />
              Export visible
            </Button>
          </div>

          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Latest approved item: {latestApproved?.title ?? "None"}
            </p>
            {visibleItems.length ? (
              visibleItems.map((item) => (
                <div key={item.id} className="rounded-2xl border border-border/70 bg-background/80 p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{item.kind}</Badge>
                        <Badge variant={item.status === "APPROVED" ? "success" : item.status === "ARCHIVED" ? "secondary" : "warning"}>{item.status}</Badge>
                      </div>
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.summary}</p>
                        <p className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => copyText(item.body)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => mutateItem(item.id, { status: "APPROVED" })}
                        disabled={isReadOnly || item.status === "APPROVED"}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => mutateItem(item.id, { status: "ARCHIVED" })}
                        disabled={isReadOnly || item.status === "ARCHIVED"}
                      >
                        <Archive className="mr-2 h-4 w-4" />
                        Archive
                      </Button>
                    </div>
                  </div>
                  <Textarea readOnly value={item.body} className="mt-3 min-h-[140px] font-mono text-xs" />
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                No queue items match the current filters.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/80 p-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/80 p-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

async function copyText(value: string) {
  await navigator.clipboard.writeText(value);
  toast.success("Copied to clipboard");
}
