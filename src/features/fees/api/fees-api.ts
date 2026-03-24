import { apiClient, unwrapResponse } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { buildQueryParams } from "@/lib/api/query-utils";
import type { ApiResponse, PaginatedResult, PaginationParams } from "@/types/api";
import type { CreateFeePlanDto, CreateFeeRecordDto, UpdateFeeRecordDto } from "@/types/dto";
import type { FeePlan, FeeRecord } from "@/types/domain";

export const feesApi = {
  listPlans: (params: PaginationParams) =>
    unwrapResponse(
      apiClient.get<ApiResponse<PaginatedResult<FeePlan>>>(`${endpoints.fees.plans}?${buildQueryParams(params).toString()}`),
    ),
  createPlan: (payload: CreateFeePlanDto) =>
    unwrapResponse(apiClient.post<ApiResponse<FeePlan>>(endpoints.fees.plans, payload)),
  listRecords: (params: PaginationParams) =>
    unwrapResponse(
      apiClient.get<ApiResponse<PaginatedResult<FeeRecord>>>(`${endpoints.fees.records}?${buildQueryParams(params).toString()}`),
    ),
  createRecord: (payload: CreateFeeRecordDto) =>
    unwrapResponse(apiClient.post<ApiResponse<FeeRecord>>(endpoints.fees.records, payload)),
  updateRecord: (id: string, payload: UpdateFeeRecordDto) =>
    unwrapResponse(apiClient.patch<ApiResponse<FeeRecord>>(endpoints.fees.recordDetail(id), payload)),
  removeRecord: (id: string) =>
    unwrapResponse(apiClient.delete<ApiResponse<{ deleted: boolean }>>(endpoints.fees.recordDetail(id))),
};
