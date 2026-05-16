import { unwrapResponse } from "@/lib/api/client";
import { portalApiClient } from "@/lib/api/portal-client";
import { endpoints } from "@/lib/api/endpoints";
import type { ApiResponse } from "@/types/api";
import type { PortalAuthResponse, PortalAuthUser } from "@/types/auth";
import type { LogoutDto, PortalLoginDto, PortalRefreshTokenDto } from "@/types/dto";

export const portalAuthApi = {
  login: (payload: PortalLoginDto) =>
    unwrapResponse(portalApiClient.post<ApiResponse<PortalAuthResponse>>(endpoints.portalAuth.login, payload)),
  refresh: (payload: PortalRefreshTokenDto) =>
    unwrapResponse(portalApiClient.post<ApiResponse<PortalAuthResponse>>(endpoints.portalAuth.refresh, payload)),
  me: () => unwrapResponse(portalApiClient.get<ApiResponse<PortalAuthUser>>(endpoints.portalAuth.me)),
  logout: (payload?: LogoutDto) =>
    unwrapResponse(portalApiClient.post<ApiResponse<{ success: boolean }>>(endpoints.portalAuth.logout, payload)),
};
