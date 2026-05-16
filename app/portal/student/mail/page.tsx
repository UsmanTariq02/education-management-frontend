"use client";

import { useSearchParams } from "next/navigation";
import { MailWorkspace } from "@/features/mail/components/mail-workspace";
import { portalMailApi } from "@/features/mail/api/portal-mail-api";

export default function StudentPortalMailPage() {
  const searchParams = useSearchParams();
  const folder = searchParams?.get("folder");
  return (
    <MailWorkspace
      title="Student Mail"
      description="Message teachers and academic staff from the student portal without leaving the learning workspace."
      api={portalMailApi}
      audienceLabel="Student portal mailbox"
      initialFolder={folder === "sent" || folder === "drafts" || folder === "starred" || folder === "trash" ? folder : "inbox"}
      scopeKey="portal-student"
    />
  );
}
