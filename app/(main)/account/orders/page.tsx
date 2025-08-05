// app/(main)/account/orders/page.tsx
'use client';

import { useState } from 'react';
import { useGetMyOrdersQuery } from '@/store/services/api';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ReviewModal from '@/components/modals/ReviewModal'; // We will create this next

export default function MyOrdersPage() {
  const { data: orders, isLoading, error } = useGetMyOrdersQuery();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const openReviewModal = (productId: string) => {
    setSelectedProductId(productId);
    setIsModalOpen(true);
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <p>Failed to load your orders.</p>;

  return (
    <>
      <div className="container py-12">
        <h1 className="text-3xl font-bold mb-8">My Order History</h1>
        <div className="space-y-6">
          {orders?.map((order) => (
            <Card key={order._id}>
              <CardHeader>
                <CardTitle>Order #{order._id.substring(0, 8)}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Placed on: {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </CardHeader>
              <CardContent>
                {order.orderItems.map((item) => (
                  <div key={item.product} className="flex justify-between items-center py-2 border-b">
                    <div>
                      <p className="font-semibold">{item.name} ({item.weight})</p>
                      <p>Ksh {item.price.toFixed(2)}</p>
                    </div>
                    <Button variant="outline" onClick={() => openReviewModal(item.product.toString())}>
                      Leave a Review
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      {selectedProductId && (
        <ReviewModal
          productId={selectedProductId}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}