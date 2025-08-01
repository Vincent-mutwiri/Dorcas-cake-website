// app/api/orders/mine/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import OrderModel from '@/models/OrderModel';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json(
      { message: 'Unauthorized: Please log in to view your orders.' },
      { status: 401 }
    );
  }

  try {
    await dbConnect();
    const orders = await OrderModel.find({ user: session.user.id }).sort({
      createdAt: -1, // Show the most recent orders first
    });

    return NextResponse.json(orders, { status: 200 });
  } catch (error) {
    console.error('GET_MY_ORDERS_ERROR', error);
    return NextResponse.json(
      { message: 'Failed to fetch your orders.' },
      { status: 500 }
    );
  }
}