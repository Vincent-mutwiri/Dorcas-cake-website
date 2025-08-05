import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import ReviewModel from '@/models/ReviewModel';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.isAdmin) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    
    // Update all reviews without status field to have 'pending' status
    const result = await ReviewModel.updateMany(
      { status: { $exists: false } },
      { $set: { status: 'pending', isFeatured: false } }
    );

    return NextResponse.json({ 
      message: `Updated ${result.modifiedCount} reviews with default status`,
      modifiedCount: result.modifiedCount 
    });
  } catch (error) {
    console.error('MIGRATE_REVIEWS_ERROR', error);
    return NextResponse.json({ message: 'Failed to migrate reviews' }, { status: 500 });
  }
}