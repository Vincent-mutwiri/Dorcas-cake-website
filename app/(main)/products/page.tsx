// app/(main)/products/page.tsx
'use client';

import { useGetProductsQuery } from '@/store/services/api';
import ProductCard from '@/components/product/ProductCard';
import { ProductDocument } from '@/types/api';
import { UIProduct, toUIProduct } from '@/types/product';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const categoryFilter = searchParams.get('category');
  const { data: products, isLoading, error } = useGetProductsQuery();
  
  const filteredProducts = useMemo(() => {
    if (!products || !categoryFilter) return products;
    return products.filter((product: ProductDocument) => 
      product.category?.slug === categoryFilter
    );
  }, [products, categoryFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">
        {categoryFilter ? `${categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1)} Cakes` : 'Our Cakes'}
      </h1>
      {error ? (
        <p className="text-center text-destructive">
          Oops! Something went wrong while fetching our cakes.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {(filteredProducts as ProductDocument[])?.map(product => toUIProduct(product)).map((product) => (
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