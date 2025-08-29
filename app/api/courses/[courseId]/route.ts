
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/courses/[courseId] - Get a single published course
export async function GET(req: Request, { params }: { params: { courseId: string } }) {
  try {
    const { courseId } = params;

    if (!courseId) {
      return new NextResponse('Course ID is required', { status: 400 });
    }

    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
        isPublished: true, // Only return published courses
      },
      include: {
        lessons: {
          where: { isPublished: true }, // Only return published lessons
          select: {
            id: true,
            title: true,
            videoUrl: true,
            modelUrl: true, // Explicitly include modelUrl
            content: true, // Include the content field
            position: true,
            isPublished: true,
          },
          orderBy: {
            position: 'asc',
          },
        },
        category: true,
        user: {
          select: { // Only select public user info
            username: true,
          }
        }
      },
    });

    if (!course) {
      return new NextResponse('Course not found or not published', { status: 404 });
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error('[COURSE_DETAILS_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
