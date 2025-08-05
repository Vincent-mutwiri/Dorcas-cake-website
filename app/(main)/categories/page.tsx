'use client';

import Link from 'next/link';
import { useGetCategoriesQuery, useGetProductsQuery } from '@/store/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function CategoriesPage() {
  const { data: categories, isLoading, error } = useGetCategoriesQuery();
  const { data: products } = useGetProductsQuery();

  const getProductCount = (categoryId: string) => {
    return products?.filter(p => p.category?._id === categoryId).length || 0;
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <p className="text-destructive">Failed to load categories.</p>;

  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold mb-8 text-center">Our Categories</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories?.map((category) => (
          <Link key={category._id} href={`/categories/${category.slug}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg">{category.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video w-full mb-3 bg-muted rounded-md overflow-hidden">
                  {category.image && !category.image.includes('KSh {process.env.AWS_REGION}') ? (
                    <img 
                      src={category.image} 
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      No Image
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {category.description || 'No description available'}
                </p>
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>Slug: {category.slug}</span>
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded">
                    {getProductCount(category._id)} products
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}