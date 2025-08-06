// app/api/admin/offers/route.ts
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

// GET all offers for the admin panel
export async function GET(req: NextRequest) {
  try {
    const { error } = await checkAdminAccess();
    if (error) return NextResponse.json({ error }, { status: 401 });

    await dbConnect();
    const offers = await OfferModel.find({})
      .populate('product', 'name basePrice images')
      .sort({ createdAt: -1 });
    
    return NextResponse.json(offers);
  } catch (error) {
    console.error('Error fetching offers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST a new offer
export async function POST(req: NextRequest) {
  try {
    console.log('Starting offer creation...');
    const { error } = await checkAdminAccess();
    if (error) {
      console.log('Admin access check failed:', error);
      return NextResponse.json({ error }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    // Convert dates to Date objects
    body.startDate = new Date(body.startDate);
    body.endDate = new Date(body.endDate);

    // Basic validation
    const requiredFields: (keyof typeof body)[] = ['product', 'discountedPrice', 'startDate', 'endDate'];
    const missingFields = requiredFields.filter((field): field is keyof typeof body => {
      const value = body[field];
      return value === undefined || value === null || value === '';
    });
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          error: `Missing required fields: ${missingFields.join(', ')}`,
          missingFields
        },
        { status: 400 }
      );
    }
    
    // Additional validation for dates
    if (body.startDate >= body.endDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }
    
    // Validate price
    if (body.discountedPrice <= 0) {
      return NextResponse.json(
        { error: 'Discounted price must be greater than 0' },
        { status: 400 }
      );
    }
    
    // Prepare offer data
    const offerData: any = {
      ...body,
      isActive: body.isActive !== undefined ? body.isActive : true
    };

    // Handle variant weight
    if (offerData.variantWeight === '' || offerData.variantWeight === null || offerData.variantWeight === undefined) {
      // If variantWeight is empty, null, or undefined, set it to undefined
      delete offerData.variantWeight;
    } else {
      // Extract numeric value from string (e.g., '2Kg' -> 2)
      const numericValue = parseFloat(offerData.variantWeight.toString().replace(/[^0-9.]/g, ''));
      
      if (isNaN(numericValue)) {
        return NextResponse.json(
          { error: 'Variant weight must be a valid number' },
          { status: 400 }
        );
      }
      
      // Store the numeric value
      offerData.variantWeight = numericValue;
      
      // Store the original display value as a separate field
      offerData.variantDisplay = offerData.variantWeight.toString();
    }

    console.log('Creating offer with data:', JSON.stringify(offerData, null, 2));
    
    try {
      const newOffer = new OfferModel(offerData);
      console.log('New offer instance created, saving...');
      
      await newOffer.save();
      console.log('Offer saved successfully');
      
      // Populate product data in the response
      console.log('Populating product data...');
      const populatedOffer = await newOffer.populate('product', 'name basePrice images');
      console.log('Product data populated');
      
      return NextResponse.json(populatedOffer, { status: 201 });
    } catch (error) {
      const saveError = error as Error & { code?: number };
      console.error('Error saving offer:', saveError);
      
      if (saveError.code === 11000) {
        return NextResponse.json(
          { error: 'An active or scheduled offer already exists for this product/variant' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: saveError.message || 'Failed to save offer' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error creating offer:', error);
    
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
