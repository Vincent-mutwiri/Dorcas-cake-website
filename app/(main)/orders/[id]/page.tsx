'use client';

import { useParams } from 'next/navigation';
import Image from 'next/image';
import { useGetOrderByIdQuery } from '@/store/services/api';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function OrderDetailPage() {
  const params = useParams();
  const { id: orderId } = params as { id: string };

  const { data: order, isLoading, error } = useGetOrderByIdQuery(orderId);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-2xl font-bold text-destructive">Order Not Found</h1>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <h1 className="mb-4 text-3xl font-bold">
        Thank You! Order #{order._id.substring(0, 8)}...
      </h1>
      <p className="mb-8 text-muted-foreground">
        Your order has been placed successfully. A confirmation has been sent to your email.
      </p>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle>Order Items</CardTitle></CardHeader>
            <CardContent>
              {order.orderItems.map((item) => (
                <div key={item.product} className="flex items-center space-x-4 py-2 border-b last:border-b-0">
                  <Image src={item.image} alt={item.name} width={64} height={64} className="rounded-md" />
                  <div className="flex-1">{item.name}</div>
                  <div>{item.qty} x ${item.price.toFixed(2)}</div>
                  <div className="font-semibold">${(item.qty * item.price).toFixed(2)}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between"><span>Subtotal</span><span>${order.itemsPrice.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>${order.shippingPrice.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Tax</span><span>${order.taxPrice.toFixed(2)}</span></div>
              <hr />
              <div className="flex justify-between font-bold"><span>Total</span><span>${order.totalPrice.toFixed(2)}</span></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Shipping Details</CardTitle></CardHeader>
            <CardContent>
              <p>{order.shippingAddress.address}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
              <p>{order.shippingAddress.country}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}