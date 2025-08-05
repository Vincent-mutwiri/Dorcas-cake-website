import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import ReviewModel from '@/models/ReviewModel';
import mongoose from 'mongoose';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    
    console.log('Looking for featured review for product:', id);
    
    // Use direct collection access to get the raw document
    const rawReviews = await ReviewModel.collection.find({ product: new mongoose.Types.ObjectId(id) }).toArray();
    console.log('Raw review data:', rawReviews.map(r => ({ 
      status: r.status, 
      isFeatured: r.isFeatured,
      id: r._id 
    })));
    
    const featuredReview = await ReviewModel.findOne({
      product: id,
      status: 'approved',
      isFeatured: true
    }).populate('user', 'name');
    
    console.log('Featured review found:', !!featuredReview);

    if (!featuredReview) {
      return NextResponse.json({ review: null });
    }

    console.log('Featured review with user:', featuredReview);
    
    return NextResponse.json({ 
      review: {
        _id: featuredReview._id,
        name: featuredReview.user?.name || featuredReview.name || 'Anonymous',
        rating: featuredReview.rating,
        comment: featuredReview.comment,
        isFeatured: featuredReview.isFeatured
      }
    });
  } catch (error) {
    console.error('FEATURED_REVIEW_ERROR', error);
    return NextResponse.json({ review: null });
  }
}