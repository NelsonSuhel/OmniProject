
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// GET /api/student/courses - Get all courses a student is enrolled in
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const userId = session.user.id;

    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: userId,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            imageUrl: true,
            price: true,
            isPublished: true,
            category: {
              select: {
                name: true,
              },
            },
            user: {
              select: {
                username: true,
              },
            },
            lessons: {
                where: { isPublished: true },
                orderBy: { position: 'asc' },
                select: { id: true, title: true, position: true }
            }
          },
        },
      },
    });

    // Extract just the course objects from the enrollments
    const enrolledCourses = enrollments.map(enrollment => enrollment.course);

    return NextResponse.json(enrolledCourses);
  } catch (error) {
    console.error('[STUDENT_COURSES_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
