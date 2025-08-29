
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// GET /api/lessons/[lessonId] - Get details of a single lesson (protected by enrollment)
export async function GET(req: Request, { params }: { params: { lessonId: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const userId = session.user.id;
    const { lessonId } = params;

    if (!lessonId) {
      return new NextResponse('Lesson ID is required', { status: 400 });
    }

    const lesson = await prisma.lesson.findUnique({
      where: {
        id: lessonId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        videoUrl: true,
        modelUrl: true, // Explicitly include modelUrl
        position: true,
        isPublished: true,
        course: {
          select: {
            id: true,
            isPublished: true,
            userId: true, // To check if it's the instructor viewing their own lesson
          },
        },
      },
    });

    if (!lesson || !lesson.course || !lesson.course.isPublished || !lesson.isPublished) {
      return new NextResponse('Lesson not found or not published', { status: 404 });
    }

    // Check if the user is the instructor of the course
    const isInstructor = lesson.course.userId === userId;

    // Check if the user is enrolled in the course (if not the instructor)
    let isEnrolled = false;
    if (!isInstructor) {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: userId,
            courseId: lesson.course.id,
          },
        },
      });
      isEnrolled = !!enrollment;
    }

    // If not instructor and not enrolled, deny access
    if (!isInstructor && !isEnrolled) {
      return new NextResponse('Forbidden: Not enrolled in this course', { status: 403 });
    }

    return NextResponse.json(lesson);
  } catch (error) {
    console.error('[LESSON_DETAILS_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
