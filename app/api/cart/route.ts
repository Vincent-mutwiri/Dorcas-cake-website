// app/api/cart/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import ProductModel, { type IProduct } from '@/models/ProductModel';

// This type defines the shape of the items we expect in the request body
type CartItemRequest = {
  productId: string;
  qty: number;
};

export async function POST(req: NextRequest) {
  try {
    const items: CartItemRequest[] = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { message: 'Cart items are required.' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Extract all product IDs from the incoming cart items
    const productIds = items.map((item) => item.productId);

    // Fetch all the relevant products from the database in a single query
    const products = await ProductModel.find({ _id: { $in: productIds } });

    // Create a map for quick lookup of product details by ID
    const productMap = new Map(
      products.map((product: IProduct & { _id: any }) => [product._id.toString(), product])
    );

    // Combine the fresh product data with the quantities from the user's cart
    const cartDetails = items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) {
        // This can happen if a product was deleted after being added to the cart
        return null;
      }
      return {
        productId: product._id,
        name: product.name,
        slug: product.slug,
        image: product.images[0], // Use the first image for the cart view
        price: product.price,
        stock: product.stock,
        qty: item.qty,
      };
    }).filter(Boolean); // Filter out any null items

    return NextResponse.json(cartDetails, { status: 200 });
  } catch (error) {
    console.error('CART_DETAILS_ERROR', error);
    return NextResponse.json(
      { message: 'Failed to fetch cart details.' },
      { status: 500 }
    );
  }
}