'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { removeFromCart, updateQuantity, CartItem } from '@/store/slices/cartSlice';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils';
import { useEffect, useState } from 'react';

export default function CartPage() {
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();
  const { items: cartItems } = useSelector((state: RootState) => state.cart);
  
  // Set isClient to true after component mounts (client-side only)
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleRemoveFromCart = (productId: string) => {
    dispatch(removeFromCart(productId));
  };

  const handleUpdateQuantity = (productId: string, qty: number) => {
    if (qty < 1) {
      handleRemoveFromCart(productId);
      return;
    }
    dispatch(updateQuantity(productId, qty));
  };

  const subtotal = cartItems.reduce(
    (total, item) => total + (item.price || 0) * (item.qty || 0),
    0
  );
  
  // Safely get the first image or a fallback
  const getFirstImage = (item: CartItem) => {
    if (item.images?.length > 0) return item.images[0];
    if (item.image) return item.image;
    return '/placeholder-product.jpg'; // Add a fallback image
  };

  // Don't render anything during server-side rendering
  if (!isClient) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
        <div className="animate-pulse">Loading cart...</div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      <div className="cart-content-wrapper">
        {cartItems.length === 0 ? (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">
              Looks like you haven't added anything to your cart yet.
            </p>
            <Button onClick={() => router.push('/products')}>
              Continue Shopping
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              {cartItems.map((item, index) => {
                // Create a stable key using both id and index as fallback
                const itemKey = item.id || `item-${index}`;
                return (
                <div key={itemKey} className="flex items-center gap-4 border-b pb-6">
                  <div className="relative w-24 h-24">
                    <Image
                      src={getFirstImage(item)}
                      alt={item.name || 'Product image'}
                      fill
                      className="object-cover rounded-md"
                      sizes="96px"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-medium">{item.name || 'Unnamed Product'}</h3>
                    <p className="text-sm text-muted-foreground">{item.category?.name || 'Cake'}</p>
                    <p className="font-medium mt-1">{formatPrice(item.price || 0)}</p>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => item.id && handleUpdateQuantity(item.id, (item.qty || 1) - 1)}
                        disabled={!item.id}
                      >
                        -
                      </Button>
                      <span className="w-8 text-center">{item.qty || 1}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => item.id && handleUpdateQuantity(item.id, (item.qty || 0) + 1)}
                        disabled={!item.id}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => item.id && handleRemoveFromCart(item.id)}
                    className="text-destructive"
                    disabled={!item.id}
                  >
                    ×
                  </Button>
                </div>
                );
              })}
            </div>
            
            <div className="bg-muted p-6 rounded-lg h-fit">
              <h2 className="text-lg font-medium mb-4">Order Summary</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                
                <Button className="w-full mt-4" size="lg">
                  Proceed to Checkout
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => router.push('/products')}
                >
                  Continue Shopping
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
