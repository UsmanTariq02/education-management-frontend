import { PortalAuthGuard } from "@/components/layout/portal-auth-guard";
import { PortalGuide } from "@/features/portal/components/portal-guide";

export default function StudentPortalGuidePage() {
  return (
    <PortalAuthGuard accountType="STUDENT">
      <PortalGuide variant="student" />
    </PortalAuthGuard>
  );
}
