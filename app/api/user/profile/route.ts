// app/api/user/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import UserModel from '@/models/UserModel';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';


export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const body = await req.json();
    


    const updateData: any = {
      name: body.name,
      profilePicture: body.imageUrl, // Use profilePicture field that exists in DB
    };
    
    // Update addresses array if defaultShippingAddress has data
    if (body.defaultShippingAddress && Object.values(body.defaultShippingAddress).some(val => val && val.trim())) {
      updateData.addresses = [body.defaultShippingAddress];
    }
    
    const updatedUser = await UserModel.findByIdAndUpdate(
      session.user.id,
      updateData,
      { new: true, runValidators: false }
    ).select('-password');
    


    if (!updatedUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error('PROFILE_UPDATE_ERROR', error);
    return NextResponse.json({ message: 'Failed to update profile' }, { status: 500 });
  }
}