"use client";

import { useSearchParams } from "next/navigation";
import { MailWorkspace } from "@/features/mail/components/mail-workspace";
import { portalMailApi } from "@/features/mail/api/portal-mail-api";

export default function ParentPortalMailPage() {
  const searchParams = useSearchParams();
  const folder = searchParams?.get("folder");
  return (
    <MailWorkspace
      title="Family Mail"
      description="Keep guardian communication in the same mailbox experience used by the school team."
      api={portalMailApi}
      audienceLabel="Parent portal mailbox"
      initialFolder={folder === "sent" || folder === "drafts" || folder === "starred" || folder === "trash" ? folder : "inbox"}
      scopeKey="portal-parent"
    />
  );
}
