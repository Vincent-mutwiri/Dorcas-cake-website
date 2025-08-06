'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useGetProductsQuery,
  useDeleteProductMutation,
} from '@/store/services/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Edit, Trash2 } from 'lucide-react';

export default function AdminProductsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: products, isLoading, error } = useGetProductsQuery();
  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();

  const deleteHandler = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(id).unwrap();
        toast({ title: 'Success', description: 'Product deleted.' });
      } catch (err) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to delete product.',
        });
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <Button asChild>
          <Link href="/admin/products/new/edit">Create Product</Link>
        </Button>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <p className="text-destructive">Failed to load products.</p>
      ) : !products || products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl mb-4">No products found</p>
          <Button asChild>
            <Link href="/admin/products/new/edit">Create your first product</Link>
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Price Variants</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products?.map((product) => (
              <TableRow key={product._id}>
                <TableCell>
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} className="w-12 h-12 object-cover rounded" />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xs">No Image</div>
                  )}
                </TableCell>
                <TableCell>{product.name}</TableCell>
                <TableCell>
                  {product.priceVariants && product.priceVariants.length > 0 ? (
                    <div className="space-y-1">
                      {product.priceVariants.map((variant: { weight: string; price: number }, idx: number) => (
                        <div key={idx} className="text-sm">
                          {variant.weight}: KSh {variant.price.toFixed(2)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div>KSh {(product.price || 0).toFixed(2)}</div>
                  )}
                </TableCell>
                <TableCell>{(product.category as any)?.name}</TableCell>
                <TableCell>{product.stock}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => router.push(`/admin/products/${product._id}/edit`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => deleteHandler(product._id)}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}