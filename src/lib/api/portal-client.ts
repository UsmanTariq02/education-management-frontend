"use client";

import axios, { type AxiosInstance } from "axios";
import { API_BASE_URL } from "@/lib/constants/app";
import { normalizeApiError } from "@/lib/api/errors";
import { endpoints } from "@/lib/api/endpoints";
import { readPortalSession, writePortalSession } from "@/lib/auth/portal-session";
import type { ApiResponse } from "@/types/api";
import type { PortalAuthResponse } from "@/types/auth";
import type { PortalRefreshTokenDto } from "@/types/dto";

let isRefreshing = false;
let refreshPromise: Promise<PortalAuthResponse> | null = null;

export const portalApiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

portalApiClient.interceptors.request.use((config) => {
  const session = readPortalSession();
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});

portalApiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const normalized = normalizeApiError(error);
    const axiosError = axios.isAxiosError(error) ? error : null;
    const originalRequest = axiosError?.config;
    const session = readPortalSession();

    if (
      normalized.statusCode === 401 &&
      session?.refreshToken &&
      originalRequest &&
      !originalRequest.headers["x-retry-auth"]
    ) {
      originalRequest.headers["x-retry-auth"] = "true";

      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = axios
          .post<ApiResponse<PortalAuthResponse>>(`${API_BASE_URL}${endpoints.portalAuth.refresh}`, {
            refreshToken: session.refreshToken,
          } satisfies PortalRefreshTokenDto)
          .then((response) => {
            writePortalSession(response.data.data);
            return response.data.data;
          })
          .finally(() => {
            isRefreshing = false;
          });
      }

      try {
        const refreshed = await refreshPromise;
        if (refreshed) {
          originalRequest.headers.Authorization = `Bearer ${refreshed.accessToken}`;
          return portalApiClient.request(originalRequest);
        }
      } catch {
        writePortalSession(null);
      }
    }

    return Promise.reject(normalized);
  },
);
