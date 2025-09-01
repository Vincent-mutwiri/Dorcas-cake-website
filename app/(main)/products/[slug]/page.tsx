// app/(main)/products/[slug]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { useDispatch } from 'react-redux';
import { addToCart } from '@/store/slices/cartSlice';
import { 
  useGetProductBySlugQuery,
  useGetActiveOffersQuery,
  useGetFeaturedReviewQuery 
} from '@/store/services/api';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { IAdminOffer } from '@/types/offer';
import { UIProduct, toUIProduct, PriceVariant } from '@/types/product';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ObjectId } from 'mongodb';
import { Star, User, Tag, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

function RatingStars({ rating, size = 'default' }: { rating: number; size?: 'sm' | 'default' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    default: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          className={`${sizeClasses[size]} ${
            value <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          }`}
        />
      ))}
      <span className="ml-2 text-sm text-gray-500">
        ({rating.toFixed(1)})
      </span>
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
  
  // Fetch product data and active offers
  const { data, isLoading, error } = useGetProductBySlugQuery(slug);
  const typedData = data as { product: any; reviews: any[] } | undefined;
  
  const { data: activeOffers = [], isLoading: isLoadingOffers } = useGetActiveOffersQuery();
  const typedActiveOffers = activeOffers as IAdminOffer[];
  const product = typedData?.product ? toUIProduct(typedData.product) : null;
  const reviews = typedData?.reviews || [];
  
  // Fetch featured review
  const { data: featuredReviewData } = useGetFeaturedReviewQuery(
    product?._id || '',
    { skip: !product?._id }
  );
  
  // Handle case when product is not found
  if (isLoading || isLoadingOffers) {
    return (
      <div className="container py-12">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }
  
  if (!product) {
    return (
      <div className="container py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <p className="text-muted-foreground mb-6">The product you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => router.push('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }
  
  interface FeaturedReview {
    _id: string;
    rating: number;
    comment: string;
    user?: {
      _id: string;
      name: string;
      profilePicture?: string;
    };
    createdAt: string;
  }
  
  const featuredReview = featuredReviewData?.review as FeaturedReview | undefined;

  // State for selected variant and price
  const [selectedWeight, setSelectedWeight] = useState<string | null>(
    product?.priceVariants?.[0]?.weight || null
  );

  // Find active offer for the selected variant
  const activeOffer = typedActiveOffers.find((offer) => {
    if (!product?._id) return false;
    
    // Convert both IDs to strings for comparison
    const offerProductId = typeof offer.product === 'string' 
      ? offer.product 
      : (offer.product as any)?._id?.toString?.();
      
    const currentProductId = product._id?.toString?.();
    
    return (
      offerProductId === currentProductId &&
      offer.variantDisplay === selectedWeight
    );
  });

  // Determine current price based on offer or regular price
  const selectedVariant = product?.priceVariants?.find(
    (v: PriceVariant) => v.weight === selectedWeight
  ) as PriceVariant | undefined;

  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const originalPrice = selectedVariant?.price || product?.basePrice || 0;

  // Set initial weight when data loads
  useEffect(() => {
    if (product?.priceVariants?.length && !selectedWeight) {
      setSelectedWeight(product.priceVariants[0].weight);
    }
  }, [product, selectedWeight]);

  // Update current price when offer or variant changes
  useEffect(() => {
    if (!product) return;
    
    let newPrice = 0;
    
    if (activeOffer) {
      newPrice = activeOffer.discountedPrice;
    } else if (selectedVariant?.price) {
      newPrice = selectedVariant.price;
    } else if (product.price) {
      newPrice = product.price;
    }
    
    setCurrentPrice(newPrice);
  }, [activeOffer, selectedVariant, product]);

  const handleWeightChange = (weight: string) => {
    setSelectedWeight(weight);
  };

  if (isLoadingProduct || isLoadingOffers || !product) {
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

  const addToCartHandler = () => {
    if (!product || !selectedWeight) return;
    
    try {
      dispatch(
        addToCart({
          id: product._id,
          _id: product._id,
          name: product.name,
          slug: product.slug || `product-${product._id}`,
          price: currentPrice,
          selectedWeight,
          qty,
          stock: product.stock || 0,
          countInStock: product.stock || 0,
          images: product.images || [],
          image: product.images?.[0] || '',
          category: product.category ? {
            name: product.category.name,
            slug: 'slug' in product.category ? product.category.slug : undefined
          } : { name: 'Uncategorized' }
        })
      );
      toast({
        title: `${product.name} added to cart`,
        description: `You have added ${qty} ${qty > 1 ? 'items' : 'item'} of ${product.name} (${selectedWeight}) to your cart.`,
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
        <div className="bg-white rounded-lg overflow-hidden relative">
          {activeOffer && (
            <Badge variant="destructive" className="absolute top-4 left-4 z-10">
              <Tag className="h-4 w-4 mr-1" />
              SPECIAL OFFER
            </Badge>
          )}
          <Image
            src={product.images?.[0] || '/images/placeholder.jpg'}
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

          {activeOffer ? (
            <div className="flex items-baseline gap-2 mb-6">
              <p className="text-3xl font-bold text-destructive">
                KSh {currentPrice?.toFixed(2)}
              </p>
              <s className="text-lg text-muted-foreground">
                KSh {originalPrice.toFixed(2)}
              </s>
            </div>
          ) : (
            <p className="text-3xl font-bold text-gray-900 mb-6">
              KSh {currentPrice?.toFixed(2)}
            </p>
          )}

          {/* Weight Selector */}
          {product.priceVariants && product.priceVariants.length > 0 && (
            <div className="mb-6">
              <Label>Size</Label>
              <Select value={selectedWeight || ''} onValueChange={handleWeightChange}>
                <SelectTrigger className="w-[180px] mt-2">
                  <SelectValue placeholder="Select a size" />
                </SelectTrigger>
                <SelectContent>
                  {product.priceVariants?.map((variant: PriceVariant) => (
                    <SelectItem key={variant.weight} value={variant.weight}>
                      {variant.weight} - KSh {variant.price.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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

      {/* Featured Review Section */}
      {featuredReview && (
        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
            Featured Review
          </h2>
          <Card className="overflow-hidden border-yellow-200 bg-yellow-50/50">
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {featuredReview.user?.profilePicture && featuredReview.user.profilePicture !== '/images/default-avatar.png' ? (
                      <Image 
                        src={featuredReview.user.profilePicture} 
                        alt={featuredReview.user?.name || 'User'} 
                        width={40} 
                        height={40} 
                        className="rounded-full object-cover" 
                        unoptimized
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center ${featuredReview.user?.profilePicture && featuredReview.user.profilePicture !== '/images/default-avatar.png' ? 'hidden' : ''}`}>
                      <User className="h-5 w-5 text-gray-500" />
                    </div>
                  </div>
                  <div>
                    <CardTitle className="text-lg">{featuredReview.user?.name || 'Anonymous'}</CardTitle>
                    <div className="flex items-center mt-1">
                      <RatingStars rating={featuredReview.rating} size="lg" />
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                  Featured
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{featuredReview.comment}</p>
              <p className="text-sm text-gray-500 mt-2">
                {format(new Date(featuredReview.createdAt), 'MMMM d, yyyy')}
              </p>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Reviews Section */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
        {reviews.length === 0 ? (
          <p className="text-gray-600">No reviews yet. Be the first to review!</p>
        ) : (
          <div className="space-y-6">
            {reviews.map((review: { _id: string; name: string; rating: number; comment: string; createdAt: string; user?: { name: string; profilePicture?: string } }) => (
              <Card key={review._id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {review.user?.profilePicture && review.user.profilePicture !== '/images/default-avatar.png' ? (
                          <Image 
                            src={review.user.profilePicture} 
                            alt={review.user?.name || review.name} 
                            width={40} 
                            height={40} 
                            className="rounded-full object-cover" 
                            unoptimized
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center ${review.user?.profilePicture && review.user.profilePicture !== '/images/default-avatar.png' ? 'hidden' : ''}`}>
                          <User className="h-5 w-5 text-gray-500" />
                        </div>
                      </div>
                      <div>
                        <CardTitle className="text-lg">{review.user?.name || review.name}</CardTitle>
                        <div className="flex items-center mt-1">
                          <RatingStars rating={review.rating} size="lg" />
                        </div>
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
