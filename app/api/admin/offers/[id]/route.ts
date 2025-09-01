// app/api/admin/offers/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import OfferModel from '@/models/OfferModel';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Helper function to check admin access
async function checkAdminAccess() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return { error: 'Unauthorized', status: 401 };
  }
  return { session };
}

// GET a single offer
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { error } = await checkAdminAccess();
    if (error) return NextResponse.json({ error }, { status: 401 });

    await dbConnect();
    
    const offer = await OfferModel.findById(id).populate('product', 'name basePrice images');
    
    if (!offer) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(offer);
  } catch (error) {
    console.error('Error fetching offer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// UPDATE an offer
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { error } = await checkAdminAccess();
    if (error) return NextResponse.json({ error }, { status: 401 });

    await dbConnect();
    const body = await req.json();
    
    // Validate dates if provided
    if (body.startDate || body.endDate) {
      const startDate = body.startDate ? new Date(body.startDate) : undefined;
      const endDate = body.endDate ? new Date(body.endDate) : undefined;
      
      if (startDate && endDate && endDate <= startDate) {
        return NextResponse.json(
          { error: 'End date must be after start date' },
          { status: 400 }
        );
      }
    }
    
    // Validate price if provided
    if (body.discountedPrice !== undefined && body.discountedPrice <= 0) {
      return NextResponse.json(
        { error: 'Discounted price must be greater than 0' },
        { status: 400 }
      );
    }

    const updatedOffer = await OfferModel.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    ).populate('product', 'name basePrice images');
    
    if (!updatedOffer) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedOffer);
  } catch (error: any) {
    console.error('Error updating offer:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'An active or scheduled offer already exists for this product' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE an offer
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { error } = await checkAdminAccess();
    if (error) return NextResponse.json({ error }, { status: 401 });

    await dbConnect();
    
    const deletedOffer = await OfferModel.findByIdAndDelete(id);
    
    if (!deletedOffer) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { message: 'Offer deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting offer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
