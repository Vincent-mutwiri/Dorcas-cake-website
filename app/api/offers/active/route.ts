// app/api/offers/active/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import OfferModel from '@/models/OfferModel';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const now = new Date();

    const activeOffers = await OfferModel.find({
      isActive: true,
      startDate: { $lte: now }, // Start date is in the past or now
      endDate: { $gte: now },   // End date is in the future or now
    })
    .populate({
      path: 'product',
      select: 'name basePrice images category',
      populate: { 
        path: 'category',
        select: 'name slug'
      }
    })
    .select('-__v -createdAt -updatedAt -isActive') // Exclude unnecessary fields
    .lean();

    // Transform the data to a more client-friendly format
    const formattedOffers = activeOffers.map(offer => ({
      ...offer,
      product: {
        ...offer.product,
        id: offer.product._id.toString(),
        _id: undefined,
        category: {
          ...offer.product.category,
          id: offer.product.category?._id?.toString(),
          _id: undefined
        }
      },
      id: offer._id.toString(),
      _id: undefined,
      isActive: undefined,
      // Calculate discount percentage
      discountPercentage: Math.round(
        ((offer.product.basePrice - offer.discountedPrice) / offer.product.basePrice) * 100
      )
    }));

    // Set cache headers - cache for 1 hour
    const response = NextResponse.json(formattedOffers);
    response.headers.set('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    
    return response;
  } catch (error) {
    console.error('Error fetching active offers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active offers' },
      { status: 500 }
    );
  }
}
