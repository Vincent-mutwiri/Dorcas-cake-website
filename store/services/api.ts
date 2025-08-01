// store/services/api.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { IProduct } from '@/models/ProductModel';
import { ICategory } from '@/models/CategoryModel';
import { IOrder } from '@/models/OrderModel';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Product', 'Order', 'Category', 'User'],
  endpoints: (builder) => ({
    // Product Endpoints
    getProducts: builder.query<IProduct[], void>({
      query: () => 'products',
      providesTags: (result) =>
        result
          ? [
              ...result.map((product) => ({ 
                type: 'Product' as const, 
                id: (product as any)._id?.toString() || '' 
              })),
              { type: 'Product' as const, id: 'LIST' },
            ]
          : [{ type: 'Product' as const, id: 'LIST' }],
    }),
    getProductById: builder.query<{ product: IProduct; reviews: any[] }, string>({
      query: (id) => `products/${id}`,
      providesTags: (result, error, id) => [{ type: 'Product', id }],
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
  useGetCategoriesQuery,
  useCreateOrderMutation,
  useGetMyOrdersQuery,
  useGetOrderByIdQuery,
  useSubmitReviewMutation,
} = api;