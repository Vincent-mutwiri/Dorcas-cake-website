import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '../auth/[...nextauth]/route';
import { Types } from 'mongoose';

interface UserDocument {
  _id: Types.ObjectId;
  email: string;
  isAdmin: boolean;
  updatedAt?: Date;
  [key: string]: any;
}

export async function GET() {
  try {
    console.log('Checking session...');
    const session = await getServerSession(authOptions);
    console.log('Session data:', session ? 'Found' : 'Not found');
    
    // Get user from database to check actual admin status
    let dbUser = null;
    let dbError = null;
    
    if (session?.user?.email) {
      try {
        console.log('Connecting to database...');
        const { default: dbConnect } = await import('@/utils/db');
        const { default: UserModel } = await import('@/models/UserModel');
        
        await dbConnect();
        console.log('Database connected, querying user...');
        
        dbUser = await UserModel.findOne({ email: session.user.email })
          .select('email isAdmin updatedAt')
          .lean() as UserDocument | null;
        console.log('Database user found:', dbUser ? 'Yes' : 'No');
      } catch (dbErr) {
        console.error('Database error:', dbErr);
        dbError = {
          message: dbErr instanceof Error ? dbErr.message : 'Unknown database error',
          stack: dbErr instanceof Error ? dbErr.stack : undefined
        };
      }
    }

    return NextResponse.json({
      success: true,
      session: session 
        ? {
            user: {
              id: session.user?.id,
              name: session.user?.name,
              email: session.user?.email,
              isAdmin: session.user?.isAdmin,
              image: session.user?.image
            },
            expires: session.expires
          }
        : null,
      dbUser: dbUser 
        ? { 
            _id: dbUser._id.toString(),
            email: dbUser.email,
            isAdmin: dbUser.isAdmin,
            ...(dbUser.updatedAt && { updatedAt: dbUser.updatedAt.toISOString() })
          } 
        : null,
      error: dbError
    });
  } catch (error) {
    console.error('Error in check-session:', error);
    return NextResponse.json(
      { 
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: process.env.NODE_ENV === 'development' && error instanceof Error 
            ? error.stack 
            : undefined
        }
      },
      { status: 500 }
    );
  }
}
