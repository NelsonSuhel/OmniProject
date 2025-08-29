
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// GET /api/instructor/courses - Get all courses for the logged-in instructor
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const userId = session.user.id;

    const courses = await prisma.course.findMany({
      where: {
        userId: userId,
      },
      include: {
        category: true,
        _count: {
            select: { lessons: true }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(courses);
  } catch (error) {
    console.error('[INSTRUCTOR_COURSES_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
