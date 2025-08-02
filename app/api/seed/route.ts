// app/api/seed/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import ProductModel from '@/models/ProductModel';
import CategoryModel from '@/models/CategoryModel';
import UserModel from '@/models/UserModel';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
  await dbConnect();

  try {
    // Clear existing data
    await CategoryModel.deleteMany({});
    await ProductModel.deleteMany({});
    await UserModel.deleteMany({});

    // Create test users
    const hashedPassword = await bcrypt.hash('password123', 12);
    await UserModel.insertMany([
      {
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
        isAdmin: false,
      },
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: hashedPassword,
        isAdmin: true,
      },
    ]);

    // Create sample categories
    const categories = await CategoryModel.insertMany([
      { name: 'Classic Cakes', slug: 'classic-cakes' },
      { name: 'Chocolate Cakes', slug: 'chocolate-cakes' },
      { name: 'Fruit Cakes', slug: 'fruit-cakes' },
      { name: 'Specialty Cakes', slug: 'specialty-cakes' },
    ]);

    const classicCategory = categories.find((c) => c.slug === 'classic-cakes')!._id;
    const chocolateCategory = categories.find((c) => c.slug === 'chocolate-cakes')!._id;
    const fruitCategory = categories.find((c) => c.slug === 'fruit-cakes')!._id;

    // Create sample products
    await ProductModel.insertMany([
      {
        name: 'Velvet Vanilla Dream',
        slug: 'velvet-vanilla-dream',
        description: 'A classic vanilla sponge cake with rich buttercream frosting.',
        category: classicCategory,
        images: ['/images/vanilla-cake.jpg'], // Make sure to add these images to public/images
        price: 35.99,
        stock: 50,
        isFeatured: true,
      },
      {
        name: 'Death by Chocolate',
        slug: 'death-by-chocolate',
        description: 'Layers of dark chocolate cake, chocolate mousse, and ganache.',
        category: chocolateCategory,
        images: ['/images/chocolate-cake.jpg'],
        price: 45.0,
        stock: 30,
        isFeatured: true,
      },
      {
        name: 'Strawberry Shortcake Supreme',
        slug: 'strawberry-shortcake-supreme',
        description: 'Light sponge cake with fresh strawberries and whipped cream.',
        category: fruitCategory,
        images: ['/images/strawberry-cake.jpg'],
        price: 40.5,
        stock: 40,
      },
      {
        name: 'Red Velvet Romance',
        slug: 'red-velvet-romance',
        description: 'A southern classic with a moist crumb and cream cheese frosting.',
        category: classicCategory,
        images: ['/images/red-velvet-cake.jpg'],
        price: 42.0,
        stock: 25,
        isFeatured: true,
      },
    ]);

    return NextResponse.json(
      { 
        message: 'Database seeded successfully!',
        testUsers: [
          { email: 'test@example.com', password: 'password123' },
          { email: 'admin@example.com', password: 'password123' }
        ]
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}