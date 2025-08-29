import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const userId = session.user.id;
    const { lessonId, quizScore, timeSpent, isCompleted } = await req.json();

    if (!lessonId) {
      return new NextResponse('Lesson ID is required', { status: 400 });
    }

    // Upsert (update or insert) the LessonProgress record
    const lessonProgress = await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: userId,
          lessonId: lessonId,
        },
      },
      update: {
        quizScore: quizScore,
        timeSpent: timeSpent,
        isCompleted: isCompleted,
      },
      create: {
        userId: userId,
        lessonId: lessonId,
        quizScore: quizScore,
        timeSpent: timeSpent,
        isCompleted: isCompleted,
      },
    });

    return NextResponse.json(lessonProgress);
  } catch (error) {
    console.error('[LESSON_PROGRESS_POST]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const lessonId = searchParams.get('lessonId');

    let lessonProgress;
    if (lessonId) {
      // Get progress for a specific lesson
      lessonProgress = await prisma.lessonProgress.findUnique({
        where: {
          userId_lessonId: {
            userId: userId,
            lessonId: lessonId,
          },
        },
      });
    } else {
      // Get all lesson progress for the user
      lessonProgress = await prisma.lessonProgress.findMany({
        where: {
          userId: userId,
        },
      });
    }

    return NextResponse.json(lessonProgress);
  } catch (error) {
    console.error('[LESSON_PROGRESS_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
