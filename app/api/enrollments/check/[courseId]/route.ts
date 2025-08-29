import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// GET /api/enrollments/check/[courseId] - Check if a user is enrolled in a course
export async function GET(req: Request, { params }: { params: { courseId: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const userId = session.user.id;
    const { courseId } = params;

    if (!courseId) {
      return new NextResponse('Course ID is required', { status: 400 });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: userId,
          courseId: courseId,
        },
      },
    });

    return NextResponse.json({
      isEnrolled: !!enrollment,
      completedLessons: enrollment?.completedLessons || [],
    });
  } catch (error) {
    console.error('[ENROLLMENT_CHECK_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}