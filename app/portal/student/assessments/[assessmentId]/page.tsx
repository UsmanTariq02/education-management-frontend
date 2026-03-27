import { PortalAuthGuard } from "@/components/layout/portal-auth-guard";
import { PortalAssessmentPlayer } from "@/features/portal/components/portal-assessment-player";

export default async function StudentAssessmentAttemptPage({
  params,
}: {
  params: Promise<{ assessmentId: string }>;
}) {
  const { assessmentId } = await params;

  return (
    <PortalAuthGuard accountType="STUDENT">
      <main className="container py-8">
        <PortalAssessmentPlayer assessmentId={assessmentId} />
      </main>
    </PortalAuthGuard>
  );
}
