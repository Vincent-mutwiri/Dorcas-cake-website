// app/(main)/products/[slug]/page.tsx
'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useDispatch } from 'react-redux';
import { addToCart } from '@/store/slices/cartSlice';
import { useProductBySlug } from '@/hooks/useProductBySlug';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, ArrowLeft } from 'lucide-react';
import { UIProduct, toUIProduct } from '@/types/product';
import { format } from 'date-fns';
import Link from 'next/link';
import { cn } from '@/lib/utils';

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            'h-5 w-5',
            star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          )}
        />
      ))}
    </div>
  );
}

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { slug } = params as { slug: string };
  const dispatch = useDispatch();
  const [qty, setQty] = useState(1);
  const { toast } = useToast();

  const { data, isLoading, error } = useProductBySlug(slug) as {
    data: { product: UIProduct; reviews: any[] } | undefined;
    isLoading: boolean;
    error: any;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Products
        </Button>
        <div className="text-center py-10">
          <h2 className="text-xl font-semibold text-red-600">
            Error loading product
          </h2>
          <p className="text-gray-600 mt-2">
            We couldn't load the product details. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  // Ensure data is properly typed
  const product = data?.product ? toUIProduct(data.product) : undefined;
  const reviews = data?.reviews || [];

  if (!product) {
    return (
      <div className="container py-12">
        <p className="text-center text-destructive">Product not found</p>
      </div>
    );
  }

  const addToCartHandler = () => {
    if (!product) return;
    
    try {
      dispatch(
        addToCart({
          id: product._id,
          _id: product._id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          qty,
          stock: product.stock,
          countInStock: product.stock,
          images: product.images,
          category: product.category ? {
            name: product.category.name,
            slug: 'slug' in product.category ? product.category.slug : undefined
          } : undefined
        })
      );
      toast({
        title: `${product.name} added to cart`,
        description: `You have added ${qty} of ${product.name} to your cart.`,
      });
    } catch (error) {
      toast({
        title: 'Failed to add to cart',
        description: 'There was an error adding the item to your cart. Please try again.',
        variant: 'destructive',
      });
      console.error('Add to cart error:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Toaster />
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Products
      </Button>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Product Image */}
        <div className="bg-white rounded-lg overflow-hidden">
          <Image
            src={product.images[0] || '/images/placeholder.jpg'}
            alt={product.name}
            width={600}
            height={600}
            className="w-full h-auto object-cover"
            priority
          />
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
          <div className="flex items-center mb-4">
            <RatingStars rating={product.rating ?? 0} />
            <span className="text-gray-600 ml-2">
              {product.rating?.toFixed(1) ?? 'No rating'} ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
            </span>
          </div>

          <p className="text-3xl font-bold text-gray-900 mb-6">
            ${product.price.toFixed(2)}
          </p>

          <p className="text-gray-700 mb-6">{product.description}</p>

          <div className="mb-6">
            <span className="text-gray-700">Status: </span>
            {product.stock > 0 ? (
              <span className="text-green-600 font-medium">In Stock</span>
            ) : (
              <span className="text-red-600 font-medium">Out of Stock</span>
            )}
          </div>

          {product.stock > 0 && (
            <div className="flex items-center mb-6">
              <span className="text-gray-700 mr-4 font-medium">Quantity</span>
              <div className="flex items-center border rounded-md overflow-hidden">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setQty(prev => Math.max(1, prev - 1));
                  }}
                  className="h-10 w-10 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                  aria-label="Decrease quantity"
                  disabled={qty <= 1}
                >
                  <span className="text-lg font-medium">−</span>
                </button>
                <div className="h-10 w-12 flex items-center justify-center border-x bg-white">
                  <span className="text-base font-medium">{qty}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setQty(prev => Math.min(product.stock, prev + 1));
                  }}
                  className="h-10 w-10 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                  aria-label="Increase quantity"
                  disabled={qty >= product.stock}
                >
                  <span className="text-lg font-medium">+</span>
                </button>
              </div>
              <span className="text-sm text-gray-500 ml-3">
                {product.stock} available
              </span>
            </div>
          )}

          <Button
            onClick={addToCartHandler}
            disabled={product.stock === 0}
            className="w-full md:w-auto"
          >
            {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
          </Button>
        </div>
      </div>

      {/* Reviews Section */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
        {reviews.length === 0 ? (
          <p className="text-gray-600">No reviews yet. Be the first to review!</p>
        ) : (
          <div className="space-y-6">
            {reviews.map((review: { _id: string; name: string; rating: number; comment: string; createdAt: string }) => (
              <Card key={review._id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <div>
                      <CardTitle className="text-lg">{review.name}</CardTitle>
                      <div className="flex items-center mt-1">
                        <RatingStars rating={review.rating} />
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {format(new Date(review.createdAt), 'MMMM d, yyyy')}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{review.comment}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
