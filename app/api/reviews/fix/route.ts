import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import ReviewModel from '@/models/ReviewModel';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    // Directly update the specific review to be approved and featured
    const result = await ReviewModel.collection.updateOne(
      { _id: new mongoose.Types.ObjectId('689237b65dc0aa3bcf9818d9') },
      { 
        $set: { 
          status: 'approved',
          isFeatured: true,
          updatedAt: new Date()
        } 
      }
    );

    return NextResponse.json({ 
      message: 'Review fixed',
      result: result
    });
  } catch (error) {
    console.error('FIX_REVIEW_ERROR', error);
    return NextResponse.json({ message: 'Failed to fix review' }, { status: 500 });
  }
}