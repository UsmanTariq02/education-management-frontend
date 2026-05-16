import { PortalAssessmentPlayer } from "@/features/portal/components/portal-assessment-player";

export default async function StudentAssessmentAttemptPage({
  params,
}: {
  params: Promise<{ assessmentId: string }>;
}) {
  const { assessmentId } = await params;

  return <PortalAssessmentPlayer assessmentId={assessmentId} />;
}
