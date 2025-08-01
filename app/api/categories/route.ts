// app/api/categories/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import CategoryModel from '@/models/CategoryModel';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

// GET all categories
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const categories = await CategoryModel.find({});
    return NextResponse.json(categories, { status: 200 });
  } catch (error) {
    console.error('GET_CATEGORIES_ERROR', error);
    return NextResponse.json(
      { message: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST a new category (Admin Only)
export async function POST(req: NextRequest) {
  // Check for admin session
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.isAdmin) {
    return NextResponse.json(
      { message: 'Unauthorized: Admin access required' },
      { status: 401 }
    );
  }

  try {
    await dbConnect();
    const { name, description, image } = await req.json();

    if (!name) {
      return NextResponse.json(
        { message: 'Category name is required' },
        { status: 400 }
      );
    }

    // Create a URL-friendly slug from the name
    const slug = name.toLowerCase().replace(/\s+/g, '-');

    const existingCategory = await CategoryModel.findOne({ slug });
    if (existingCategory) {
      return NextResponse.json(
        { message: 'A category with this name already exists' },
        { status: 409 }
      );
    }

    const newCategory = new CategoryModel({
      name,
      slug,
      description,
      image,
    });

    const savedCategory = await newCategory.save();
    return NextResponse.json(savedCategory, { status: 201 });
  } catch (error) {
    console.error('POST_CATEGORY_ERROR', error);
    return NextResponse.json(
      { message: 'Failed to create category' },
      { status: 500 }
    );
  }
}