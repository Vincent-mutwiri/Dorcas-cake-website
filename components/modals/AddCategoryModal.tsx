
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useCreateCategoryMutation, useUpdateCategoryMutation } from '@/store/services/api';
import { useToast } from '@/components/ui/use-toast';
import { Switch } from '@/components/ui/switch';

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isFeatured?: boolean;
}

interface AddCategoryModalProps {
  isOpen: boolean;
  editingCategory?: Category | null;
  onClose: () => void;
}

export default function AddCategoryModal({ isOpen, editingCategory, onClose }: AddCategoryModalProps) {
  const [formData, setFormData] = useState({
    name: editingCategory?.name || '',
    description: editingCategory?.description || '',
    image: editingCategory?.image || '',
    isFeatured: editingCategory?.isFeatured || false,
  });

  // Update form when editing category changes
  React.useEffect(() => {
    if (editingCategory) {
      setFormData({
        name: editingCategory.name,
        description: editingCategory.description || '',
        image: editingCategory.image || '',
        isFeatured: editingCategory.isFeatured || false,
      });
    } else {
      setFormData({ name: '', description: '', image: '', isFeatured: false });
    }
  }, [editingCategory]);
  const [isUploading, setIsUploading] = useState(false);
  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();
  const isLoading = isCreating || isUpdating;
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });

      if (!res.ok) throw new Error('Failed to get pre-signed URL.');

      const { uploadUrl, publicUrl } = await res.json();

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      if (!uploadRes.ok) throw new Error('S3 upload failed.');

      setFormData(prev => ({ ...prev, image: publicUrl }));
      toast({ title: 'Success', description: 'Image uploaded.' });
    } catch (error: any) {
      toast({ 
        variant: 'destructive', 
        title: 'Upload Error', 
        description: error.message 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Category name cannot be empty.',
      });
      return;
    }
    try {
      const categoryData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        image: formData.image,
        isFeatured: formData.isFeatured,
        slug: formData.name.toLowerCase().replace(/\s+/g, '-'),
      };

      if (editingCategory) {
        await updateCategory({ id: editingCategory._id, data: categoryData }).unwrap();
        toast({ title: 'Success', description: 'Category updated.' });
      } else {
        await createCategory(categoryData).unwrap();
        toast({ title: 'Success', description: 'Category created.' });
      }
      
      setFormData({ name: '', description: '', image: '', isFeatured: false });
      onClose();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to ${editingCategory ? 'update' : 'create'} category.`,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
          <DialogDescription>
            {editingCategory ? 'Update the category details.' : 'Create a new product category. This will help organize your products.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Input
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="col-span-3"
              placeholder="Optional description"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="image" className="text-right">
              Image
            </Label>
            <div className="col-span-3 space-y-2">
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isUploading}
              />
              {formData.image && (
                <img src={formData.image} alt="Preview" className="w-16 h-16 object-cover rounded" />
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="isFeatured" className="text-right">
              Featured
            </Label>
            <div className="col-span-3 flex items-center">
              <Switch
                id="isFeatured"
                checked={formData.isFeatured}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFeatured: checked }))}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Saving...' : (editingCategory ? 'Update Category' : 'Save Category')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
