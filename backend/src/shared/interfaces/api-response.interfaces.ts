export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface PaginatedApiResponse<T> extends ApiResponse<T> {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
