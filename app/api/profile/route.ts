import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import dbConnect from '@/utils/db';
import UserModel from '@/models/UserModel';

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const { profilePicture } = await req.json();
    
    const updatedUser = await UserModel.findByIdAndUpdate(
      session.user.id,
      { profilePicture },
      { new: true }
    ).select('-password');

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to update profile' }, { status: 500 });
  }
}