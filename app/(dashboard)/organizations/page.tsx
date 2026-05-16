"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Building2, Clock3, ReceiptText, ShieldCheck, Users, UserSquare2 } from "lucide-react";
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
import { activityLogsApi } from "@/features/activity-logs/api/activity-logs-api";
import { organizationsApi } from "@/features/organizations/api/organizations-api";
import { organizationSchema, type OrganizationSchema } from "@/features/organizations/schemas/organization-schema";
import { normalizeApiError } from "@/lib/api/errors";
import { getAiAccessLabel } from "@/lib/ai/access";
import { formatDate } from "@/lib/formatters";
import { exportRowsToCsv } from "@/lib/utils/export";
import { useAuth } from "@/providers/auth-provider";
import { useSavedFilterPresets } from "@/hooks/use-saved-filter-presets";
import type { UpdateOrganizationBillingEntryDto, UpdateOrganizationDto } from "@/types/dto";
import type { ActivityLog, Organization, OrganizationBillingEntry } from "@/types/domain";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

const subscriptionStatuses = ["TRIAL", "ACTIVE", "PAST_DUE", "SUSPENDED", "CANCELLED"] as const;
const billingEntryTypes = ["SUBSCRIPTION", "TRIAL_EXTENSION", "ADJUSTMENT", "MANUAL_INVOICE"] as const;
const billingEntryStatuses = ["OPEN", "PAID", "VOID"] as const;
type BillingEntryTypeValue = (typeof billingEntryTypes)[number];
type BillingEntryStatusValue = (typeof billingEntryStatuses)[number];

function getOrganizationBillingStatus(organization: {
  subscriptionStatus: (typeof subscriptionStatuses)[number];
  trialEndsAt: string | null;
}) {
  const trialExpired =
    organization.subscriptionStatus === "TRIAL" &&
    organization.trialEndsAt !== null &&
    new Date(organization.trialEndsAt).getTime() <= Date.now();

  return {
    label: trialExpired ? "Trial expired" : organization.subscriptionStatus.replaceAll("_", " "),
    variant: trialExpired ? "danger" : organization.subscriptionStatus === "ACTIVE" ? "success" : "warning",
    trialExpired,
  } as const;
}

