import { PortalAuthGuard } from "@/components/layout/portal-auth-guard";
import { PortalGuide } from "@/features/portal/components/portal-guide";

export default function ParentPortalGuidePage() {
  return (
    <PortalAuthGuard accountType="PARENT">
      <PortalGuide variant="parent" />
    </PortalAuthGuard>
  );
}
