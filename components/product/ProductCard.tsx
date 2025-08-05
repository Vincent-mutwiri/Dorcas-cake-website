// components/product/ProductCard.tsx
import Link from 'next/link';
import { UIProduct } from '@/types/product';
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
import { ShoppingCart } from 'lucide-react';
import { useState } from 'react';

interface ProductCardProps {
  product: UIProduct;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const [selectedWeight, setSelectedWeight] = useState(
    product.priceVariants?.[0]?.weight || '1KG'
  );

  const selectedVariant = product.priceVariants?.find(v => v.weight === selectedWeight);
  const currentPrice = selectedVariant?.price || product.price || 0;

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
        
        {product.priceVariants?.length > 0 ? (
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
                {product.priceVariants.map((variant, idx) => (
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
      </CardContent>
    </Card>
  );
};

export default ProductCard;
