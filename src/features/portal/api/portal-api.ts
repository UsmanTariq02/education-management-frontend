import { unwrapResponse } from "@/lib/api/client";
import { portalApiClient } from "@/lib/api/portal-client";
import { endpoints } from "@/lib/api/endpoints";
import type { ApiResponse } from "@/types/api";
import type { SavePortalAssessmentAttemptDto } from "@/types/dto";
import type { PortalAssessmentAttempt, PortalAssessmentDetail, PortalAssessmentListItem, PortalAssessmentSubmitResult, PortalDashboard } from "@/types/domain";

export const portalApi = {
  dashboard: () =>
    unwrapResponse(portalApiClient.get<ApiResponse<PortalDashboard>>(endpoints.portal.dashboard)),
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
