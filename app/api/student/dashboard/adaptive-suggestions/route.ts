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

    // 1. Fetch all lesson progress for the user
    const lessonProgresses = await prisma.lessonProgress.findMany({
      where: { userId: userId },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            position: true,
            courseId: true,
            // Potentially include concept tags or prerequisites here if available in the Lesson model
          },
        },
      },
    });

    // 2. Identify potential weak areas
    const weakLessons: { lessonId: string; title: string; courseId: string; reason: string }[] = [];
    const completedLessons = new Set(lessonProgresses.filter(lp => lp.isCompleted).map(lp => lp.lessonId));

    for (const lp of lessonProgresses) {
      // Example criteria for a "weak area":
      // - Low quiz score (e.g., < 70%)
      // - High time spent without completion (might indicate struggle)
      // - Lesson not completed and quiz score is low (if applicable)

      if (lp.quizScore !== null && lp.quizScore < 70) { // Assuming quizScore is a percentage or similar
        weakLessons.push({
          lessonId: lp.lessonId,
          title: lp.lesson.title,
          courseId: lp.lesson.courseId,
          reason: `Bajo puntaje en el cuestionario (${lp.quizScore}%)`,
        });
      } else if (!lp.isCompleted && lp.timeSpent && lp.timeSpent > 3600) { // More than 1 hour spent, not completed
        weakLessons.push({
          lessonId: lp.lessonId,
          title: lp.lesson.title,
          courseId: lp.lesson.courseId,
          reason: `Mucho tiempo sin completar (${(lp.timeSpent / 60).toFixed(0)} minutos)`,
        });
      }
      // Add more sophisticated logic here (e.g., comparing to average, tracking multiple attempts)
    }

    // 3. Suggest remedial content
    const suggestions: { lessonId: string; title: string; courseId: string; reason: string; suggestion: string }[] = [];

    // For each weak lesson, suggest related content.
    // For simplicity, we'll suggest previous lessons in the same course.
    // In a real system, you'd use concept tags, prerequisites, or a recommendation engine.
    for (const weakLesson of weakLessons) {
      // Fetch all lessons for the course of the weak lesson
      const courseLessons = await prisma.lesson.findMany({
        where: { courseId: weakLesson.courseId },
        orderBy: { position: 'asc' },
      });

      const weakLessonIndex = courseLessons.findIndex(l => l.id === weakLesson.lessonId);

      if (weakLessonIndex > 0) {
        // Suggest the immediately preceding lesson
        const suggestedLesson = courseLessons[weakLessonIndex - 1];
        // Only suggest if the student hasn't already completed it
        if (!completedLessons.has(suggestedLesson.id)) {
          suggestions.push({
            ...weakLesson,
            suggestion: `Revisa la lección anterior: "${suggestedLesson.title}"`, 
            lessonId: suggestedLesson.id, // Suggest the previous lesson's ID
            title: suggestedLesson.title, // Suggest the previous lesson's title
          });
        }
      } else {
        // If it's the first lesson and they struggled, suggest reviewing it again
        suggestions.push({
          ...weakLesson,
          suggestion: `Revisa esta lección nuevamente: "${weakLesson.title}"`, 
        });
      }
    }

    return NextResponse.json({ weakLessons, suggestions });
  } catch (error) {
    console.error('[ADAPTIVE_SUGGESTIONS_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
