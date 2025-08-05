'use client';

import { use } from 'react';
import { useGetProductsQuery, useGetCategoriesQuery } from '@/store/services/api';
import { useDispatch } from 'react-redux';
import { addToCart } from '@/store/slices/cartSlice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function CategoryProductsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const dispatch = useDispatch();
  const { toast } = useToast();
  
  const { data: products, isLoading: productsLoading } = useGetProductsQuery();
  const { data: categories, isLoading: categoriesLoading } = useGetCategoriesQuery();
  
  const [selectedWeights, setSelectedWeights] = useState<{ [key: string]: string }>({});

  const category = categories?.find(c => c.slug === slug);
  const categoryProducts = products?.filter(p => p.category?.slug === slug) || [];

  const handleWeightChange = (productId: string, weight: string) => {
    setSelectedWeights(prev => ({ ...prev, [productId]: weight }));
  };

  const handleAddToCart = (product: any) => {
    const selectedWeight = selectedWeights[product._id] || product.priceVariants?.[0]?.weight || '1KG';
    const selectedVariant = product.priceVariants?.find((v: any) => v.weight === selectedWeight);
    const price = selectedVariant?.price || product.price || 0;

    dispatch(addToCart({
      id: product._id,
      _id: product._id,
      name: product.name,
      price: price,
      selectedWeight: selectedWeight,
      qty: 1,
      images: product.images,
      image: product.images?.[0] || '',
      stock: product.stock,
      category: product.category
    }));

    toast({
      title: 'Added to Cart',
      description: `${product.name} (${selectedWeight}) added to cart.`,
    });
  };

  if (productsLoading || categoriesLoading) return <LoadingSpinner />;
  if (!category) return <p className="text-center text-destructive">Category not found.</p>;

  return (
    <div className="container py-12">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{category.name}</h1>
          <p className="text-muted-foreground">{category.description}</p>
        </div>
      </div>

      {categoryProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl mb-4">No products in this category yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categoryProducts.map((product) => {
            const selectedWeight = selectedWeights[product._id] || product.priceVariants?.[0]?.weight || '1KG';
            const selectedVariant = product.priceVariants?.find((v: any) => v.weight === selectedWeight);
            const currentPrice = selectedVariant?.price || product.price || 0;

            return (
              <Card key={product._id} className="hover:shadow-lg transition-shadow">
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
                  <CardTitle className="text-lg">{product.name}</CardTitle>
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
                        onValueChange={(value) => handleWeightChange(product._id, value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {product.priceVariants.map((variant: any, idx: number) => (
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
                    onClick={() => handleAddToCart(product)}
                    disabled={!product.stock || product.stock === 0}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}