import { apiClient, unwrapResponse } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { ApiResponse } from "@/types/api";
import type { AuthResponse, AuthUser } from "@/types/auth";
import type { LoginDto, LogoutDto, RefreshTokenDto } from "@/types/dto";

export const authApi = {
  login: (payload: LoginDto) =>
    unwrapResponse(apiClient.post<ApiResponse<AuthResponse>>(endpoints.auth.login, payload)),
  refresh: (payload: RefreshTokenDto) =>
    unwrapResponse(apiClient.post<ApiResponse<AuthResponse>>(endpoints.auth.refresh, payload)),
  me: () => unwrapResponse(apiClient.get<ApiResponse<AuthUser>>(endpoints.auth.me)),
  logout: (payload?: LogoutDto) =>
    unwrapResponse(apiClient.post<ApiResponse<{ success: boolean }>>(endpoints.auth.logout, payload)),
};
