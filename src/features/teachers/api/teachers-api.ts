import { apiClient, unwrapResponse } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { buildQueryParams } from "@/lib/api/query-utils";
import type { ApiResponse, PaginatedResult, PaginationParams } from "@/types/api";
import type { BulkDeleteDto, CreateTeacherDto, UpdateTeacherDto } from "@/types/dto";
import type { Teacher } from "@/types/domain";

export const teachersApi = {
  list: (params: PaginationParams) =>
    unwrapResponse(
      apiClient.get<ApiResponse<PaginatedResult<Teacher>>>(`${endpoints.teachers.list}?${buildQueryParams(params).toString()}`),
    ),
  detail: (id: string) => unwrapResponse(apiClient.get<ApiResponse<Teacher>>(endpoints.teachers.detail(id))),
  create: (payload: CreateTeacherDto) => unwrapResponse(apiClient.post<ApiResponse<Teacher>>(endpoints.teachers.list, payload)),
  update: (id: string, payload: UpdateTeacherDto) =>
    unwrapResponse(apiClient.patch<ApiResponse<Teacher>>(endpoints.teachers.detail(id), payload)),
  remove: (id: string) =>
    unwrapResponse(apiClient.delete<ApiResponse<{ deleted: boolean }>>(endpoints.teachers.detail(id))),
  bulkRemove: (ids: string[]) =>
    unwrapResponse(apiClient.post<ApiResponse<{ deletedCount: number }>>(endpoints.teachers.bulkDelete, { ids } satisfies BulkDeleteDto)),
  bulkUpdateStatus: (ids: string[], isActive: boolean) =>
    unwrapResponse(apiClient.post<ApiResponse<{ updatedCount: number }>>(endpoints.teachers.bulkStatus, { ids, isActive })),
};
