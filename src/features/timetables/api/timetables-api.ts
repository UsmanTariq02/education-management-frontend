import { apiClient, unwrapResponse } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { buildQueryParams } from "@/lib/api/query-utils";
import type { ApiResponse, PaginatedResult, PaginationParams } from "@/types/api";
import type { BulkDeleteDto, CreateTimetableEntryDto, UpdateTimetableEntryDto } from "@/types/dto";
import type { TimetableEntry } from "@/types/domain";

export const timetablesApi = {
  list: (params: PaginationParams) =>
    unwrapResponse(
      apiClient.get<ApiResponse<PaginatedResult<TimetableEntry>>>(`${endpoints.timetables.list}?${buildQueryParams(params).toString()}`),
    ),
  detail: (id: string) => unwrapResponse(apiClient.get<ApiResponse<TimetableEntry>>(endpoints.timetables.detail(id))),
  create: (payload: CreateTimetableEntryDto) => unwrapResponse(apiClient.post<ApiResponse<TimetableEntry>>(endpoints.timetables.list, payload)),
  update: (id: string, payload: UpdateTimetableEntryDto) =>
    unwrapResponse(apiClient.patch<ApiResponse<TimetableEntry>>(endpoints.timetables.detail(id), payload)),
  remove: (id: string) =>
    unwrapResponse(apiClient.delete<ApiResponse<{ deleted: boolean }>>(endpoints.timetables.detail(id))),
  bulkRemove: (ids: string[]) =>
    unwrapResponse(
      apiClient.post<ApiResponse<{ deletedCount: number }>>(endpoints.timetables.bulkDelete, { ids } satisfies BulkDeleteDto),
    ),
};