export default function OrganizationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [subscriptionFilter, setSubscriptionFilter] = useState("ALL");
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 12;
  const [open, setOpen] = useState(false);
  const [editingOrganization, setEditingOrganization] = useState<Organization | null>(null);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [billingOpen, setBillingOpen] = useState(false);
  const [editingBillingEntry, setEditingBillingEntry] = useState<OrganizationBillingEntry | null>(null);
  const [billingStatusFilter, setBillingStatusFilter] = useState<(typeof billingEntryStatuses)[number] | "ALL">("ALL");
  const [billingSearch, setBillingSearch] = useState("");
  const [billingQuickFilter, setBillingQuickFilter] = useState<"ALL" | "OVERDUE">("ALL");
  const [selectedBillingEntryIds, setSelectedBillingEntryIds] = useState<string[]>([]);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [billingForm, setBillingForm] = useState<{
    type: BillingEntryTypeValue;
    status: BillingEntryStatusValue;
    title: string;
    description: string;
    amount: number;
    currency: string;
    dueDate: string;
    entryDate: string;
    periodStart: string;
    periodEnd: string;
  }>({
    type: "MANUAL_INVOICE",
    status: "OPEN",
    title: "",
    description: "",
    amount: 0,
    currency: "USD",
    dueDate: "",
    entryDate: "",
    periodStart: "",
    periodEnd: "",
  });
  const savedOrganizationFilterPresets = useSavedFilterPresets<{
    search: string;
    statusFilter: string;
    subscriptionFilter: string;
  }>("organizations-filter-presets");
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

  const organizationsQuery = useQuery({
    queryKey: ["organizations", debouncedSearch, pageIndex, pageSize],
    queryFn: () => organizationsApi.list({ page: pageIndex + 1, limit: pageSize, search: debouncedSearch }),
    enabled: user?.roles.includes("SUPER_ADMIN") ?? false,
  });
  const billingEntriesQuery = useQuery({
    queryKey: ["organizations", selectedOrganization?.id, "billing-entries"],
    queryFn: () => organizationsApi.billingEntries(selectedOrganization!.id),
    enabled: Boolean(selectedOrganization?.id),
  });
  const organizationActivityLogsQuery = useQuery({
    queryKey: ["organizations", selectedOrganization?.id, "activity-logs"],
    queryFn: () =>
      activityLogsApi.list({
        page: 1,
        limit: 8,
        module: "organizations",
        targetId: selectedOrganization!.id,
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
    enabled: Boolean(selectedOrganization?.id),
  });
  const organizationSettingsActivityLogsQuery = useQuery({
    queryKey: ["organization-settings", selectedOrganization?.id, "activity-logs"],
    queryFn: () =>
      activityLogsApi.list({
        page: 1,
        limit: 8,
        module: "organization-settings",
        targetId: selectedOrganization!.id,
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
    enabled: Boolean(selectedOrganization?.id),
  });

  const form = useForm<OrganizationSchema>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: "",
      slug: "",
      email: "",
      phone: "",
      address: "",
      openAiApiKey: "",
      isActive: true,
      subscriptionStatus: "TRIAL",
      trialDays: 14,
      trialStartsAt: "",
      trialEndsAt: "",
      subscriptionStartsAt: "",
      subscriptionEndsAt: "",
      subscriptionNotes: "",
      userLimit: 10,
      studentLimit: 500,
      enabledModules: [],
      aiDraftApprovalRequired: false,
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: OrganizationSchema) => {
      const payload = {
        ...values,
        email: values.email || undefined,
        phone: values.phone || undefined,
        address: values.address || undefined,
        trialStartsAt: values.trialStartsAt || undefined,
        trialEndsAt: values.trialEndsAt || undefined,
        subscriptionStartsAt: values.subscriptionStartsAt || undefined,
        subscriptionEndsAt: values.subscriptionEndsAt || undefined,
        subscriptionNotes: values.subscriptionNotes || undefined,
        openAiApiKey: values.openAiApiKey || undefined,
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
  const billingMutation = useMutation({
    mutationFn: () => {
      if (!selectedOrganization) {
        throw new Error("Organization is required");
      }
      return organizationsApi.createBillingEntry(selectedOrganization.id, {
        type: billingForm.type,
        status: billingForm.status,
        title: billingForm.title,
        description: billingForm.description || undefined,
        amount: Number(billingForm.amount),
        currency: billingForm.currency || "USD",
        dueDate: billingForm.dueDate || undefined,
        entryDate: billingForm.entryDate || undefined,
        periodStart: billingForm.periodStart || undefined,
        periodEnd: billingForm.periodEnd || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Billing entry added");
      queryClient.invalidateQueries({ queryKey: ["organizations", selectedOrganization?.id, "billing-entries"] });
      queryClient.invalidateQueries({ queryKey: ["organizations", selectedOrganization?.id, "activity-logs"] });
      queryClient.invalidateQueries({ queryKey: ["organization-settings", selectedOrganization?.id, "activity-logs"] });
      setBillingOpen(false);
      setBillingForm({
        type: "MANUAL_INVOICE",
        status: "OPEN",
        title: "",
        description: "",
        amount: 0,
        currency: "USD",
        dueDate: "",
        entryDate: "",
        periodStart: "",
        periodEnd: "",
      });
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });
  const billingUpdateMutation = useMutation({
    mutationFn: async (payload: { entryId: string; update: UpdateOrganizationBillingEntryDto }) => {
      if (!selectedOrganization) {
        throw new Error("Organization is required");
      }

      return organizationsApi.updateBillingEntry(selectedOrganization.id, payload.entryId, payload.update);
    },
    onSuccess: () => {
      toast.success("Billing entry updated");
      queryClient.invalidateQueries({ queryKey: ["organizations", selectedOrganization?.id, "billing-entries"] });
      queryClient.invalidateQueries({ queryKey: ["organizations", selectedOrganization?.id, "activity-logs"] });
      queryClient.invalidateQueries({ queryKey: ["organization-settings", selectedOrganization?.id, "activity-logs"] });
      setEditingBillingEntry(null);
      setBillingOpen(false);
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });
  const bulkBillingUpdateMutation = useMutation({
    mutationFn: async (payload: {
      entryIds: string[];
      update: { status: BillingEntryStatusValue };
    }) => {
      if (!selectedOrganization) {
        throw new Error("Organization is required");
      }

      await Promise.all(
        payload.entryIds.map((entryId) => organizationsApi.updateBillingEntry(selectedOrganization.id, entryId, payload.update)),
      );
      return payload.entryIds.length;
    },
    onSuccess: (updatedCount) => {
      toast.success(`${updatedCount} billing entr${updatedCount === 1 ? "y" : "ies"} updated`);
      queryClient.invalidateQueries({ queryKey: ["organizations", selectedOrganization?.id, "billing-entries"] });
      queryClient.invalidateQueries({ queryKey: ["organizations", selectedOrganization?.id, "activity-logs"] });
      queryClient.invalidateQueries({ queryKey: ["organization-settings", selectedOrganization?.id, "activity-logs"] });
      setSelectedBillingEntryIds([]);
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });
  const lifecycleMutation = useMutation({
    mutationFn: async (payload: UpdateOrganizationDto) => {
      if (!selectedOrganization) {
        throw new Error("Organization is required");
      }

      return organizationsApi.update(selectedOrganization.id, payload);
    },
    onSuccess: (organization) => {
      toast.success("Subscription state updated");
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.invalidateQueries({ queryKey: ["organizations", selectedOrganization?.id, "activity-logs"] });
      queryClient.invalidateQueries({ queryKey: ["organization-settings", selectedOrganization?.id, "activity-logs"] });
      setSelectedOrganization(organization);
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const filteredOrganizations = useMemo(() => {
    const items = organizationsQuery.data?.items ?? [];

    return items.filter((item) => {
      if (statusFilter === "ALL") {
        return subscriptionFilter === "ALL" ? true : item.subscriptionStatus === subscriptionFilter;
      }
      const matchesStatus = statusFilter === "ACTIVE" ? item.isActive : !item.isActive;
      const matchesSubscription = subscriptionFilter === "ALL" ? true : item.subscriptionStatus === subscriptionFilter;
      return matchesStatus && matchesSubscription;
    });
  }, [organizationsQuery.data, statusFilter, subscriptionFilter]);

  const hasLocalFilters = statusFilter !== "ALL" || subscriptionFilter !== "ALL";

  const organizationStats = useMemo(() => {
    const items = filteredOrganizations;
    const totalUserLimit = items.reduce((sum, item) => sum + item.userLimit, 0);
    const totalStudentLimit = items.reduce((sum, item) => sum + item.studentLimit, 0);

    return {
      totalOrganizations: items.length,
      totalAdmins: items.reduce((sum, item) => sum + item.totalAdmins, 0),
      totalStudents: items.reduce((sum, item) => sum + item.totalStudents, 0),
      totalUsers: items.reduce((sum, item) => sum + item.totalUsers, 0),
      totalUserLimit,
      totalStudentLimit,
      activeOrganizations: items.filter((item) => item.isActive).length,
      inactiveOrganizations: items.filter((item) => !item.isActive).length,
      activeSubscriptions: items.filter((item) => item.subscriptionStatus === "ACTIVE").length,
      pastDueSubscriptions: items.filter((item) => item.subscriptionStatus === "PAST_DUE").length,
      trials: items.filter((item) => item.subscriptionStatus === "TRIAL" && (!item.trialEndsAt || new Date(item.trialEndsAt).getTime() > Date.now())).length,
      expiredTrials: items.filter((item) => item.subscriptionStatus === "PAST_DUE" && item.trialEndsAt !== null).length,
      expiringTrials: items.filter((item) => {
        if (item.subscriptionStatus !== "TRIAL" || !item.trialEndsAt) return false;
        const diff = new Date(item.trialEndsAt).getTime() - Date.now();
        return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
      }).length,
    };
  }, [filteredOrganizations]);
  const lifecycleSummary = useMemo(() => {
    if (!selectedOrganization) {
      return null;
    }

    const billingStatus = getOrganizationBillingStatus(selectedOrganization);
    const trialEndsAt = selectedOrganization.trialEndsAt ? new Date(selectedOrganization.trialEndsAt) : null;
    const subscriptionEndsAt = selectedOrganization.subscriptionEndsAt ? new Date(selectedOrganization.subscriptionEndsAt) : null;
    const trialExpired = billingStatus.trialExpired;

    return {
      billingStatus,
      trialEndsAt,
      subscriptionEndsAt,
      trialExpired,
    };
  }, [selectedOrganization]);
  const organizationAuditLogs = useMemo<ActivityLog[]>(() => {
    const organizationLogs = organizationActivityLogsQuery.data?.items ?? [];
    const settingsLogs = organizationSettingsActivityLogsQuery.data?.items ?? [];

    return [...organizationLogs, ...settingsLogs]
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
      .slice(0, 8);
  }, [organizationActivityLogsQuery.data, organizationSettingsActivityLogsQuery.data]);
  const filteredBillingEntries = useMemo(() => {
    const entries = billingEntriesQuery.data ?? [];
    const searchTerm = billingSearch.trim().toLowerCase();

    return entries.filter((entry) => {
      const matchesStatus = billingStatusFilter === "ALL" ? true : entry.status === billingStatusFilter;
      const matchesSearch = searchTerm
        ? [entry.title, entry.description ?? "", entry.type, entry.status, entry.currency]
            .join(" ")
            .toLowerCase()
            .includes(searchTerm)
        : true;
      const isOverdue = Boolean(entry.dueDate && entry.status === "OPEN" && new Date(entry.dueDate).getTime() < Date.now());
      const matchesQuickFilter = billingQuickFilter === "ALL" ? true : isOverdue;

      return matchesStatus && matchesSearch && matchesQuickFilter;
    });
  }, [billingEntriesQuery.data, billingQuickFilter, billingSearch, billingStatusFilter]);
  const selectedBillingEntries = useMemo(
    () => filteredBillingEntries.filter((entry) => selectedBillingEntryIds.includes(entry.id)),
    [filteredBillingEntries, selectedBillingEntryIds],
  );
  const visibleBillingEntryIds = useMemo(() => filteredBillingEntries.map((entry) => entry.id), [filteredBillingEntries]);
  const allVisibleBillingSelected = visibleBillingEntryIds.length > 0 && visibleBillingEntryIds.every((id) => selectedBillingEntryIds.includes(id));
  const someVisibleBillingSelected =
    visibleBillingEntryIds.some((id) => selectedBillingEntryIds.includes(id)) && !allVisibleBillingSelected;
  const selectedBillingSummary = useMemo(
    () => ({
      total: selectedBillingEntries.length,
      open: selectedBillingEntries.filter((entry) => entry.status === "OPEN").length,
      paid: selectedBillingEntries.filter((entry) => entry.status === "PAID").length,
      void: selectedBillingEntries.filter((entry) => entry.status === "VOID").length,
      overdue: selectedBillingEntries.filter(
        (entry) => Boolean(entry.dueDate && entry.status === "OPEN" && new Date(entry.dueDate).getTime() < Date.now()),
      ).length,
    }),
    [selectedBillingEntries],
  );
  const billingCounts = useMemo(
    () => ({
      open: billingEntriesQuery.data?.filter((entry) => entry.status === "OPEN").length ?? 0,
      paid: billingEntriesQuery.data?.filter((entry) => entry.status === "PAID").length ?? 0,
      void: billingEntriesQuery.data?.filter((entry) => entry.status === "VOID").length ?? 0,
      overdue:
        billingEntriesQuery.data?.filter(
          (entry) => Boolean(entry.dueDate && entry.status === "OPEN" && new Date(entry.dueDate).getTime() < Date.now()),
        ).length ?? 0,
    }),
    [billingEntriesQuery.data],
  );
  const formatDaysOverdue = (entry: OrganizationBillingEntry) => {
    if (!entry.dueDate || entry.status !== "OPEN") {
      return "N/A";
    }

    const diff = Date.now() - new Date(entry.dueDate).getTime();
    if (diff <= 0) {
      return "Not overdue";
    }

    const days = Math.max(1, Math.ceil(diff / (24 * 60 * 60 * 1000)));
    return `${days} day${days === 1 ? "" : "s"}`;
  };
  const getBillingDueTone = (entry: OrganizationBillingEntry) => {
    if (!entry.dueDate) {
      return { label: "No due date", variant: "outline" as const };
    }

    if (entry.status === "PAID") {
      return { label: "Paid", variant: "success" as const };
    }

    if (entry.status === "VOID") {
      return { label: "Voided", variant: "secondary" as const };
    }

    const diff = new Date(entry.dueDate).getTime() - Date.now();
    if (diff < 0) {
      return { label: "Overdue", variant: "danger" as const };
    }

    const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
    if (days <= 3) {
      return { label: `Due in ${days} day${days === 1 ? "" : "s"}`, variant: "warning" as const };
    }

    if (days <= 14) {
      return { label: `Due in ${days} days`, variant: "outline" as const };
    }

    return { label: `Due in ${days} days`, variant: "secondary" as const };
  };
  const runBillingEntryStatusAction = (entry: OrganizationBillingEntry, action: "PAID" | "OPEN" | "VOID") => {
    billingUpdateMutation.mutate({
      entryId: entry.id,
      update: { status: action },
    });
  };

  useEffect(() => {
    setBillingStatusFilter("ALL");
    setBillingQuickFilter("ALL");
    setBillingSearch("");
    setSelectedBillingEntryIds([]);
  }, [selectedOrganization?.id]);
  const billingExportRows = useMemo(
    () =>
      filteredBillingEntries.map((entry) => ({
        Title: entry.title,
        Type: entry.type.replaceAll("_", " "),
        Status: entry.status,
        Amount: `${entry.currency} ${entry.amount}`,
        DueDate: entry.dueDate ? formatDate(entry.dueDate) : "N/A",
        EntryDate: formatDate(entry.entryDate),
        Period: `${formatDate(entry.periodStart)} to ${formatDate(entry.periodEnd)}`,
        UpdatedAt: formatDate(entry.updatedAt),
        Description: entry.description ?? "",
      })),
    [filteredBillingEntries],
  );

  const runLifecycleAction = (action: "extend-trial" | "activate" | "past-due" | "suspend" | "cancel") => {
    if (!selectedOrganization) {
      return;
    }

    const currentTrialEndsAt = selectedOrganization.trialEndsAt ? new Date(selectedOrganization.trialEndsAt) : new Date();
    const nextTrialEndsAt = new Date(currentTrialEndsAt);
    nextTrialEndsAt.setDate(nextTrialEndsAt.getDate() + 7);

    const now = new Date().toISOString();
    const payload: UpdateOrganizationDto =
      action === "extend-trial"
        ? {
            subscriptionStatus: "TRIAL",
            trialDays: selectedOrganization.trialDays + 7,
            trialEndsAt: nextTrialEndsAt.toISOString(),
          }
        : action === "activate"
          ? {
              subscriptionStatus: "ACTIVE",
              subscriptionStartsAt: now,
            }
          : action === "past-due"
            ? {
                subscriptionStatus: "PAST_DUE",
              }
            : action === "suspend"
              ? {
                  subscriptionStatus: "SUSPENDED",
                }
              : {
                  subscriptionStatus: "CANCELLED",
                };

    const actionLabels: Record<typeof action, string> = {
      "extend-trial": "extend this trial by 7 days",
      activate: "mark this subscription active",
      "past-due": "mark this subscription past due",
      suspend: "suspend this subscription",
      cancel: "cancel this subscription",
    };

    if (window.confirm(`Do you want to ${actionLabels[action]} for ${selectedOrganization.name}?`)) {
      lifecycleMutation.mutate(payload);
    }
  };
  const resetBillingForm = (entry?: OrganizationBillingEntry | null) => {
    setBillingForm({
      type: entry?.type ?? "MANUAL_INVOICE",
      status: entry?.status ?? "OPEN",
      title: entry?.title ?? "",
      description: entry?.description ?? "",
      amount: entry?.amount ?? 0,
      currency: entry?.currency ?? "USD",
      dueDate: entry?.dueDate ? entry.dueDate.slice(0, 10) : "",
      entryDate: entry?.entryDate ? entry.entryDate.slice(0, 10) : "",
      periodStart: entry?.periodStart ? entry.periodStart.slice(0, 10) : "",
      periodEnd: entry?.periodEnd ? entry.periodEnd.slice(0, 10) : "",
    });
  };
  const openCreateBillingEntryDialog = () => {
    setEditingBillingEntry(null);
    resetBillingForm(null);
    setBillingOpen(true);
  };
  const openEditBillingEntryDialog = (entry: OrganizationBillingEntry) => {
    setEditingBillingEntry(entry);
    resetBillingForm(entry);
    setBillingOpen(true);
  };
  const organizationSnapshotRows = useMemo(
    () => [
      {
        Section: "Tenant KPI snapshot",
        Metric: "Organizations",
        Value: organizationStats.totalOrganizations,
      },
      {
        Section: "Tenant KPI snapshot",
        Metric: "Active organizations",
        Value: organizationStats.activeOrganizations,
      },
      {
        Section: "Tenant KPI snapshot",
        Metric: "Inactive organizations",
        Value: organizationStats.inactiveOrganizations,
      },
      {
        Section: "Tenant KPI snapshot",
        Metric: "Users",
        Value: organizationStats.totalUsers,
      },
      {
        Section: "Tenant KPI snapshot",
        Metric: "Students",
        Value: organizationStats.totalStudents,
      },
      {
        Section: "Tenant KPI snapshot",
        Metric: "Active billing",
        Value: organizationStats.activeSubscriptions,
      },
      {
        Section: "Tenant KPI snapshot",
        Metric: "Past due",
        Value: organizationStats.pastDueSubscriptions,
      },
      {
        Section: "Tenant KPI snapshot",
        Metric: "Trial organizations",
        Value: organizationStats.trials,
      },
      {
        Section: "Tenant KPI snapshot",
        Metric: "Expired trials",
        Value: organizationStats.expiredTrials,
      },
      {
        Section: "Tenant KPI snapshot",
        Metric: "Trials expiring in 7 days",
        Value: organizationStats.expiringTrials,
      },
      {
        Section: "Tenant KPI snapshot",
        Metric: "User capacity used",
        Value: organizationStats.totalUserLimit > 0 ? `${Math.round((organizationStats.totalUsers / organizationStats.totalUserLimit) * 100)}%` : "N/A",
      },
      {
        Section: "Tenant KPI snapshot",
        Metric: "Student capacity used",
        Value:
          organizationStats.totalStudentLimit > 0
            ? `${Math.round((organizationStats.totalStudents / organizationStats.totalStudentLimit) * 100)}%`
            : "N/A",
      },
      ...filteredOrganizations.map((organization) => ({
        Section: "Organization detail",
        Name: organization.name,
        Slug: organization.slug,
        Status: organization.isActive ? "Active" : "Inactive",
        Billing: getOrganizationBillingStatus(organization).label,
        AIApproval: organization.aiDraftApprovalRequired ? "Required" : "Optional",
        Users: organization.totalUsers,
        Students: organization.totalStudents,
        Batches: organization.totalBatches,
        FeePlans: organization.totalFeePlans,
        FeeRecords: organization.totalFeeRecords,
        AttendanceRecords: organization.totalAttendanceRecords,
        ReminderLogs: organization.totalReminderLogs,
        Modules: organization.enabledModules.map((module) => module.replaceAll("_", " ")).join(", "),
      })),
    ],
    [filteredOrganizations, organizationStats],
  );

  const columns = useMemo<Array<ColumnDef<Organization>>>(
    () => [
      {
        accessorKey: "name",
        header: "Organization",
        cell: ({ row }) => (
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">{row.original.name}</p>
              <Badge variant={row.original.hasOpenAiApiKey || row.original.hasTrialAiAccess ? "success" : "warning"} className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.16em]">
                {getAiAccessLabel(row.original)}
              </Badge>
            </div>
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
          <div className="space-y-1.5 text-sm leading-snug">
            <p>
              {row.original.totalAdmins} admins · {row.original.totalStaff} staff · {row.original.totalUsers} users
            </p>
            <p className="text-xs text-muted-foreground">
              {row.original.totalStudents} students · {row.original.totalBatches} batches · {row.original.totalFeeRecords} fee records
            </p>
            <p className="text-xs text-muted-foreground">
              Limits: {row.original.totalUsers}/{row.original.userLimit} users · {row.original.totalStudents}/{row.original.studentLimit} students
            </p>
            <p className="text-xs text-muted-foreground">
              Billing: {getOrganizationBillingStatus(row.original).label} · trial {row.original.trialDays} days
            </p>
            <p className="text-xs text-muted-foreground">
        AI: {row.original.hasOpenAiApiKey ? "ready for tenant workflows" : row.original.hasTrialAiAccess ? "available during the trial window" : "key missing for AI workflows"}
            · approval {row.original.aiDraftApprovalRequired ? "required" : "optional"}
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
        cell: ({ row }) => (
          <div className="flex flex-col gap-1 py-0.5">
            <Badge variant={row.original.isActive ? "success" : "warning"}>{row.original.isActive ? "Active" : "Inactive"}</Badge>
            {(() => {
              const billingStatus = getOrganizationBillingStatus(row.original);
              return (
                <div className="space-y-0.5">
                  <Badge variant={billingStatus.variant}>{billingStatus.label}</Badge>
                  {billingStatus.trialExpired && row.original.trialEndsAt ? (
                    <p className="max-w-[12rem] text-[11px] leading-snug text-muted-foreground">
                      Trial ended on {formatDate(row.original.trialEndsAt)}
                    </p>
                  ) : null}
                </div>
              );
            })()}
          </div>
        ),
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
            <Button variant="outline" size="sm" className="rounded-full px-3 shadow-sm hover:border-primary/40 hover:bg-primary/5" onClick={() => setSelectedOrganization(row.original)}>
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
                  openAiApiKey: "",
                  isActive: row.original.isActive,
                  subscriptionStatus: row.original.subscriptionStatus,
                  trialDays: row.original.trialDays,
                  trialStartsAt: row.original.trialStartsAt ? row.original.trialStartsAt.slice(0, 10) : "",
                  trialEndsAt: row.original.trialEndsAt ? row.original.trialEndsAt.slice(0, 10) : "",
                  subscriptionStartsAt: row.original.subscriptionStartsAt ? row.original.subscriptionStartsAt.slice(0, 10) : "",
                  subscriptionEndsAt: row.original.subscriptionEndsAt ? row.original.subscriptionEndsAt.slice(0, 10) : "",
                  subscriptionNotes: row.original.subscriptionNotes ?? "",
                  userLimit: row.original.userLimit,
                  studentLimit: row.original.studentLimit,
                  enabledModules: row.original.enabledModules,
                  aiDraftApprovalRequired: row.original.aiDraftApprovalRequired,
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

  const openOnboardingWizard = () => {
    setEditingOrganization(null);
    setOnboardingStep(0);
    form.reset({
      name: "",
      slug: "",
      email: "",
      phone: "",
      address: "",
      openAiApiKey: "",
      isActive: true,
      subscriptionStatus: "TRIAL",
      trialDays: 14,
      trialStartsAt: "",
      trialEndsAt: "",
      subscriptionStartsAt: "",
      subscriptionEndsAt: "",
      subscriptionNotes: "",
      userLimit: 10,
      studentLimit: 500,
      enabledModules: [],
      aiDraftApprovalRequired: false,
    });
    setOpen(true);
  };

  const goToNextOnboardingStep = async () => {
    const fields =
      onboardingStep === 0
        ? (["name", "slug", "email", "phone", "address", "openAiApiKey", "subscriptionStatus", "trialDays"] as const)
        : (["trialStartsAt", "trialEndsAt", "subscriptionStartsAt", "subscriptionEndsAt", "subscriptionNotes", "userLimit", "studentLimit", "enabledModules"] as const);

    const valid = await form.trigger(fields as never);
    if (!valid) {
      return;
    }

    setOnboardingStep((current) => Math.min(current + 1, 1));
  };

  const goToPreviousOnboardingStep = () => {
    setOnboardingStep((current) => Math.max(current - 1, 0));
  };

  const onboardingProgress = onboardingStep === 0 ? 1 : 2;

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
        exportConfig={{ filename: "organization-tenant-snapshot", rows: organizationSnapshotRows }}
        filters={
          <>
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
            <NativeSelect
              value={subscriptionFilter}
              onChange={(event) => {
                setSubscriptionFilter(event.target.value);
                setPageIndex(0);
              }}
            >
              <option value="ALL">All billing states</option>
              {subscriptionStatuses.map((status) => (
                <option key={status} value={status}>
                  {status.replaceAll("_", " ")}
                </option>
              ))}
            </NativeSelect>
          </>
        }
        action={
          <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
              setOpen(nextOpen);
              if (!nextOpen) {
                setEditingOrganization(null);
                setOnboardingStep(0);
                form.reset();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button onClick={openOnboardingWizard}>Onboard organization</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingOrganization ? "Edit organization" : "Onboard organization"}</DialogTitle>
                <DialogDescription>Create a tenant boundary before assigning admins, staff, and students.</DialogDescription>
              </DialogHeader>
              {editingOrganization ? (
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
                  <FormField label="Subscription status" required error={form.formState.errors.subscriptionStatus}>
                    <NativeSelect {...form.register("subscriptionStatus")}>
                      {subscriptionStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status.replaceAll("_", " ")}
                        </option>
                      ))}
                    </NativeSelect>
                  </FormField>
                  <FormField label="Trial days" required error={form.formState.errors.trialDays}>
                    <Input type="number" min={0} {...form.register("trialDays", { valueAsNumber: true })} />
                  </FormField>
                  <FormField label="Trial starts on" error={form.formState.errors.trialStartsAt}>
                    <Input type="date" {...form.register("trialStartsAt")} />
                  </FormField>
                  <FormField label="Trial ends on" error={form.formState.errors.trialEndsAt}>
                    <Input type="date" {...form.register("trialEndsAt")} />
                  </FormField>
                  <FormField label="Subscription starts on" error={form.formState.errors.subscriptionStartsAt}>
                    <Input type="date" {...form.register("subscriptionStartsAt")} />
                  </FormField>
                  <FormField label="Subscription ends on" error={form.formState.errors.subscriptionEndsAt}>
                    <Input type="date" {...form.register("subscriptionEndsAt")} />
                  </FormField>
                  <FormField label="Billing notes" className="md:col-span-2" error={form.formState.errors.subscriptionNotes}>
                    <Textarea rows={3} {...form.register("subscriptionNotes")} />
                  </FormField>
                  <FormField label="Address" className="md:col-span-2" error={form.formState.errors.address}>
                    <Textarea rows={4} {...form.register("address")} />
                  </FormField>
                  <FormField label="OpenAI API key" className="md:col-span-2" error={form.formState.errors.openAiApiKey}>
                    <Input
                      type="password"
                      autoComplete="off"
                      placeholder="Leave blank to keep the existing key"
                      {...form.register("openAiApiKey")}
                    />
                  </FormField>
                  <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 shadow-sm md:col-span-2">
                    <Checkbox
                      checked={form.watch("aiDraftApprovalRequired")}
                      onChange={(event) => form.setValue("aiDraftApprovalRequired", event.target.checked, { shouldDirty: true })}
                      label="Require approval for AI drafts"
                    />
                    <p className="mt-2 text-xs text-muted-foreground">
                      Generated notices, mail drafts, and reminder drafts must be approved before use.
                    </p>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <p className="text-sm font-medium">Enabled modules</p>
                    <div className="grid gap-2 rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm md:grid-cols-2">
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
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-3 rounded-[1.75rem] border border-border/70 bg-muted/20 px-4 py-3 shadow-sm">
                    <div>
                      <p className="text-sm font-medium">Step {onboardingProgress} of 2</p>
                      <p className="text-xs text-muted-foreground">
                        {onboardingStep === 0
                          ? "Start with tenant identity and billing posture."
                          : "Finish limits and module access before creating the tenant."}
                      </p>
                    </div>
                    <Badge variant="outline">{onboardingStep === 0 ? "Identity" : "Access & limits"}</Badge>
                  </div>
                  <form
                    className="grid gap-4 md:grid-cols-2"
                    onSubmit={(event) => {
                      if (onboardingStep === 0) {
                        event.preventDefault();
                        return;
                      }

                      void form.handleSubmit((values) => mutation.mutate(values))(event);
                    }}
                  >
                    {onboardingStep === 0 ? (
                      <>
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
                        <FormField label="OpenAI API key" className="md:col-span-2" error={form.formState.errors.openAiApiKey}>
                          <Input
                            type="password"
                            autoComplete="off"
                            placeholder="Leave blank to keep the existing key"
                            {...form.register("openAiApiKey")}
                          />
                        </FormField>
                        <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 shadow-sm md:col-span-2">
                          <Checkbox
                            checked={form.watch("aiDraftApprovalRequired")}
                            onChange={(event) => form.setValue("aiDraftApprovalRequired", event.target.checked, { shouldDirty: true })}
                            label="Require approval for AI drafts"
                          />
                          <p className="mt-2 text-xs text-muted-foreground">
                            Keep generated drafts in review until an admin approves them.
                          </p>
                        </div>
                        <FormField label="Subscription status" required error={form.formState.errors.subscriptionStatus}>
                          <NativeSelect {...form.register("subscriptionStatus")}>
                            {subscriptionStatuses.map((status) => (
                              <option key={status} value={status}>
                                {status.replaceAll("_", " ")}
                              </option>
                            ))}
                          </NativeSelect>
                        </FormField>
                        <FormField label="Trial days" required error={form.formState.errors.trialDays}>
                          <Input type="number" min={0} {...form.register("trialDays", { valueAsNumber: true })} />
                        </FormField>
                        <FormField label="Trial starts on" error={form.formState.errors.trialStartsAt}>
                          <Input type="date" {...form.register("trialStartsAt")} />
                        </FormField>
                        <FormField label="Trial ends on" error={form.formState.errors.trialEndsAt}>
                          <Input type="date" {...form.register("trialEndsAt")} />
                        </FormField>
                      </>
                    ) : (
                      <>
                        <FormField label="User limit" required error={form.formState.errors.userLimit}>
                          <Input type="number" min={1} {...form.register("userLimit", { valueAsNumber: true })} />
                        </FormField>
                        <FormField label="Student limit" required error={form.formState.errors.studentLimit}>
                          <Input type="number" min={1} {...form.register("studentLimit", { valueAsNumber: true })} />
                        </FormField>
                        <FormField label="Subscription starts on" error={form.formState.errors.subscriptionStartsAt}>
                          <Input type="date" {...form.register("subscriptionStartsAt")} />
                        </FormField>
                        <FormField label="Subscription ends on" error={form.formState.errors.subscriptionEndsAt}>
                          <Input type="date" {...form.register("subscriptionEndsAt")} />
                        </FormField>
                        <FormField label="Billing notes" className="md:col-span-2" error={form.formState.errors.subscriptionNotes}>
                          <Textarea rows={3} {...form.register("subscriptionNotes")} />
                        </FormField>
                        <div className="space-y-2 md:col-span-2">
                          <p className="text-sm font-medium">Enabled modules</p>
                          <div className="grid gap-2 rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm md:grid-cols-2">
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
                      </>
                    )}
                    <div className="md:col-span-2 flex items-center justify-between gap-2 pt-2">
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                          Cancel
                        </Button>
                        {onboardingStep > 0 ? (
                          <Button type="button" variant="outline" onClick={goToPreviousOnboardingStep}>
                            Back
                          </Button>
                        ) : null}
                      </div>
                      {onboardingStep === 0 ? (
                        <Button type="button" onClick={goToNextOnboardingStep}>
                          Continue
                        </Button>
                      ) : (
                        <Button type="submit" disabled={mutation.isPending}>
                          {mutation.isPending ? "Saving..." : "Create organization"}
                        </Button>
                      )}
                    </div>
                  </form>
                </div>
              )}
            </DialogContent>
          </Dialog>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard title="Organizations" value={String(organizationStats.totalOrganizations)} helper="Total onboarded institutions" icon={Building2} tone="sky" />
        <MetricCard title="Admins" value={String(organizationStats.totalAdmins)} helper="Tenant admins across all organizations" icon={ShieldCheck} tone="violet" />
        <MetricCard title="Users" value={String(organizationStats.totalUsers)} helper="Organization-scoped platform users" icon={Users} tone="emerald" />
        <MetricCard title="Students" value={String(organizationStats.totalStudents)} helper="Students across onboarded organizations" icon={UserSquare2} tone="amber" />
        <MetricCard title="Active billing" value={String(organizationStats.activeSubscriptions)} helper="Organizations on active subscription" icon={ShieldCheck} tone="emerald" />
        <MetricCard title="Trials expiring" value={String(organizationStats.expiringTrials)} helper={`${organizationStats.trials} total trial organizations`} icon={Clock3} tone="amber" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Active orgs" value={String(organizationStats.activeOrganizations)} helper="Organizations currently enabled" icon={Building2} tone="emerald" />
        <MetricCard title="Inactive orgs" value={String(organizationStats.inactiveOrganizations)} helper="Organizations paused or disabled" icon={Clock3} tone="rose" />
        <MetricCard title="Past due" value={String(organizationStats.pastDueSubscriptions)} helper="Organizations behind on billing" icon={ReceiptText} tone="amber" />
        <MetricCard
          title="User capacity used"
          value={organizationStats.totalUserLimit > 0 ? `${Math.round((organizationStats.totalUsers / organizationStats.totalUserLimit) * 100)}%` : "N/A"}
          helper={`${organizationStats.totalUsers} users of ${organizationStats.totalUserLimit} seat limit`}
          icon={Users}
          tone="sky"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={buildActivityLogsHref({ module: "organizations" })}>Audit tenant events</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={buildActivityLogsHref({ action: "create-billing-entry" })}>Audit billing entries</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={buildActivityLogsHref({ action: "update-current" })}>Audit settings updates</Link>
        </Button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.75rem] border border-border/70 bg-card/85 px-4 py-3 text-sm shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground">Saved views</span>
          <Select
            value={selectedPresetId}
            onValueChange={(presetId) => {
              const preset = savedOrganizationFilterPresets.presets.find((item) => item.id === presetId);
              if (!preset) return;

              setSearch(preset.value.search);
              setStatusFilter(preset.value.statusFilter);
              setSubscriptionFilter(preset.value.subscriptionFilter);
              setSelectedPresetId(preset.id);
              setPageIndex(0);
            }}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select saved view" />
            </SelectTrigger>
            <SelectContent>
              {savedOrganizationFilterPresets.presets.length === 0 ? (
                <SelectItem value="__none" disabled>
                  No saved views yet
                </SelectItem>
              ) : (
                savedOrganizationFilterPresets.presets.map((preset) => (
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
              const name = window.prompt("Save the current organization filters as:");
              const preset = name
                ? savedOrganizationFilterPresets.savePreset(name, {
                    search,
                    statusFilter,
                    subscriptionFilter,
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
              savedOrganizationFilterPresets.clearPresets();
              setSelectedPresetId("");
              toast.success("Saved organization views cleared");
            }}
            disabled={savedOrganizationFilterPresets.presets.length === 0}
          >
            Clear saved views
          </Button>
        </div>
      </div>
      <DataTable
        data={filteredOrganizations}
        columns={columns}
        pageCount={hasLocalFilters ? 1 : Math.ceil(organizationsQuery.data.total / organizationsQuery.data.limit)}
        pagination={{ pageIndex: hasLocalFilters ? 0 : organizationsQuery.data.page - 1, pageSize: organizationsQuery.data.limit }}
        rowClassName="h-16 align-top"
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
              {(() => {
                const billingStatus = getOrganizationBillingStatus(selectedOrganization);
                return (
              <div className="grid gap-3 md:grid-cols-2">
                <DetailItem label="Organization" value={selectedOrganization.name} />
                <DetailItem label="Slug" value={selectedOrganization.slug} />
                <DetailItem label="Status" value={`${selectedOrganization.isActive ? "Active" : "Inactive"} · Onboarded ${formatDate(selectedOrganization.createdAt)}`} />
                <DetailItem
                  label="Billing status"
                  value={
                    billingStatus.trialExpired && selectedOrganization.trialEndsAt
                      ? `${billingStatus.label} · expired on ${formatDate(selectedOrganization.trialEndsAt)}`
                      : billingStatus.label
                  }
                />
                <DetailItem label="Contact" value={`${selectedOrganization.email ?? "No email"} · ${selectedOrganization.phone ?? "No phone"}`} />
                <DetailItem label="Users capacity" value={`${selectedOrganization.totalUsers}/${selectedOrganization.userLimit}`} />
                <DetailItem label="Students capacity" value={`${selectedOrganization.totalStudents}/${selectedOrganization.studentLimit}`} />
                <DetailItem
                  label="Trial window"
                  value={`${selectedOrganization.trialDays} days · ${formatDate(selectedOrganization.trialStartsAt)} to ${formatDate(selectedOrganization.trialEndsAt)}`}
                />
                <DetailItem
                  label="Subscription term"
                  value={`${formatDate(selectedOrganization.subscriptionStartsAt)} to ${formatDate(selectedOrganization.subscriptionEndsAt)}`}
                />
                <DetailItem label="Address" value={selectedOrganization.address ?? "No address recorded"} className="md:col-span-2" />
                <DetailItem label="Billing notes" value={selectedOrganization.subscriptionNotes ?? "No notes recorded"} className="md:col-span-2" />
              </div>
                );
              })()}
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm">
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
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Subscription lifecycle</p>
                    <p className="text-xs text-muted-foreground">
                      Move this tenant between trial, active, past due, suspended, and cancelled states.
                    </p>
                  </div>
                  {lifecycleSummary ? (
                    <Badge variant={lifecycleSummary.billingStatus.variant}>{lifecycleSummary.billingStatus.label}</Badge>
                  ) : null}
                </div>
                <div className="mt-4 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
                  <Button
                    variant="outline"
                    onClick={() => runLifecycleAction("extend-trial")}
                    disabled={lifecycleMutation.isPending}
                  >
                    Extend trial 7 days
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => runLifecycleAction("activate")}
                    disabled={lifecycleMutation.isPending}
                  >
                    Mark active
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => runLifecycleAction("past-due")}
                    disabled={lifecycleMutation.isPending}
                  >
                    Mark past due
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => runLifecycleAction("suspend")}
                    disabled={lifecycleMutation.isPending}
                  >
                    Suspend access
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => runLifecycleAction("cancel")}
                    disabled={lifecycleMutation.isPending}
                    className="lg:col-span-2 xl:col-span-1"
                  >
                    Cancel subscription
                  </Button>
                </div>
                {lifecycleSummary ? (
                  <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                    <DetailItem
                      label="Trial timeline"
                      value={
                        lifecycleSummary.trialEndsAt
                          ? `${selectedOrganization.trialDays} days · ends ${formatDate(lifecycleSummary.trialEndsAt)}`
                          : "No trial end recorded"
                      }
                    />
                    <DetailItem
                      label="Subscription timeline"
                      value={
                        lifecycleSummary.subscriptionEndsAt
                          ? `${formatDate(selectedOrganization.subscriptionStartsAt)} to ${formatDate(lifecycleSummary.subscriptionEndsAt)}`
                          : selectedOrganization.subscriptionStartsAt
                            ? `Started ${formatDate(selectedOrganization.subscriptionStartsAt)}`
                            : "Not started"
                      }
                    />
                  </div>
                ) : null}
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm">
                <p className="text-sm font-medium">Enabled modules</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedOrganization.enabledModules.map((module) => (
                    <Badge key={module} variant="outline">
                      {module.replaceAll("_", " ")}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-medium">AI automation</p>
                  <Badge variant={selectedOrganization.hasOpenAiApiKey || selectedOrganization.hasTrialAiAccess ? "success" : "warning"}>
                    {getAiAccessLabel(selectedOrganization)}
                  </Badge>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {selectedOrganization.hasOpenAiApiKey
                    ? `Tenant AI key configured${selectedOrganization.openAiApiKeyUpdatedAt ? ` · updated ${formatDate(selectedOrganization.openAiApiKeyUpdatedAt)}` : ""}.`
                  : selectedOrganization.hasTrialAiAccess
                    ? "Trial AI is enabled for this tenant through the shared Groq daily quota. Add a tenant key before the trial ends to keep access uninterrupted."
                    : "Add an OpenAI API key in organization settings to enable AI mail, notices, support replies, and admission extraction for this tenant."}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-medium">AI draft approval</p>
                  <Badge variant={selectedOrganization.aiDraftApprovalRequired ? "default" : "outline"}>
                    {selectedOrganization.aiDraftApprovalRequired ? "Required" : "Optional"}
                  </Badge>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {selectedOrganization.aiDraftApprovalRequired
                    ? "AI-generated drafts must be reviewed in the queue before they can be used in mail, notices, or reminder workflows."
                    : "AI-generated drafts can be used directly, while still remaining available in the review queue."}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-medium">Billing ledger</p>
                  <Dialog
                    open={billingOpen}
                    onOpenChange={(nextOpen) => {
                      setBillingOpen(nextOpen);
                      if (!nextOpen) {
                        setEditingBillingEntry(null);
                        resetBillingForm(null);
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button size="sm" onClick={openCreateBillingEntryDialog}>
                        <ReceiptText className="mr-2 h-4 w-4" />
                        Add billing entry
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{editingBillingEntry ? "Edit billing entry" : "Add billing entry"}</DialogTitle>
                        <DialogDescription>
                          Record or update a manual invoice, trial extension, subscription charge, or adjustment for this organization.
                        </DialogDescription>
                      </DialogHeader>
                      <form
                        className="grid gap-4 md:grid-cols-2"
                        onSubmit={(event) => {
                          event.preventDefault();
                          if (editingBillingEntry) {
                            billingUpdateMutation.mutate({
                              entryId: editingBillingEntry.id,
                              update: {
                                type: billingForm.type as BillingEntryTypeValue,
                                status: billingForm.status as BillingEntryStatusValue,
                                title: billingForm.title,
                                description: billingForm.description || undefined,
                                amount: Number(billingForm.amount),
                                currency: billingForm.currency || "USD",
                                dueDate: billingForm.dueDate || undefined,
                                entryDate: billingForm.entryDate || undefined,
                                periodStart: billingForm.periodStart || undefined,
                                periodEnd: billingForm.periodEnd || undefined,
                              },
                            });
                            return;
                          }

                          billingMutation.mutate();
                        }}
                      >
                        <FormField label="Entry type" required>
                          <NativeSelect
                            value={billingForm.type}
                            onChange={(event) =>
                              setBillingForm((current) => ({ ...current, type: event.target.value as BillingEntryTypeValue }))
                            }
                          >
                            {billingEntryTypes.map((type) => (
                              <option key={type} value={type}>
                                {type.replaceAll("_", " ")}
                              </option>
                            ))}
                          </NativeSelect>
                        </FormField>
                        <FormField label="Status" required>
                          <NativeSelect
                            value={billingForm.status}
                            onChange={(event) =>
                              setBillingForm((current) => ({ ...current, status: event.target.value as BillingEntryStatusValue }))
                            }
                          >
                            {billingEntryStatuses.map((status) => (
                              <option key={status} value={status}>
                                {status.replaceAll("_", " ")}
                              </option>
                            ))}
                          </NativeSelect>
                        </FormField>
                        <FormField label="Title" required className="md:col-span-2">
                          <Input value={billingForm.title} onChange={(event) => setBillingForm((current) => ({ ...current, title: event.target.value }))} />
                        </FormField>
                        <FormField label="Amount" required>
                          <Input type="number" min={0} value={billingForm.amount} onChange={(event) => setBillingForm((current) => ({ ...current, amount: Number(event.target.value) }))} />
                        </FormField>
                        <FormField label="Currency" required>
                          <Input value={billingForm.currency} onChange={(event) => setBillingForm((current) => ({ ...current, currency: event.target.value.toUpperCase() }))} />
                        </FormField>
                        <FormField label="Entry date">
                          <Input type="date" value={billingForm.entryDate} onChange={(event) => setBillingForm((current) => ({ ...current, entryDate: event.target.value }))} />
                        </FormField>
                        <FormField label="Due date">
                          <Input type="date" value={billingForm.dueDate} onChange={(event) => setBillingForm((current) => ({ ...current, dueDate: event.target.value }))} />
                        </FormField>
                        <FormField label="Period start">
                          <Input type="date" value={billingForm.periodStart} onChange={(event) => setBillingForm((current) => ({ ...current, periodStart: event.target.value }))} />
                        </FormField>
                        <FormField label="Period end">
                          <Input type="date" value={billingForm.periodEnd} onChange={(event) => setBillingForm((current) => ({ ...current, periodEnd: event.target.value }))} />
                        </FormField>
                        <FormField label="Description" className="md:col-span-2">
                          <Textarea rows={3} value={billingForm.description} onChange={(event) => setBillingForm((current) => ({ ...current, description: event.target.value }))} />
                        </FormField>
                        <div className="md:col-span-2 flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => setBillingOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={billingMutation.isPending || !billingForm.title}>
                            {billingUpdateMutation.isPending || billingMutation.isPending ? "Saving..." : editingBillingEntry ? "Update entry" : "Add entry"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="sticky top-0 z-10 mt-4 rounded-[1.75rem] border border-border/70 bg-card/95 px-4 py-3 shadow-sm backdrop-blur">
                  <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={billingStatusFilter === "ALL" ? "success" : "outline"}>All {billingEntriesQuery.data?.length ?? 0}</Badge>
                  <Badge variant={billingStatusFilter === "OPEN" ? "success" : "outline"}>Open {billingCounts.open}</Badge>
                  <Badge variant={billingStatusFilter === "PAID" ? "success" : "outline"}>Paid {billingCounts.paid}</Badge>
                  <Badge variant={billingStatusFilter === "VOID" ? "success" : "outline"}>Void {billingCounts.void}</Badge>
                  <Badge variant={billingCounts.overdue > 0 ? "danger" : "outline"}>Overdue {billingCounts.overdue}</Badge>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={billingQuickFilter === "ALL" ? "default" : "outline"}
                      onClick={() => setBillingQuickFilter("ALL")}
                    >
                      All entries
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={billingQuickFilter === "OVERDUE" ? "default" : "outline"}
                      onClick={() => setBillingQuickFilter("OVERDUE")}
                    >
                      Overdue only
                    </Button>
                  </div>
                  <Input
                    value={billingSearch}
                    onChange={(event) => setBillingSearch(event.target.value)}
                    placeholder="Search billing history..."
                    className="w-full max-w-xs"
                  />
                  <NativeSelect
                    className="w-full max-w-[200px]"
                    value={billingStatusFilter}
                    onChange={(event) => setBillingStatusFilter(event.target.value as typeof billingStatusFilter)}
                  >
                    <option value="ALL">All statuses</option>
                    {billingEntryStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status.replaceAll("_", " ")}
                      </option>
                    ))}
                  </NativeSelect>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="ml-auto"
                    onClick={() =>
                      exportRowsToCsv({
                        filename: `billing-history-${selectedOrganization.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
                        rows: billingExportRows,
                      })
                    }
                    disabled={billingExportRows.length === 0}
                  >
                    Export CSV
                  </Button>
                </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t pt-3 text-sm">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={allVisibleBillingSelected}
                      indeterminate={someVisibleBillingSelected}
                      onChange={() => {
                        setSelectedBillingEntryIds((current) =>
                          allVisibleBillingSelected
                            ? current.filter((id) => !visibleBillingEntryIds.includes(id))
                            : Array.from(new Set([...current, ...visibleBillingEntryIds])),
                        );
                      }}
                      label="Select visible billing entries"
                    />
                    <span className="text-muted-foreground">
                      {selectedBillingEntryIds.length} selected · {filteredBillingEntries.length} visible
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={selectedBillingEntryIds.length === 0 || bulkBillingUpdateMutation.isPending}
                      onClick={() => bulkBillingUpdateMutation.mutate({ entryIds: selectedBillingEntryIds, update: { status: "PAID" } })}
                    >
                      Mark selected paid
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={selectedBillingEntryIds.length === 0 || bulkBillingUpdateMutation.isPending}
                      onClick={() => bulkBillingUpdateMutation.mutate({ entryIds: selectedBillingEntryIds, update: { status: "VOID" } })}
                    >
                      Void selected
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={selectedBillingEntryIds.length === 0}
                      onClick={() => setSelectedBillingEntryIds([])}
                    >
                      Clear selection
                    </Button>
                  </div>
                </div>
                </div>
                {selectedBillingEntries.length ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2 rounded-[1.75rem] border border-sky-200 bg-sky-50/70 px-4 py-3 text-sm shadow-sm">
                    <Badge variant="outline">{selectedBillingSummary.total} selected</Badge>
                    <Badge variant={selectedBillingSummary.open ? "warning" : "outline"}>Open {selectedBillingSummary.open}</Badge>
                    <Badge variant={selectedBillingSummary.paid ? "success" : "outline"}>Paid {selectedBillingSummary.paid}</Badge>
                    <Badge variant={selectedBillingSummary.void ? "secondary" : "outline"}>Void {selectedBillingSummary.void}</Badge>
                    <Badge variant={selectedBillingSummary.overdue ? "danger" : "outline"}>Overdue {selectedBillingSummary.overdue}</Badge>
                    <span className="text-xs text-muted-foreground">
                      Review the mix before applying the selected bulk action.
                    </span>
                  </div>
                ) : null}
                <div className="mt-4 hidden rounded-2xl border bg-muted/20 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground md:grid md:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,0.8fr)_auto] md:items-center md:gap-3">
                  <span>Entry</span>
                  <span>Due state</span>
                  <span>Amount</span>
                  <span>Status</span>
                  <span className="text-right">Actions</span>
                </div>
                <div className="mt-3 space-y-3">
                  {filteredBillingEntries.length ? (
                    filteredBillingEntries.map((entry: OrganizationBillingEntry) => (
                      <div
                        key={entry.id}
                        className="rounded-2xl border border-border/70 bg-card/85 px-4 py-3 shadow-sm backdrop-blur md:grid md:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,0.8fr)_auto] md:items-center md:gap-3"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={selectedBillingEntryIds.includes(entry.id)}
                              onChange={() =>
                                setSelectedBillingEntryIds((current) =>
                                  current.includes(entry.id) ? current.filter((id) => id !== entry.id) : [...current, entry.id],
                                )
                              }
                              label=""
                            />
                            <div className="min-w-0">
                              <p className="font-medium">{entry.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {entry.type.replaceAll("_", " ")} · {formatDate(entry.entryDate)}
                              </p>
                              {entry.description ? <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{entry.description}</p> : null}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2 md:mt-0">
                          <Badge variant={getBillingDueTone(entry).variant}>{getBillingDueTone(entry).label}</Badge>
                          <span className="text-xs text-muted-foreground">{formatDaysOverdue(entry)}</span>
                        </div>
                        <div className="mt-3 text-sm font-semibold md:mt-0">
                          {entry.currency} {entry.amount}
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2 md:mt-0">
                          <Badge variant="outline">{entry.status}</Badge>
                          <Badge variant="secondary">{entry.type.replaceAll("_", " ")}</Badge>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 md:mt-0 md:justify-end">
                          <Button size="sm" variant="ghost" onClick={() => openEditBillingEntryDialog(entry)}>
                            Edit
                          </Button>
                          <NativeSelect
                            className="w-full max-w-[180px]"
                            defaultValue=""
                            disabled={billingUpdateMutation.isPending}
                            onChange={(event) => {
                              const value = event.target.value as "" | "PAID" | "OPEN" | "VOID";
                              if (!value) {
                                return;
                              }

                              runBillingEntryStatusAction(entry, value);
                              event.currentTarget.value = "";
                            }}
                          >
                            <option value="" disabled>
                              Change status...
                            </option>
                            <option value="PAID" disabled={entry.status === "PAID"}>
                              Mark paid
                            </option>
                            <option value="OPEN" disabled={entry.status === "OPEN"}>
                              Retry payment
                            </option>
                            <option value="VOID" disabled={entry.status === "VOID"}>
                              Void
                            </option>
                          </NativeSelect>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {billingEntriesQuery.data?.length
                        ? "No billing entries match the selected status filter."
                        : "No billing entries recorded yet for this organization."}
                    </p>
                  )}
                </div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Lifecycle audit trail</p>
                    <p className="text-xs text-muted-foreground">Recent organization and subscription changes from the activity log.</p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={buildActivityLogsHref({ targetId: selectedOrganization.id })}>Open audit log</Link>
                  </Button>
                </div>
                <div className="mt-4 space-y-3">
                  {organizationActivityLogsQuery.isLoading || organizationSettingsActivityLogsQuery.isLoading ? (
                    <LoadingState rows={3} />
                  ) : organizationAuditLogs.length ? (
                    organizationAuditLogs.map((log) => (
                      <div key={log.id} className="rounded-2xl border bg-muted/20 p-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-medium capitalize">{log.action.replaceAll("-", " ")}</p>
                            <p className="text-xs text-muted-foreground">
                              {log.module.replaceAll("_", " ")} · {formatDate(log.createdAt)}
                            </p>
                          </div>
                          <Badge variant="outline">{log.module}</Badge>
                        </div>
                        {log.metadata ? (() => {
                          const previousAiApproval = log.metadata.previousAiDraftApprovalRequired;
                          const nextAiApproval = log.metadata.nextAiDraftApprovalRequired;
                          const hasAiApprovalChange =
                            typeof previousAiApproval === "boolean" && typeof nextAiApproval === "boolean";

                          if (hasAiApprovalChange) {
                            return (
                              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <span className="font-medium text-foreground">AI approval policy changed:</span>
                                <Badge variant={nextAiApproval ? "default" : "outline"}>
                                  {nextAiApproval ? "Required" : "Optional"}
                                </Badge>
                                <span>
                                  {previousAiApproval ? "Required" : "Optional"} to {nextAiApproval ? "Required" : "Optional"}
                                </span>
                              </div>
                            );
                          }

                          return (
                            <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">
                              {Object.entries(log.metadata)
                                .map(([key, value]) => `${key}: ${typeof value === "object" ? JSON.stringify(value) : String(value)}`)
                                .join(" · ")}
                            </p>
                          );
                        })() : (
                          <p className="mt-2 text-xs text-muted-foreground">No extra metadata recorded.</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No lifecycle audit entries were found for this tenant.</p>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
