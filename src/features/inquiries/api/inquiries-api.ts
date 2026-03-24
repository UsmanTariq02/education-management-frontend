import { apiClient, unwrapResponse } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { buildQueryParams } from "@/lib/api/query-utils";
import type { ApiResponse, PaginatedResult, PaginationParams } from "@/types/api";
import type { CreateContactInquiryDto, UpdateContactInquiryStatusDto } from "@/types/dto";
import type { ContactInquiry } from "@/types/domain";

export const inquiriesApi = {
  createContactInquiry: (payload: CreateContactInquiryDto) =>
    unwrapResponse(apiClient.post<ApiResponse<{ id: string }>>(endpoints.inquiries.contact, payload)),
  list: (params: PaginationParams) =>
    unwrapResponse(
      apiClient.get<ApiResponse<PaginatedResult<ContactInquiry>>>(
        `${endpoints.inquiries.list}?${buildQueryParams(params).toString()}`,
      ),
    ),
  updateStatus: (id: string, payload: UpdateContactInquiryStatusDto) =>
    unwrapResponse(apiClient.patch<ApiResponse<ContactInquiry>>(endpoints.inquiries.updateStatus(id), payload)),
};
