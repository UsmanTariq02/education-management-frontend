import { unwrapResponse } from "@/lib/api/client";
import { portalApiClient } from "@/lib/api/portal-client";
import { endpoints } from "@/lib/api/endpoints";
import { buildQueryParams } from "@/lib/api/query-utils";
import type { ApiResponse, PaginationParams } from "@/types/api";
import type { CreateMailMessageDto, ReplyMailMessageDto, UpdateMailDraftDto } from "@/types/dto";
import type { MailContact, MailConversationDetail, MailMailboxItem, MailMailboxResponse } from "@/types/domain";

export const portalMailApi = {
  contacts: (search?: string) =>
    unwrapResponse(
      portalApiClient.get<ApiResponse<MailContact[]>>(`${endpoints.portalMail.contacts}?${buildQueryParams({ search }).toString()}`),
    ),
  mailbox: (params: PaginationParams & { folder?: string }) =>
    unwrapResponse(
      portalApiClient.get<ApiResponse<MailMailboxResponse>>(`${endpoints.portalMail.list}?${buildQueryParams(params).toString()}`),
    ),
  conversation: (conversationId: string) =>
    unwrapResponse(portalApiClient.get<ApiResponse<MailConversationDetail>>(endpoints.portalMail.conversation(conversationId))),
  create: (payload: CreateMailMessageDto) =>
    unwrapResponse(portalApiClient.post<ApiResponse<MailMailboxItem>>(endpoints.portalMail.list, payload)),
  updateDraft: (id: string, payload: UpdateMailDraftDto) =>
    unwrapResponse(portalApiClient.patch<ApiResponse<MailMailboxItem>>(endpoints.portalMail.detail(id), payload)),
  sendDraft: (id: string) => unwrapResponse(portalApiClient.post<ApiResponse<MailMailboxItem>>(endpoints.portalMail.send(id), {})),
  reply: (conversationId: string, payload: ReplyMailMessageDto) =>
    unwrapResponse(portalApiClient.post<ApiResponse<MailMailboxItem>>(endpoints.portalMail.reply(conversationId), payload)),
  markRead: (id: string) => unwrapResponse(portalApiClient.post<ApiResponse<{ updated: boolean }>>(endpoints.portalMail.read(id), {})),
  star: (id: string) => unwrapResponse(portalApiClient.post<ApiResponse<{ starred: boolean }>>(endpoints.portalMail.star(id), {})),
  unstar: (id: string) => unwrapResponse(portalApiClient.post<ApiResponse<{ starred: boolean }>>(endpoints.portalMail.unstar(id), {})),
  archive: (id: string) => unwrapResponse(portalApiClient.post<ApiResponse<{ archived: boolean }>>(endpoints.portalMail.archive(id), {})),
  trash: (id: string) => unwrapResponse(portalApiClient.post<ApiResponse<{ trashed: boolean }>>(endpoints.portalMail.trash(id), {})),
  restore: (id: string) => unwrapResponse(portalApiClient.post<ApiResponse<{ restored: boolean }>>(endpoints.portalMail.restore(id), {})),
};
