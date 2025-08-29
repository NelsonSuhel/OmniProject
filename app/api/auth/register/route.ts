import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { email, username, password } = await req.json();

    if (!email || !username || !password) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const existingUserByEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUserByEmail) {
      return new NextResponse('Email already in use', { status: 409 });
    }

    const existingUserByUsername = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUserByUsername) {
      return new NextResponse('Username already in use', { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
      },
    });

    // Do not send the password back in the response
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('[REGISTER_POST]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}