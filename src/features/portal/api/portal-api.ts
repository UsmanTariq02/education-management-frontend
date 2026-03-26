import { unwrapResponse } from "@/lib/api/client";
import { portalApiClient } from "@/lib/api/portal-client";
import { endpoints } from "@/lib/api/endpoints";
import type { ApiResponse } from "@/types/api";
import type { PortalDashboard } from "@/types/domain";

export const portalApi = {
  dashboard: () =>
    unwrapResponse(portalApiClient.get<ApiResponse<PortalDashboard>>(endpoints.portal.dashboard)),
};
