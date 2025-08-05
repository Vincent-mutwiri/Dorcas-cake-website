'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { addToCart, removeFromCart } from '@/store/slices/cartSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function CartPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { items, itemsPrice, shippingPrice, taxPrice, totalPrice } =
    useSelector((state: RootState) => state.cart);

  useEffect(() => {
    setMounted(true);
  }, []);

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
              <Card key={item.id || item._id} className="flex items-center p-4">
                <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md">
                  <Image
                    src={item.images?.[0] || item.image || '/placeholder-product.jpg'}
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
                  <p className="text-sm text-muted-foreground">
                    {item.selectedWeight && <span className="mr-2">Size: {item.selectedWeight}</span>}
                    ${item.price.toFixed(2)}
                  </p>
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
                  <span>${itemsPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>${shippingPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>${taxPrice.toFixed(2)}</span>
                </div>
                <hr />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>${totalPrice.toFixed(2)}</span>
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
