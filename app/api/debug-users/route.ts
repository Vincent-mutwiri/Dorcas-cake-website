import { NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import UserModel from '@/models/UserModel';

export async function GET() {
  try {
    await dbConnect();
    const users = await UserModel.find({}).select('name email isAdmin createdAt');
    return NextResponse.json({ 
      count: users.length,
      users: users.map(u => ({
        _id: u._id,
        name: u.name,
        email: u.email,
        isAdmin: u.isAdmin,
        createdAt: u.createdAt
      }))
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}