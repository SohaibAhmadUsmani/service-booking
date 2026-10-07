export interface ValidationErrorDetail {
  field: string;
  message: string;
  code?: string;
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data?: T;
  message?: string;
}

export interface ApiFailureResponse {
  success: false;
  error: string;
  statusCode?: number;
  details?: ValidationErrorDetail[] | unknown;
  message?: string;
  data?: undefined;
}

/**
 * Standard unified API response wrapper (discriminated union on success).
 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiFailureResponse;

/**
 * Standard API error response shape.
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  statusCode?: number;
  details?: ValidationErrorDetail[] | unknown;
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
