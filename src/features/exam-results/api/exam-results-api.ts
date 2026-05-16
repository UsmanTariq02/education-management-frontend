import { apiClient, unwrapResponse } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { buildQueryParams } from "@/lib/api/query-utils";
import type { ApiResponse, PaginatedResult, PaginationParams } from "@/types/api";
import type { BulkDeleteDto, CreateExamResultDto, UpdateExamResultDto } from "@/types/dto";
import type { ExamResult } from "@/types/domain";

export const examResultsApi = {
  list: (params: PaginationParams) =>
    unwrapResponse(apiClient.get<ApiResponse<PaginatedResult<ExamResult>>>(`${endpoints.examResults.list}?${buildQueryParams(params).toString()}`)),
  detail: (id: string) => unwrapResponse(apiClient.get<ApiResponse<ExamResult>>(endpoints.examResults.detail(id))),
  create: (payload: CreateExamResultDto) =>
    unwrapResponse(apiClient.post<ApiResponse<ExamResult>>(endpoints.examResults.list, payload)),
  update: (id: string, payload: UpdateExamResultDto) =>
    unwrapResponse(apiClient.patch<ApiResponse<ExamResult>>(endpoints.examResults.detail(id), payload)),
  remove: (id: string) =>
    unwrapResponse(apiClient.delete<ApiResponse<{ deleted: boolean }>>(endpoints.examResults.detail(id))),
  bulkRemove: (ids: string[]) =>
    unwrapResponse(
      apiClient.post<ApiResponse<{ deletedCount: number }>>(endpoints.examResults.bulkDelete, { ids } satisfies BulkDeleteDto),
    ),
};
