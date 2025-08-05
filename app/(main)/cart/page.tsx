'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { addToCart, removeFromCart } from '@/store/slices/cartSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useGetProductByIdQuery } from '@/store/services/api';

export default function CartPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { items, itemsPrice, shippingPrice, taxPrice, totalPrice } =
    useSelector((state: RootState) => state.cart);

  useEffect(() => {
    setMounted(true);
  }, []);

  const CartItemCard = ({ item }: { item: any }) => {
    const { data: productData, isLoading } = useGetProductByIdQuery(item._id || item.id, { 
      skip: !item._id && !item.id 
    });
    const product = (productData as any)?.product || productData;

    const handleWeightChange = (newWeight: string) => {
      const selectedVariant = product?.priceVariants?.find((v: any) => v.weight === newWeight);
      if (selectedVariant) {
        // Create a new item with updated weight and price
        const updatedItem = { 
          ...item, 
          selectedWeight: newWeight, 
          price: selectedVariant.price,
          // Keep the original ID for proper identification
          id: item.id || item._id,
          _id: item._id || item.id
        };
        
        // Remove the old item and add the updated one
        dispatch(removeFromCart({ id: item.id || item._id, weight: item.selectedWeight }));
        dispatch(addToCart(updatedItem));
      }
    };

    return (
      <Card key={item.id || item._id} className="flex items-center p-4">
        <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md">
          <Image
            src={item.images?.[0] || item.image || '/images/cake-placeholder.svg'}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 96px, 96px"
            className="object-cover"
          />
        </div>
        <div className="ml-4 flex-1">
          <Link
            href={`/products/${item.slug}`}
            className="font-semibold hover:text-primary"
          >
            {item.name}
          </Link>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Size:</span>
              {product?.priceVariants?.length ? (
                <Select value={item.selectedWeight} onValueChange={handleWeightChange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {product.priceVariants.map((variant: any) => (
                      <SelectItem key={variant.weight} value={variant.weight}>
                        {variant.weight} - KSh {variant.price.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <span className="text-sm text-muted-foreground">{item.selectedWeight}</span>
              )}
            </div>
            <p className="text-sm font-medium">
              KSh {(item.price || 0).toFixed(2)} each
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center border rounded-md overflow-hidden">
            <button
              onClick={(e) => {
                e.preventDefault();
                dispatch(addToCart({ ...item, qty: Math.max(1, item.qty - 1) }));
              }}
              className="h-10 w-10 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="Decrease quantity"
              disabled={item.qty <= 1}
            >
              <span className="text-lg font-medium">−</span>
            </button>
            <div className="h-10 w-12 flex items-center justify-center border-x bg-white">
              <span className="text-base font-medium">{item.qty}</span>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                dispatch(addToCart({ ...item, qty: item.qty + 1 }));
              }}
              className="h-10 w-10 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="Increase quantity"
              disabled={item.qty >= (item.stock || item.countInStock || 0)}
            >
              <span className="text-lg font-medium">+</span>
            </button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => dispatch(removeFromCart({ id: item.id || item._id || '', weight: item.selectedWeight || '' }))}
          >
            <Trash2 className="h-5 w-5 text-destructive" />
          </Button>
        </div>
      </Card>
    );
  };

  const checkoutHandler = () => {
    router.push('/checkout');
  };

  if (!mounted) {
    return (
      <div className="container py-12">
        <h1 className="mb-8 text-center text-4xl font-bold">Your Shopping Cart</h1>
        <div className="text-center">
          <p className="text-xl">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <h1 className="mb-8 text-center text-4xl font-bold">Your Shopping Cart</h1>
      {items.length === 0 ? (
        <div className="text-center">
          <p className="text-xl">Your cart is empty.</p>
          <Button asChild className="mt-4">
            <Link href="/products">Go Shopping</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-12 md:grid-cols-3">
          <div className="space-y-4 md:col-span-2">
            {items.map((item) => (
              <CartItemCard key={`${item.id || item._id}-${item.selectedWeight}`} item={item} />
            ))}
          </div>

          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>KSh {(itemsPrice || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>KSh {(shippingPrice || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>KSh {(taxPrice || 0).toFixed(2)}</span>
                </div>
                <hr />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>KSh {(totalPrice || 0).toFixed(2)}</span>
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={checkoutHandler}
                  disabled={items.length === 0}
                >
                  Proceed to Checkout
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}