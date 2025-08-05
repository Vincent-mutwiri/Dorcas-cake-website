import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import ReviewModel from '@/models/ReviewModel';
import ProductModel from '@/models/ProductModel';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';

// PUT - Update a review's status (approve/reject/feature)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.isAdmin) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const { status, isFeatured } = await req.json();
  const review = await ReviewModel.findById(params.id);

  if (!review) {
    return NextResponse.json({ message: 'Review not found' }, { status: 404 });
  }

  const wasApproved = review.status === 'approved';
  review.status = status ?? review.status;
  review.isFeatured = isFeatured ?? review.isFeatured;
  const updatedReview = await review.save();

  // If the review is newly approved, update the product's rating
  if (status === 'approved' && !wasApproved) {
    const product = await ProductModel.findById(review.product);
    if (product) {
      product.rating = (product.rating * product.numReviews + review.rating) / (product.numReviews + 1);
      product.numReviews += 1;
      await product.save();
    }
  }

  return NextResponse.json(updatedReview, { status: 200 });
}

// DELETE - Delete a review
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.isAdmin) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  try {
    const deletedReview = await ReviewModel.findByIdAndDelete(params.id);
    if (!deletedReview) {
      return NextResponse.json({ message: 'Review not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Review deleted' });
  } catch (error) {
    console.error('DELETE_REVIEW_ERROR', error);
    return NextResponse.json(
      { message: 'Error deleting review' },
      { status: 500 }
    );
  }
}