'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image'; // Import Next's Image component
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
  interface FormData {
    name: string;
    slug: string;
    description: string;
    category: string;
    images: string[];
    stock: number;
    isFeatured: boolean;
  }

  const [formData, setFormData] = useState<FormData>({
    name: '',
    slug: '',
    description: '',
    category: '',
    images: [],
    stock: 0,
    isFeatured: false,
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [priceVariants, setPriceVariants] = useState([{ weight: '', price: 0 }]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: productData, isLoading: isLoadingProduct } =
    useGetProductByIdQuery(productId, { skip: isNewProduct });
  const { data: categories, isLoading: isLoadingCategories, refetch } = useGetCategoriesQuery();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();

  useEffect(() => {
    console.log('useEffect triggered:', { isNewProduct, productData });
    if (isNewProduct) {
      setIsLoading(false);
      return;
    }

    if (productData) {
      try {
        const product = (productData as any).product || productData; // Handle API response structure
        
        // Set form data
        setFormData({
          name: product.name || '',
          slug: product.slug || '',
          description: product.description || '',
          category: product.category?._id || '',
          images: product.images || [],
          stock: product.stock || 0,
          isFeatured: product.isFeatured || false,
        });

        // Handle price variants
        if (product.priceVariants?.length > 0) {
          setPriceVariants(product.priceVariants);
        } else if (product.price) {
          // For backward compatibility with products that don't have price variants
          setPriceVariants([{ 
            weight: '1KG', 
            price: product.price 
          }]);
        } else {
          setPriceVariants([{ 
            weight: '', 
            price: 0 
          }]);
        }
      } catch (error) {
        console.error('Error processing product data:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load product data. Please try again.',
        });
      } finally {
        setIsLoading(false);
      }
    }
  }, [productData, isNewProduct, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // 1. Get the pre-signed URL from our API
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });

      if (!res.ok) throw new Error('Failed to get pre-signed URL.');

      const { uploadUrl, publicUrl } = await res.json();

      // 2. Upload the file directly to S3 using the pre-signed URL
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      if (!uploadRes.ok) throw new Error('S3 upload failed.');

      // 3. Update the form state with the new public URL
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, publicUrl]
      }));

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

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
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
    
    // Validate required fields
    if (!formData.name || !formData.description || !formData.category) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fill in all required fields',
      });
      return;
    }

    // Validate price variants
    const hasInvalidVariants = priceVariants.some(
      variant => !variant.weight || isNaN(Number(variant.price)) || Number(variant.price) <= 0
    );
    
    if (hasInvalidVariants) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please provide valid weight and price for all variants',
      });
      return;
    }

    try {
      const selectedCategory = categories?.find(cat => cat._id === formData.category);
      
      if (!selectedCategory) {
        throw new Error('Please select a valid category');
      }

      // Prepare the product data with proper types
      const productPayload = { 
        name: formData.name,
        description: formData.description,
        category: selectedCategory, // Send the full category object
        images: formData.images,
        stock: Number(formData.stock) || 0,
        isFeatured: Boolean(formData.isFeatured),
        priceVariants: priceVariants.map(variant => ({
          weight: variant.weight,
          price: Number(variant.price)
        })),
        // For backward compatibility
        price: priceVariants[0]?.price ? Number(priceVariants[0].price) : 0,
        slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
        // Set default values for required fields
        rating: 0,
        numReviews: 0,
      };
      
      if (isNewProduct) {
        await createProduct(productPayload).unwrap();
        toast({ 
          title: 'Success', 
          description: 'Product created successfully',
          duration: 3000,
        });
      } else {
        await updateProduct({ 
          id: productId, 
          data: productPayload 
        }).unwrap();
        toast({ 
          title: 'Success', 
          description: 'Product updated successfully',
          duration: 3000,
        });
      }
      
      // Redirect to products list after a short delay
      setTimeout(() => {
        router.push('/admin/products');
        router.refresh(); // Ensure the products list is refreshed
      }, 1000);
      
    } catch (err: any) {
      console.error('Product operation failed:', err);
      const errorMessage = err.data?.message || err.message || 'Operation failed. Please try again.';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
        duration: 5000,
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
          <Label>Product Images</Label>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              {formData.images.map((image, index) => (
                <div key={index} className="relative h-32 w-32">
                  <div className="relative h-full w-full">
                    <Image
                      src={image}
                      alt={`Product image KSh {index + 1}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 128px"
                      className="object-cover rounded-md"
                      priority={index < 2} // Prioritize loading first 2 images
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                    onClick={() => removeImage(index)}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
            <div>
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isUploading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {isUploading ? 'Uploading...' : 'Upload an image file (JPEG, PNG, etc.)'}
              </p>
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

      <div className="flex gap-4">
        <Button type="submit" disabled={isUpdating || isCreating || isUploading}>
          {isUpdating || isCreating ? 'Saving...' : 'Save Product'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push('/admin/products')}>
          Cancel
        </Button>
      </div>
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