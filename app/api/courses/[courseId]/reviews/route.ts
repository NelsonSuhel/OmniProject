
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// GET /api/courses/[courseId]/reviews - Get all reviews for a course
export async function GET(req: Request, { params }: { params: { courseId: string } }) {
  try {
    const { courseId } = params;

    if (!courseId) {
      return new NextResponse('Course ID is required', { status: 400 });
    }

    const reviews = await prisma.review.findMany({
      where: { courseId: courseId },
      include: {
        user: {
          select: { username: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error('[REVIEWS_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// POST /api/courses/[courseId]/reviews - Create a new review for a course
export async function POST(req: Request, { params }: { params: { courseId: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const userId = session.user.id;
    const { courseId } = params;
    const { rating, comment } = await req.json();

    if (!rating || rating < 1 || rating > 5) {
      return new NextResponse('Rating must be between 1 and 5', { status: 400 });
    }

    // Check if user is enrolled in the course
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: userId,
          courseId: courseId,
        },
      },
    });

    if (!enrollment) {
      return new NextResponse('Forbidden: Must be enrolled to review', { status: 403 });
    }

    // Check if user has already reviewed this course
    const existingReview = await prisma.review.findUnique({
      where: {
        courseId_userId: {
          courseId: courseId,
          userId: userId,
        },
      },
    });

    if (existingReview) {
      return new NextResponse('Already reviewed this course', { status: 409 });
    }

    const review = await prisma.review.create({
      data: {
        courseId,
        userId,
        rating,
        comment,
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error('[REVIEWS_POST]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
