import { apiClient, unwrapResponse } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { ApiResponse, PaginatedResult } from "@/types/api";
import type {
  CreateOnlineClassSessionDto,
  OnlineClassParticipantInputDto,
  UpsertOnlineClassProviderSettingDto,
  UpdateOnlineClassSessionDto,
} from "@/types/dto";
import type { OnlineClassAlert, OnlineClassAutomationSummary, OnlineClassProviderSetting, OnlineClassSession } from "@/types/domain";

export const onlineClassesApi = {
  list: (params?: Record<string, string | number | undefined>) =>
    unwrapResponse(apiClient.get<ApiResponse<PaginatedResult<OnlineClassSession>>>(endpoints.onlineClasses.list, { params })),
  detail: (id: string) =>
    unwrapResponse(apiClient.get<ApiResponse<OnlineClassSession>>(endpoints.onlineClasses.detail(id))),
  getProviderSettings: () =>
    unwrapResponse(apiClient.get<ApiResponse<OnlineClassProviderSetting>>(endpoints.onlineClasses.providerSettings)),
  getAutomationSummary: () =>
    unwrapResponse(apiClient.get<ApiResponse<OnlineClassAutomationSummary>>(endpoints.onlineClasses.automationSummary)),
  getAlerts: () =>
    unwrapResponse(apiClient.get<ApiResponse<OnlineClassAlert[]>>(endpoints.onlineClasses.alerts)),
  upsertProviderSettings: (payload: UpsertOnlineClassProviderSettingDto) =>
    unwrapResponse(apiClient.patch<ApiResponse<OnlineClassProviderSetting>>(endpoints.onlineClasses.providerSettings, payload)),
  create: (payload: CreateOnlineClassSessionDto) =>
    unwrapResponse(apiClient.post<ApiResponse<OnlineClassSession>>(endpoints.onlineClasses.list, payload)),
  update: (id: string, payload: UpdateOnlineClassSessionDto) =>
    unwrapResponse(apiClient.patch<ApiResponse<OnlineClassSession>>(endpoints.onlineClasses.detail(id), payload)),
  generateMeet: (id: string) =>
    unwrapResponse(apiClient.post<ApiResponse<OnlineClassSession>>(endpoints.onlineClasses.generateMeet(id))),
  syncGoogleMeet: (id: string) =>
    unwrapResponse(apiClient.post<ApiResponse<OnlineClassSession>>(endpoints.onlineClasses.syncGoogleMeet(id))),
  runAutomation: () =>
    unwrapResponse(
      apiClient.post<ApiResponse<{ generatedCount: number; syncedCount: number; attendanceProcessedCount: number }>>(
        endpoints.onlineClasses.runAutomation,
      ),
    ),
  upsertParticipants: (id: string, participants: OnlineClassParticipantInputDto[]) =>
    unwrapResponse(
      apiClient.post<ApiResponse<OnlineClassSession>>(endpoints.onlineClasses.participants(id), { participants }),
    ),
  processAttendance: (id: string) =>
    unwrapResponse(apiClient.post<ApiResponse<{ createdCount: number; skippedCount: number }>>(endpoints.onlineClasses.processAttendance(id))),
};
