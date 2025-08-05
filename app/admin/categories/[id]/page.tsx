'use client';

import { useGetProductsQuery, useUpdateProductMutation } from '@/store/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use } from 'react';

export default function CategoryProductsPage({ params }: { params: Promise<{ id: string }> }) {
  const { toast } = useToast();
  const router = useRouter();
  const { id } = use(params);
  const { data: products, isLoading, error } = useGetProductsQuery();
  const [updateProduct] = useUpdateProductMutation();

  const categoryProducts = products?.filter(p => p.category?._id === id) || [];
  const categoryName = categoryProducts[0]?.category?.name || 'Category';

  const toggleFeatured = async (productId: string, currentFeatured: boolean) => {
    try {
      await updateProduct({ 
        id: productId, 
        data: { isFeatured: !currentFeatured } 
      }).unwrap();
      toast({ title: 'Success', description: 'Product updated.' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update product.' });
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <p className="text-destructive">Failed to load products.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">{categoryName} Products</h1>
      </div>

      {categoryProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl mb-4">No products in this category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoryProducts.map((product) => (
            <Card key={product._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={product.isFeatured || false}
                      onChange={() => toggleFeatured(product._id, product.isFeatured || false)}
                      className="rounded"
                    />
                    <label className="text-sm">Featured</label>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {product.images?.[0] && (
                  <img 
                    src={product.images[0]} 
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-md mb-3"
                  />
                )}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {product.description || 'No description available'}
                  </p>
                  <div className="space-y-1">
                    {product.priceVariants?.length > 0 ? (
                      product.priceVariants.map((variant, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>{variant.weight}</span>
                          <span className="font-medium">KSh {variant.price.toFixed(2)}</span>
                        </div>
                      ))
                    ) : (
                      <div className="flex justify-between text-sm">
                        <span>Price</span>
                        <span className="font-medium">KSh {(product.price || 0).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Stock: {product.stock || 0}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}