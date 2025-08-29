
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const userId = session.user.id;

    // Get all published courses
    // Fetch user's interests and skills
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { interests: true, skills: true }
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    const enrolledCourses = await prisma.enrollment.findMany({
        where: {
            userId: userId,
        },
        include: {
            course: true,
        },
    });

    // Get categories of courses the user is already enrolled in
    const enrolledCategoryIds = new Set(enrolledCourses.map(e => e.course.categoryId));

    // Build recommendation query
    const recommendedCourses = await prisma.course.findMany({
      where: {
        isPublished: true,
        NOT: {
          enrollments: {
            some: {
              userId: userId
            }
          }
        },
        OR: [
          // Recommend courses with tags matching user interests or skills
          {
            tags: {
              hasSome: [...user.interests, ...user.skills].filter(Boolean) // Filter out empty strings
            }
          },
          // Recommend courses in categories user is already enrolled in
          {
            categoryId: {
              in: Array.from(enrolledCategoryIds)
            }
          }
        ]
      },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        price: true,
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
        tags: true, // Include tags in the selection
      },
      orderBy: {
        createdAt: 'desc' // Order by creation date for now, can be improved later
      },
      take: 10 // Limit to 10 recommendations
    });

    return NextResponse.json(recommendedCourses);
  } catch (error) {
    console.error('[RECOMMENDATIONS_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
