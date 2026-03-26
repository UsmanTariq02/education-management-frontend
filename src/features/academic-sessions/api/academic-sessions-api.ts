import { apiClient, unwrapResponse } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { buildQueryParams } from "@/lib/api/query-utils";
import type { ApiResponse, PaginatedResult, PaginationParams } from "@/types/api";
import type { CreateAcademicSessionDto, UpdateAcademicSessionDto } from "@/types/dto";
import type { AcademicSession } from "@/types/domain";

export const academicSessionsApi = {
  list: (params: PaginationParams) =>
    unwrapResponse(
      apiClient.get<ApiResponse<PaginatedResult<AcademicSession>>>(
        `${endpoints.academicSessions.list}?${buildQueryParams(params).toString()}`,
      ),
    ),
  detail: (id: string) =>
    unwrapResponse(apiClient.get<ApiResponse<AcademicSession>>(endpoints.academicSessions.detail(id))),
  create: (payload: CreateAcademicSessionDto) =>
    unwrapResponse(apiClient.post<ApiResponse<AcademicSession>>(endpoints.academicSessions.list, payload)),
  update: (id: string, payload: UpdateAcademicSessionDto) =>
    unwrapResponse(apiClient.patch<ApiResponse<AcademicSession>>(endpoints.academicSessions.detail(id), payload)),
  remove: (id: string) =>
    unwrapResponse(apiClient.delete<ApiResponse<{ deleted: boolean }>>(endpoints.academicSessions.detail(id))),
};
