import { PortalAuthGuard } from "@/components/layout/portal-auth-guard";
import { PortalDashboard } from "@/features/portal/components/portal-dashboard";

export default function ParentPortalPage() {
  return (
    <PortalAuthGuard accountType="PARENT">
      <main className="container py-8">
        <PortalDashboard variant="parent" />
      </main>
    </PortalAuthGuard>
  );
}
