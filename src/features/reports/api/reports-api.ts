import { apiClient, unwrapResponse } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { ApiResponse } from "@/types/api";
import type {
  AttendanceStatusPoint,
  AttendanceBatchPoint,
  AttendanceDailyTrendPoint,
  BatchStatusPoint,
  BatchCollectionPoint,
  DashboardSummary,
  EnrollmentTrendPoint,
  FeeCollectionTrendPoint,
  FeeStatusPoint,
  ReminderChannelPoint,
  ReminderDailyTrendPoint,
  ReminderStatusPoint,
  StudentBatchDistributionPoint,
  StudentStatusPoint,
  UserRoleDistributionPoint,
  UserStatusPoint,
} from "@/types/domain";

export const reportsApi = {
  summary: () => unwrapResponse(apiClient.get<ApiResponse<DashboardSummary>>(endpoints.reports.summary)),
  totalStudents: () => unwrapResponse(apiClient.get<ApiResponse<{ totalStudents: number }>>(endpoints.reports.totalStudents)),
  activeStudents: () => unwrapResponse(apiClient.get<ApiResponse<{ activeStudents: number }>>(endpoints.reports.activeStudents)),
  enrollmentTrend: () =>
    unwrapResponse(apiClient.get<ApiResponse<EnrollmentTrendPoint[]>>(endpoints.reports.enrollmentTrend)),
  studentStatusBreakdown: () =>
    unwrapResponse(apiClient.get<ApiResponse<StudentStatusPoint[]>>(endpoints.reports.studentStatusBreakdown)),
  studentBatchDistribution: () =>
    unwrapResponse(apiClient.get<ApiResponse<StudentBatchDistributionPoint[]>>(endpoints.reports.studentBatchDistribution)),
  userRoleDistribution: () =>
    unwrapResponse(apiClient.get<ApiResponse<UserRoleDistributionPoint[]>>(endpoints.reports.userRoleDistribution)),
  userStatusSummary: () =>
    unwrapResponse(apiClient.get<ApiResponse<UserStatusPoint[]>>(endpoints.reports.userStatusSummary)),
  batchStatusSummary: () =>
    unwrapResponse(apiClient.get<ApiResponse<BatchStatusPoint[]>>(endpoints.reports.batchStatusSummary)),
  monthlyFeeCollection: () =>
    unwrapResponse(apiClient.get<ApiResponse<{ monthlyFeeCollection: number }>>(endpoints.reports.monthlyFeeCollection)),
  feeCollectionTrend: () =>
    unwrapResponse(apiClient.get<ApiResponse<FeeCollectionTrendPoint[]>>(endpoints.reports.feeCollectionTrend)),
  batchCollection: () =>
    unwrapResponse(apiClient.get<ApiResponse<BatchCollectionPoint[]>>(endpoints.reports.batchCollection)),
  feeStatusBreakdown: () =>
    unwrapResponse(apiClient.get<ApiResponse<FeeStatusPoint[]>>(endpoints.reports.feeStatusBreakdown)),
  unpaidFees: () => unwrapResponse(apiClient.get<ApiResponse<{ unpaidFeeCount: number }>>(endpoints.reports.unpaidFees)),
  attendanceSummary: () =>
    unwrapResponse(apiClient.get<ApiResponse<{ presentAttendanceCount: number }>>(endpoints.reports.attendanceSummary)),
  attendanceStatusBreakdown: () =>
    unwrapResponse(apiClient.get<ApiResponse<AttendanceStatusPoint[]>>(endpoints.reports.attendanceStatusBreakdown)),
  attendanceDailyTrend: () =>
    unwrapResponse(apiClient.get<ApiResponse<AttendanceDailyTrendPoint[]>>(endpoints.reports.attendanceDailyTrend)),
  attendanceBatchSummary: () =>
    unwrapResponse(apiClient.get<ApiResponse<AttendanceBatchPoint[]>>(endpoints.reports.attendanceBatchSummary)),
  reminderChannelBreakdown: () =>
    unwrapResponse(apiClient.get<ApiResponse<ReminderChannelPoint[]>>(endpoints.reports.reminderChannelBreakdown)),
  reminderStatusBreakdown: () =>
    unwrapResponse(apiClient.get<ApiResponse<ReminderStatusPoint[]>>(endpoints.reports.reminderStatusBreakdown)),
  reminderDailyTrend: () =>
    unwrapResponse(apiClient.get<ApiResponse<ReminderDailyTrendPoint[]>>(endpoints.reports.reminderDailyTrend)),
};
