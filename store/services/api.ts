// store/services/api.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { z } from 'zod';
import type { 
  ProductResponse,
  ApiError,
  CartItem,
  Review
} from '@/types/api';
import { 
  productResponseSchema, 
  productSchema, 
  cartItemSchema, 
  reviewSchema,
  isApiError 
} from '@/types/api';

// Re-export types for backward compatibility
type IProduct = z.infer<typeof productSchema>;
type ICategory = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
};

type IOrder = {
  _id: string;
  user: string;
  orderItems: Array<{
    _id: string;
    name: string;
    qty: number;
    image: string;
    price: number;
    product: string;
  }>;
  shippingAddress: {
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  paymentMethod: string;
  paymentResult?: {
    id: string;
    status: string;
    update_time: string;
    email_address: string;
  };
  itemsPrice: number;
  taxPrice: number;
  shippingPrice: number;
  totalPrice: number;
  isPaid: boolean;
  paidAt?: string;
  isDelivered: boolean;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
};

// Helper to handle RTK Query errors
const handleQueryError = (error: unknown): { error: ApiError } => {
  if (isApiError(error)) {
    return { error };
  }
  return {
    error: {
      status: 500,
      data: {
        message: 'An unknown error occurred',
        statusCode: 500,
      },
    },
  };
};

// Base query
const baseQuery = fetchBaseQuery({ 
  baseUrl: '/api/',
  prepareHeaders: (headers) => {
    return headers;
  },
});

export const api = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['Product', 'Category', 'Order', 'User', 'Review'],
  endpoints: (builder) => ({
    // Product Endpoints
    getProducts: builder.query<IProduct[], void>({
      query: () => 'products',
      providesTags: (result = []) => [
        'Product',
        ...result.map(({ _id }) => ({ type: 'Product' as const, id: _id })),
      ],
    }),
    getProductById: builder.query<IProduct, string>({
      query: (id) => `products/${id}`,
      providesTags: (result, error, id) => [{ type: 'Product', id }],
    }),
    getProductBySlug: builder.query<ProductResponse, string>({
      query: (slug) => `products/slug/${slug}`,
      providesTags: (result, error, slug) => [
        { 
          type: 'Product' as const, 
          id: result?.product?._id?.toString() || slug,
        },
      ],
    }),

    // Category Endpoints
    getCategories: builder.query<ICategory[], void>({
      query: () => 'categories',
      providesTags: ['Category'],
    }),

    // Order Endpoints
    createOrder: builder.mutation<IOrder, Partial<IOrder>>({
      query: (order) => ({
        url: 'orders',
        method: 'POST',
        body: order,
      }),
      invalidatesTags: [{ type: 'Product', id: 'LIST' }], // Invalidate product list to update stock
    }),
    getMyOrders: builder.query<IOrder[], void>({
      query: () => 'orders/mine',
      providesTags: ['Order'],
    }),
    getOrderById: builder.query<IOrder, string>({
      query: (id) => `orders/${id}`,
      providesTags: (result, error, id) => [{ type: 'Order', id }],
    }),

    // Product CRUD Mutations
    createProduct: builder.mutation<IProduct, Partial<IProduct>>({
      query: (product) => ({
        url: 'products',
        method: 'POST',
        body: product,
      }),
      invalidatesTags: [{ type: 'Product', id: 'LIST' }],
    }),
    updateProduct: builder.mutation<IProduct, { id: string; data: Partial<IProduct> }>({
      query: ({ id, data }) => ({
        url: `products/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Product', id: 'LIST' },
        { type: 'Product', id },
      ],
    }),
    deleteProduct: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Product', id: 'LIST' }],
    }),

    // Order Management Endpoints
    getOrders: builder.query<IOrder[], void>({
      query: () => 'orders',
      providesTags: ['Order'],
    }),
    updateOrder: builder.mutation<IOrder, { id: string; data: { isPaid?: boolean; isDelivered?: boolean } }>({
      query: ({ id, data }) => ({
        url: `orders/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Order'],
    }),

    // User Management Endpoints
    getUsers: builder.query<any[], void>({
      query: () => 'users',
      providesTags: ['User'],
    }),
    deleteUser: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),

    // Review Endpoints
    submitReview: builder.mutation({
      query: (reviewData) => ({
        url: 'reviews',
        method: 'POST',
        body: reviewData,
      }),
      invalidatesTags: (result, error, { productId }) => [
        { type: 'Product', id: productId },
      ],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useGetProductsQuery,
  useGetProductByIdQuery,
  useGetProductBySlugQuery,
  useGetCategoriesQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useCreateOrderMutation,
  useGetMyOrdersQuery,
  useGetOrderByIdQuery,
  useGetOrdersQuery,
  useUpdateOrderMutation,
  useGetUsersQuery,
  useDeleteUserMutation,
  useSubmitReviewMutation,
} = api;