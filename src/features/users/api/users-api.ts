import { apiClient, unwrapResponse } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { buildQueryParams } from "@/lib/api/query-utils";
import type { ApiResponse, PaginatedResult, PaginationParams } from "@/types/api";
import type { BulkDeleteDto, CreateUserDto, UpdateUserDto } from "@/types/dto";
import type { User } from "@/types/domain";

export const usersApi = {
  list: (params: PaginationParams) =>
    unwrapResponse(
      apiClient.get<ApiResponse<PaginatedResult<User>>>(`${endpoints.users.list}?${buildQueryParams(params).toString()}`),
    ),
  detail: (id: string) => unwrapResponse(apiClient.get<ApiResponse<User>>(endpoints.users.detail(id))),
  create: (payload: CreateUserDto) => unwrapResponse(apiClient.post<ApiResponse<User>>(endpoints.users.list, payload)),
  update: (id: string, payload: UpdateUserDto) =>
    unwrapResponse(apiClient.patch<ApiResponse<User>>(endpoints.users.detail(id), payload)),
  remove: (id: string) => unwrapResponse(apiClient.delete<ApiResponse<{ deleted: boolean }>>(endpoints.users.detail(id))),
  bulkRemove: (ids: string[]) =>
    unwrapResponse(apiClient.post<ApiResponse<{ deletedCount: number }>>(endpoints.users.bulkDelete, { ids } satisfies BulkDeleteDto)),
  bulkUpdateStatus: (ids: string[], isActive: boolean) =>
    unwrapResponse(
      apiClient.post<ApiResponse<{ updatedCount: number }>>(endpoints.users.bulkStatus, { ids, isActive }),
    ),
};
