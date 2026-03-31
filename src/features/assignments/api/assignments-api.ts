import { apiClient, unwrapResponse } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { buildQueryParams } from "@/lib/api/query-utils";
import type { ApiResponse, PaginatedResult, PaginationParams } from "@/types/api";
import type { CreateAssignmentDto, ReviewAssignmentSubmissionDto, UpdateAssignmentDto } from "@/types/dto";
import type { Assignment, AssignmentSubmission } from "@/types/domain";

export const assignmentsApi = {
  list: (params: PaginationParams) =>
    unwrapResponse(
      apiClient.get<ApiResponse<PaginatedResult<Assignment>>>(`${endpoints.assignments.list}?${buildQueryParams(params).toString()}`),
    ),
  detail: (id: string) => unwrapResponse(apiClient.get<ApiResponse<Assignment>>(endpoints.assignments.detail(id))),
  create: (payload: CreateAssignmentDto) =>
    unwrapResponse(apiClient.post<ApiResponse<Assignment>>(endpoints.assignments.list, payload)),
  update: (id: string, payload: UpdateAssignmentDto) =>
    unwrapResponse(apiClient.patch<ApiResponse<Assignment>>(endpoints.assignments.detail(id), payload)),
  reviewSubmission: (submissionId: string, payload: ReviewAssignmentSubmissionDto) =>
    unwrapResponse(apiClient.patch<ApiResponse<AssignmentSubmission>>(endpoints.assignments.reviewSubmission(submissionId), payload)),
  remove: (id: string) =>
    unwrapResponse(apiClient.delete<ApiResponse<{ deleted: boolean }>>(endpoints.assignments.detail(id))),
};
