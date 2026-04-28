export interface ApiResponse<T> {
  message: string;
  content: T;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  message: string;
  content: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
