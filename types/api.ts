import { z } from 'zod';
import { IProduct } from '@/models/ProductModel';

// Base API Response Type
export type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  statusCode?: number;
};

// Error Response Type
export type ApiError = {
  status: number;
  data: {
    message: string;
    error?: string;
    statusCode?: number;
  };
};

// Review Schema
export const reviewSchema = z.object({
  _id: z.string(),
  user: z.string(),
  product: z.string(), // Added product ID
  name: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string(),
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'), // Added status
  isFeatured: z.boolean().default(false), // Added isFeatured
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Review = z.infer<typeof reviewSchema>;

export const categorySchema = z.object({
  _id: z.string(),
  name: z.string(),
  slug: z.string(),
});

// Product Schema
export const productSchema = z.object({
  _id: z.string(),
  name: z.string(),
  slug: z.string(),
  price: z.number(),
  images: z.array(z.string()),
  stock: z.number(),
  rating: z.number().optional().default(0),
  numReviews: z.number().optional().default(0),
  description: z.string(),
  category: categorySchema, // Use the category schema here
  isFeatured: z.boolean().optional().default(false),
  featuredImage: z.string().optional(),
  details: z.record(z.string(), z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
  variants: z.array(z.object({
    name: z.string(),
    options: z.array(z.object({
      name: z.string(),
      price: z.number().optional(),
      stock: z.number().optional(),
    })),
  })).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  __v: z.number().optional(),
});

// Type for MongoDB document with methods
export type ProductDocument = z.infer<typeof productSchema> & {
  $assertPopulated?(): Promise<void>;
  $clone?(): ProductDocument;
  $ignore?(path: string): void;
  $isDefault?(path: string): boolean;
  $isDeleted?: boolean;
  $isEmpty?(path: string): boolean;
  $isModified?(path?: string): boolean;
  $isNew?: boolean;
  $isSelected?(path: string): boolean;
  $locals?: Record<string, unknown>;
  $markModified?(path: string): void;
  $op?: string;
  $parent?: unknown;
  $session?(session: unknown): void;
  $set?(path: string, value: unknown): void;
  $where?: unknown;
};

// Product Response Schema
export const productResponseSchema = z.object({
  product: productSchema,
  reviews: z.array(reviewSchema),
});

export type ProductResponse = z.infer<typeof productResponseSchema>;

// Cart Item Schema
export const cartItemSchema = z.object({
  _id: z.string(),
  name: z.string(),
  price: z.number().positive(),
  image: z.string().url(),
  countInStock: z.number().int().nonnegative(),
  qty: z.number().int().positive(),
});

export type CartItem = z.infer<typeof cartItemSchema>;

// API Error Type Guard
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    'data' in error &&
    typeof (error as ApiError).data.message === 'string'
  );
}

// API Response Handler
export async function handleApiResponse<T>(
  response: Response,
  schema: z.ZodType<T>
): Promise<ApiResponse<T>> {
  const data = await response.json();
  
  if (!response.ok) {
    throw {
      status: response.status,
      data: {
        message: data.message || 'An error occurred',
        error: data.error,
        statusCode: response.status,
      },
    };
  }

  const result = schema.safeParse(data);
  
  if (!result.success) {
    console.error('Validation error:', result.error);
    throw {
      status: response.status,
      data: {
        message: 'Invalid response format',
        error: result.error.message,
        statusCode: 500,
      },
    };
  }

  return {
    success: true,
    data: result.data,
  };
}
