/**
 * Standard unified API response wrapper.
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: unknown;
}

/**
 * Standard API error response shape.
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  statusCode?: number;
  details?: unknown;
}

/**
 * Common pagination query parameters.
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Paginated response container.
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
