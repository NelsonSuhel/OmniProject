import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const lessonId = searchParams.get('lessonId');

    if (!lessonId) {
      return new NextResponse('Lesson ID is required', { status: 400 });
    }

    const lessonProgress = await prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
      include: {
        lesson: {
          select: {
            title: true,
            description: true,
          },
        },
      },
    });

    if (!lessonProgress) {
      return NextResponse.json({ suggestions: ['No se encontró progreso para esta lección. ¡Comienza a aprender para recibir recomendaciones personalizadas!'] });
    }

    const GOOGLE_GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
    if (!GOOGLE_GEMINI_API_KEY) {
      return new NextResponse('LLM API Key not configured', { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(GOOGLE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
      Eres un consejero de aprendizaje adaptativo para una plataforma de e-learning.
      Tu objetivo es analizar el rendimiento de un estudiante en una lección y proporcionar sugerencias personalizadas, útiles y alentadoras en español.

      Datos del estudiante y la lección:
      - Título de la lección: ${JSON.stringify(lessonProgress.lesson.title)}
      - Descripción de la lección: ${JSON.stringify(lessonProgress.lesson.description)}
      - Lección completada: ${lessonProgress.isCompleted}
      - Puntuación del cuestionario (sobre 100): ${lessonProgress.quizScore ?? 'No registrado'}
      - Tiempo dedicado (segundos): ${lessonProgress.timeSpent ?? 'No registrado'}

      Instrucciones:
      1.  Analiza los datos proporcionados.
      2.  Genera 2 o 3 sugerencias cortas y accionables.
      3.  Si el rendimiento es bueno (ej. alta puntuación, completado), las sugerencias deben ser de felicitación y proponer los siguientes pasos o desafíos.
      4.  Si el rendimiento es bajo (ej. baja puntuación, poco tiempo), las sugerencias deben ser de apoyo, recomendando revisar material, usar el tutor IA, o enfocarse en conceptos clave, sin ser desalentador.
      5.  Si faltan datos (ej. sin puntuación), basa tus sugerencias en la información disponible (ej. tiempo dedicado).
      6.  Tu respuesta debe ser un objeto JSON con una única clave "suggestions", que es un array de strings. No incluyas texto adicional.

      Ejemplo de formato de salida JSON:
      {
        "suggestions": [
          "¡Gran trabajo al completar esta lección! Tu puntuación en el cuestionario es excelente.",
          "Considera aplicar lo que aprendiste en un pequeño proyecto personal.",
          "¿Listo para el siguiente desafío? La próxima lección te espera."
        ]
      }

      Ahora, genera las sugerencias basadas en los datos del estudiante.
    `;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const generatedSuggestions = JSON.parse(jsonText);

      return NextResponse.json(generatedSuggestions);

    } catch (llmError) {
      console.error('[ADAPTIVE_SUGGESTIONS_GET] LLM Error:', llmError);
      return new NextResponse('Failed to get suggestions from LLM.', { status: 500 });
    }

  } catch (error) {
    console.error('[ADAPTIVE_SUGGESTIONS_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
