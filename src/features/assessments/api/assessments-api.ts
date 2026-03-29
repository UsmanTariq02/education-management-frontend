import { apiClient, unwrapResponse } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { buildQueryParams } from "@/lib/api/query-utils";
import type { ApiResponse, PaginatedResult, PaginationParams } from "@/types/api";
import type { CreateAssessmentDto, ReviewAssessmentAttemptDto, UpdateAssessmentDto } from "@/types/dto";
import type { Assessment, AssessmentAnalytics, AssessmentReviewAttempt, AssessmentReviewQueue } from "@/types/domain";

export const assessmentsApi = {
  list: (params: PaginationParams) =>
    unwrapResponse(
      apiClient.get<ApiResponse<PaginatedResult<Assessment>>>(`${endpoints.assessments.list}?${buildQueryParams(params).toString()}`),
    ),
  detail: (id: string) => unwrapResponse(apiClient.get<ApiResponse<Assessment>>(endpoints.assessments.detail(id))),
  create: (payload: CreateAssessmentDto) =>
    unwrapResponse(apiClient.post<ApiResponse<Assessment>>(endpoints.assessments.list, payload)),
  update: (id: string, payload: UpdateAssessmentDto) =>
    unwrapResponse(apiClient.patch<ApiResponse<Assessment>>(endpoints.assessments.detail(id), payload)),
  reviewQueue: (id: string) =>
    unwrapResponse(apiClient.get<ApiResponse<AssessmentReviewQueue>>(endpoints.assessments.reviewQueue(id))),
  analytics: (id: string) =>
    unwrapResponse(apiClient.get<ApiResponse<AssessmentAnalytics>>(endpoints.assessments.analytics(id))),
  reviewAttempt: (attemptId: string, payload: ReviewAssessmentAttemptDto) =>
    unwrapResponse(apiClient.patch<ApiResponse<AssessmentReviewAttempt>>(endpoints.assessments.reviewAttempt(attemptId), payload)),
  remove: (id: string) =>
    unwrapResponse(apiClient.delete<ApiResponse<{ deleted: boolean }>>(endpoints.assessments.detail(id))),
};
