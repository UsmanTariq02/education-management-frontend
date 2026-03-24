"use client";

import axios, { type AxiosInstance } from "axios";
import { API_BASE_URL } from "@/lib/constants/app";
import { normalizeApiError } from "@/lib/api/errors";
import { readSession, writeSession } from "@/lib/auth/session";
import { endpoints } from "@/lib/api/endpoints";
import type { ApiResponse } from "@/types/api";
import type { AuthResponse } from "@/types/auth";
import type { RefreshTokenDto } from "@/types/dto";

let isRefreshing = false;
let refreshPromise: Promise<AuthResponse> | null = null;

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const session = readSession();
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const normalized = normalizeApiError(error);
    const axiosError = axios.isAxiosError(error) ? error : null;
    const originalRequest = axiosError?.config;
    const session = readSession();

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
          .post<ApiResponse<AuthResponse>>(`${API_BASE_URL}${endpoints.auth.refresh}`, {
            refreshToken: session.refreshToken,
          } satisfies RefreshTokenDto)
          .then((response) => {
            writeSession(response.data.data);
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
          return apiClient.request(originalRequest);
        }
      } catch {
        writeSession(null);
      }
    }

    return Promise.reject(normalized);
  },
);

export async function unwrapResponse<T>(promise: Promise<{ data: ApiResponse<T> }>) {
  const response = await promise;
  return response.data.data;
}
