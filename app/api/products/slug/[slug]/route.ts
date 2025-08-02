// app/api/products/slug/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../../utils/db';
import ProductModel from '../../../../../models/ProductModel';
import ReviewModel from '../../../../../models/ReviewModel';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  await dbConnect();

  try {
    const product = await ProductModel.findOne({ slug: params.slug }).populate(
      'category',
      'name slug'
    );

    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    const reviews = await ReviewModel.find({ product: product._id }).sort({
      createdAt: -1,
    });

    return NextResponse.json({ product, reviews });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}