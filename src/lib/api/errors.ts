import axios from "axios";
import type { ApiErrorShape } from "@/types/api";

export class AppError extends Error {
  statusCode: number;
  details: Array<{ field: string; message: string }>;

  constructor(message: string, statusCode = 500, details: Array<{ field: string; message: string }> = []) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function normalizeApiError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as ApiErrorShape | undefined;
    const message = Array.isArray(payload?.message)
      ? payload.message.join(", ")
      : payload?.message ?? error.message ?? "Request failed";

    return new AppError(message, error.response?.status ?? 500, payload?.details ?? []);
  }

  if (error instanceof AppError) {
    return error;
  }

  return new AppError("Something went wrong. Please try again.");
}
