// app/page.tsx
'use client';

import Link from 'next/link';
import { useGetProductsQuery } from '@/store/services/api';
import ProductCard from '@/components/product/ProductCard';
import { Button } from '@/components/ui/button';
import { ProductDocument } from '@/types/api';
import { UIProduct, toUIProduct } from '@/types/product';

export default function HomePage() {
  const { data: products, isLoading, error } = useGetProductsQuery();

  const featuredProducts = (products as ProductDocument[])?.filter((p) => p.isFeatured).slice(0, 3);

  return (
    <>
      {/* Hero Section */}
      <section className="bg-primary/10 py-20 text-center">
        <div className="container">
          <h1 className="text-4xl font-bold tracking-tight text-text-main lg:text-5xl">
            The Sweetest Cakes, Delivered to You
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Handcrafted with love, baked to perfection.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link href="/products">Shop All Cakes</Link>
          </Button>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16">
        <div className="container">
          <h2 className="mb-8 text-center text-3xl font-bold">
            Our Featured Cakes
          </h2>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <p className="text-center text-destructive">
              Failed to load featured cakes.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {featuredProducts?.map(product => toUIProduct(product)).map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}