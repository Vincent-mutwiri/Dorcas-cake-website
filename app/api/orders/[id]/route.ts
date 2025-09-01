// app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import OrderModel from '@/models/OrderModel';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json(
      { message: 'Unauthorized: Please log in.' },
      { status: 401 }
    );
  }

  try {
    await dbConnect();
    const order = await OrderModel.findById(id);

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

// PUT - Update order to delivered (Admin Only)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.isAdmin) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const body = await req.json();
    const order = await OrderModel.findById(id);

    if (order) {
      if (body.isDelivered !== undefined) {
        order.isDelivered = body.isDelivered;
        if (body.isDelivered) order.deliveredAt = new Date();
      }
      if (body.isPaid !== undefined) {
        order.isPaid = body.isPaid;
        if (body.isPaid) order.paidAt = new Date();
      }
      const updatedOrder = await order.save();
      return NextResponse.json(updatedOrder, { status: 200 });
    } else {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('UPDATE_ORDER_ERROR', error);
    return NextResponse.json({ message: 'Failed to update order' }, { status: 500 });
  }
}