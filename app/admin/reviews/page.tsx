'use client';

import { useState } from 'react';
import { useGetReviewsQuery, useUpdateReviewMutation } from '@/store/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Star, Check, X, Award } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

export default function AdminReviewsPage() {
  const { toast } = useToast();
  const { data: reviews, isLoading, error, refetch } = useGetReviewsQuery();
  
  console.log('Reviews data:', reviews);
  console.log('Full review object:', reviews?.[0]);
  console.log('Review status:', reviews?.[0]?.status);
  console.log('Pending reviews:', reviews?.filter(r => r.status === 'pending'));
  const [updateReview] = useUpdateReviewMutation();

  const handleStatusUpdate = async (reviewId: string, status: 'approved' | 'rejected') => {
    try {
      await updateReview({ id: reviewId, data: { status } }).unwrap();
      toast({ title: 'Success', description: `Review ${status}.` });
      setTimeout(() => refetch(), 100);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update review.' });
    }
  };

  const handleFeatureToggle = async (reviewId: string, isFeatured: boolean) => {
    try {
      await updateReview({ id: reviewId, data: { isFeatured: !isFeatured } }).unwrap();
      toast({ title: 'Success', description: `Review ${!isFeatured ? 'featured' : 'unfeatured'}.` });
      refetch();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update review.' });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'approved':
        return <Badge variant="default">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <p className="text-destructive">Failed to load reviews.</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Review Management</h1>

      <div className="flex gap-4 mb-6">
        <Button asChild variant="outline">
          <Link href="/admin/reviews/archived">View Archived Reviews</Link>
        </Button>
      </div>

      {!reviews || reviews.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl mb-4">No reviews found</p>
        </div>
      ) : reviews.filter(r => r.status === 'pending').length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl mb-4">No pending reviews found</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {reviews.filter(review => review.status === 'pending').map((review) => (
            <Card key={review._id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {(review.user?.name || review.name || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{review.user?.name || review.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {review.product?.images?.[0] && (
                          <img 
                            src={review.product.images[0]} 
                            alt={review.product.name}
                            className="w-8 h-8 object-cover rounded"
                          />
                        )}
                        <p className="text-sm text-muted-foreground">
                          Product: {review.product?.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex">{renderStars(review.rating)}</div>
                        <span className="text-sm">({review.rating}/5)</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(review.status)}
                    {review.isFeatured && (
                      <Badge variant="outline" className="text-yellow-600">
                        <Award className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">{review.comment}</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Submitted: {new Date(review.createdAt).toLocaleDateString()}
                </p>
                
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={review.status === 'approved' ? 'default' : 'outline'}
                    onClick={() => handleStatusUpdate(review._id, 'approved')}
                    disabled={review.status === 'approved'}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    {review.status === 'approved' ? 'Approved' : 'Approve'}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant={review.status === 'rejected' ? 'destructive' : 'outline'}
                    onClick={() => handleStatusUpdate(review._id, 'rejected')}
                    disabled={review.status === 'rejected'}
                  >
                    <X className="h-4 w-4 mr-1" />
                    {review.status === 'rejected' ? 'Rejected' : 'Reject'}
                  </Button>
                  
                  {review.status === 'approved' && (
                    <Button
                      size="sm"
                      variant={review.isFeatured ? 'default' : 'outline'}
                      onClick={() => handleFeatureToggle(review._id, review.isFeatured)}
                    >
                      <Award className="h-4 w-4 mr-1" />
                      {review.isFeatured ? 'Featured' : 'Feature'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}