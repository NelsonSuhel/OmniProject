
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// PATCH /api/lessons/[lessonId]/complete - Mark a lesson as complete
export async function PATCH(req: Request, { params }: { params: { lessonId: string } }) {
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

    // Fetch the lesson to get its courseId
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { courseId: true, isPublished: true },
    });

    if (!lesson || !lesson.isPublished) {
      return new NextResponse('Lesson not found or not published', { status: 404 });
    }

    // Check if the user is enrolled in the course
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: userId,
          courseId: lesson.courseId,
        },
      },
    });

    if (!enrollment) {
      return new NextResponse('Forbidden: Not enrolled in this course', { status: 403 });
    }

    // Add lessonId to completedLessons if not already present
    const updatedCompletedLessons = enrollment.completedLessons.includes(lessonId)
      ? enrollment.completedLessons
      : [...enrollment.completedLessons, lessonId];

    const updatedEnrollment = await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { completedLessons: updatedCompletedLessons },
    });

    return NextResponse.json(updatedEnrollment);
  } catch (error) {
    console.error('[LESSON_COMPLETE_PATCH]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
