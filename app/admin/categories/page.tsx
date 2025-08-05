'use client';

import { useState } from 'react';
import { useGetCategoriesQuery, useDeleteCategoryMutation } from '@/store/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import AddCategoryModal from '@/components/modals/AddCategoryModal';
import { Edit, Trash2 } from 'lucide-react';

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
}

export default function AdminCategoriesPage() {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const { data: categories, isLoading, error, refetch } = useGetCategoriesQuery();
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation();

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
            <Card key={category._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                  <div className="flex gap-2">
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
                {category.image && (
                  <img 
                    src={category.image} 
                    alt={category.name}
                    className="w-full h-32 object-cover rounded-md mb-3"
                  />
                )}
                <p className="text-sm text-muted-foreground">
                  {category.description || 'No description available'}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Slug: {category.slug}
                </p>
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
          refetch();
        }}
      />
    </div>
  );
}