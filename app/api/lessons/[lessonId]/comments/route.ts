import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// Placeholder for a translation function (replace with actual API call)
async function translateText(text: string, targetLang: string): Promise<string> {
  // In a real application, this would call a translation API (e.g., Google Cloud Translation, DeepL)
  // For demonstration, we'll just append a tag indicating translation.
  if (targetLang === 'es' && text.startsWith('Hello')) {
    return 'Hola (translated)';
  }
  if (targetLang === 'en' && text.startsWith('Hola')) {
    return 'Hello (translated)';
  }
  return `${text} [translated to ${targetLang}]`; // Placeholder translation
}

// GET /api/lessons/[lessonId]/comments - Get all comments for a specific lesson
export async function GET(req: Request, { params }: { params: { lessonId: string } }) {
  try {
    const { lessonId } = params;
    const { searchParams } = new URL(req.url);
    const targetLang = searchParams.get('lang') || 'en'; // Default to English if no lang param

    if (!lessonId) {
      return new NextResponse('Lesson ID is required', { status: 400 });
    }

    const comments = await prisma.comment.findMany({
      where: {
        lessonId: lessonId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Process comments for translation
    const commentsWithTranslations = await Promise.all(comments.map(async (comment) => {
      let translatedContent = comment.content;
      // Only translate if the target language is different from the original (if original lang is known)
      // For simplicity, we'll always attempt translation here.
      if (targetLang !== 'original_language_of_comment') { // Replace with actual language detection
        translatedContent = await translateText(comment.content, targetLang);
      }
      return {
        ...comment,
        translatedContent: translatedContent,
      };
    }));

    return NextResponse.json(commentsWithTranslations);
  } catch (error) {
    console.error('[COMMENTS_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// POST /api/lessons/[lessonId]/comments - Create a new comment for a specific lesson
export async function POST(req: Request, { params }: { params: { lessonId: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const userId = session.user.id;
    const { lessonId } = params;
    const { content } = await req.json();

    if (!lessonId || !content) {
      return new NextResponse('Lesson ID and content are required', { status: 400 });
    }

    // Optional: Check if user is enrolled in the course before allowing comment
    // This would require fetching lesson.courseId and then checking enrollment
    // For simplicity, we'll allow comments if authenticated for now.

    const comment = await prisma.comment.create({
      data: {
        content: content,
        userId: userId,
        lessonId: lessonId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error('[COMMENTS_POST]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}