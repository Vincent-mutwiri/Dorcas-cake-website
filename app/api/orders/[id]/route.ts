// app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import OrderModel from '@/models/OrderModel';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json(
      { message: 'Unauthorized: Please log in.' },
      { status: 401 }
    );
  }

  try {
    await dbConnect();
    const order = await OrderModel.findById(params.id);

    if (!order) {
      return NextResponse.json({ message: 'Order not found.' }, { status: 404 });
    }

    // Security check: Ensure the user requesting the order is the one who placed it, or is an admin
    if (order.user.toString() !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json(
        { message: 'Forbidden: You are not authorized to view this order.' },
        { status: 403 }
      );
    }

    return NextResponse.json(order, { status: 200 });
  } catch (error) {
    console.error('GET_ORDER_DETAILS_ERROR', error);
    if (error instanceof Error && error.name === 'CastError') {
      return NextResponse.json({ message: 'Invalid order ID' }, { status: 400 });
    }
    return NextResponse.json(
      { message: 'Failed to fetch order details.' },
      { status: 500 }
    );
  }
}