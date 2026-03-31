import { unwrapResponse } from "@/lib/api/client";
import { portalApiClient } from "@/lib/api/portal-client";
import { endpoints } from "@/lib/api/endpoints";
import type { ApiResponse } from "@/types/api";
import type { AcknowledgePortalItemDto, CreatePortalFeePaymentProofDto, SavePortalAssessmentAttemptDto, UpsertPortalAssignmentSubmissionDto } from "@/types/dto";
import type {
  PortalAcknowledgementItem,
  PortalAnnouncement,
  PortalAssessmentAttempt,
  PortalAssessmentDetail,
  PortalAssessmentListItem,
  PortalActivityFeedItem,
  PortalDocument,
  PortalFeePaymentProof,
  PortalFeeRecord,
  PortalReportCard,
  PortalAssessmentSubmitResult,
  PortalAssignmentDetail,
  PortalAssignmentListItem,
  PortalAssignmentSubmission,
  PortalDashboard,
} from "@/types/domain";

export const portalApi = {
  dashboard: () =>
    unwrapResponse(portalApiClient.get<ApiResponse<PortalDashboard>>(endpoints.portal.dashboard)),
  reportCard: () =>
    unwrapResponse(portalApiClient.get<ApiResponse<PortalReportCard>>(endpoints.portal.reportCard)),
  activityFeed: () =>
    unwrapResponse(portalApiClient.get<ApiResponse<PortalActivityFeedItem[]>>(endpoints.portal.activityFeed)),
  acknowledgements: () =>
    unwrapResponse(portalApiClient.get<ApiResponse<PortalAcknowledgementItem[]>>(endpoints.portal.acknowledgements)),
  acknowledgeItem: (payload: AcknowledgePortalItemDto) =>
    unwrapResponse(portalApiClient.post<ApiResponse<PortalAcknowledgementItem>>(endpoints.portal.acknowledgeItem, payload)),
  announcements: () =>
    unwrapResponse(portalApiClient.get<ApiResponse<PortalAnnouncement[]>>(endpoints.portal.announcements)),
  fees: () =>
    unwrapResponse(portalApiClient.get<ApiResponse<PortalFeeRecord[]>>(endpoints.portal.fees)),
  uploadPaymentProof: async (feeRecordId: string, payload: CreatePortalFeePaymentProofDto, file: File) => {
    const formData = new FormData();
    formData.append("title", payload.title);
    if (payload.notes) formData.append("notes", payload.notes);
    formData.append("file", file);
    return unwrapResponse(
      portalApiClient.post<ApiResponse<PortalFeePaymentProof>>(endpoints.portal.uploadPaymentProof(feeRecordId), formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    );
  },
  downloadPaymentProof: async (proofId: string) => {
    const response = await portalApiClient.get<Blob>(endpoints.portal.paymentProofDownload(proofId), {
      responseType: "blob",
    });
    return response.data;
  },
  documents: () =>
    unwrapResponse(portalApiClient.get<ApiResponse<PortalDocument[]>>(endpoints.portal.documents)),
  downloadDocument: async (documentId: string) => {
    const response = await portalApiClient.get<Blob>(endpoints.portal.documentDownload(documentId), {
      responseType: "blob",
    });
    return response.data;
  },
  assignments: () =>
    unwrapResponse(portalApiClient.get<ApiResponse<PortalAssignmentListItem[]>>(endpoints.portal.assignments)),
  assignmentDetail: (assignmentId: string) =>
    unwrapResponse(portalApiClient.get<ApiResponse<PortalAssignmentDetail>>(endpoints.portal.assignmentDetail(assignmentId))),
  saveAssignmentSubmission: (assignmentId: string, payload: UpsertPortalAssignmentSubmissionDto) =>
    unwrapResponse(portalApiClient.put<ApiResponse<PortalAssignmentSubmission>>(endpoints.portal.assignmentSubmission(assignmentId), payload)),
  submitAssignment: (assignmentId: string, payload: UpsertPortalAssignmentSubmissionDto) =>
    unwrapResponse(portalApiClient.post<ApiResponse<PortalAssignmentSubmission>>(endpoints.portal.assignmentSubmit(assignmentId), payload)),
  assessments: () =>
    unwrapResponse(portalApiClient.get<ApiResponse<PortalAssessmentListItem[]>>(endpoints.portal.assessments)),
  assessmentDetail: (assessmentId: string) =>
    unwrapResponse(portalApiClient.get<ApiResponse<PortalAssessmentDetail>>(endpoints.portal.assessmentDetail(assessmentId))),
  startAssessment: (assessmentId: string) =>
    unwrapResponse(portalApiClient.post<ApiResponse<PortalAssessmentAttempt>>(endpoints.portal.assessmentStart(assessmentId))),
  saveAssessmentAnswers: (attemptId: string, payload: SavePortalAssessmentAttemptDto) =>
    unwrapResponse(
      portalApiClient.put<ApiResponse<PortalAssessmentAttempt>>(endpoints.portal.assessmentAttemptAnswers(attemptId), payload),
    ),
  submitAssessment: (attemptId: string) =>
    unwrapResponse(portalApiClient.post<ApiResponse<PortalAssessmentSubmitResult>>(endpoints.portal.assessmentAttemptSubmit(attemptId))),
};
