import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

interface UpdateData {
  title?: {
    es: string;
  };
  description?: {
    es: string;
  };
}

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

// DELETE /api/courses/[courseId]/lessons/[lessonId] - Delete a lesson
export async function DELETE(req: Request, { params }: { params: { courseId: string, lessonId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { courseId, lessonId } = params;

    if (!await verifyCourseOwner(courseId, session.user.id)) {
        return new NextResponse('Forbidden', { status: 403 });
    }

    await prisma.lesson.delete({
      where: { id: lessonId },
    });

    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error) {
    console.error('[LESSON_DELETE]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// PATCH /api/courses/[courseId]/lessons/[lessonId] - Update a lesson
export async function PATCH(req: Request, { params }: { params: { courseId: string, lessonId: string } }) {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return new NextResponse('Unauthorized', { status: 401 });
      }
  
      const { courseId, lessonId } = params;
      const { title, description } = await req.json(); // Now expecting description too
  
      if (!title) {
        return new NextResponse('Title is required', { status: 400 });
      }

      if (!await verifyCourseOwner(courseId, session.user.id)) {
          return new NextResponse('Forbidden', { status: 403 });
      }

      const updateData: UpdateData = {};
      if (title) updateData.title = { es: title }; // Store title as JSON for Spanish
      if (description) updateData.description = { es: description }; // Store description as JSON
  
      const updatedLesson = await prisma.lesson.update({
        where: { id: lessonId },
        data: updateData,
      });
  
      return NextResponse.json(updatedLesson);
    } catch (error) {
      console.error('[LESSON_PATCH]', error);
      return new NextResponse('Internal Server Error', { status: 500 });
    }
  }