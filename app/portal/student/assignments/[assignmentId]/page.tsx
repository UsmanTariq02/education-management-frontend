import { PortalAssignmentWorkspace } from "@/features/portal/components/portal-assignment-workspace";

interface StudentAssignmentDetailPageProps {
  params: Promise<{ assignmentId: string }>;
}

export default async function StudentAssignmentDetailPage({ params }: StudentAssignmentDetailPageProps) {
  const { assignmentId } = await params;

  return <PortalAssignmentWorkspace assignmentId={assignmentId} />;
}
