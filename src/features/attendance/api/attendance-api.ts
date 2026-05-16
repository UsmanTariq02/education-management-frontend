import { apiClient, unwrapResponse } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { buildQueryParams } from "@/lib/api/query-utils";
import type { ApiResponse, PaginatedResult, PaginationParams } from "@/types/api";
import type {
  BulkCreateAttendanceDto,
  BulkDeleteDto,
  BulkUpdateAttendanceStatusDto,
  CreateAttendanceDto,
  UpdateAttendanceDto,
} from "@/types/dto";
import type { AttendanceFollowUpAutomationSummary, AttendanceRecord } from "@/types/domain";

export const attendanceApi = {
  list: (params: PaginationParams) =>
    unwrapResponse(
      apiClient.get<ApiResponse<PaginatedResult<AttendanceRecord>>>(`${endpoints.attendance.list}?${buildQueryParams(params).toString()}`),
    ),
  create: (payload: CreateAttendanceDto) =>
    unwrapResponse(apiClient.post<ApiResponse<AttendanceRecord>>(endpoints.attendance.list, payload)),
  bulkCreate: (payload: BulkCreateAttendanceDto) =>
    unwrapResponse(apiClient.post<ApiResponse<{ createdCount: number }>>(endpoints.attendance.bulkCreate, payload)),
  update: (id: string, payload: UpdateAttendanceDto) =>
    unwrapResponse(apiClient.patch<ApiResponse<AttendanceRecord>>(endpoints.attendance.detail(id), payload)),
  remove: (id: string) =>
    unwrapResponse(apiClient.delete<ApiResponse<{ deleted: boolean }>>(endpoints.attendance.detail(id))),
  bulkRemove: (ids: string[]) =>
    unwrapResponse(
      apiClient.post<ApiResponse<{ deletedCount: number }>>(endpoints.attendance.bulkDelete, { ids } satisfies BulkDeleteDto),
    ),
  bulkStatus: (payload: BulkUpdateAttendanceStatusDto) =>
    unwrapResponse(apiClient.post<ApiResponse<{ updatedCount: number; status: string }>>(endpoints.attendance.bulkStatus, payload)),
  processFollowUps: () =>
    unwrapResponse(apiClient.post<ApiResponse<AttendanceFollowUpAutomationSummary>>(endpoints.attendance.processFollowUps, {})),
};
