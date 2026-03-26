"use client";

import { useEffect, useMemo, useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Clock3, Mail, MessageCircleMore, PlayCircle, Settings2, Smartphone, BellRing, Send, AlertTriangle, Workflow } from "lucide-react";
import { toast } from "sonner";
import { ChartCard } from "@/components/charts/chart-card";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { FormField } from "@/components/forms/form-field";
import { DetailItem } from "@/components/shared/detail-item";
import { OrganizationScopeBanner } from "@/components/shared/organization-scope-banner";
import { FilterBar } from "@/components/shared/filter-bar";
import { PageHeader } from "@/components/shared/page-header";
import { MetricCard } from "@/components/cards/metric-card";
import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { NativeSelect } from "@/components/ui/native-select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { feesApi } from "@/features/fees/api/fees-api";
import { remindersApi } from "@/features/reminders/api/reminders-api";
import {
  reminderProviderSettingSchema,
  reminderRuleSchema,
  reminderTemplateSchema,
  type ReminderProviderSettingSchema,
  type ReminderRuleSchema,
  type ReminderTemplateSchema,
} from "@/features/reminders/schemas/reminder-automation-schema";
import { reminderSchema, type ReminderSchema } from "@/features/reminders/schemas/reminder-schema";
import { studentsApi } from "@/features/students/api/students-api";
import { usePermission } from "@/hooks/use-permission";
import { normalizeApiError } from "@/lib/api/errors";
import { APP_NAME } from "@/lib/constants/app";
import { getChartColor } from "@/lib/constants/chart-colors";
import { getReminderStatusBadgeVariant } from "@/lib/constants/status-colors";
import { formatDate } from "@/lib/formatters";
import { buildReminderMessage } from "@/lib/utils/message-templates";
import { useAuth } from "@/providers/auth-provider";
import type { ReminderAutomationTrigger, ReminderLog, ReminderRule, ReminderTemplate } from "@/types/domain";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

const automationTriggerOptions: Array<{ value: ReminderAutomationTrigger; label: string; description: string }> = [
  { value: "FEE_DUE", label: "Fee due", description: "Schedule reminders before or on the planned due date." },
  { value: "FEE_OVERDUE", label: "Fee overdue", description: "Escalate after the due date passes and fees remain open." },
  { value: "PAYMENT_RECEIVED", label: "Payment received", description: "Send payment confirmation after a successful fee update." },
];

const templatePlaceholderRows = [
  "{{studentName}}",
  "{{guardianName}}",
  "{{billingCycle}}",
  "{{duration}}",
  "{{dueAmount}}",
  "{{totalFee}}",
  "{{amountPaid}}",
  "{{paidFee}}",
  "{{balance}}",
  "{{pendingFee}}",
  "{{dueDate}}",
  "{{organizationName}}",
  "{{month}}",
  "{{year}}",
];

