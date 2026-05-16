import { apiClient, unwrapResponse } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { buildQueryParams } from "@/lib/api/query-utils";
import type { ApiResponse, PaginatedResult, PaginationParams } from "@/types/api";
import type { BulkDeleteDto, CreateBatchDto, UpdateBatchDto } from "@/types/dto";
import type { Batch } from "@/types/domain";

export const batchesApi = {
  list: (params: PaginationParams) =>
    unwrapResponse(
      apiClient.get<ApiResponse<PaginatedResult<Batch>>>(`${endpoints.batches.list}?${buildQueryParams(params).toString()}`),
    ),
  detail: (id: string) => unwrapResponse(apiClient.get<ApiResponse<Batch>>(endpoints.batches.detail(id))),
  create: (payload: CreateBatchDto) => unwrapResponse(apiClient.post<ApiResponse<Batch>>(endpoints.batches.list, payload)),
  update: (id: string, payload: UpdateBatchDto) =>
    unwrapResponse(apiClient.patch<ApiResponse<Batch>>(endpoints.batches.detail(id), payload)),
  remove: (id: string) =>
    unwrapResponse(apiClient.delete<ApiResponse<{ deleted: boolean }>>(endpoints.batches.detail(id))),
  bulkRemove: (ids: string[]) =>
    unwrapResponse(apiClient.post<ApiResponse<{ deletedCount: number }>>(endpoints.batches.bulkDelete, { ids } satisfies BulkDeleteDto)),
  bulkUpdateStatus: (ids: string[], isActive: boolean) =>
    unwrapResponse(apiClient.post<ApiResponse<{ updatedCount: number }>>(endpoints.batches.bulkStatus, { ids, isActive })),
};
