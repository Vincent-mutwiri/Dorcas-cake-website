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
    dispatch(
      addToCart({
        _id: product._id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        qty: 1, // Default to 1 when adding from product card
        countInStock: product.stock,
        image: product.images[0] || '',
      })
    );
    toast({
      title: `${product.name} added to cart`,
      description: `1 x ${product.name} has been added to your cart.`,
    });
  };

  return (
    <Card className="overflow-hidden">
      <Link href={`/products/${product.slug}`}>
        <CardHeader className="p-0">
          <div className="relative h-48 w-full">
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
            {product.name}
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {product.category.name}
          </p>
        </CardContent>
      </Link>
      <CardFooter className="flex items-center justify-between p-4 pt-0">
        <p className="text-xl font-bold text-text-main">
          ${product.price.toFixed(2)}
        </p>
        <Button onClick={addToCartHandler}>Add to Cart</Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
