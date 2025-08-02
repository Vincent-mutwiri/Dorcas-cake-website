'use client';

import { useGetMyOrdersQuery } from '@/store/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';

export default function OrdersPage() {
  const { data: orders, isLoading, error } = useGetMyOrdersQuery();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-2xl font-bold text-destructive">Error Loading Orders</h1>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <h1 className="mb-8 text-3xl font-bold">My Orders</h1>
      
      {!orders || orders.length === 0 ? (
        <div className="text-center">
          <p className="text-xl mb-4">You haven't placed any orders yet.</p>
          <Button asChild>
            <Link href="/products">Start Shopping</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order._id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Order #{order._id.substring(0, 8)}...</span>
                  <span className="text-lg">{formatPrice(order.totalPrice)}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {order.orderItems.length} item(s) • {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm">
                      Status: {order.isPaid ? 'Paid' : 'Pending Payment'} • {order.isDelivered ? 'Delivered' : 'Processing'}
                    </p>
                  </div>
                  <Button asChild variant="outline">
                    <Link href={`/orders/${order._id}`}>View Details</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}