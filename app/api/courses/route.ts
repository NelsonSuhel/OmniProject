import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { z } from 'zod'; // Import Zod

// Define schema for course creation input
const courseCreateSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long").max(255, "Title cannot exceed 255 characters"),
  description: z.string().max(1000, "Description cannot exceed 1000 characters").optional(),
  categoryId: z.string().uuid("Invalid category ID format"), // Assuming categoryId is a UUID
});

interface WhereClause {
  isPublished: boolean;
  category?: {
    name: string;
  };
  price?: number | { gt: number };
  title?: {
    contains: string;
    mode: 'insensitive';
  };
}

interface OrderByClause {
  createdAt?: 'desc';
  price?: 'asc' | 'desc';
}

// POST /api/courses - Create a new course
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();

    // Validate request body using Zod
    const validatedData = courseCreateSchema.safeParse(body);

    if (!validatedData.success) {
      return new NextResponse(JSON.stringify({ errors: validatedData.error.flatten() }), { status: 400 });
    }

    const { title, description, categoryId } = validatedData.data;

    const course = await prisma.course.create({
      data: {
        title,
        description,
        categoryId,
        userId,
      },
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    console.error('[COURSES_POST]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

import { courses as courseData } from '@/app/data/courses.data';

// GET /api/courses - Get all courses with filters and sorting
export async function GET(request: NextRequest) {
    try {
      const searchParams = request.nextUrl.searchParams;
      const categoryName = searchParams.get('category');
      const priceFilter = searchParams.get('price'); // 'all', 'free', 'paid'
      const searchTerm = searchParams.get('search');
      const sortOrder = searchParams.get('sort'); // 'newest', 'price_asc', 'price_desc'

      const where: WhereClause = { isPublished: true };
      let orderBy: OrderByClause = { createdAt: 'desc' };

      // Apply category filter
      if (categoryName && categoryName !== 'Todos') {
        where.category = { name: categoryName };
      }

      // Apply price filter
      if (priceFilter === 'free') {
        where.price = 0;
      } else if (priceFilter === 'paid') {
        where.price = { gt: 0 }; // greater than 0
      }

      // Apply search term
      if (searchTerm) {
        where.title = { contains: searchTerm, mode: 'insensitive' };
      }

      // Apply sorting
      if (sortOrder === 'price_asc') {
        orderBy = { price: 'asc' };
      } else if (sortOrder === 'price_desc') {
        orderBy = { price: 'desc' };
      } else { // default to newest
        orderBy = { createdAt: 'desc' };
      }

      const coursesFromDb = await prisma.course.findMany({
        where,
        include: {
          category: true,
          user: {
            select: {
              username: true,
            }
          },
          lessons: {
            select: {
                id: true
            }
          }
        },
        orderBy,
      });

      // Augment courses with area data from the static file
      const augmentedCourses = coursesFromDb.map(course => {
        const staticData = courseData.find(c => c.title === course.title);
        return {
          ...course,
          area: staticData ? staticData.area : 'General', // Add area, with a fallback
        };
      });

      return NextResponse.json(augmentedCourses);
    } catch (error) {
      console.error('[COURSES_GET_FILTERED]', error);
      return new NextResponse('Internal Server Error', { status: 500 });
    }
  }