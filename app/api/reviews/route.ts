// app/api/reviews/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import ReviewModel from '@/models/ReviewModel';
import ProductModel from '@/models/ProductModel';
import OrderModel from '@/models/OrderModel';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json(
      { message: 'Unauthorized: Please log in to leave a review.' },
      { status: 401 }
    );
  }

  try {
    await dbConnect();
    const { productId, rating, comment } = await req.json();
    const userId = session.user.id;

    if (!productId || !rating || !comment) {
      return NextResponse.json(
        { message: 'Product ID, rating, and comment are required.' },
        { status: 400 }
      );
    }

    const product = await ProductModel.findById(productId);
    if (!product) {
      return NextResponse.json({ message: 'Product not found.' }, { status: 404 });
    }

    // 1. Check if the user has already reviewed this product
    const existingReview = await ReviewModel.findOne({
      user: userId,
      product: productId,
    });
    if (existingReview) {
      return NextResponse.json(
        { message: 'You have already submitted a review for this product.' },
        { status: 409 } // 409 Conflict
      );
    }

    // 2. (Optional but recommended) Check if the user has purchased this product
    const hasPurchased = await OrderModel.findOne({
      user: userId,
      isPaid: true,
      'orderItems.product': productId, // Check if the product exists in any of the user's paid orders
    });

    if (!hasPurchased) {
      return NextResponse.json(
        { message: 'You can only review products you have purchased.' },
        { status: 403 } // 403 Forbidden
      );
    }

    // 3. Create the new review
    const newReview = new ReviewModel({
      user: userId,
      product: productId,
      name: session.user.name, // Denormalize user's name for easy display
      rating,
      comment,
    });
    await newReview.save();

    // 4. Update the product's rating and number of reviews
    product.rating =
      (product.rating * product.numReviews + rating) / (product.numReviews + 1);
    product.numReviews += 1;
    await product.save();

    return NextResponse.json(
      { message: 'Review submitted successfully!', review: newReview },
      { status: 201 }
    );
  } catch (error) {
    console.error('SUBMIT_REVIEW_ERROR', error);
    return NextResponse.json(
      { message: 'Failed to submit review.' },
      { status: 500 }
    );
  }
}