// app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import OrderModel, { IOrderItem } from '@/models/OrderModel';
import ProductModel, { IProduct } from '@/models/ProductModel';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

// Helper function to calculate prices
const calculatePrices = (orderItems: IOrderItem[]) => {
  const itemsPrice = orderItems.reduce(
    (acc, item) => acc + item.price * item.qty,
    0
  );
  // Simple tax calculation (e.g., 8%)
  const taxPrice = itemsPrice * 0.08;
  // Shipping is free for orders over $100
  const shippingPrice = itemsPrice > 100 ? 0 : 10;
  const totalPrice = itemsPrice + taxPrice + shippingPrice;

  return {
    itemsPrice: parseFloat(itemsPrice.toFixed(2)),
    taxPrice: parseFloat(taxPrice.toFixed(2)),
    shippingPrice: parseFloat(shippingPrice.toFixed(2)),
    totalPrice: parseFloat(totalPrice.toFixed(2)),
  };
};

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json(
      { message: 'Unauthorized: Please log in to place an order.' },
      { status: 401 }
    );
  }

  try {
    const { orderItems, shippingAddress, paymentMethod } = await req.json();
    console.log('Order request data:', { orderItems, shippingAddress, paymentMethod });

    if (!orderItems || orderItems.length === 0) {
      return NextResponse.json(
        { message: 'No order items found.' },
        { status: 400 }
      );
    }

    await dbConnect();

    // IMPORTANT: Recalculate prices on the backend to prevent client-side manipulation
    const productIds = orderItems.map((item: IOrderItem) => item.product);
    const dbProducts = await ProductModel.find({ _id: { $in: productIds } });
    const productMap = new Map(dbProducts.map((product: IProduct & { _id: any }) => [product._id.toString(), product]));

    const finalOrderItems = orderItems.map((item: IOrderItem) => {
      const dbProduct = productMap.get(item.product.toString());
      if (!dbProduct) {
        throw new Error(`Product with ID ${item.product} not found.`);
      }
      // Check stock
      if (item.qty > dbProduct.stock) {
        throw new Error(`Not enough stock for ${dbProduct.name}.`);
      }
      return {
        ...item,
        price: dbProduct.price, // Use the price from the database
      };
    });

    const { itemsPrice, taxPrice, shippingPrice, totalPrice } =
      calculatePrices(finalOrderItems);

    const newOrder = new OrderModel({
      user: session.user.id,
      orderItems: finalOrderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    });

    const createdOrder = await newOrder.save();

    // After creating the order, decrement the stock for each product
    for (const item of createdOrder.orderItems) {
      await ProductModel.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.qty },
      });
    }

    return NextResponse.json(createdOrder, { status: 201 });
  } catch (error: any) {
    console.error('CREATE_ORDER_ERROR', error);
    return NextResponse.json(
      { message: error.message || 'Failed to create order.' },
      { status: 500 }
    );
  }
}