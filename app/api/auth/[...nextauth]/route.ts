import NextAuth from "next-auth"
import { AuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"
import { User } from "@prisma/client"

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid credentials");
        }

        return user; // Return the full user object
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      // On initial sign in, user object is available
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role; // Add role to token
        token.passwordChangedAt = user.passwordChangedAt; // Store passwordChangedAt in token
      }

      // Revalidate token if password has been changed since token was issued
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { passwordChangedAt: true },
        });

        if (dbUser?.passwordChangedAt && token.iat) {
          const tokenIssuedAt = new Date(token.iat * 1000); // Convert iat to Date object
          if (dbUser.passwordChangedAt > tokenIssuedAt) {
            // Password was changed after the token was issued, invalidate token
            return {}; // Return empty object to invalidate token
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Add user id, username, and role to the session object
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.role = token.role as string; // Add role to session
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };