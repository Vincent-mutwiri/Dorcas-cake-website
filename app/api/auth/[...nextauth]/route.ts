// app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions, type DefaultSession } from 'next-auth';
import type { DefaultUser } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import dbConnect from '@/utils/db';
import UserModel, { type IUser } from '@/models/UserModel';
import bcrypt from 'bcryptjs';

// Extend the built-in session and user types
declare module 'next-auth' {
  /**
   * Extend the built-in session types
   */
  interface Session {
    user: {
      id: string;
      isAdmin: boolean;
    } & DefaultSession['user'];
  }

  /**
   * Extend the built-in user types
   */
  interface User {
    id: string;
    isAdmin: boolean;
    name: string;
    email: string;
    image?: string;
  }
}

// Extend the JWT type to include our custom fields
declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    isAdmin: boolean;
    email: string;
    picture?: string;
  }
}

// Type for the user document we get from MongoDB
type UserDocument = Pick<IUser, 'name' | 'email' | 'password' | 'isAdmin'> & {
  _id: any; // Using 'any' for _id to handle both string and ObjectId
  email: string;
  name?: string;
};

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('Authorization attempt with credentials:', {
          email: credentials?.email,
          hasPassword: !!credentials?.password
        });

        if (!credentials?.email || !credentials?.password) {
          console.error('Missing credentials');
          throw new Error('Email and password are required');
        }

        try {
          console.log('Connecting to database...');
          await dbConnect();
          console.log('Database connected');
          
          // Find user by email (case-insensitive)
          const email = credentials.email.trim().toLowerCase();
          console.log('Looking up user with email:', email);
          
          const user = await UserModel.findOne({ email })
            .select('+password profilePicture email name')
            .lean()
            .exec();
          
          if (!user) {
            console.error('User not found for email:', email);
            throw new Error('Invalid email or password');
          }
          
          console.log('User found:', { 
            userId: user._id, 
            email: user.email,
            hasPassword: !!user.password 
          });
          
          if (!user.password) {
            console.error('No password set for user:', user.email);
            throw new Error('Authentication error. Please reset your password.');
          }
          
          // Verify password
          console.log('Verifying password...');
          const isValid = await bcrypt.compare(credentials.password, user.password);
          
          if (!isValid) {
            console.error('Invalid password for user:', user.email);
            throw new Error('Invalid email or password');
          }
          
          // Prepare user data for the session
          const userData = {
            id: user._id?.toString() || '',
            name: user.name || '',
            email: user.email,
            image: user.profilePicture || '/images/default-avatar.png',
            isAdmin: Boolean(user.isAdmin),
          };
          
          console.log('Authentication successful for user:', userData.email);
          return userData;
        } catch (error) {
          console.error('Authentication error:', error);
          throw new Error('Authentication failed. Please try again.');
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.isAdmin = user.isAdmin;
        token.email = user.email;
        token.picture = user.image;
        return token;
      }

      // For subsequent requests, verify admin status from the database
      try {
        await dbConnect();
        const dbUser = await UserModel.findById(token.id).select('isAdmin').lean();
        if (dbUser) {
          token.isAdmin = dbUser.isAdmin;
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.isAdmin = token.isAdmin;
        session.user.email = token.email;
        session.user.image = token.picture;
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
  logger: {
    error(code, metadata) {
      console.error('NextAuth Error:', { code, metadata });
    },
    warn(code) {
      console.warn('NextAuth Warning:', code);
    },
    debug(code, metadata) {
      console.log('NextAuth Debug:', { code, metadata });
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };