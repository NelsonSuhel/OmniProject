
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// GET /api/categories - Get all categories
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error('[CATEGORIES_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// POST /api/categories - Create a new category
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { name } = await req.json();

    if (!name) {
      return new NextResponse('Name is required', { status: 400 });
    }

    const existingCategory = await prisma.category.findFirst({
        where: { name: { equals: name, mode: 'insensitive' } },
    });

    if (existingCategory) {
        return new NextResponse('Category already exists', { status: 409 });
    }

    const category = await prisma.category.create({
      data: {
        name,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('[CATEGORIES_POST]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
