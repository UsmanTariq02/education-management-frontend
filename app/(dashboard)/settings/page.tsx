"use client";

import Link from "next/link";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, Building2, Mail, MessageSquare, Settings2, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { MetricCard } from "@/components/cards/metric-card";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { FormField } from "@/components/forms/form-field";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { organizationsApi } from "@/features/organizations/api/organizations-api";
import { organizationSchema, type OrganizationSchema } from "@/features/organizations/schemas/organization-schema";
import { OrganizationAssetsCard } from "@/features/media/components/organization-assets-card";
import { onlineClassesApi } from "@/features/online-classes/api/online-classes-api";
import {
  onlineClassProviderSettingSchema,
  type OnlineClassProviderSettingSchema,
} from "@/features/online-classes/schemas/online-class-provider-setting-schema";
import { remindersApi } from "@/features/reminders/api/reminders-api";
import {
  reminderProviderSettingSchema,
  type ReminderProviderSettingSchema,
} from "@/features/reminders/schemas/reminder-automation-schema";
import { normalizeApiError } from "@/lib/api/errors";
import { useAuth } from "@/providers/auth-provider";
import { getAiAccessLabel, hasAiAccess } from "@/lib/ai/access";

export default function SettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const organizationId = user?.organizationId;
  const isSuperAdmin = user?.roles.includes("SUPER_ADMIN") ?? false;
  const isOrganizationAdmin = user?.roles.includes("ADMIN") ?? false;
  const mediaEnabled = user?.enabledModules.includes("MEDIA") ?? false;
  const academicsEnabled = user?.enabledModules.includes("ACADEMICS") ?? false;

  const organizationQuery = useQuery({
    queryKey: ["organizations", "settings", organizationId],
    queryFn: () => organizationsApi.currentSettings(),
    enabled: Boolean(organizationId) && isOrganizationAdmin && !isSuperAdmin,
  });

  const providerSettingsQuery = useQuery({
    queryKey: ["reminder-provider-settings", "settings-page"],
    queryFn: remindersApi.getProviderSettings,
    enabled: Boolean(organizationId) && isOrganizationAdmin && !isSuperAdmin,
  });
  const onlineClassProviderSettingsQuery = useQuery({
    queryKey: ["online-class-provider-settings", "settings-page"],
    queryFn: onlineClassesApi.getProviderSettings,
    enabled: Boolean(organizationId) && isOrganizationAdmin && !isSuperAdmin && academicsEnabled,
  });

  const organizationForm = useForm<OrganizationSchema>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: "",
      slug: "",
      email: "",
      phone: "",
      address: "",
      openAiApiKey: "",
      isActive: true,
      aiDraftApprovalRequired: false,
    },
  });

  const reminderForm = useForm<ReminderProviderSettingSchema>({
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
  const onlineClassProviderForm = useForm<OnlineClassProviderSettingSchema>({
    resolver: zodResolver(onlineClassProviderSettingSchema),
    defaultValues: {
      provider: "GOOGLE_MEET",
      integrationEnabled: false,
      autoCreateMeetLinks: false,
      autoSyncParticipants: false,
      calendarId: "",
      impersonatedUserEmail: "",
    },
  });

  useEffect(() => {
    if (!organizationQuery.data) {
      return;
    }

    organizationForm.reset({
      name: organizationQuery.data.name,
      slug: organizationQuery.data.slug,
      email: organizationQuery.data.email ?? "",
      phone: organizationQuery.data.phone ?? "",
      address: organizationQuery.data.address ?? "",
      openAiApiKey: "",
      isActive: organizationQuery.data.isActive,
      aiDraftApprovalRequired: organizationQuery.data.aiDraftApprovalRequired,
    });
  }, [organizationForm, organizationQuery.data]);

  useEffect(() => {
    if (!providerSettingsQuery.data) {
      return;
    }

    reminderForm.reset({
      autoRemindersEnabled: providerSettingsQuery.data.autoRemindersEnabled,
      emailEnabled: providerSettingsQuery.data.emailEnabled,
      whatsappEnabled: providerSettingsQuery.data.whatsappEnabled,
      smsEnabled: providerSettingsQuery.data.smsEnabled,
      paymentConfirmationEnabled: providerSettingsQuery.data.paymentConfirmationEnabled,
      senderName: providerSettingsQuery.data.senderName ?? "",
      replyToEmail: providerSettingsQuery.data.replyToEmail ?? "",
    });
  }, [providerSettingsQuery.data, reminderForm]);
  useEffect(() => {
    if (!onlineClassProviderSettingsQuery.data) {
      return;
    }

    onlineClassProviderForm.reset({
      provider: onlineClassProviderSettingsQuery.data.provider,
      integrationEnabled: onlineClassProviderSettingsQuery.data.integrationEnabled,
      autoCreateMeetLinks: onlineClassProviderSettingsQuery.data.autoCreateMeetLinks,
      autoSyncParticipants: onlineClassProviderSettingsQuery.data.autoSyncParticipants,
      calendarId: onlineClassProviderSettingsQuery.data.calendarId ?? "",
      impersonatedUserEmail: onlineClassProviderSettingsQuery.data.impersonatedUserEmail ?? "",
    });
  }, [onlineClassProviderForm, onlineClassProviderSettingsQuery.data]);

  const organizationMutation = useMutation({
    mutationFn: async (values: OrganizationSchema) => {
      if (!organizationId) {
        throw new Error("Organization context not found");
      }

      return organizationsApi.updateCurrentSettings({
        ...values,
        email: values.email || undefined,
        phone: values.phone || undefined,
        address: values.address || undefined,
        openAiApiKey: values.openAiApiKey || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Organization settings updated");
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.invalidateQueries({ queryKey: ["organizations", "settings", organizationId] });
      queryClient.invalidateQueries({ queryKey: ["ai-current-settings"] });
      queryClient.invalidateQueries({ queryKey: ["ai-queue-current-settings"] });
      queryClient.invalidateQueries({ queryKey: ["mail-current-settings"] });
      queryClient.invalidateQueries({ queryKey: ["reminders-current-settings"] });
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const reminderMutation = useMutation({
    mutationFn: (values: ReminderProviderSettingSchema) =>
      remindersApi.upsertProviderSettings({
        ...values,
        senderName: values.senderName || undefined,
        replyToEmail: values.replyToEmail || undefined,
      }),
    onSuccess: () => {
      toast.success("Reminder provider settings updated");
      queryClient.invalidateQueries({ queryKey: ["reminder-provider-settings"] });
      queryClient.invalidateQueries({ queryKey: ["reminder-provider-settings", "settings-page"] });
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });
  const onlineClassProviderMutation = useMutation({
    mutationFn: (values: OnlineClassProviderSettingSchema) =>
      onlineClassesApi.upsertProviderSettings({
        ...values,
        calendarId: values.calendarId || undefined,
        impersonatedUserEmail: values.impersonatedUserEmail || undefined,
      }),
    onSuccess: () => {
      toast.success("Online class provider settings updated");
      queryClient.invalidateQueries({ queryKey: ["online-class-provider-settings"] });
      queryClient.invalidateQueries({ queryKey: ["online-class-provider-settings", "settings-page"] });
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  if (isSuperAdmin || !organizationId) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Configuration"
          title="Settings"
          description="Platform-level super admin accounts do not own a single tenant configuration. Use organizations to manage institution settings and profile to update your own account."
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Workspace Mode" value="Platform" helper="Global console without tenant-bound settings" icon={Settings2} tone="sky" />
          <MetricCard title="Organization Scope" value="None" helper="Select or manage a tenant from the organizations workspace" icon={Building2} tone="amber" />
          <MetricCard title="Profile Access" value="Available" helper="Personal account updates remain available" icon={ShieldCheck} tone="emerald" />
          <MetricCard title="Reminder Config" value="Tenant-only" helper="Provider settings live inside each organization" icon={BellRing} tone="violet" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Tenant settings require an organization context</CardTitle>
            <CardDescription>Super admin operates across multiple institutions, so organization-owned settings are managed from tenant records rather than from a platform-wide form.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border/70 bg-muted/30 p-5 shadow-sm">
              <p className="font-medium text-foreground">Manage institutions</p>
              <p className="mt-2 text-sm text-muted-foreground">Open the organizations workspace to review active tenants, update school identity details, and control which organizations remain active.</p>
              <Button asChild className="mt-4">
                <Link href="/organizations">Go to organizations</Link>
              </Button>
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/30 p-5 shadow-sm">
              <p className="font-medium text-foreground">Manage personal account</p>
              <p className="mt-2 text-sm text-muted-foreground">Profile settings let you update your own name, email, and password without changing role assignments or tenant governance.</p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/profile">Open profile</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isOrganizationAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Configuration"
          title="Settings"
          description="Organization settings belong to the organization admin workspace."
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Workspace Mode" value="Tenant" helper="You are inside a tenant-scoped workspace" icon={Settings2} tone="sky" />
          <MetricCard title="Access Level" value="Restricted" helper="Only organization admins can update institution settings" icon={ShieldCheck} tone="amber" />
          <MetricCard title="Profile Access" value="Available" helper="You can still update your personal profile" icon={Building2} tone="emerald" />
          <MetricCard title="Reminder Config" value="Admin-only" helper="Provider and org settings are managed by tenant admins" icon={BellRing} tone="violet" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Admin-only workspace</CardTitle>
            <CardDescription>Ask your organization admin to update school identity details, reminder provider settings, and other tenant configuration items.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/profile">Open profile</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (
    organizationQuery.isLoading ||
    providerSettingsQuery.isLoading ||
    (academicsEnabled && onlineClassProviderSettingsQuery.isLoading)
  ) {
    return <LoadingState rows={6} />;
  }

  if (
    organizationQuery.isError ||
    providerSettingsQuery.isError ||
    (academicsEnabled && onlineClassProviderSettingsQuery.isError) ||
    !organizationQuery.data ||
    !providerSettingsQuery.data ||
    (academicsEnabled && !onlineClassProviderSettingsQuery.data)
  ) {
    return <ErrorState description="Settings could not be loaded from the current organization context." />;
  }

  const providerSettings = providerSettingsQuery.data;
  const enabledChannels = [providerSettings.emailEnabled, providerSettings.whatsappEnabled, providerSettings.smsEnabled].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Configuration"
        title="Settings"
        description="Manage live organization identity, operational reminder delivery, and tenant-owned communication controls."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Organization Status"
          value={organizationQuery.data.isActive ? "Active" : "Inactive"}
          helper="Tenant access follows this organization state"
          icon={Building2}
          tone={organizationQuery.data.isActive ? "emerald" : "rose"}
        />
        <MetricCard
          title="Auto Reminders"
          value={providerSettings.autoRemindersEnabled ? "Enabled" : "Disabled"}
          helper="Automated schedules for due and overdue communication"
          icon={BellRing}
          tone={providerSettings.autoRemindersEnabled ? "violet" : "amber"}
        />
        <MetricCard
          title="Delivery Channels"
          value={String(enabledChannels)}
          helper="Configured outbound reminder channels"
          icon={MessageSquare}
          tone="sky"
        />
        <MetricCard
          title="AI Key"
          value={getAiAccessLabel(organizationQuery.data)}
          helper={
            hasAiAccess(organizationQuery.data)
              ? organizationQuery.data.hasOpenAiApiKey
                ? "Tenant-owned OpenAI credentials for AI workflows"
                : "Trial AI uses a shared Groq key with a limited daily quota"
              : "Add a tenant key or rely on the trial window to enable AI workflows"
          }
          icon={Mail}
          tone={hasAiAccess(organizationQuery.data) ? "emerald" : "amber"}
        />
        <MetricCard
          title="AI approval"
          value={organizationQuery.data.aiDraftApprovalRequired ? "Required" : "Optional"}
          helper="Whether generated drafts must be approved first"
          icon={ShieldCheck}
          tone={organizationQuery.data.aiDraftApprovalRequired ? "rose" : "sky"}
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Organization settings</CardTitle>
            <CardDescription>School identity, primary contact information, slug, and tenant activation state.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={organizationForm.handleSubmit((values) => organizationMutation.mutate(values))}>
              <FormField label="Organization name" required error={organizationForm.formState.errors.name}>
                <Input {...organizationForm.register("name")} />
              </FormField>
              <FormField label="Slug" required error={organizationForm.formState.errors.slug}>
                <Input {...organizationForm.register("slug")} />
              </FormField>
              <FormField label="Contact email" error={organizationForm.formState.errors.email}>
                <Input type="email" {...organizationForm.register("email")} />
              </FormField>
              <FormField label="Contact phone" error={organizationForm.formState.errors.phone}>
                <Input {...organizationForm.register("phone")} />
              </FormField>
              <FormField label="Address" error={organizationForm.formState.errors.address} className="md:col-span-2">
                <Textarea rows={4} {...organizationForm.register("address")} />
              </FormField>
              <FormField label="OpenAI API key" error={organizationForm.formState.errors.openAiApiKey} className="md:col-span-2">
                <Input
                  type="password"
                  autoComplete="off"
                  placeholder={organizationQuery.data.hasOpenAiApiKey ? "Leave blank to keep the current key" : "sk-..."}
                  {...organizationForm.register("openAiApiKey")}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Stored securely for this organization only. Leave blank to keep the existing key. Trial organizations can use the shared Groq quota without a tenant key.
                </p>
              </FormField>
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 shadow-sm md:col-span-2">
                <Checkbox
                  checked={organizationForm.watch("aiDraftApprovalRequired")}
                  onChange={() =>
                    organizationForm.setValue("aiDraftApprovalRequired", !organizationForm.watch("aiDraftApprovalRequired"), {
                      shouldDirty: true,
                    })
                  }
                  label="Require approval for AI drafts"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  When enabled, generated notices, mail drafts, and reminder drafts stay in the review queue until approved.
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground shadow-sm md:col-span-2">
                <p className="font-medium text-foreground">Organization activation</p>
                <p className="mt-2">
                  Tenant admins can update organization identity and contact settings here. Activation status remains a platform-level control managed by super admin.
                </p>
              </div>
              <div className="md:col-span-2 flex justify-end">
                <Button type="submit" disabled={organizationMutation.isPending}>
                  {organizationMutation.isPending ? "Saving..." : "Save organization settings"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reminder provider settings</CardTitle>
            <CardDescription>Configure automation behavior and the outbound reminder channels available for this organization.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={reminderForm.handleSubmit((values) => reminderMutation.mutate(values))}>
              <ToggleField
                label="Auto reminders"
                description="Automatically process due and overdue reminder schedules."
                checked={reminderForm.watch("autoRemindersEnabled")}
                onChange={(checked) => reminderForm.setValue("autoRemindersEnabled", checked, { shouldDirty: true })}
              />
              <ToggleField
                label="Payment confirmations"
                description="Send confirmation reminders when a payment event is recorded."
                checked={reminderForm.watch("paymentConfirmationEnabled")}
                onChange={(checked) => reminderForm.setValue("paymentConfirmationEnabled", checked, { shouldDirty: true })}
              />
              <ToggleField
                label="Email delivery"
                description="Allow email reminders for this organization."
                checked={reminderForm.watch("emailEnabled")}
                onChange={(checked) => reminderForm.setValue("emailEnabled", checked, { shouldDirty: true })}
              />
              <ToggleField
                label="WhatsApp delivery"
                description="Allow WhatsApp reminders through the configured provider."
                checked={reminderForm.watch("whatsappEnabled")}
                onChange={(checked) => reminderForm.setValue("whatsappEnabled", checked, { shouldDirty: true })}
              />
              <ToggleField
                label="SMS delivery"
                description="Reserve SMS as a supported outbound channel."
                checked={reminderForm.watch("smsEnabled")}
                onChange={(checked) => reminderForm.setValue("smsEnabled", checked, { shouldDirty: true })}
                className="md:col-span-2"
              />
              <FormField label="Sender name" error={reminderForm.formState.errors.senderName} className="md:col-span-2">
                <Input {...reminderForm.register("senderName")} placeholder="EduFlow Billing Desk" />
              </FormField>
              <FormField label="Reply-to email" error={reminderForm.formState.errors.replyToEmail} className="md:col-span-2">
                <Input type="email" {...reminderForm.register("replyToEmail")} placeholder="accounts@school.edu" />
              </FormField>
              <div className="md:col-span-2 flex justify-end">
                <Button type="submit" disabled={reminderMutation.isPending}>
                  {reminderMutation.isPending ? "Saving..." : "Save reminder settings"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {academicsEnabled ? (
          <Card>
            <CardHeader>
              <CardTitle>Online class provider</CardTitle>
              <CardDescription>Configure Google Meet generation and participant sync for scheduled online classes.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="grid gap-4 md:grid-cols-2"
                onSubmit={onlineClassProviderForm.handleSubmit((values) => onlineClassProviderMutation.mutate(values))}
              >
                <FormField label="Provider" className="md:col-span-2">
                  <select
                    className="h-10 rounded-2xl border border-border/70 bg-background px-3 text-sm shadow-sm"
                    {...onlineClassProviderForm.register("provider")}
                  >
                    <option value="GOOGLE_MEET">Google Meet</option>
                    <option value="ZOOM">Zoom</option>
                  </select>
                </FormField>
                <ToggleField
                  label="Integration enabled"
                  description="Allow scheduled online classes to use the selected provider."
                  checked={onlineClassProviderForm.watch("integrationEnabled")}
                  onChange={(checked) => onlineClassProviderForm.setValue("integrationEnabled", checked, { shouldDirty: true })}
                />
                <ToggleField
                  label="Auto-create meet links"
                  description="Generate a Meet link as soon as an online class occurrence is created."
                  checked={onlineClassProviderForm.watch("autoCreateMeetLinks")}
                  onChange={(checked) => onlineClassProviderForm.setValue("autoCreateMeetLinks", checked, { shouldDirty: true })}
                />
                <ToggleField
                  label="Auto-sync participants"
                  description="Reserved for scheduled background sync once the server job is enabled."
                  checked={onlineClassProviderForm.watch("autoSyncParticipants")}
                  onChange={(checked) => onlineClassProviderForm.setValue("autoSyncParticipants", checked, { shouldDirty: true })}
                />
                <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground shadow-sm">
                  <p className="font-medium text-foreground">Google Workspace requirement</p>
                  <p className="mt-1">
                    Calendar creation and participant sync require delegated Workspace credentials on the backend.
                  </p>
                </div>
                <FormField label="Calendar ID" error={onlineClassProviderForm.formState.errors.calendarId}>
                  <Input {...onlineClassProviderForm.register("calendarId")} placeholder="primary" />
                </FormField>
                <FormField
                  label="Delegated admin email"
                  error={onlineClassProviderForm.formState.errors.impersonatedUserEmail}
                >
                  <Input
                    type="email"
                    {...onlineClassProviderForm.register("impersonatedUserEmail")}
                    placeholder="workspace-admin@school.edu"
                  />
                </FormField>
                <div className="md:col-span-2 flex justify-end">
                  <Button type="submit" disabled={onlineClassProviderMutation.isPending}>
                    {onlineClassProviderMutation.isPending ? "Saving..." : "Save online class settings"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : null}

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Operational notes</CardTitle>
            <CardDescription>Explicit guidance for the settings that are live today and the ones that still need dedicated backend policy APIs.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground shadow-sm">
              <p className="font-medium text-foreground">Login governance</p>
              <p className="mt-2">Tenant users cannot sign in if the user is inactive or if the organization itself is marked inactive.</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground shadow-sm">
              <p className="font-medium text-foreground">Live today</p>
              <p className="mt-2">
                Organization profile details, reminder provider controls, and online class provider settings are stored against the current tenant and affect real platform behavior.
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground shadow-sm">
              <p className="font-medium text-foreground">Next backend step</p>
              <p className="mt-2">Access policy, password rotation policy, currency, and locale formats should move into a dedicated organization configuration model.</p>
            </div>
          </CardContent>
        </Card>
      </div>
      {mediaEnabled ? <OrganizationAssetsCard /> : null}
    </div>
  );
}

function ToggleField({
  label,
  description,
  checked,
  onChange,
  className,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}) {
  return (
    <label className={`flex items-start justify-between gap-4 rounded-2xl border border-border/70 p-4 text-sm shadow-sm ${className ?? ""}`}>
      <div>
        <p className="font-medium">{label}</p>
        <p className="mt-1 text-muted-foreground">{description}</p>
      </div>
      <Checkbox checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}
