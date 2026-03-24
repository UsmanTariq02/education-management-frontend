import { apiClient, unwrapResponse } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { buildQueryParams } from "@/lib/api/query-utils";
import type { ApiResponse, PaginatedResult, PaginationParams } from "@/types/api";
import type { CreateOrganizationDto, UpdateOrganizationDto } from "@/types/dto";
import type { Organization } from "@/types/domain";

export const organizationsApi = {
  list: (params: PaginationParams) =>
    unwrapResponse(
      apiClient.get<ApiResponse<PaginatedResult<Organization>>>(
        `${endpoints.organizations.list}?${buildQueryParams(params).toString()}`,
      ),
    ),
  detail: (id: string) => unwrapResponse(apiClient.get<ApiResponse<Organization>>(endpoints.organizations.detail(id))),
  currentSettings: () =>
    unwrapResponse(apiClient.get<ApiResponse<Organization>>(endpoints.organizations.currentSettings)),
  create: (payload: CreateOrganizationDto) =>
    unwrapResponse(apiClient.post<ApiResponse<Organization>>(endpoints.organizations.list, payload)),
  update: (id: string, payload: UpdateOrganizationDto) =>
    unwrapResponse(apiClient.patch<ApiResponse<Organization>>(endpoints.organizations.detail(id), payload)),
  updateCurrentSettings: (payload: UpdateOrganizationDto) =>
    unwrapResponse(apiClient.patch<ApiResponse<Organization>>(endpoints.organizations.currentSettings, payload)),
};
