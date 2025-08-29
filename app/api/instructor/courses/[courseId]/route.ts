import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// Helper function to verify course ownership
async function verifyCourseOwner(courseId: string, userId: string) {
  const course = await prisma.course.findUnique({
    where: {
      id: courseId,
      userId: userId,
    },
  });
  return !!course;
}

// GET /api/instructor/courses/[courseId] - Get a single course for the logged-in instructor
export async function GET(req: Request, { params }: { params: { courseId: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { courseId } = params;

    if (!courseId) {
      return new NextResponse('Course ID is required', { status: 400 });
    }

    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
      },
      include: {
        lessons: {
          orderBy: {
            position: 'asc',
          },
        },
        category: true,
      },
    });

    if (!course) {
      return new NextResponse('Course not found', { status: 404 });
    }

    // Security check: ensure the user requesting the course is the owner
    if (course.userId !== session.user.id) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error('[INSTRUCTOR_COURSE_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// DELETE /api/instructor/courses/[courseId] - Delete a course
export async function DELETE(req: Request, { params }: { params: { courseId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { courseId } = params;

    if (!await verifyCourseOwner(courseId, session.user.id)) {
        return new NextResponse('Forbidden', { status: 403 });
    }

    await prisma.course.delete({
      where: { id: courseId },
    });

    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error) {
    console.error('[COURSE_DELETE]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// PATCH /api/instructor/courses/[courseId] - Update a course
export async function PATCH(req: Request, { params }: { params: { courseId: string } }) {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return new NextResponse('Unauthorized', { status: 401 });
      }
  
      const { courseId } = params;
      const values = await req.json(); // Get all values from the request body
  
      if (!await verifyCourseOwner(courseId, session.user.id)) {
          return new NextResponse('Forbidden', { status: 403 });
      }
  
      const updatedCourse = await prisma.course.update({
        where: { id: courseId },
        data: { ...values }, // Update with all provided values
      });
  
      return NextResponse.json(updatedCourse);
    } catch (error) {
      console.error('[COURSE_PATCH]', error);
      return new NextResponse('Internal Server Error', { status: 500 });
    }
  }