import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return new NextResponse('Missing email or password', { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Generic error to prevent email enumeration
      return new NextResponse('Invalid credentials', { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return new NextResponse('Invalid credentials', { status: 401 });
    }

    // In a real application, you would generate a JWT or session token here.
    // For now, we'll just return the user data without the password.

    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword, { status: 200 });

  } catch (error) {
    console.error('[LOGIN_POST]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}