// components/product/ProductCard.tsx
import Link from 'next/link';
import Image from 'next/image';
import { UIProduct } from '@/types/product';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDispatch } from 'react-redux';
import { addToCart } from '@/store/slices/cartSlice';
import { useToast } from '@/components/ui/use-toast';

interface ProductCardProps {
  product: UIProduct;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const dispatch = useDispatch();
  const { toast } = useToast();

  const addToCartHandler = () => {
    // Use the first price variant's weight as default if available, otherwise use 'standard'
    const defaultWeight = product.priceVariants?.[0]?.weight || 'standard';
    
    dispatch(
      addToCart({
        id: product._id,
        _id: product._id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        selectedWeight: defaultWeight,
        qty: 1,
        stock: product.stock,
        images: product.images,
        category: product.category,
      })
    );
    toast({
      title: `KSh {product.name} added to cart`,
      description: `1 x KSh {product.name} has been added to your cart.`,
    });
  };

  // Safely get the first image or use a placeholder
  const imageSrc = product.images?.[0] || '/images/vanilla-cake.jpg';
  
  // Safely get the category name
  const categoryName = product.category?.name || 'Uncategorized';
  
  // Safely format the price with a fallback to 0
  const formattedPrice = (product.price || 0).toFixed(2);
  
  return (
    <Card className="overflow-hidden">
      <Link href={`/products/${product.slug || '#'}`}>
        <CardHeader className="p-0">
          <div className="relative h-48 w-full">
            <Image
              src={imageSrc}
              alt={product.name || 'Product image'}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority
            />
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {product.isFeatured && (
            <Badge variant="destructive" className="mb-2">
              Featured
            </Badge>
          )}
          <CardTitle className="text-lg font-semibold leading-tight hover:text-primary">
            {product.name || 'Unnamed Product'}
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {categoryName}
          </p>
        </CardContent>
      </Link>
      <CardFooter className="flex items-center justify-between p-4 pt-0">
        <p className="text-xl font-bold text-text-main">
          KSh {formattedPrice}
        </p>
        <Button 
          onClick={addToCartHandler}
          disabled={!product._id || !product.slug}
        >
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
