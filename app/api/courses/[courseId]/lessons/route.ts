
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// POST /api/courses/[courseId]/lessons - Create a new lesson for a course
export async function POST(req: Request, { params }: { params: { courseId: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { courseId } = params;
    const { title, description, modelUrl } = await req.json(); // Now expecting modelUrl too

    if (!title) {
      return new NextResponse('Title is required', { status: 400 });
    }

    // Verify the user owns the course
    const courseOwner = await prisma.course.findUnique({
      where: {
        id: courseId,
        userId: session.user.id,
      },
    });

    if (!courseOwner) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Find the last lesson to determine the new position
    const lastLesson = await prisma.lesson.findFirst({
      where: {
        courseId: courseId,
      },
      orderBy: {
        position: 'desc',
      },
    });

    const newPosition = lastLesson ? lastLesson.position + 1 : 1;

    const lesson = await prisma.lesson.create({
      data: {
        title: { es: title }, // Store title as JSON for Spanish
        description: description ? { es: description } : null, // Store description as JSON
        modelUrl: modelUrl || null, // Store modelUrl
        courseId: courseId,
        position: newPosition,
      },
    });

    return NextResponse.json(lesson, { status: 201 });
  } catch (error) {
    console.error('[LESSONS_POST]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
