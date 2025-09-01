// app/page.tsx
'use client';

import Link from 'next/link';
import { useGetProductsQuery, useGetActiveOffersQuery } from '@/store/services/api';
import ProductCard from '@/components/product/ProductCard';
import { Button } from '@/components/ui/button';
import { ProductDocument } from '@/types/api';
import { UIProduct, toUIProduct } from '@/types/product';

export default function HomePage() {
  const { data: products, isLoading: isLoadingProducts, error: productsError } = useGetProductsQuery();
  const { data: activeOffers = [], isLoading: isLoadingOffers, error: offersError } = useGetActiveOffersQuery();
  
  const isLoading = isLoadingProducts || isLoadingOffers;
  const error = productsError || offersError;

  // Convert products to UI format and filter out any null values
  const uiProducts: UIProduct[] = (Array.isArray(products) ? products : [])
    .filter((p): p is ProductDocument => p !== null && p.isFeatured)
    .map(product => toUIProduct(product))
    .filter((product): product is UIProduct => product !== null);
    
  // Helper function to safely convert and filter products
  const getSafeProducts = (productsList: any[] = []) => {
    return productsList
      .filter((p): p is ProductDocument => p !== null)
      .map(p => toUIProduct(p))
      .filter((p): p is UIProduct => p !== null);
  };
  
  // Convert active offers to UI format and filter out any null values
  const uiActiveOffers = (Array.isArray(activeOffers) ? activeOffers : [])
    .map(offer => ({
      ...offer,
      product: toUIProduct(offer.product)
    }))
    .filter(offer => offer.product !== null);


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

      {/* Today's Offers Section */}
      {uiActiveOffers.length > 0 && (
        <section className="py-16 bg-destructive/10">
          <div className="container">
            <h2 className="mb-8 text-center text-3xl font-bold text-destructive">
              Today's Special Offers
            </h2>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <p className="text-center text-destructive">
                Failed to load special offers.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {uiActiveOffers.map(({ _id, product }) => (
                  <ProductCard
                    key={_id}
                    product={product}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

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
              {getSafeProducts(products as ProductDocument[])
                .filter(product => product.isFeatured)
                .map((product, index) => (
                  <ProductCard 
                    key={product._id || `featured-${index}`} 
                    product={product} 
                  />
                ))}
            </div>
          )}
        </div>
      </section>

      {/* All Products Section */}
      <section className="py-16 bg-muted/20">
        <div className="container">
          <h2 className="mb-8 text-center text-3xl font-bold">
            All Our Cakes
          </h2>
          {!uiProducts.length ? (
            <p className="text-center text-muted-foreground">
              No cakes available at the moment.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {getSafeProducts(products as ProductDocument[]).map((product, index) => (
                <ProductCard 
                  key={product._id || `all-${index}`} 
                  product={product} 
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}