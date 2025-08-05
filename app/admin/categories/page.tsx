'use client';

import { useState } from 'react';
import { useGetCategoriesQuery, useDeleteCategoryMutation, useGetProductsQuery } from '@/store/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import AddCategoryModal from '@/components/modals/AddCategoryModal';
import { Edit, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isFeatured?: boolean;
}

export default function AdminCategoriesPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: categories, isLoading, error, refetch } = useGetCategoriesQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const { data: products } = useGetProductsQuery();
  
  console.log('Categories data:', categories?.map(c => ({ name: c.name, image: c.image, hasImage: !!c.image })));
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const getProductCount = (categoryId: string) => {
    return products?.filter(p => p.category?._id === categoryId).length || 0;
  };

  const deleteHandler = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await deleteCategory(id).unwrap();
        toast({ title: 'Success', description: 'Category deleted.' });
      } catch (err) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to delete category.',
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Categories</h1>
        <Button onClick={() => setIsModalOpen(true)}>Add Category</Button>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <p className="text-destructive">Failed to load categories.</p>
      ) : !categories || categories.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl mb-4">No categories found</p>
          <Button onClick={() => setIsModalOpen(true)}>Create your first category</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Card key={category._id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push(`/admin/categories/${category._id}`)}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => {
                        setEditingCategory(category);
                        setIsModalOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => deleteHandler(category._id)}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="aspect-video w-full mb-3 bg-muted rounded-md overflow-hidden">
                  {category.image && !category.image.includes('KSh {process.env.AWS_REGION}') ? (
                    <img 
                      src={category.image} 
                      alt={category.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.log('Image load error:', category.image);
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground flex-col gap-2">
                      <span>{category.image?.includes('KSh {process.env.AWS_REGION}') ? 'Broken Image URL' : 'No Image'}</span>
                      {category.image?.includes('KSh {process.env.AWS_REGION}') && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              await fetch(`/api/categories/${category._id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ ...category, image: '' })
                              });
                              refetch();
                              toast({ title: 'Success', description: 'Broken URL cleared' });
                            } catch (err) {
                              toast({ variant: 'destructive', title: 'Error', description: 'Failed to clear URL' });
                            }
                          }}
                        >
                          Clear Broken URL
                        </Button>
                      )}
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
          ))}
        </div>
      )}

      <AddCategoryModal 
        isOpen={isModalOpen} 
        editingCategory={editingCategory}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCategory(null);
          setTimeout(() => refetch(), 100);
        }}
      />
    </div>
  );
}