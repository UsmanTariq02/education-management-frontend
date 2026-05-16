import { apiClient, unwrapResponse } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { buildQueryParams } from "@/lib/api/query-utils";
import type { ApiResponse, PaginatedResult, PaginationParams } from "@/types/api";
import type {
  BulkDeleteDto,
  CreateReminderLogDto,
  CreateReminderRuleDto,
  CreateReminderTemplateDto,
  UpdateReminderLogDto,
  UpdateReminderRuleDto,
  UpdateReminderTemplateDto,
  UpsertReminderProviderSettingDto,
} from "@/types/dto";
import type { ReminderLog, ReminderProviderSetting, ReminderRule, ReminderTemplate } from "@/types/domain";

export const remindersApi = {
  list: (params: PaginationParams) =>
    unwrapResponse(
      apiClient.get<ApiResponse<PaginatedResult<ReminderLog>>>(`${endpoints.reminders.list}?${buildQueryParams(params).toString()}`),
    ),
  create: (payload: CreateReminderLogDto) =>
    unwrapResponse(apiClient.post<ApiResponse<ReminderLog>>(endpoints.reminders.list, payload)),
  update: (id: string, payload: UpdateReminderLogDto) =>
    unwrapResponse(apiClient.patch<ApiResponse<ReminderLog>>(endpoints.reminders.detail(id), payload)),
  remove: (id: string) =>
    unwrapResponse(apiClient.delete<ApiResponse<{ deleted: boolean }>>(endpoints.reminders.detail(id))),
  bulkRemove: (ids: string[]) =>
    unwrapResponse(
      apiClient.post<ApiResponse<{ deletedCount: number }>>(endpoints.reminders.bulkDelete, { ids } satisfies BulkDeleteDto),
    ),
  listTemplates: (params: PaginationParams) =>
    unwrapResponse(
      apiClient.get<ApiResponse<PaginatedResult<ReminderTemplate>>>(
        `${endpoints.reminders.templates}?${buildQueryParams(params).toString()}`,
      ),
    ),
  createTemplate: (payload: CreateReminderTemplateDto) =>
    unwrapResponse(apiClient.post<ApiResponse<ReminderTemplate>>(endpoints.reminders.templates, payload)),
  resetDefaultTemplates: () =>
    unwrapResponse(
      apiClient.post<
        ApiResponse<{ reset: boolean; templatesCreated: number; templatesUpdated: number; rulesCreated: number }>
      >(endpoints.reminders.resetDefaultTemplates, {}),
    ),
  updateTemplate: (id: string, payload: UpdateReminderTemplateDto) =>
    unwrapResponse(apiClient.patch<ApiResponse<ReminderTemplate>>(endpoints.reminders.templateDetail(id), payload)),
  listRules: (params: PaginationParams) =>
    unwrapResponse(
      apiClient.get<ApiResponse<PaginatedResult<ReminderRule>>>(`${endpoints.reminders.rules}?${buildQueryParams(params).toString()}`),
    ),
  createRule: (payload: CreateReminderRuleDto) =>
    unwrapResponse(apiClient.post<ApiResponse<ReminderRule>>(endpoints.reminders.rules, payload)),
  updateRule: (id: string, payload: UpdateReminderRuleDto) =>
    unwrapResponse(apiClient.patch<ApiResponse<ReminderRule>>(endpoints.reminders.ruleDetail(id), payload)),
  getProviderSettings: () =>
    unwrapResponse(apiClient.get<ApiResponse<ReminderProviderSetting>>(endpoints.reminders.providerSettings)),
  upsertProviderSettings: (payload: UpsertReminderProviderSettingDto) =>
    unwrapResponse(apiClient.patch<ApiResponse<ReminderProviderSetting>>(endpoints.reminders.providerSettings, payload)),
  processDue: () =>
    unwrapResponse(apiClient.post<ApiResponse<{ processed: boolean }>>(endpoints.reminders.processDue, {})),
};