export default function RemindersPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [channelFilter, setChannelFilter] = useState("ALL");
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 12;
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<ReminderLog | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<ReminderTemplate | null>(null);
  const [editingRule, setEditingRule] = useState<ReminderRule | null>(null);
  const [selectedReminder, setSelectedReminder] = useState<ReminderLog | null>(null);
  const canCreate = usePermission("reminders.create");
  const canManage = usePermission("reminders.update");
  const canManageSettings = usePermission("settings.update");
  const canMutateWithinScope = Boolean(user?.organizationId);

  const remindersQuery = useQuery({
    queryKey: ["reminders", debouncedSearch, pageIndex, pageSize],
    queryFn: () => remindersApi.list({ page: pageIndex + 1, limit: pageSize, search: debouncedSearch }),
  });
  const templatesQuery = useQuery({
    queryKey: ["reminder-templates"],
    queryFn: () => remindersApi.listTemplates({ page: 1, limit: 50, sortBy: "createdAt", sortOrder: "desc" }),
    enabled: canMutateWithinScope,
  });
  const rulesQuery = useQuery({
    queryKey: ["reminder-rules"],
    queryFn: () => remindersApi.listRules({ page: 1, limit: 50, sortBy: "createdAt", sortOrder: "desc" }),
    enabled: canMutateWithinScope,
  });
  const providerSettingsQuery = useQuery({
    queryKey: ["reminder-provider-settings"],
    queryFn: () => remindersApi.getProviderSettings(),
    enabled: canManageSettings && canMutateWithinScope,
  });
  const shouldLoadReminderReferenceData =
    logDialogOpen ||
    Boolean(selectedReminder) ||
    Boolean(editingReminder) ||
    (remindersQuery.data?.items.length ?? 0) > 0;
  const studentsQuery = useQuery({
    queryKey: ["students", "reminders"],
    queryFn: () => studentsApi.list({ page: 1, limit: 100 }),
    enabled: shouldLoadReminderReferenceData,
  });
  const feesQuery = useQuery({
    queryKey: ["fees", "reminders"],
    queryFn: () => feesApi.listRecords({ page: 1, limit: 100 }),
    enabled: shouldLoadReminderReferenceData,
  });

  const studentMap = useMemo(() => new Map((studentsQuery.data?.items ?? []).map((student) => [student.id, student])), [studentsQuery.data]);
  const feeRecordMap = useMemo(() => new Map((feesQuery.data?.items ?? []).map((record) => [record.id, record])), [feesQuery.data]);
  const templateMap = useMemo(() => new Map((templatesQuery.data?.items ?? []).map((template) => [template.id, template])), [templatesQuery.data]);

  const manualForm = useForm<ReminderSchema>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      studentId: "",
      feeRecordId: "",
      channel: "SMS",
      message: "",
      status: "PENDING",
    },
  });
  const templateForm = useForm<ReminderTemplateSchema>({
    resolver: zodResolver(reminderTemplateSchema),
    defaultValues: {
      name: "",
      code: "",
      channel: "WHATSAPP",
      target: "GUARDIAN",
      subject: "",
      body: "",
      isActive: true,
    },
  });
  const ruleForm = useForm<ReminderRuleSchema>({
    resolver: zodResolver(reminderRuleSchema),
    defaultValues: {
      name: "",
      templateId: "",
      trigger: "FEE_OVERDUE",
      offsetDays: 1,
      isActive: true,
    },
  });
  const providerForm = useForm<ReminderProviderSettingSchema>({
    resolver: zodResolver(reminderProviderSettingSchema),
    defaultValues: {
      autoRemindersEnabled: false,
      emailEnabled: false,
      whatsappEnabled: false,
      smsEnabled: false,
      paymentConfirmationEnabled: false,
      senderName: "",
      replyToEmail: "",
    },
  });

  const selectedStudentId = manualForm.watch("studentId");
  const selectedChannel = manualForm.watch("channel");
  const selectedFeeRecordId = manualForm.watch("feeRecordId");

  useEffect(() => {
    const currentMessage = manualForm.getValues("message");
    if (currentMessage && currentMessage.trim().length > 0) {
      return;
    }

    const student = studentMap.get(selectedStudentId);
    const feeRecord = selectedFeeRecordId ? feeRecordMap.get(selectedFeeRecordId) : undefined;
    manualForm.setValue("message", buildReminderMessage(student, selectedChannel, feeRecord));
  }, [feeRecordMap, manualForm, selectedChannel, selectedFeeRecordId, selectedStudentId, studentMap]);

  useEffect(() => {
    if (!providerSettingsQuery.data) {
      return;
    }

    providerForm.reset({
      autoRemindersEnabled: providerSettingsQuery.data.autoRemindersEnabled,
      emailEnabled: providerSettingsQuery.data.emailEnabled,
      whatsappEnabled: providerSettingsQuery.data.whatsappEnabled,
      smsEnabled: providerSettingsQuery.data.smsEnabled,
      paymentConfirmationEnabled: providerSettingsQuery.data.paymentConfirmationEnabled,
      senderName: providerSettingsQuery.data.senderName ?? "",
      replyToEmail: providerSettingsQuery.data.replyToEmail ?? "",
    });
  }, [providerForm, providerSettingsQuery.data]);

  const logMutation = useMutation({
    mutationFn: async (values: ReminderSchema) => {
      const payload = {
        ...values,
        feeRecordId: values.feeRecordId || undefined,
      };

      if (editingReminder) {
        return remindersApi.update(editingReminder.id, payload);
      }

      return remindersApi.create(payload);
    },
    onSuccess: (reminder) => {
      if (editingReminder) {
        toast.success("Reminder updated");
      } else if (reminder.status === "SENT") {
        toast.success(`Reminder sent successfully via ${reminder.channel}.`);
      } else if (reminder.status === "FAILED") {
        toast.error(reminder.failureReason ?? `Reminder delivery failed for ${reminder.channel}.`);
      } else {
        toast.message("Reminder queued for delivery.");
      }

      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      setLogDialogOpen(false);
      setEditingReminder(null);
      manualForm.reset();
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const templateMutation = useMutation({
    mutationFn: async (values: ReminderTemplateSchema) => {
      const payload = {
        ...values,
        subject: values.subject || undefined,
      };

      if (editingTemplate) {
        return remindersApi.updateTemplate(editingTemplate.id, payload);
      }

      return remindersApi.createTemplate(payload);
    },
    onSuccess: () => {
      toast.success(editingTemplate ? "Template updated" : "Template created");
      queryClient.invalidateQueries({ queryKey: ["reminder-templates"] });
      setTemplateDialogOpen(false);
      setEditingTemplate(null);
      templateForm.reset();
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const ruleMutation = useMutation({
    mutationFn: async (values: ReminderRuleSchema) => {
      const payload = {
        ...values,
      };

      if (editingRule) {
        return remindersApi.updateRule(editingRule.id, payload);
      }

      return remindersApi.createRule(payload);
    },
    onSuccess: () => {
      toast.success(editingRule ? "Automation rule updated" : "Automation rule created");
      queryClient.invalidateQueries({ queryKey: ["reminder-rules"] });
      setRuleDialogOpen(false);
      setEditingRule(null);
      ruleForm.reset();
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const providerMutation = useMutation({
    mutationFn: async (values: ReminderProviderSettingSchema) =>
      remindersApi.upsertProviderSettings({
        ...values,
        senderName: values.senderName || undefined,
        replyToEmail: values.replyToEmail || undefined,
      }),
    onSuccess: () => {
      toast.success("Provider settings updated");
      queryClient.invalidateQueries({ queryKey: ["reminder-provider-settings"] });
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const processDueMutation = useMutation({
    mutationFn: () => remindersApi.processDue(),
    onSuccess: () => {
      toast.success("Due reminder schedules were processed");
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const resetTemplatesMutation = useMutation({
    mutationFn: () => remindersApi.resetDefaultTemplates(),
    onSuccess: (result) => {
      toast.success(
        `Default templates restored. ${result.templatesCreated} created, ${result.templatesUpdated} updated, ${result.rulesCreated} rules added.`,
      );
      void queryClient.invalidateQueries({ queryKey: ["reminder-templates"] });
      void queryClient.invalidateQueries({ queryKey: ["reminder-rules"] });
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const filteredReminderLogs = useMemo(() => {
    const items = remindersQuery.data?.items ?? [];

    return items.filter((item) => {
      const matchesStatus = statusFilter === "ALL" ? true : item.status === statusFilter;
      const matchesChannel = channelFilter === "ALL" ? true : item.channel === channelFilter;

      return matchesStatus && matchesChannel;
    });
  }, [channelFilter, remindersQuery.data, statusFilter]);

  const hasLocalFilters = statusFilter !== "ALL" || channelFilter !== "ALL";

  const chartData = useMemo(() => {
    const counts = new Map<string, number>();
    filteredReminderLogs.forEach((record) => counts.set(record.channel, (counts.get(record.channel) ?? 0) + 1));
    return Array.from(counts.entries()).map(([channel, total]) => ({ channel, total }));
  }, [filteredReminderLogs]);

  const exportRows = useMemo(
    () =>
      filteredReminderLogs.map((record) => ({
        Student: studentMap.get(record.studentId)?.fullName ?? "Unknown student",
        Channel: record.channel,
        Status: record.status,
        FeeRecord:
          record.feeRecordId && feeRecordMap.get(record.feeRecordId)
            ? `${feeRecordMap.get(record.feeRecordId)?.month}/${feeRecordMap.get(record.feeRecordId)?.year}`
            : "General",
        SentAt: formatDate(record.sentAt),
        DeliveryReference: record.deliveryReference ?? "",
        FailureReason: record.failureReason ?? "",
        Message: record.message,
      })),
    [feeRecordMap, filteredReminderLogs, studentMap],
  );

  const columns = useMemo<Array<ColumnDef<ReminderLog>>>(
    () => {
      const baseColumns: Array<ColumnDef<ReminderLog>> = [
        {
          accessorKey: "studentId",
          header: "Student",
          cell: ({ row }) => {
            const student = studentMap.get(row.original.studentId);
            return (
              <div>
                <p className="font-medium">{student?.fullName ?? "Unknown student"}</p>
                <p className="text-xs text-muted-foreground">
                  {student?.guardianName ?? "Guardian"} · {student?.guardianPhone ?? student?.phone ?? "No contact"}
                </p>
              </div>
            );
          },
        },
        ...(user?.roles.includes("SUPER_ADMIN")
          ? [
              {
                id: "organization",
                header: "Organization",
                cell: ({ row }) => studentMap.get(row.original.studentId)?.organizationName ?? "Unknown organization",
              } satisfies ColumnDef<ReminderLog>,
            ]
          : []),
        { accessorKey: "channel", header: "Channel", cell: ({ row }) => <Badge>{row.original.channel}</Badge> },
        {
          accessorKey: "status",
          header: "Status",
          cell: ({ row }) => <Badge variant={getReminderStatusBadgeVariant(row.original.status)}>{row.original.status}</Badge>,
        },
        {
          accessorKey: "feeRecordId",
          header: "Fee record",
          cell: ({ row }) => {
            const record = row.original.feeRecordId ? feeRecordMap.get(row.original.feeRecordId) : null;
            return record ? `${record.month}/${record.year} · ${record.status}` : "General";
          },
        },
        { accessorKey: "sentAt", header: "Sent at", cell: ({ row }) => formatDate(row.original.sentAt) },
        {
          accessorKey: "message",
          header: "Message",
          cell: ({ row }) => <p className="max-w-[320px] truncate">{row.original.message}</p>,
        },
        {
          id: "actions",
          header: "Actions",
          cell: ({ row }) => (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelectedReminder(row.original)}>
                View
              </Button>
              {canManage ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingReminder(row.original);
                    manualForm.reset({
                      studentId: row.original.studentId,
                      feeRecordId: row.original.feeRecordId ?? "",
                      channel: row.original.channel,
                      message: row.original.message,
                      status: row.original.status,
                    });
                    setLogDialogOpen(true);
                  }}
                >
                  Edit
                </Button>
              ) : null}
            </div>
          ),
        },
      ];

      return baseColumns;
    },
    [canManage, feeRecordMap, manualForm, studentMap, user?.roles],
  );

  if (remindersQuery.isLoading || (shouldLoadReminderReferenceData && (studentsQuery.isLoading || feesQuery.isLoading))) {
    return <LoadingState rows={6} />;
  }

  if (
    remindersQuery.isError ||
    (shouldLoadReminderReferenceData && (studentsQuery.isError || feesQuery.isError)) ||
    !remindersQuery.data ||
    (shouldLoadReminderReferenceData && (!studentsQuery.data || !feesQuery.data))
  ) {
    return (
      <ErrorState
        description="Reminder data could not be loaded."
        onRetry={() => {
          void remindersQuery.refetch();
          if (shouldLoadReminderReferenceData) {
            void studentsQuery.refetch();
            void feesQuery.refetch();
          }
          void templatesQuery.refetch();
          void rulesQuery.refetch();
          void providerSettingsQuery.refetch();
        }}
      />
    );
  }

  const providerSettings = providerSettingsQuery.data;
  const templates = templatesQuery.data?.items ?? [];
  const rules = rulesQuery.data?.items ?? [];
  const activeTemplates = templates.filter((template) => template.isActive).length;
  const activeRules = rules.filter((rule) => rule.isActive).length;
  const failedReminderCount = filteredReminderLogs.filter((record) => record.status === "FAILED").length;
  const sentReminderCount = filteredReminderLogs.filter((record) => record.status === "SENT").length;
  const totalReminders = filteredReminderLogs.length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Communication"
        title="Reminder operations"
        description="Manage delivery providers, reusable templates, automation rules, and the reminder execution log from one workspace."
        actions={
          <div className="flex flex-wrap gap-3">
            {canManageSettings ? (
              <Button
                variant="outline"
                disabled={!canMutateWithinScope || processDueMutation.isPending}
                onClick={() => processDueMutation.mutate()}
              >
                {processDueMutation.isPending ? "Processing..." : "Process due schedules"}
              </Button>
            ) : null}
            {canCreate ? (
              <Dialog
                open={logDialogOpen}
                onOpenChange={(nextOpen) => {
                  setLogDialogOpen(nextOpen);
                  if (!nextOpen) {
                    setEditingReminder(null);
                    manualForm.reset();
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button disabled={!canMutateWithinScope}>Send reminder</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingReminder ? "Edit reminder" : "Create reminder"}</DialogTitle>
                    <DialogDescription>
                      Branded reminder messages are sent through the configured {APP_NAME} delivery providers for email and WhatsApp.
                    </DialogDescription>
                  </DialogHeader>
                  <form className="grid gap-4 md:grid-cols-2" onSubmit={manualForm.handleSubmit((values) => logMutation.mutate(values))}>
                    <FormField label="Student" required error={manualForm.formState.errors.studentId}>
                      <NativeSelect {...manualForm.register("studentId")}>
                        <option value="">Select student</option>
                        {(studentsQuery.data?.items ?? []).map((student) => (
                          <option key={student.id} value={student.id}>
                            {student.fullName}
                          </option>
                        ))}
                      </NativeSelect>
                    </FormField>
                    <FormField label="Fee record" error={manualForm.formState.errors.feeRecordId}>
                      <NativeSelect {...manualForm.register("feeRecordId")}>
                        <option value="">Optional fee record</option>
                        {(feesQuery.data?.items ?? []).map((record) => (
                          <option key={record.id} value={record.id}>
                            {(studentMap.get(record.studentId)?.fullName ?? "Student")} / {record.month}/{record.year} / {record.status}
                          </option>
                        ))}
                      </NativeSelect>
                    </FormField>
                    <FormField label="Channel" required error={manualForm.formState.errors.channel}>
                      <NativeSelect {...manualForm.register("channel")}>
                        {["SMS", "WHATSAPP", "EMAIL", "MANUAL"].map((channel) => (
                          <option key={channel} value={channel}>
                            {channel}
                          </option>
                        ))}
                      </NativeSelect>
                    </FormField>
                    {editingReminder ? (
                      <FormField label="Status" required error={manualForm.formState.errors.status}>
                        <NativeSelect {...manualForm.register("status")}>
                          {["PENDING", "SENT", "FAILED"].map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </NativeSelect>
                      </FormField>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Delivery status</p>
                        <div className="flex h-10 items-center rounded-xl border bg-muted/40 px-3 text-sm text-muted-foreground">
                          Determined automatically by the backend delivery provider
                        </div>
                      </div>
                    )}
                    <FormField label="Message" required error={manualForm.formState.errors.message} className="md:col-span-2">
                      <Textarea rows={6} {...manualForm.register("message")} />
                    </FormField>
                    <div className="md:col-span-2 flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setLogDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={logMutation.isPending}>
                        {logMutation.isPending ? "Saving..." : editingReminder ? "Update reminder" : "Create reminder"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            ) : null}
          </div>
        }
      />

      <OrganizationScopeBanner moduleLabel="Reminder automation" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Visible reminders" value={String(totalReminders)} helper="Reminder logs in the current page scope" icon={BellRing} tone="sky" />
        <MetricCard title="Sent reminders" value={String(sentReminderCount)} helper="Successfully delivered reminders" icon={Send} tone="emerald" />
        <MetricCard title="Failed reminders" value={String(failedReminderCount)} helper="Delivery failures needing review" icon={AlertTriangle} tone="rose" />
        <MetricCard title="Automation assets" value={String(activeTemplates + activeRules)} helper={`${activeTemplates} active templates and ${activeRules} active rules`} icon={Workflow} tone="violet" />
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        <AutomationMetricCard
          title="Automation"
          value={providerSettings?.autoRemindersEnabled ? "Enabled" : "Paused"}
          description="Organization-level automation switch"
          icon={<Clock3 className="h-4 w-4" />}
        />
        <AutomationMetricCard
          title="Active templates"
          value={String(activeTemplates)}
          description={`${templates.length} total templates configured`}
          icon={<Mail className="h-4 w-4" />}
        />
        <AutomationMetricCard
          title="Active rules"
          value={String(activeRules)}
          description={`${rules.length} automation rules available`}
          icon={<PlayCircle className="h-4 w-4" />}
        />
        <AutomationMetricCard
          title="Failed sends"
          value={String(failedReminderCount)}
          description="Failures in the current reminder log page"
          icon={<MessageCircleMore className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <ChartCard title="Reminder delivery summary">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="channel" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total">
                  {chartData.map((entry, index) => (
                    <Cell key={entry.channel} fill={getChartColor(index)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <Card>
          <CardHeader>
            <CardTitle>Provider settings</CardTitle>
            <CardDescription>Control which delivery channels are enabled for the logged-in organization.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!canManageSettings ? (
              <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
                You need `settings.update` to change provider and automation controls.
              </div>
            ) : !canMutateWithinScope ? (
              <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
                Tenant-scoped provider settings require an organization context.
              </div>
            ) : providerSettingsQuery.isLoading ? (
              <LoadingState rows={4} />
            ) : providerSettingsQuery.isError ? (
              <ErrorState description="Provider settings could not be loaded." onRetry={() => providerSettingsQuery.refetch()} />
            ) : (
              <form className="space-y-4" onSubmit={providerForm.handleSubmit((values) => providerMutation.mutate(values))}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <ToggleSetting label="Enable automation" description="Allow scheduled rules to send automatically." {...providerForm.register("autoRemindersEnabled")} />
                  <ToggleSetting label="Payment confirmations" description="Send confirmation messages when a fee is paid." {...providerForm.register("paymentConfirmationEnabled")} />
                  <ToggleSetting label="Email delivery" description="Use the configured email provider for reminder delivery." {...providerForm.register("emailEnabled")} />
                  <ToggleSetting label="WhatsApp delivery" description="Use the configured WhatsApp provider for reminder delivery." {...providerForm.register("whatsappEnabled")} />
                  <ToggleSetting label="SMS delivery" description="Enable SMS when a provider is attached later." {...providerForm.register("smsEnabled")} />
                </div>
                <FormField label="Sender name" error={providerForm.formState.errors.senderName}>
                  <Input {...providerForm.register("senderName")} placeholder="Accounts Office" />
                </FormField>
                <FormField label="Reply-to email" error={providerForm.formState.errors.replyToEmail}>
                  <Input type="email" {...providerForm.register("replyToEmail")} placeholder="accounts@school.edu" />
                </FormField>
                <div className="flex justify-end">
                  <Button type="submit" disabled={providerMutation.isPending}>
                    {providerMutation.isPending ? "Saving..." : "Save provider settings"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Reminder templates</CardTitle>
              <CardDescription>Create reusable content blocks for overdue notices, due reminders, and payment confirmations.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {canManage ? (
                <Button
                  variant="outline"
                  disabled={!canMutateWithinScope || resetTemplatesMutation.isPending}
                  onClick={() => resetTemplatesMutation.mutate()}
                >
                  {resetTemplatesMutation.isPending ? "Restoring..." : "Restore defaults"}
                </Button>
              ) : null}
              {canCreate ? (
                <Dialog
                  open={templateDialogOpen}
                  onOpenChange={(nextOpen) => {
                    setTemplateDialogOpen(nextOpen);
                    if (!nextOpen) {
                      setEditingTemplate(null);
                      templateForm.reset();
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" disabled={!canMutateWithinScope}>New template</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{editingTemplate ? "Edit template" : "Create template"}</DialogTitle>
                      <DialogDescription>Use placeholders to keep reminder content dynamic across students, fees, and organizations.</DialogDescription>
                    </DialogHeader>
                    <form className="grid gap-4 md:grid-cols-2" onSubmit={templateForm.handleSubmit((values) => templateMutation.mutate(values))}>
                      <FormField label="Template name" required error={templateForm.formState.errors.name}>
                        <Input {...templateForm.register("name")} />
                      </FormField>
                      <FormField label="Code" required error={templateForm.formState.errors.code}>
                        <Input {...templateForm.register("code")} placeholder="fee_overdue_guardian_whatsapp" />
                      </FormField>
                      <FormField label="Channel" required error={templateForm.formState.errors.channel}>
                        <NativeSelect {...templateForm.register("channel")}>
                          {["EMAIL", "WHATSAPP", "SMS", "MANUAL"].map((channel) => (
                            <option key={channel} value={channel}>
                              {channel}
                            </option>
                          ))}
                        </NativeSelect>
                      </FormField>
                      <FormField label="Recipient target" required error={templateForm.formState.errors.target}>
                        <NativeSelect {...templateForm.register("target")}>
                          {["GUARDIAN", "STUDENT", "BOTH"].map((target) => (
                            <option key={target} value={target}>
                              {target}
                            </option>
                          ))}
                        </NativeSelect>
                      </FormField>
                      <FormField label="Subject" className="md:col-span-2" error={templateForm.formState.errors.subject}>
                        <Input {...templateForm.register("subject")} placeholder="Optional for email templates" />
                      </FormField>
                      <FormField label="Body" className="md:col-span-2" required error={templateForm.formState.errors.body}>
                        <Textarea rows={7} {...templateForm.register("body")} />
                      </FormField>
                      <Checkbox containerClassName="md:col-span-2" label="Template is active" {...templateForm.register("isActive")} />
                      <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground md:col-span-2">
                        Available placeholders: {templatePlaceholderRows.join(", ")}
                      </div>
                      <div className="md:col-span-2 flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setTemplateDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={templateMutation.isPending}>
                          {templateMutation.isPending ? "Saving..." : editingTemplate ? "Update template" : "Create template"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {templatesQuery.isLoading ? (
              <LoadingState rows={3} />
            ) : templates.length === 0 ? (
              <EmptyStatePanel
                title="No templates yet"
                description="Start with one overdue reminder template and one payment confirmation template."
              />
            ) : (
              templates.map((template) => (
                <div key={template.id} className="rounded-2xl border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{template.name}</p>
                        <Badge variant={template.isActive ? "success" : "secondary"}>{template.isActive ? "Active" : "Paused"}</Badge>
                        <Badge>{template.channel}</Badge>
                        <Badge variant="outline">{template.target}</Badge>
                      </div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{template.code}</p>
                    </div>
                    {canManage ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingTemplate(template);
                          templateForm.reset({
                            name: template.name,
                            code: template.code,
                            channel: template.channel,
                            target: template.target,
                            subject: template.subject ?? "",
                            body: template.body,
                            isActive: template.isActive,
                          });
                          setTemplateDialogOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                    ) : null}
                  </div>
                  {template.subject ? <p className="mt-3 text-sm text-foreground/80">Subject: {template.subject}</p> : null}
                  <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{template.body}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Automation rules</CardTitle>
              <CardDescription>Attach templates to fee lifecycle triggers so reminders run without manual operator steps.</CardDescription>
            </div>
            {canCreate ? (
              <Dialog
                open={ruleDialogOpen}
                onOpenChange={(nextOpen) => {
                  setRuleDialogOpen(nextOpen);
                  if (!nextOpen) {
                    setEditingRule(null);
                    ruleForm.reset();
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" disabled={!canMutateWithinScope || templates.length === 0}>New rule</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingRule ? "Edit automation rule" : "Create automation rule"}</DialogTitle>
                    <DialogDescription>Offsets are measured in days from the trigger event, such as due date, overdue date, or payment receipt.</DialogDescription>
                  </DialogHeader>
                  <form className="grid gap-4 md:grid-cols-2" onSubmit={ruleForm.handleSubmit((values) => ruleMutation.mutate(values))}>
                    <FormField label="Rule name" required error={ruleForm.formState.errors.name}>
                      <Input {...ruleForm.register("name")} />
                    </FormField>
                    <FormField label="Trigger" required error={ruleForm.formState.errors.trigger}>
                      <NativeSelect {...ruleForm.register("trigger")}>
                        {automationTriggerOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </NativeSelect>
                    </FormField>
                    <FormField label="Template" required error={ruleForm.formState.errors.templateId} className="md:col-span-2">
                      <NativeSelect {...ruleForm.register("templateId")}>
                        <option value="">Select template</option>
                        {templates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.name} · {template.channel} · {template.target}
                          </option>
                        ))}
                      </NativeSelect>
                    </FormField>
                    <FormField label="Offset days" required error={ruleForm.formState.errors.offsetDays}>
                      <Input type="number" min={0} {...ruleForm.register("offsetDays", { valueAsNumber: true })} />
                    </FormField>
                    <Checkbox label="Rule is active" {...ruleForm.register("isActive")} />
                    <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground md:col-span-2">
                      {automationTriggerOptions.map((option) => (
                        <p key={option.value}>
                          <span className="font-medium text-foreground">{option.label}:</span> {option.description}
                        </p>
                      ))}
                    </div>
                    <div className="md:col-span-2 flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setRuleDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={ruleMutation.isPending}>
                        {ruleMutation.isPending ? "Saving..." : editingRule ? "Update rule" : "Create rule"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-3">
            {rulesQuery.isLoading ? (
              <LoadingState rows={3} />
            ) : rules.length === 0 ? (
              <EmptyStatePanel
                title="No automation rules yet"
                description="Rules connect your templates to fee due, overdue, and payment confirmation events."
              />
            ) : (
              rules.map((rule) => {
                const template = rule.template ?? templateMap.get(rule.templateId);
                return (
                  <div key={rule.id} className="rounded-2xl border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{rule.name}</p>
                          <Badge variant={rule.isActive ? "success" : "secondary"}>{rule.isActive ? "Active" : "Paused"}</Badge>
                          <Badge variant="outline">{rule.trigger}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Uses {template?.name ?? "an unavailable template"} with a {rule.offsetDays}-day offset.
                        </p>
                      </div>
                      {canManage ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingRule(rule);
                            ruleForm.reset({
                              name: rule.name,
                              templateId: rule.templateId,
                              trigger: rule.trigger,
                              offsetDays: rule.offsetDays,
                              isActive: rule.isActive,
                            });
                            setRuleDialogOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                      ) : null}
                    </div>
                    {template ? (
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span className="rounded-full border px-2 py-1">{template.channel}</span>
                        <span className="rounded-full border px-2 py-1">{template.target}</span>
                        <span className="rounded-full border px-2 py-1">{template.code}</span>
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <FilterBar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPageIndex(0);
        }}
        searchPlaceholder="Search reminders by student, message, or delivery..."
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
              {["PENDING", "SENT", "FAILED"].map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </NativeSelect>
            <NativeSelect
              value={channelFilter}
              onChange={(event) => {
                setChannelFilter(event.target.value);
                setPageIndex(0);
              }}
            >
              <option value="ALL">All channels</option>
              {["SMS", "WHATSAPP", "EMAIL", "MANUAL"].map((channel) => (
                <option key={channel} value={channel}>
                  {channel}
                </option>
              ))}
            </NativeSelect>
          </>
        }
        exportConfig={{ filename: "reminder-logs", rows: exportRows }}
      />

      <DataTable
        data={filteredReminderLogs}
        columns={columns}
        pageCount={hasLocalFilters ? 1 : Math.ceil(remindersQuery.data.total / remindersQuery.data.limit)}
        pagination={{ pageIndex: hasLocalFilters ? 0 : remindersQuery.data.page - 1, pageSize: remindersQuery.data.limit }}
        onPaginationChange={(state) => {
          if (!hasLocalFilters) {
            setPageIndex(state.pageIndex);
          }
        }}
      />

      <Dialog open={Boolean(selectedReminder)} onOpenChange={(open) => !open && setSelectedReminder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reminder detail</DialogTitle>
            <DialogDescription>Review the complete reminder content, channel result, and delivery diagnostics.</DialogDescription>
          </DialogHeader>
          {selectedReminder ? (
            <div className="space-y-4 text-sm">
              <div className="grid gap-3 md:grid-cols-2">
                <DetailItem label="Student" value={studentMap.get(selectedReminder.studentId)?.fullName ?? "Unknown student"} />
                <DetailItem label="Channel" value={selectedReminder.channel} />
                <DetailItem label="Status" value={selectedReminder.status} />
                <DetailItem label="Sent at" value={formatDate(selectedReminder.sentAt)} />
                <DetailItem
                  label="Fee record"
                  value={
                    selectedReminder.feeRecordId && feeRecordMap.get(selectedReminder.feeRecordId)
                      ? `${feeRecordMap.get(selectedReminder.feeRecordId)?.month}/${feeRecordMap.get(selectedReminder.feeRecordId)?.year}`
                      : "General"
                  }
                />
                <DetailItem label="Delivery reference" value={selectedReminder.deliveryReference ?? "Not available"} />
              </div>
              <div className="rounded-xl border bg-muted/30 p-4">
                <p className="mb-2 font-medium">Complete message</p>
                <pre className="whitespace-pre-wrap break-words text-sm text-muted-foreground">{selectedReminder.message}</pre>
              </div>
              {selectedReminder.status === "FAILED" ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <p className="mb-1 font-medium">Failure reason</p>
                  <p>{selectedReminder.failureReason ?? "The backend marked this reminder as failed, but no detailed error was returned."}</p>
                </div>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AutomationMetricCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="rounded-xl border bg-muted/40 p-2 text-muted-foreground">{icon}</div>
      </CardContent>
    </Card>
  );
}

function ToggleSetting({
  label,
  description,
  ...inputProps
}: {
  label: string;
  description: string;
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex items-start justify-between gap-3 rounded-xl border p-4 text-sm">
      <div>
        <p className="font-medium">{label}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      <Checkbox {...inputProps} />
    </label>
  );
}

function EmptyStatePanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed bg-muted/20 p-6 text-sm text-muted-foreground">
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-2">{description}</p>
    </div>
  );
}
