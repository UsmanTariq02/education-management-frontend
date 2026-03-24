import { apiClient, unwrapResponse } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { buildQueryParams } from "@/lib/api/query-utils";
import type { ApiResponse, PaginatedResult, PaginationParams } from "@/types/api";
import type { CreateAttendanceDto, UpdateAttendanceDto } from "@/types/dto";
import type { AttendanceRecord } from "@/types/domain";

export const attendanceApi = {
  list: (params: PaginationParams) =>
    unwrapResponse(
      apiClient.get<ApiResponse<PaginatedResult<AttendanceRecord>>>(`${endpoints.attendance.list}?${buildQueryParams(params).toString()}`),
    ),
  create: (payload: CreateAttendanceDto) =>
    unwrapResponse(apiClient.post<ApiResponse<AttendanceRecord>>(endpoints.attendance.list, payload)),
  update: (id: string, payload: UpdateAttendanceDto) =>
    unwrapResponse(apiClient.patch<ApiResponse<AttendanceRecord>>(endpoints.attendance.detail(id), payload)),
  remove: (id: string) =>
    unwrapResponse(apiClient.delete<ApiResponse<{ deleted: boolean }>>(endpoints.attendance.detail(id))),
};
