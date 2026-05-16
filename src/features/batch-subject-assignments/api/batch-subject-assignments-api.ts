import { apiClient, unwrapResponse } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { buildQueryParams } from "@/lib/api/query-utils";
import type { ApiResponse, PaginatedResult, PaginationParams } from "@/types/api";
import type { BulkDeleteDto, CreateBatchSubjectAssignmentDto, UpdateBatchSubjectAssignmentDto } from "@/types/dto";
import type { BatchSubjectAssignment } from "@/types/domain";

export const batchSubjectAssignmentsApi = {
  list: (params: PaginationParams) =>
    unwrapResponse(
      apiClient.get<ApiResponse<PaginatedResult<BatchSubjectAssignment>>>(
        `${endpoints.batchSubjectAssignments.list}?${buildQueryParams(params).toString()}`,
      ),
    ),
  detail: (id: string) =>
    unwrapResponse(apiClient.get<ApiResponse<BatchSubjectAssignment>>(endpoints.batchSubjectAssignments.detail(id))),
  create: (payload: CreateBatchSubjectAssignmentDto) =>
    unwrapResponse(apiClient.post<ApiResponse<BatchSubjectAssignment>>(endpoints.batchSubjectAssignments.list, payload)),
  update: (id: string, payload: UpdateBatchSubjectAssignmentDto) =>
    unwrapResponse(apiClient.patch<ApiResponse<BatchSubjectAssignment>>(endpoints.batchSubjectAssignments.detail(id), payload)),
  remove: (id: string) =>
    unwrapResponse(apiClient.delete<ApiResponse<{ deleted: boolean }>>(endpoints.batchSubjectAssignments.detail(id))),
  bulkRemove: (ids: string[]) =>
    unwrapResponse(
      apiClient.post<ApiResponse<{ deletedCount: number }>>(endpoints.batchSubjectAssignments.bulkDelete, { ids } satisfies BulkDeleteDto),
    ),
  bulkUpdateStatus: (ids: string[], isActive: boolean) =>
    unwrapResponse(
      apiClient.post<ApiResponse<{ updatedCount: number }>>(endpoints.batchSubjectAssignments.bulkStatus, { ids, isActive }),
    ),
};
