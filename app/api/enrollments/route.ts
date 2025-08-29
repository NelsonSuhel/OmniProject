
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// POST /api/enrollments - Create a new enrollment
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const userId = session.user.id;
    const { courseId, isPaid } = await req.json();

    if (!courseId) {
      return new NextResponse('Course ID is required', { status: 400 });
    }

    // Check if user is already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: userId,
          courseId: courseId,
        },
      },
    });

    if (existingEnrollment) {
      return new NextResponse('Already enrolled in this course', { status: 409 });
    }

    // Fetch course details to validate price and published status
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course || !course.isPublished) {
      return new NextResponse('Course not found or not published', { status: 404 });
    }

    // Validate payment status based on course price
    if (course.price && course.price > 0 && !isPaid) {
      return new NextResponse('Payment required for this course', { status: 402 });
    }
    if ((course.price === 0 || course.price === null) && isPaid) {
        return new NextResponse('Free course does not require payment', { status: 400 });
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        userId: userId,
        courseId: courseId,
      },
    });

    return NextResponse.json(enrollment, { status: 201 });
  } catch (error) {
    console.error('[ENROLLMENTS_POST]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
