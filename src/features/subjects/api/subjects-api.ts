import { apiClient, unwrapResponse } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { buildQueryParams } from "@/lib/api/query-utils";
import type { ApiResponse, PaginatedResult, PaginationParams } from "@/types/api";
import type { CreateSubjectDto, UpdateSubjectDto } from "@/types/dto";
import type { Subject } from "@/types/domain";

export const subjectsApi = {
  list: (params: PaginationParams) =>
    unwrapResponse(
      apiClient.get<ApiResponse<PaginatedResult<Subject>>>(`${endpoints.subjects.list}?${buildQueryParams(params).toString()}`),
    ),
  detail: (id: string) => unwrapResponse(apiClient.get<ApiResponse<Subject>>(endpoints.subjects.detail(id))),
  create: (payload: CreateSubjectDto) => unwrapResponse(apiClient.post<ApiResponse<Subject>>(endpoints.subjects.list, payload)),
  update: (id: string, payload: UpdateSubjectDto) =>
    unwrapResponse(apiClient.patch<ApiResponse<Subject>>(endpoints.subjects.detail(id), payload)),
  remove: (id: string) =>
    unwrapResponse(apiClient.delete<ApiResponse<{ deleted: boolean }>>(endpoints.subjects.detail(id))),
};
