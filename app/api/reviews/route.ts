// app/api/reviews/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import ReviewModel from '@/models/ReviewModel';
import ProductModel from '@/models/ProductModel';
import OrderModel from '@/models/OrderModel';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.isAdmin) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    // Use aggregation to get reviews with populated fields and preserve status/isFeatured
    const reviews = await ReviewModel.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: { path: '$product', preserveNullAndEmptyArrays: true }
      },
      {
        $unwind: { path: '$user', preserveNullAndEmptyArrays: true }
      },
      {
        $project: {
          _id: 1,
          rating: 1,
          comment: 1,
          createdAt: 1,
          updatedAt: 1,
          status: { $ifNull: ['$status', 'pending'] },
          isFeatured: { $ifNull: ['$isFeatured', false] },
          'product._id': 1,
          'product.name': 1,
          'product.images': 1,
          'user._id': 1,
          'user.name': 1,
          'user.email': 1
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]);
    
    console.log('Reviews with status:', reviews[0]);
    return NextResponse.json(reviews);
  } catch (error) {
    console.error('GET_REVIEWS_ERROR', error);
    return NextResponse.json({ message: 'Failed to fetch reviews' }, { status: 500 });
  }
}

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
      isDelivered: true, // Only allow reviews for delivered orders
      'orderItems.product': productId,
    });

    if (!hasPurchased) {
      return NextResponse.json(
        { message: 'You can only review products from delivered orders.' },
        { status: 403 }
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

    return NextResponse.json(
      { message: 'Review submitted and is pending approval.', review: newReview },
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