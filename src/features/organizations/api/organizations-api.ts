import { apiClient, unwrapResponse } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { buildQueryParams } from "@/lib/api/query-utils";
import type { ApiResponse, PaginatedResult, PaginationParams } from "@/types/api";
import type {
  CreateOrganizationBillingEntryDto,
  CreateOrganizationDto,
  UpdateOrganizationBillingEntryDto,
  UpdateOrganizationDto,
} from "@/types/dto";
import type { Organization, OrganizationBillingEntry } from "@/types/domain";

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
  billingEntries: (id: string) =>
    unwrapResponse(apiClient.get<ApiResponse<OrganizationBillingEntry[]>>(endpoints.organizations.billingEntries(id))),
  create: (payload: CreateOrganizationDto) =>
    unwrapResponse(apiClient.post<ApiResponse<Organization>>(endpoints.organizations.list, payload)),
  update: (id: string, payload: UpdateOrganizationDto) =>
    unwrapResponse(apiClient.patch<ApiResponse<Organization>>(endpoints.organizations.detail(id), payload)),
  createBillingEntry: (id: string, payload: CreateOrganizationBillingEntryDto) =>
    unwrapResponse(apiClient.post<ApiResponse<OrganizationBillingEntry>>(endpoints.organizations.billingEntries(id), payload)),
  updateBillingEntry: (id: string, entryId: string, payload: UpdateOrganizationBillingEntryDto) =>
    unwrapResponse(apiClient.patch<ApiResponse<OrganizationBillingEntry>>(endpoints.organizations.billingEntryDetail(id, entryId), payload)),
  updateCurrentSettings: (payload: UpdateOrganizationDto) =>
    unwrapResponse(apiClient.patch<ApiResponse<Organization>>(endpoints.organizations.currentSettings, payload)),
};
