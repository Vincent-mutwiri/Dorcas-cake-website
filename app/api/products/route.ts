// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import ProductModel from '@/models/ProductModel';
import CategoryModel from '@/models/CategoryModel';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

// GET all products
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    // Ensure CategoryModel is loaded
    CategoryModel;
    const products = await ProductModel.find({}).populate('category', 'name slug');
    return NextResponse.json(products, { status: 200 });
  } catch (error) {
    console.error('GET_PRODUCTS_ERROR', error);
    return NextResponse.json(
      { message: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST a new product (Admin Only)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.isAdmin) {
    return NextResponse.json(
      { message: 'Unauthorized: Admin access required' },
      { status: 401 }
    );
  }

  try {
    await dbConnect();
    const body = await req.json();
    const { name, description, priceVariants, category, stock, images } = body;

    if (!name || !description || !priceVariants || !category || !stock || !images) {
      return NextResponse.json(
        { message: 'All product fields are required' },
        { status: 400 }
      );
    }

    // Calculate basePrice from the variants
    if (priceVariants && priceVariants.length > 0) {
      body.basePrice = Math.min(...priceVariants.map((v: any) => v.price));
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-');

    const newProduct = new ProductModel({
      ...body,
      slug,
    });

    const savedProduct = await newProduct.save();
    return NextResponse.json(savedProduct, { status: 201 });
  } catch (error) {
    console.error('POST_PRODUCT_ERROR', error);
    return NextResponse.json(
      { message: 'Failed to create product' },
      { status: 500 }
    );
  }
}