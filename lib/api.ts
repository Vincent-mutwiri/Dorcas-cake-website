import { ApiError, ApiResponse, handleApiResponse } from '@/types/api';
import { z } from 'zod';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

type RequestOptions = {
  headers?: Record<string, string>;
  params?: Record<string, string | number>;
  signal?: AbortSignal;
};

export async function apiRequest<T>(
  endpoint: string,
  schema: z.ZodType<T>,
  options: RequestInit & RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { params, ...fetchOptions } = options;
  
  // Build URL with query parameters
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  try {
    const response = await fetch(url.toString(), {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    });

    return await handleApiResponse(response, schema);
  } catch (error) {
    if (error instanceof Error) {
      throw {
        status: 500,
        data: {
          message: error.message,
          statusCode: 500,
        },
      };
    }
    throw error;
  }
}

// Generic API hooks
export function createApiHook<T, P extends any[] = []>(
  queryKey: string,
  fetcher: (...args: P) => Promise<ApiResponse<T>>,
  options?: {
    enabled?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: ApiError) => void;
  }
) {
  return {
    queryKey: [queryKey],
    queryFn: async (...args: P) => {
      try {
        const response = await fetcher(...args);
        if (options?.onSuccess) {
          options.onSuccess(response.data);
        }
        return response.data;
      } catch (error) {
        if (options?.onError && isApiError(error)) {
          options.onError(error);
        }
        throw error;
      }
    },
    enabled: options?.enabled !== false,
  };
}

// Helper function to check if error is an API error
function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    'data' in error &&
    typeof (error as ApiError).data.message === 'string'
  );
}

// Example usage:
/*
const useProductBySlug = (slug: string) => {
  return useQuery({
    ...createApiHook(
      ['product', slug],
      () => apiRequest(`/products/${slug}`, productResponseSchema)
    ),
    // Additional React Query options
    retry: 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
*/
