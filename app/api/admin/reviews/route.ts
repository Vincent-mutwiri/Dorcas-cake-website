import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import ReviewModel from '@/models/ReviewModel';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';

// GET all reviews for the admin panel
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.isAdmin) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  await dbConnect();
  const reviews = await ReviewModel.find({}).populate('product', 'name').sort({ createdAt: -1 });
  return NextResponse.json(reviews, { status: 200 });
}