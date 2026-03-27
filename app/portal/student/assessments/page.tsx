import { PortalAuthGuard } from "@/components/layout/portal-auth-guard";
import { PortalAssessmentCenter } from "@/features/portal/components/portal-assessment-center";

export default function StudentAssessmentCenterPage() {
  return (
    <PortalAuthGuard accountType="STUDENT">
      <main className="container py-8">
        <PortalAssessmentCenter />
      </main>
    </PortalAuthGuard>
  );
}
