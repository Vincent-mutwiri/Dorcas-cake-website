// components/modals/ReviewModal.tsx
'use client';

import { useState } from 'react';
import { useSubmitReviewMutation } from '@/store/services/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Rating } from 'react-simple-star-rating';

interface ReviewModalProps {
  productId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ReviewModal({ productId, isOpen, onClose }: ReviewModalProps) {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitReview, { isLoading }] = useSubmitReviewMutation();

  const handleRating = (rate: number) => setRating(rate);

  const handleSubmit = async () => {
    if (rating === 0 || !comment) {
      toast({ variant: 'destructive', title: 'Please provide a rating and a comment.' });
      return;
    }
    try {
      await submitReview({ productId, rating, comment }).unwrap();
      toast({ title: 'Success!', description: 'Your review is pending approval.' });
      onClose();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.data?.message || 'Failed to submit review.' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Write a Review</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex justify-center">
            <Rating onClick={handleRating} initialValue={rating} />
          </div>
          <Textarea
            placeholder="Share your feedback..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <Button onClick={handleSubmit} disabled={isLoading} className="w-full">
            {isLoading ? 'Submitting...' : 'Submit Review'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}