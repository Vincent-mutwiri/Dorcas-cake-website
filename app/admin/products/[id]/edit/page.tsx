'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  useGetProductByIdQuery,
  useUpdateProductMutation,
  useCreateProductMutation,
  useGetCategoriesQuery,
} from '@/store/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import AddCategoryModal from '@/components/modals/AddCategoryModal';

export default function ProductEditPage() {
  const router = useRouter();
  const params = useParams();
  const { id: productId } = params as { id: string };
  const isNewProduct = productId === 'new';

  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    category: '',
    images: ['/images/chocolate-cake.jpg'],
    stock: 0,
    isFeatured: false,
  });
  const [priceVariants, setPriceVariants] = useState([{ weight: '', price: 0 }]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: productData, isLoading: isLoadingProduct } =
    useGetProductByIdQuery(productId, { skip: isNewProduct });
  const { data: categories, isLoading: isLoadingCategories, refetch } = useGetCategoriesQuery();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();

  useEffect(() => {
    if (productData) {
      setFormData({
        name: productData.product.name,
        slug: productData.product.slug,
        description: productData.product.description,
        category: (productData.product.category as any)._id,
        images: productData.product.images,
        stock: productData.product.stock,
        isFeatured: productData.product.isFeatured,
      });
      // Handle legacy products without priceVariants
      if (productData.product.priceVariants && productData.product.priceVariants.length > 0) {
        setPriceVariants(productData.product.priceVariants);
      } else if (productData.product.price) {
        setPriceVariants([{ weight: '1KG', price: productData.product.price }]);
      } else {
        setPriceVariants([{ weight: '', price: 0 }]);
      }
    }
  }, [productData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value }));
  };

  const handleVariantChange = (index: number, field: string, value: string | number) => {
    const newVariants = [...priceVariants];
    (newVariants[index] as any)[field] = value;
    setPriceVariants(newVariants);
  };

  const addVariant = () => {
    setPriceVariants([...priceVariants, { weight: '', price: 0 }]);
  };

  const removeVariant = (index: number) => {
    setPriceVariants(priceVariants.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const productPayload = { ...formData, priceVariants };
      if (isNewProduct) {
        await createProduct(productPayload).unwrap();
        toast({ title: 'Success', description: 'Product created.' });
      } else {
        await updateProduct({ id: productId, data: productPayload }).unwrap();
        toast({ title: 'Success', description: 'Product updated.' });
      }
      router.push('/admin/products');
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Operation failed.',
      });
    }
  };

  if (isLoadingProduct || isLoadingCategories) return <LoadingSpinner />;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h1 className="text-2xl font-bold">
        {isNewProduct ? 'Create Product' : 'Edit Product'}
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" value={formData.name} onChange={handleChange} />
        </div>

        <div>
          <Label htmlFor="stock">Stock</Label>
          <Input id="stock" name="stock" type="number" value={formData.stock} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <div className="flex items-center gap-2">
            <Select value={formData.category} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {categories?.map((cat) => (
                  <SelectItem key={cat._id} value={cat._id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" onClick={() => setIsModalOpen(true)}>Add Category</Button>
          </div>
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" value={formData.description} onChange={handleChange} />
        </div>
        <div className="md:col-span-2">
          <Label>Product Image</Label>
          <div className="space-y-4">
            {formData.images[0] && (
              <div className="relative inline-block">
                <img src={formData.images[0]} alt="Product" className="w-32 h-32 object-cover rounded" />
                <Button 
                  type="button"
                  variant="destructive" 
                  size="sm" 
                  className="absolute -top-2 -right-2"
                  onClick={() => setFormData(prev => ({ ...prev, images: ['/images/chocolate-cake.jpg'] }))}
                >
                  ×
                </Button>
              </div>
            )}
            <div>
              <Input 
                type="file" 
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // In a real app, upload to cloud storage and get URL
                    const fakeUrl = `/images/${file.name}`;
                    setFormData(prev => ({ ...prev, images: [fakeUrl] }));
                  }
                }}
              />
              <p className="text-xs text-muted-foreground mt-1">Upload an image file</p>
            </div>
          </div>
        </div>
        
        <div className="md:col-span-2">
          <Label>Price Variants</Label>
          <div className="space-y-2 mt-2">
            {priceVariants.map((variant, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder="Weight (e.g., 1KG)"
                  value={variant.weight}
                  onChange={(e) => handleVariantChange(index, 'weight', e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Price"
                  value={variant.price}
                  onChange={(e) => handleVariantChange(index, 'price', Number(e.target.value))}
                />
                <Button type="button" variant="destructive" size="sm" onClick={() => removeVariant(index)}>
                  Remove
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addVariant}>
              Add Price Variant
            </Button>
          </div>
        </div>
      </div>

      <Button type="submit" disabled={isUpdating || isCreating}>
        {isUpdating || isCreating ? 'Saving...' : 'Save Product'}
      </Button>
      <AddCategoryModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          refetch();
        }}
      />
    </form>
  );
}