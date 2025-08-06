// store/services/api.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { IUser } from '@/models/UserModel';
import { IAdminOffer, IOfferInput, IOfferResponse } from '@/types/offer';

const baseQuery = fetchBaseQuery({ 
  baseUrl: '/api/',
  prepareHeaders: (headers) => {
    return headers;
  },
});

export const api = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['Product', 'Category', 'Order', 'User', 'Review', 'Offer'],
  endpoints: (builder) => ({
    // Product Endpoints
    getProducts: builder.query<any[], void>({
      query: () => 'products',
      providesTags: ['Product'],
    }),
    getProductById: builder.query<any, string>({
      query: (id) => `products/${id}`,
      providesTags: (result, error, id) => [{ type: 'Product', id }],
    }),
    getProductBySlug: builder.query<any, string>({
      query: (slug) => `products/slug/${slug}`,
      providesTags: (result, error, slug) => [{ type: 'Product', id: slug }],
    }),
    createProduct: builder.mutation<any, any>({
      query: (product) => ({
        url: 'products',
        method: 'POST',
        body: product,
      }),
      invalidatesTags: ['Product'],
    }),
    updateProduct: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `products/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Product'],
    }),
    deleteProduct: builder.mutation<any, string>({
      query: (id) => ({
        url: `products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Product'],
    }),

    // Category Endpoints
    getCategories: builder.query<any[], void>({
      query: () => 'categories',
      providesTags: ['Category'],
    }),
    createCategory: builder.mutation<any, any>({
      query: (category) => ({
        url: 'categories',
        method: 'POST',
        body: category,
      }),
      invalidatesTags: ['Category'],
    }),
    updateCategory: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `categories/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Category'],
    }),

    // Order Endpoints
    createOrder: builder.mutation<any, any>({
      query: (order) => ({
        url: 'orders',
        method: 'POST',
        body: order,
      }),
      invalidatesTags: ['Order'],
    }),
    getMyOrders: builder.query<any[], void>({
      query: () => 'orders/mine',
      providesTags: ['Order'],
    }),
    getOrderById: builder.query<any, string>({
      query: (id) => `orders/${id}`,
      providesTags: (result, error, id) => [{ type: 'Order', id }],
    }),
    getOrders: builder.query<any[], void>({
      query: () => 'orders',
      providesTags: ['Order'],
    }),
    updateOrder: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `orders/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Order'],
    }),

    // Review Endpoints
    getReviews: builder.query<any[], void>({
      query: () => 'reviews',
      providesTags: ['Review'],
    }),
    submitReview: builder.mutation<any, any>({
      query: (reviewData) => ({
        url: 'reviews',
        method: 'POST',
        body: reviewData,
      }),
      invalidatesTags: ['Review'],
    }),
    updateReview: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `reviews/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Review'],
    }),
    getFeaturedReview: builder.query<any, string>({
      query: (productId) => `products/${productId}/featured-review`,
      providesTags: (result, error, productId) => [{ type: 'Review', id: `featured-${productId}` }],
    }),

    // Offer Endpoints
    getActiveOffers: builder.query<IOfferResponse[], void>({
      query: () => 'offers/active',
      providesTags: ['Offer'],
    }),
    getAdminOffers: builder.query<IAdminOffer[], void>({
      query: () => 'admin/offers',
      providesTags: ['Offer'],
    }),
    getOfferById: builder.query<IAdminOffer, string>({
      query: (id) => `admin/offers/${id}`,
      providesTags: (result, error, id) => [{ type: 'Offer', id }],
    }),
    createOffer: builder.mutation<IAdminOffer, IOfferInput>({
      query: (data) => ({
        url: 'admin/offers',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Offer'],
    }),
    updateOffer: builder.mutation<IAdminOffer, { id: string; data: Partial<IOfferInput> }>({
      query: ({ id, data }) => ({
        url: `admin/offers/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Offer', id },
        { type: 'Offer', id: 'LIST' },
      ],
    }),
    deleteOffer: builder.mutation<void, string>({
      query: (id) => ({
        url: `admin/offers/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Offer'],
    }),

    // User Endpoints
    getUsers: builder.query<any[], void>({
      query: () => 'users',
      providesTags: ['User'],
    }),
    deleteUser: builder.mutation<any, string>({
      query: (id) => ({
        url: `users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),
    updateUserProfile: builder.mutation<any, any>({
      query: (data) => ({
        url: 'user/profile',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductByIdQuery,
  useGetProductBySlugQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useCreateOrderMutation,
  useGetMyOrdersQuery,
  useGetOrderByIdQuery,
  useGetOrdersQuery,
  useUpdateOrderMutation,
  useGetReviewsQuery,
  useSubmitReviewMutation,
  useUpdateReviewMutation,
  useGetFeaturedReviewQuery,
  useGetUsersQuery,
  useDeleteUserMutation,
  useUpdateUserProfileMutation,
  useGetActiveOffersQuery,
  useGetAdminOffersQuery,
  useGetOfferByIdQuery,
  useCreateOfferMutation,
  useUpdateOfferMutation,
  useDeleteOfferMutation,
} = api;