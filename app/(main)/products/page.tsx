// app/(main)/products/page.tsx
'use client';

import { useGetProductsQuery } from '@/store/services/api';
import ProductCard from '@/components/product/ProductCard';
import { ProductDocument } from '@/types/api';
import { UIProduct, toUIProduct } from '@/types/product';

export default function ProductsPage() {
  const { data: products, isLoading, error } = useGetProductsQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Our Cakes</h1>
      {error ? (
        <p className="text-center text-destructive">
          Oops! Something went wrong while fetching our cakes.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {(products as ProductDocument[])?.map(product => toUIProduct(product)).map((product) => (
            <ProductCard 
              key={product._id}
              product={product}
            />
          ))}
        </div>
      )}
    </div>
  );
}