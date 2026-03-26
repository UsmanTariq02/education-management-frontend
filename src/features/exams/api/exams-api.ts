import { apiClient, unwrapResponse } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { buildQueryParams } from "@/lib/api/query-utils";
import type { ApiResponse, PaginatedResult, PaginationParams } from "@/types/api";
import type { CreateExamDto, UpdateExamDto } from "@/types/dto";
import type { Exam } from "@/types/domain";

export const examsApi = {
  list: (params: PaginationParams) =>
    unwrapResponse(apiClient.get<ApiResponse<PaginatedResult<Exam>>>(`${endpoints.exams.list}?${buildQueryParams(params).toString()}`)),
  detail: (id: string) => unwrapResponse(apiClient.get<ApiResponse<Exam>>(endpoints.exams.detail(id))),
  create: (payload: CreateExamDto) => unwrapResponse(apiClient.post<ApiResponse<Exam>>(endpoints.exams.list, payload)),
  update: (id: string, payload: UpdateExamDto) =>
    unwrapResponse(apiClient.patch<ApiResponse<Exam>>(endpoints.exams.detail(id), payload)),
  remove: (id: string) =>
    unwrapResponse(apiClient.delete<ApiResponse<{ deleted: boolean }>>(endpoints.exams.detail(id))),
};
