export type SortOrder = "asc" | "desc";

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: SortOrder;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiValidationIssue {
  field: string;
  message: string;
}

export interface ApiErrorShape {
  statusCode?: number;
  message?: string | string[];
  error?: string;
  details?: ApiValidationIssue[];
}
