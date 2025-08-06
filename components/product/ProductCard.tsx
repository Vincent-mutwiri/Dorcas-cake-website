// components/product/ProductCard.tsx
import Link from 'next/link';
import { UIProduct, PriceVariant } from '@/types/product';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDispatch } from 'react-redux';
import { addToCart } from '@/store/slices/cartSlice';
import { useToast } from '@/components/ui/use-toast';
import { ShoppingCart, Star } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ProductCardProps {
  product: UIProduct;
}

interface FeaturedReview {
  _id: string;
  name: string;
  rating: number;
  comment: string;
  isFeatured: boolean;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const [selectedWeight, setSelectedWeight] = useState(
    product.priceVariants?.[0]?.weight || '1KG'
  );
  
  const selectedVariant = product.priceVariants?.find(v => v.weight === selectedWeight);
  const currentPrice = selectedVariant?.price || product.price || 0;
  const [featuredReview, setFeaturedReview] = useState<FeaturedReview | null>(null);

  useEffect(() => {
    // Fetch featured review for this product
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
        price: currentPrice,
        selectedWeight: selectedWeight,
        qty: 1,
        images: product.images,
        image: product.images?.[0] || '',
        stock: product.stock,
        category: product.category,
      })
    );
    toast({
      title: 'Added to Cart',
      description: `${product.name} (${selectedWeight}) added to cart.`,
    });
  };
  
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="aspect-square w-full mb-3 bg-muted rounded-md overflow-hidden">
          {product.images?.[0] ? (
            <img 
              src={product.images[0]} 
              alt={product.name}
              className="w-full h-full object-cover"
            />
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
                {product.priceVariants?.map((variant: PriceVariant, idx: number) => (
                  <SelectItem key={idx} value={variant.weight}>
                    {variant.weight} - KSh {variant.price.toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        
        <div className="flex justify-between items-center">
          <div>
            <p className="text-2xl font-bold text-primary">
              KSh {currentPrice.toFixed(2)}
            </p>
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
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium">
                  {(featuredReview.name || 'U').charAt(0).toUpperCase()}
                </span>
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
