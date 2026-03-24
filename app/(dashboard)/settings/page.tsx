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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { organizationsApi } from "@/features/organizations/api/organizations-api";
import { organizationSchema, type OrganizationSchema } from "@/features/organizations/schemas/organization-schema";
import { remindersApi } from "@/features/reminders/api/reminders-api";
import {
  reminderProviderSettingSchema,
  type ReminderProviderSettingSchema,
} from "@/features/reminders/schemas/reminder-automation-schema";
import { normalizeApiError } from "@/lib/api/errors";
import { useAuth } from "@/providers/auth-provider";

export default function SettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const organizationId = user?.organizationId;
  const isSuperAdmin = user?.roles.includes("SUPER_ADMIN") ?? false;
  const isOrganizationAdmin = user?.roles.includes("ADMIN") ?? false;

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

  const organizationForm = useForm<OrganizationSchema>({
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
      isActive: organizationQuery.data.isActive,
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
      });
    },
    onSuccess: () => {
      toast.success("Organization settings updated");
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.invalidateQueries({ queryKey: ["organizations", "settings", organizationId] });
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

  if (isSuperAdmin || !organizationId) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Configuration"
          title="Settings"
          description="Platform-level super admin sessions do not own a single tenant configuration. Use organizations to manage institution settings and profile to update your own account."
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
            <div className="rounded-xl border bg-muted/30 p-5">
              <p className="font-medium text-foreground">Manage institutions</p>
              <p className="mt-2 text-sm text-muted-foreground">Open the organizations workspace to review active tenants, update school identity details, and control which organizations remain active.</p>
              <Button asChild className="mt-4">
                <Link href="/organizations">Go to organizations</Link>
              </Button>
            </div>
            <div className="rounded-xl border bg-muted/30 p-5">
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
          <MetricCard title="Workspace Mode" value="Tenant" helper="You are inside a tenant-scoped session" icon={Settings2} tone="sky" />
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

  if (organizationQuery.isLoading || providerSettingsQuery.isLoading) {
    return <LoadingState rows={6} />;
  }

  if (organizationQuery.isError || providerSettingsQuery.isError || !organizationQuery.data || !providerSettingsQuery.data) {
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
          title="Reply Address"
          value={providerSettings.replyToEmail ? "Configured" : "Pending"}
          helper="Email response routing for reminders"
          icon={Mail}
          tone={providerSettings.replyToEmail ? "emerald" : "amber"}
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
              <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground md:col-span-2">
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

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Operational notes</CardTitle>
            <CardDescription>Explicit guidance for the settings that are live today and the ones that still need dedicated backend policy APIs.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Login governance</p>
              <p className="mt-2">Tenant users cannot sign in if the user is inactive or if the organization itself is marked inactive.</p>
            </div>
            <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Live today</p>
              <p className="mt-2">Organization profile details and reminder provider controls are stored against the current tenant and affect real platform behavior.</p>
            </div>
            <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Next backend step</p>
              <p className="mt-2">Session policy, password rotation policy, currency, and locale formats should move into a dedicated organization configuration model.</p>
            </div>
          </CardContent>
        </Card>
      </div>
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
    <label className={`flex items-start justify-between gap-4 rounded-xl border p-4 text-sm ${className ?? ""}`}>
      <div>
        <p className="font-medium">{label}</p>
        <p className="mt-1 text-muted-foreground">{description}</p>
      </div>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-1" />
    </label>
  );
}
