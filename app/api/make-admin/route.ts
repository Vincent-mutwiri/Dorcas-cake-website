import { NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import UserModel from '@/models/UserModel';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    await dbConnect();
    await UserModel.updateOne({ email }, { isAdmin: true });
    return NextResponse.json({ message: 'User made admin' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}