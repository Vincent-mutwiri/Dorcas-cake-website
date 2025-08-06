// app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions, type DefaultSession } from 'next-auth';
import type { DefaultUser } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import dbConnect from '@/utils/db';
import UserModel, { type IUser, IAddress } from '@/models/UserModel';
import bcrypt from 'bcryptjs';

// Extend the built-in session and user types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      isAdmin: boolean;
      imageUrl?: string;
      defaultShippingAddress?: IAddress;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    isAdmin: boolean;
    name: string;
    email: string;
    imageUrl?: string;
    defaultShippingAddress?: IAddress;
  }
}

// Extend the JWT type to include our custom fields
declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    isAdmin: boolean;
    imageUrl?: string;
    defaultShippingAddress?: IAddress;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        await dbConnect();
        
        const user = await UserModel.findOne({ email: credentials.email.toLowerCase() })
          .select('+password +defaultShippingAddress')
          .lean();

        if (user && (await bcrypt.compare(credentials.password, user.password!))) {
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            imageUrl: user.imageUrl, // ADDED
            defaultShippingAddress: user.defaultShippingAddress, // ADDED
          };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user, trigger }) => {
      if (user) {
        token.id = user.id;
        token.isAdmin = (user as any).isAdmin;
        token.imageUrl = (user as any).imageUrl;
        token.defaultShippingAddress = (user as any).defaultShippingAddress;
      }
      
      // Refresh user data from database on session update
      if (trigger === 'update' && token.id) {
        await dbConnect();
        const updatedUser = await UserModel.findById(token.id)
          .select('+defaultShippingAddress')
          .lean();
        
        if (updatedUser) {
          token.imageUrl = updatedUser.imageUrl;
          token.defaultShippingAddress = updatedUser.defaultShippingAddress;
        }
      }
      
      return token;
    },
    session: async ({ session, token }) => {
      if (token && session.user) {
        // Always fetch fresh user data from database
        await dbConnect();
        const user = await UserModel.findById(token.id).lean();
        
        if (user) {
          session.user.id = token.id as string;
          session.user.isAdmin = user.isAdmin;
          // Map database fields to session fields
          session.user.imageUrl = (user as any).profilePicture;
          const addresses = (user as any).addresses || [];
          session.user.defaultShippingAddress = addresses.length > 0 ? addresses[0] : null;
          

        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };