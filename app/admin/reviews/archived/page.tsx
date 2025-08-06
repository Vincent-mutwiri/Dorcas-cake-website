'use client';

import { useState } from 'react';
import { useGetReviewsQuery, useUpdateReviewMutation } from '@/store/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Star, Check, X, Award, User } from 'lucide-react';
import Image from 'next/image';

export default function ArchivedReviewsPage() {
  const { toast } = useToast();
  const { data: allReviews, isLoading, error, refetch } = useGetReviewsQuery();
  const [updateReview] = useUpdateReviewMutation();

  const archivedReviews = allReviews?.filter(review => 
    review.status === 'approved' || review.status === 'rejected'
  ) || [];
  
  console.log('All reviews:', allReviews);
  allReviews?.forEach(r => console.log('Review:', r._id, 'Status:', r.status));
  console.log('Archived reviews:', archivedReviews);

  const handleStatusUpdate = async (reviewId: string, status: 'approved' | 'rejected') => {
    try {
      await updateReview({ id: reviewId, data: { status } }).unwrap();
      toast({ title: 'Success', description: `Review ${status}.` });
      refetch();
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
  if (error) return <p className="text-destructive">Failed to load archived reviews.</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Archived Reviews</h1>

      {archivedReviews.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl mb-4">No archived reviews found</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {archivedReviews.map((review) => (
            <Card key={review._id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {review.user?.profilePicture && review.user.profilePicture !== '/images/default-avatar.png' ? (
                        <img 
                          src={review.user.profilePicture} 
                          alt={review.user.name || review.name} 
                          width={40} 
                          height={40} 
                          className="rounded-full object-cover" 
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-500" />
                        </div>
                      )}
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
                  >
                    <Check className="h-4 w-4 mr-1" />
                    {review.status === 'approved' ? 'Approved' : 'Approve'}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant={review.status === 'rejected' ? 'destructive' : 'outline'}
                    onClick={() => handleStatusUpdate(review._id, 'rejected')}
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