import { apiClient, unwrapResponse } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { buildQueryParams } from "@/lib/api/query-utils";
import type { ApiResponse } from "@/types/api";
import type {
  AiAdmissionExtraction,
  AiAttendanceIntervention,
  AiFeeCollectionPlan,
  AiMailDraft,
  AiNoticeDraft,
  AiReminderDraft,
  NoticeCampaignAnalytics,
  AnnouncementDeliveryAnalytics,
  AiReviewItem,
  AiReviewQueueSummary,
  AiOrganizationQueueSummary,
  AiOrganizationQueueTrendPoint,
  NoticeCampaignSummary,
  AiStudentRiskRecommendation,
  AiUsageSummary,
  AiSupportReply,
} from "@/types/domain";
import type {
  GenerateAttendanceInterventionAiDto,
  GenerateFeeCollectionPlanAiDto,
  ExtractAdmissionFormAiDto,
  GenerateMailDraftAiDto,
  GenerateNoticeAiDto,
  GenerateReminderDraftAiDto,
  GenerateStudentRiskRecommendationAiDto,
  GenerateSupportReplyAiDto,
  ScheduleNoticeCampaignAiDto,
  SaveAiReviewQueueDto,
} from "@/types/dto";

export const aiApi = {
  generateNotice: (payload: GenerateNoticeAiDto) =>
    unwrapResponse(apiClient.post<ApiResponse<AiNoticeDraft>>(endpoints.ai.notices, payload)),
  listNoticeCampaigns: (organizationId?: string) =>
    unwrapResponse(
      apiClient.get<ApiResponse<NoticeCampaignSummary[]>>(
        organizationId
          ? `${endpoints.ai.noticeCampaigns}?${buildQueryParams({ organizationId }).toString()}`
          : endpoints.ai.noticeCampaigns,
      ),
    ),
  noticeCampaignAnalytics: (organizationId?: string) =>
    unwrapResponse(
      apiClient.get<ApiResponse<NoticeCampaignAnalytics>>(
        organizationId ? `${endpoints.ai.noticeCampaignAnalytics}?${buildQueryParams({ organizationId }).toString()}` : endpoints.ai.noticeCampaignAnalytics,
      ),
    ),
  announcementDeliveryAnalytics: (organizationId?: string) =>
    unwrapResponse(
      apiClient.get<ApiResponse<AnnouncementDeliveryAnalytics>>(
        organizationId ? `${endpoints.ai.noticeDeliveryAnalytics}?${buildQueryParams({ organizationId }).toString()}` : endpoints.ai.noticeDeliveryAnalytics,
      ),
    ),
  reviewQueue: (organizationId?: string, userId?: string) =>
    unwrapResponse(
      apiClient.get<ApiResponse<AiReviewItem[]>>(
        (() => {
          const params = buildQueryParams({
            ...(organizationId ? { organizationId } : {}),
            ...(userId ? { userId } : {}),
          });
          const query = params.toString();
          return query ? `${endpoints.ai.reviewQueue}?${query}` : endpoints.ai.reviewQueue;
        })(),
      ),
    ),
  reviewQueueSummary: (organizationId?: string, userId?: string) =>
    unwrapResponse(
      apiClient.get<ApiResponse<AiReviewQueueSummary>>(
        (() => {
          const params = buildQueryParams({
            ...(organizationId ? { organizationId } : {}),
            ...(userId ? { userId } : {}),
          });
          const query = params.toString();
          return query ? `${endpoints.ai.reviewQueueSummary}?${query}` : endpoints.ai.reviewQueueSummary;
        })(),
      ),
    ),
  organizationQueueSummary: (organizationId?: string) =>
    unwrapResponse(
      apiClient.get<ApiResponse<AiOrganizationQueueSummary>>(
        organizationId
          ? `${endpoints.ai.organizationQueueSummary}?${buildQueryParams({ organizationId }).toString()}`
          : endpoints.ai.organizationQueueSummary,
      ),
    ),
  organizationQueueTrend: (organizationId?: string) =>
    unwrapResponse(
      apiClient.get<ApiResponse<AiOrganizationQueueTrendPoint[]>>(
        organizationId ? `${endpoints.ai.organizationQueueTrend}?${buildQueryParams({ organizationId }).toString()}` : endpoints.ai.organizationQueueTrend,
      ),
    ),
  saveReviewQueue: (payload: SaveAiReviewQueueDto, organizationId?: string) =>
    unwrapResponse(
      apiClient.post<ApiResponse<AiReviewItem[]>>(
        organizationId ? `${endpoints.ai.reviewQueue}?${buildQueryParams({ organizationId }).toString()}` : endpoints.ai.reviewQueue,
        payload,
      ),
    ),
  scheduleNoticeCampaign: (payload: ScheduleNoticeCampaignAiDto) =>
    unwrapResponse(apiClient.post<ApiResponse<NoticeCampaignSummary>>(endpoints.ai.scheduleNoticeCampaign, payload)),
  generateMailDraft: (payload: GenerateMailDraftAiDto) =>
    unwrapResponse(apiClient.post<ApiResponse<AiMailDraft>>(endpoints.ai.mailDraft, payload)),
  generateSupportReply: (payload: GenerateSupportReplyAiDto) =>
    unwrapResponse(apiClient.post<ApiResponse<AiSupportReply>>(endpoints.ai.supportReply, payload)),
  extractAdmissionForm: (payload: ExtractAdmissionFormAiDto) =>
    unwrapResponse(apiClient.post<ApiResponse<AiAdmissionExtraction>>(endpoints.ai.admissionExtract, payload)),
  generateStudentRiskRecommendation: (payload: GenerateStudentRiskRecommendationAiDto) =>
    unwrapResponse(apiClient.post<ApiResponse<AiStudentRiskRecommendation>>(endpoints.ai.studentRiskRecommendation, payload)),
  generateFeeCollectionPlan: (payload: GenerateFeeCollectionPlanAiDto) =>
    unwrapResponse(apiClient.post<ApiResponse<AiFeeCollectionPlan>>(endpoints.ai.feeCollectionPlan, payload)),
  generateAttendanceIntervention: (payload: GenerateAttendanceInterventionAiDto) =>
    unwrapResponse(apiClient.post<ApiResponse<AiAttendanceIntervention>>(endpoints.ai.attendanceIntervention, payload)),
  generateReminderDraft: (payload: GenerateReminderDraftAiDto) =>
    unwrapResponse(apiClient.post<ApiResponse<AiReminderDraft>>(endpoints.ai.reminderDraft, payload)),
  getUsage: (organizationId?: string) =>
    unwrapResponse(
      apiClient.get<ApiResponse<AiUsageSummary>>(
        organizationId ? `${endpoints.ai.usage}?${buildQueryParams({ organizationId }).toString()}` : endpoints.ai.usage,
      ),
    ),
};
