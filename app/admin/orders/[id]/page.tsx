'use client';

import { useParams } from 'next/navigation';
import { useGetOrderByIdQuery, useUpdateOrderMutation } from '@/store/services/api';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import Image from 'next/image';

export default function AdminOrderDetailPage() {
  const params = useParams();
  const { id: orderId } = params as { id: string };
  const { toast } = useToast();

  const { data: order, isLoading, error } = useGetOrderByIdQuery(orderId);
  const [updateOrder, { isLoading: isUpdating }] = useUpdateOrderMutation();

  const deliverHandler = async () => {
    try {
      await updateOrder({ id: orderId, data: { isDelivered: true } }).unwrap();
      toast({ title: 'Success', description: 'Order marked as delivered.' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update order.' });
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error || !order) return <p className="text-destructive">Order not found.</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Order #{order._id.substring(0, 8)}...</h1>
      
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle>Order Items</CardTitle></CardHeader>
            <CardContent>
              {order.orderItems.map((item) => (
                <div key={item.product} className="flex items-center space-x-4 py-2 border-b last:border-b-0">
                  <Image src={item.image} alt={item.name} width={64} height={64} className="rounded-md" />
                  <div className="flex-1">{item.name}</div>
                  <div>{item.qty} x KSh {item.price.toFixed(2)}</div>
                  <div className="font-semibold">KSh {(item.qty * item.price).toFixed(2)}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between"><span>Subtotal</span><span>KSh {order.itemsPrice.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>KSh {order.shippingPrice.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Tax</span><span>KSh {order.taxPrice.toFixed(2)}</span></div>
              <hr />
              <div className="flex justify-between font-bold"><span>Total</span><span>KSh {order.totalPrice.toFixed(2)}</span></div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader><CardTitle>Order Actions</CardTitle></CardHeader>
            <CardContent>
              {!order.isDelivered && (
                <Button onClick={deliverHandler} disabled={isUpdating}>
                  {isUpdating ? 'Marking...' : 'Mark as Delivered'}
                </Button>
              )}
              {order.isDelivered && <p className="text-green-600 font-semibold">Order has been delivered.</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}