import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import ReviewModel from '@/models/ReviewModel';
import ProductModel from '@/models/ProductModel';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import mongoose from 'mongoose';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.isAdmin) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const { status, isFeatured } = await req.json();
    
    const { id } = await params;
    console.log('Updating review:', id, 'with data:', { status, isFeatured });
    
    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
    
    console.log('Update data:', updateData);
    
    // Force update using direct MongoDB operation
    const setData: any = { updatedAt: new Date() };
    if (status !== undefined) setData.status = status;
    if (isFeatured !== undefined) setData.isFeatured = isFeatured;
    
    const result = await ReviewModel.collection.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: setData }
    );
    
    console.log('Direct update result:', result);
    
    const updatedReview = await ReviewModel.findById(id)
      .populate('product', 'name images')
      .populate('user', 'name');

    if (!updatedReview) {
      return NextResponse.json({ message: 'Review not found' }, { status: 404 });
    }

    console.log('Updated review after update:', updatedReview.toObject());
    console.log('Updated review status:', updatedReview.status);

    // If review is approved, update product's reviews array and rating
    if (status === 'approved' && updatedReview.product) {
      try {
        // Add review to product's reviews array
        await ProductModel.findByIdAndUpdate(
          updatedReview.product._id,
          { $addToSet: { reviews: updatedReview._id } }
        );
        
        // Calculate new average rating
        const approvedReviews = await ReviewModel.find({
          product: updatedReview.product._id,
          status: 'approved'
        });
        
        const totalRating = approvedReviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = approvedReviews.length > 0 ? totalRating / approvedReviews.length : 0;
        const numReviews = approvedReviews.length;
        
        // Update product with new rating
        await ProductModel.findByIdAndUpdate(
          updatedReview.product._id,
          { 
            rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
            numReviews: numReviews
          }
        );
        
        console.log(`Updated product rating: ${averageRating} (${numReviews} reviews)`);
      } catch (productError) {
        console.log('Product update error:', productError);
      }
    }

    // Return the review with actual values
    const reviewObj = updatedReview.toObject();
    return NextResponse.json(reviewObj);
  } catch (error) {
    console.error('UPDATE_REVIEW_ERROR', error);
    return NextResponse.json({ message: 'Failed to update review' }, { status: 500 });
  }
}