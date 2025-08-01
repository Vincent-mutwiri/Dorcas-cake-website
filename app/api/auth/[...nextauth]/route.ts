// app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions, type DefaultSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import dbConnect from '@/utils/db';
import UserModel, { type IUser } from '@/models/UserModel';
import bcrypt from 'bcryptjs';

// Extend the built-in session types
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      isAdmin: boolean;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    isAdmin: boolean;
  }
}

// Extend the JWT type to include our custom fields
declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    isAdmin: boolean;
  }
}

// Type for the user document we get from MongoDB
type UserDocument = Pick<IUser, 'name' | 'email' | 'password' | 'isAdmin'> & {
  _id: string;
};

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        await dbConnect();

        // Find user and explicitly select the password field
        const user = await UserModel.findOne({ email: credentials.email })
          .select('+password')
          .lean<UserDocument>();

        if (!user) {
          throw new Error('Invalid email or password');
        }

        // Verify the password
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password || ''
        );

        if (!isPasswordValid) {
          throw new Error('Invalid email or password');
        }

        // Return the user object that will be encoded in the JWT
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin || false,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/auth/login',
    // error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = user.isAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.isAdmin = token.isAdmin;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };