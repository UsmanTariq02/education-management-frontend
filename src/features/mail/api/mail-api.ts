import { apiClient, unwrapResponse } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { buildQueryParams } from "@/lib/api/query-utils";
import type { ApiResponse, PaginationParams } from "@/types/api";
import type { CreateMailMessageDto, ReplyMailMessageDto, UpdateMailDraftDto } from "@/types/dto";
import type { MailContact, MailConversationDetail, MailMailboxItem, MailMailboxResponse } from "@/types/domain";

export const mailApi = {
  contacts: (search?: string, organizationId?: string, audience?: string[], limit?: number) =>
    unwrapResponse(
      apiClient.get<ApiResponse<MailContact[]>>(
        `${endpoints.mail.contacts}?${buildQueryParams({ search, organizationId, audience: audience?.join(","), limit }).toString()}`,
      ),
    ),
  mailbox: (params: PaginationParams & { folder?: string; organizationId?: string }) =>
    unwrapResponse(
      apiClient.get<ApiResponse<MailMailboxResponse>>(`${endpoints.mail.list}?${buildQueryParams(params).toString()}`),
    ),
  conversation: (conversationId: string, organizationId?: string) =>
    unwrapResponse(
      apiClient.get<ApiResponse<MailConversationDetail>>(
        `${endpoints.mail.conversation(conversationId)}?${buildQueryParams({ organizationId }).toString()}`,
      ),
    ),
  create: (payload: CreateMailMessageDto, organizationId?: string) =>
    unwrapResponse(
      apiClient.post<ApiResponse<MailMailboxItem>>(`${endpoints.mail.list}?${buildQueryParams({ organizationId }).toString()}`, payload),
    ),
  updateDraft: (id: string, payload: UpdateMailDraftDto, organizationId?: string) =>
    unwrapResponse(
      apiClient.patch<ApiResponse<MailMailboxItem>>(
        `${endpoints.mail.detail(id)}?${buildQueryParams({ organizationId }).toString()}`,
        payload,
      ),
    ),
  sendDraft: (id: string, organizationId?: string) =>
    unwrapResponse(
      apiClient.post<ApiResponse<MailMailboxItem>>(
        `${endpoints.mail.send(id)}?${buildQueryParams({ organizationId }).toString()}`,
        {},
      ),
    ),
  reply: (conversationId: string, payload: ReplyMailMessageDto, organizationId?: string) =>
    unwrapResponse(
      apiClient.post<ApiResponse<MailMailboxItem>>(
        `${endpoints.mail.reply(conversationId)}?${buildQueryParams({ organizationId }).toString()}`,
        payload,
      ),
    ),
  markRead: (id: string, organizationId?: string) =>
    unwrapResponse(
      apiClient.post<ApiResponse<{ updated: boolean }>>(
        `${endpoints.mail.read(id)}?${buildQueryParams({ organizationId }).toString()}`,
        {},
      ),
    ),
  star: (id: string, organizationId?: string) =>
    unwrapResponse(
      apiClient.post<ApiResponse<{ starred: boolean }>>(
        `${endpoints.mail.star(id)}?${buildQueryParams({ organizationId }).toString()}`,
        {},
      ),
    ),
  unstar: (id: string, organizationId?: string) =>
    unwrapResponse(
      apiClient.post<ApiResponse<{ starred: boolean }>>(
        `${endpoints.mail.unstar(id)}?${buildQueryParams({ organizationId }).toString()}`,
        {},
      ),
    ),
  archive: (id: string, organizationId?: string) =>
    unwrapResponse(
      apiClient.post<ApiResponse<{ archived: boolean }>>(
        `${endpoints.mail.archive(id)}?${buildQueryParams({ organizationId }).toString()}`,
        {},
      ),
    ),
  trash: (id: string, organizationId?: string) =>
    unwrapResponse(
      apiClient.post<ApiResponse<{ trashed: boolean }>>(
        `${endpoints.mail.trash(id)}?${buildQueryParams({ organizationId }).toString()}`,
        {},
      ),
    ),
  restore: (id: string, organizationId?: string) =>
    unwrapResponse(
      apiClient.post<ApiResponse<{ restored: boolean }>>(
        `${endpoints.mail.restore(id)}?${buildQueryParams({ organizationId }).toString()}`,
        {},
      ),
    ),
};
