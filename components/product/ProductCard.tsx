// components/product/ProductCard.tsx
import Link from 'next/link';
import Image from 'next/image';
import { UIProduct, PriceVariant } from '@/types/product';
import { IAdminOffer, IOfferResponse } from '@/types/offer';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDispatch } from 'react-redux';
import { addToCart } from '@/store/slices/cartSlice';
import { useToast } from '@/components/ui/use-toast';
import { ShoppingCart, Star, User, Tag } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useGetActiveOffersQuery } from '@/store/services/api';

interface ProductCardProps {
  product: UIProduct;
}

interface FeaturedReview {
  _id: string;
  name: string;
  rating: number;
  comment: string;
  isFeatured: boolean;
  userImageUrl?: string;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { data: activeOffers } = useGetActiveOffersQuery();
  const [selectedWeight, setSelectedWeight] = useState(
    product.priceVariants?.[0]?.weight || '1KG'
  );
  
  const selectedVariant = product.priceVariants?.find(v => v.weight === selectedWeight);
  
  // Find if there's an active offer for the selected variant
  interface IOfferWithProduct {
    product: {
      _id: string | { toString: () => string };
    };
    variantDisplay: string;
    discountedPrice: number;
  }

  // Type guard to check if an offer has the required properties
  const isMatchingOffer = (offer: unknown): offer is IOfferWithProduct => {
    if (!offer || typeof offer !== 'object') return false;
    const o = offer as Record<string, any>;
    return (
      o.product && 
      o.product._id && 
      typeof o.variantDisplay === 'string' &&
      typeof o.discountedPrice === 'number'
    );
  };

  const activeOffer = (activeOffers as unknown[])?.find(offer => {
    if (!isMatchingOffer(offer)) return false;
    const typedOffer = offer as IOfferWithProduct;
    const productId = typeof typedOffer.product._id === 'object' 
      ? typedOffer.product._id.toString() 
      : typedOffer.product._id;
    return (
      productId === product._id &&
      typedOffer.variantDisplay === selectedWeight
    );
  }) as IOfferWithProduct | undefined;

  const currentPrice = activeOffer
    ? activeOffer.discountedPrice
    : selectedVariant?.price || product.price || 0;
    
  const originalPrice = selectedVariant?.price || product.basePrice || 0;
  const [featuredReview, setFeaturedReview] = useState<FeaturedReview | null>(null);

  useEffect(() => {
    // Fetch featured review for this product
    if (!product._id) {
      console.log('Product ID is missing:', product);
      return;
    }
    
    console.log('Fetching featured review for product ID:', product._id);
    fetch(`/api/products/${product._id}/featured-review`)
      .then(res => res.json())
      .then(data => {
        console.log('Featured review response:', data);
        if (data.review) setFeaturedReview(data.review);
      })
      .catch(err => console.log('Featured review error:', err));
  }, [product._id]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  const addToCartHandler = () => {
    dispatch(
      addToCart({
        id: product._id,
        _id: product._id,
        name: product.name,
        slug: product.slug || `product-${product._id}`, // Add a fallback slug if not available
        price: currentPrice,
        selectedWeight: selectedWeight,
        qty: 1,
        images: product.images || [],
        image: product.images?.[0] || '',
        stock: product.stock || 0,
        category: product.category || { name: 'Uncategorized' },
      })
    );
    toast({
      title: 'Added to Cart',
      description: `${product.name} (${selectedWeight}) added to cart.`,
    });
  };
  
  return (
    <Card className="hover:shadow-lg transition-shadow relative">
      {activeOffer && (
        <Badge variant="destructive" className="absolute top-2 right-2 z-10">
          <Tag className="h-3 w-3 mr-1" />
          OFFER
        </Badge>
      )}
      <CardHeader>
        <div className="aspect-square w-full mb-3 bg-muted rounded-md overflow-hidden">
          {product.images?.[0] ? (
            <div className="relative w-full h-full">
              <Image 
                src={product.images[0]} 
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
                priority={false}
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No Image
            </div>
          )}
        </div>
        <CardTitle className="text-lg">
          <Link href={`/products/${product.slug}`} className="hover:text-primary">
            {product.name}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {product.description || 'No description available'}
        </p>
        
        {product.priceVariants && product.priceVariants.length > 0 ? (
          <div className="space-y-2">
            <label className="text-sm font-medium">Weight:</label>
            <Select 
              value={selectedWeight} 
              onValueChange={setSelectedWeight}
            >
              <SelectTrigger>
                <SelectValue />
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
        ) : null}
        
        <div className="flex justify-between items-center">
          <div>
            {activeOffer && currentPrice < originalPrice ? (
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-destructive">
                  KSh {currentPrice.toFixed(2)}
                </p>
                <s className="text-sm text-muted-foreground">
                  KSh {originalPrice.toFixed(2)}
                </s>
              </div>
            ) : (
              <p className="text-2xl font-bold">
                KSh {currentPrice.toFixed(2)}
                {activeOffer && currentPrice >= originalPrice && (
                  <span className="ml-2 text-sm text-muted-foreground">
                    (No discount)
                  </span>
                )}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Stock: {product.stock || 0}
            </p>
          </div>
        </div>
        
        <Button 
          className="w-full" 
          onClick={addToCartHandler}
          disabled={!product.stock || product.stock === 0}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Add to Cart
        </Button>
        
        {featuredReview && (
          <div className="mt-4 p-3 bg-muted rounded-md">
            <div className="flex items-start gap-3 mb-2">
              <div className="flex-shrink-0">
                {featuredReview.userImageUrl && featuredReview.userImageUrl !== '/images/default-avatar.png' ? (
                  <img 
                    src={featuredReview.userImageUrl} 
                    alt={featuredReview.name} 
                    width={32} 
                    height={32} 
                    className="rounded-full object-cover" 
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-4 w-4 text-gray-500" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{featuredReview.name || 'Anonymous'}</span>
                  <div className="flex">{renderStars(featuredReview.rating)}</div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {featuredReview.comment}
                </p>
              </div>
            </div>
          </div>
        )}
        
        <Button asChild variant="outline" className="w-full mt-2">
          <Link href={`/products/${product.slug}`}>
            View More Reviews
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
