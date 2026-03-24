import { apiClient, unwrapResponse } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { buildQueryParams } from "@/lib/api/query-utils";
import type { ApiResponse, PaginatedResult, PaginationParams } from "@/types/api";
import type { ActivityLog } from "@/types/domain";

export interface ActivityLogParams extends PaginationParams {
  module?: string;
  action?: string;
  actorUserId?: string;
  targetId?: string;
}

export const activityLogsApi = {
  list: (params: ActivityLogParams) =>
    unwrapResponse(
      apiClient.get<ApiResponse<PaginatedResult<ActivityLog>>>(
        `${endpoints.activityLogs.list}?${buildQueryParams(params as Record<string, string | number | undefined>).toString()}`,
      ),
    ),
};
