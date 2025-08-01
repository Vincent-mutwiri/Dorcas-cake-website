// components/product/ProductCard.tsx
import Link from 'next/link';
import Image from 'next/image';
import { IProduct } from '@/models/ProductModel';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ProductCardProps {
  product: IProduct;
}

const ProductCard = ({ product }: ProductCardProps) => {
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
            {/* We need to populate category name in the API call */}
            {/* For now, let's assume it's an object */}
            {(product.category as any)?.name || 'Category'}
          </p>
        </CardContent>
      </Link>
      <CardFooter className="flex items-center justify-between p-4 pt-0">
        <p className="text-xl font-bold text-text-main">
          ${product.price.toFixed(2)}
        </p>
        <Button>Add to Cart</Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;