'use client';

import { useState } from 'react';
import { useGetMyOrdersQuery, useSubmitReviewMutation } from '@/store/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { Star } from 'lucide-react';

export default function OrdersPage() {
  const { data: orders, isLoading, error } = useGetMyOrdersQuery();
  const [submitReview] = useSubmitReviewMutation();
  const { toast } = useToast();
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '', productId: '' });
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  const handleReviewSubmit = async () => {
    try {
      await submitReview(reviewData).unwrap();
      toast({ title: 'Success', description: 'Review submitted successfully!' });
      setIsReviewOpen(false);
      setReviewData({ rating: 5, comment: '', productId: '' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to submit review.' });
    }
  };

  const openReviewModal = (productId: string) => {
    setReviewData({ ...reviewData, productId });
    setIsReviewOpen(true);
  };

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
                <div className="space-y-4">
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
                  
                  {order.isDelivered && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">Order Items:</h4>
                      <div className="grid gap-2">
                        {order.orderItems.map((item) => (
                          <div key={item._id} className="flex justify-between items-center p-2 bg-muted rounded">
                            <div className="flex items-center gap-3">
                              <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded" />
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-sm text-muted-foreground">Qty: {item.qty} • KSh {item.price.toFixed(2)}</p>
                              </div>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => openReviewModal(item.product)}
                            >
                              <Star className="h-4 w-4 mr-1" />
                              Review
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Rating</Label>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-6 w-6 cursor-pointer ${
                      star <= reviewData.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                    }`}
                    onClick={() => setReviewData({ ...reviewData, rating: star })}
                  />
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="comment">Comment</Label>
              <Textarea
                id="comment"
                value={reviewData.comment}
                onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                placeholder="Share your experience with this product..."
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleReviewSubmit}>Submit Review</Button>
              <Button variant="outline" onClick={() => setIsReviewOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}