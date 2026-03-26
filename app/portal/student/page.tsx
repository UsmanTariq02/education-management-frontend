import { PortalAuthGuard } from "@/components/layout/portal-auth-guard";
import { PortalDashboard } from "@/features/portal/components/portal-dashboard";

export default function StudentPortalPage() {
  return (
    <PortalAuthGuard accountType="STUDENT">
      <main className="container py-8">
        <PortalDashboard variant="student" />
      </main>
    </PortalAuthGuard>
  );
}
