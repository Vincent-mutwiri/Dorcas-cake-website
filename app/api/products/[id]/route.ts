// app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import ProductModel from '@/models/ProductModel';
import ReviewModel from '@/models/ReviewModel';

export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const id = context.params.id;
  try {
    await dbConnect();
    const product = await ProductModel.findById(id).populate(
      'category',
      'name slug'
    );

    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    // Also fetch reviews for this product
    const reviews = await ReviewModel.find({ product: id }).sort({
      createdAt: -1,
    });

    return NextResponse.json({ product, reviews }, { status: 200 });
  } catch (error) {
    console.error('GET_PRODUCT_DETAIL_ERROR', error);
    // Handle potential CastError if the ID format is invalid
    if (error instanceof Error && error.name === 'CastError') {
      return NextResponse.json({ message: 'Invalid product ID' }, { status: 400 });
    }
    return NextResponse.json(
      { message: 'Failed to fetch product details' },
      { status: 500 }
    );
  }
}

import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

// PUT - Update a product (Admin Only)
export async function PUT(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const id = context.params.id;
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.isAdmin) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const body = await req.json();

    if (body.category === '') {
      delete body.category;
    }

    // Handle legacy products without priceVariants
    if (!body.priceVariants && body.price) {
      body.priceVariants = [{ weight: '1KG', price: body.price }];
      body.basePrice = body.price;
      delete body.price; // Remove legacy price field
    } else if (body.priceVariants && body.priceVariants.length > 0) {
      body.basePrice = Math.min(...body.priceVariants.map((v: any) => v.price));
    }

    const updatedProduct = await ProductModel.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!updatedProduct) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json(updatedProduct, { status: 200 });
  } catch (error) {
    console.error('PUT_PRODUCT_ERROR', error);
    return NextResponse.json(
      { message: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a product (Admin Only)
export async function DELETE(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const id = context.params.id;
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.isAdmin) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const deletedProduct = await ProductModel.findByIdAndDelete(id);

    if (!deletedProduct) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json(
      { message: 'Product deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE_PRODUCT_ERROR', error);
    return NextResponse.json(
      { message: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
