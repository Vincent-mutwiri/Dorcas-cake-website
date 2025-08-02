import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import UserModel from '@/models/UserModel';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    await dbConnect();
    
    // Check if admin user exists
    const adminUser = await UserModel.findOne({ email: 'admin@example.com' }).select('+password');
    
    if (!adminUser) {
      // Create admin user
      const hashedPassword = await bcrypt.hash('password123', 12);
      const newAdmin = new UserModel({
        name: 'Admin User',
        email: 'admin@example.com',
        password: hashedPassword,
        isAdmin: true,
      });
      await newAdmin.save();
      return NextResponse.json({ message: 'Admin user created' });
    }
    
    // Test password
    const isValid = await bcrypt.compare('password123', adminUser.password || '');
    
    return NextResponse.json({ 
      message: 'Admin user exists',
      email: adminUser.email,
      isAdmin: adminUser.isAdmin,
      passwordValid: isValid
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}