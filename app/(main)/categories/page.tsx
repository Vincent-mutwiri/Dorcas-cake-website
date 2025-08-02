'use client';

import Link from 'next/link';
import { useGetCategoriesQuery } from '@/store/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function CategoriesPage() {
  const { data: categories, isLoading, error } = useGetCategoriesQuery();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <p className="text-destructive">Failed to load categories.</p>;

  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold mb-8 text-center">Categories</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories?.map((category) => (
          <Link key={category._id} href={`/products?category=${category.slug}`}>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>{category.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{category.description || 'Explore our selection'}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}