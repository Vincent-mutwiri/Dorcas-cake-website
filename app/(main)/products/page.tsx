// app/(main)/products/page.tsx
'use client';

import { useGetProductsQuery } from '@/store/services/api';
import ProductCard from '@/components/product/ProductCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function ProductsPage() {
  const { data: products, isLoading, error } = useGetProductsQuery();

  return (
    <div className="container py-12">
      <h1 className="mb-8 text-center text-4xl font-bold">All Our Cakes</h1>

      {isLoading ? (
        <div className="flex justify-center pt-16">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <p className="text-center text-destructive">
          Oops! Something went wrong while fetching our cakes.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products?.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}