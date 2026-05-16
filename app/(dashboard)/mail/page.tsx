"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MailWorkspace } from "@/features/mail/components/mail-workspace";
import { mailApi } from "@/features/mail/api/mail-api";
import { useAuth } from "@/providers/auth-provider";
import { organizationsApi } from "@/features/organizations/api/organizations-api";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrganizationScopeBanner } from "@/components/shared/organization-scope-banner";
import { getAiAccessLabel, hasAiAccess } from "@/lib/ai/access";

export default function MailPage() {
  const searchParams = useSearchParams();
  const folder = searchParams?.get("folder");
  const { user } = useAuth();
  const isPlatformSession = Boolean(user && !user.organizationId);
  const organizationsQuery = useQuery({
    queryKey: ["mail-organizations"],
    queryFn: () => organizationsApi.list({ page: 1, limit: 100 }),
    enabled: isPlatformSession,
  });
  const currentSettingsQuery = useQuery({
    queryKey: ["mail-current-settings"],
    queryFn: organizationsApi.currentSettings,
    enabled: Boolean(user?.organizationId) && !isPlatformSession,
  });
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | undefined>(user?.organizationId ?? undefined);

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

  const scopedMailApi = useMemo(
    () => ({
      contacts: (search?: string, organizationId?: string, audience?: string[], limit?: number) =>
        mailApi.contacts(search, organizationId ?? selectedOrganizationId, audience, limit),
      mailbox: (params: { page?: number; limit?: number; folder?: string; search?: string }) =>
        mailApi.mailbox({ ...params, organizationId: selectedOrganizationId }),
      conversation: (conversationId: string) => mailApi.conversation(conversationId, selectedOrganizationId),
      create: (payload: Parameters<typeof mailApi.create>[0]) => mailApi.create(payload, selectedOrganizationId),
      updateDraft: (id: string, payload: Parameters<typeof mailApi.updateDraft>[1]) => mailApi.updateDraft(id, payload, selectedOrganizationId),
      sendDraft: (id: string) => mailApi.sendDraft(id, selectedOrganizationId),
      reply: (conversationId: string, payload: Parameters<typeof mailApi.reply>[1]) =>
        mailApi.reply(conversationId, payload, selectedOrganizationId),
      markRead: (id: string) => mailApi.markRead(id, selectedOrganizationId),
      star: (id: string) => mailApi.star(id, selectedOrganizationId),
      unstar: (id: string) => mailApi.unstar(id, selectedOrganizationId),
      archive: (id: string) => mailApi.archive(id, selectedOrganizationId),
      trash: (id: string) => mailApi.trash(id, selectedOrganizationId),
      restore: (id: string) => mailApi.restore(id, selectedOrganizationId),
    }),
    [selectedOrganizationId],
  );

  const organizationOptions = organizationsQuery.data?.items ?? [];
  const selectedOrganization = organizationOptions.find((organization) => organization.id === selectedOrganizationId) ?? null;
  const aiReady = hasAiAccess(user) || hasAiAccess(selectedOrganization);
  const approvalRequired = Boolean(selectedOrganization?.aiDraftApprovalRequired ?? currentSettingsQuery.data?.aiDraftApprovalRequired);

  if (isPlatformSession && !selectedOrganizationId) {
    return (
      <div className="space-y-6">
        <OrganizationScopeBanner moduleLabel="Mail" />
        <Card className="border-border/70 bg-card/85 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle>Select an organization</CardTitle>
            <CardDescription>Super admin sessions need an organization selected before composing or reading mail.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={selectedOrganizationId} onValueChange={setSelectedOrganizationId}>
              <SelectTrigger>
                <SelectValue placeholder={organizationsQuery.isLoading ? "Loading organizations..." : "Choose organization"} />
              </SelectTrigger>
              <SelectContent>
                {organizationOptions.map((organization) => (
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
    <MailWorkspace
      title="Internal Mail"
      description="Compose, reply, file, and star conversations across students, teachers, and staff."
      api={scopedMailApi}
      audienceLabel="Dashboard mailbox"
      initialFolder={folder === "sent" || folder === "drafts" || folder === "starred" || folder === "trash" ? folder : "inbox"}
      scopeKey={selectedOrganizationId ?? user?.organizationId ?? "dashboard"}
      organizationId={selectedOrganizationId}
      aiReady={aiReady}
      requireApprovalForAiDrafts={approvalRequired}
    />
  );
}
