import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    // For now, allow any authenticated user to try this. In production, you'd lock it down.
    // if (!session?.user?.id || session.user.role !== 'INSTRUCTOR') {
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { lessonId, content, numQuestions = 2 } = await req.json();

    if (!lessonId || !content) {
      return new NextResponse('Lesson ID and content are required', { status: 400 });
    }

    const GOOGLE_GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
    if (!GOOGLE_GEMINI_API_KEY) {
      return new NextResponse('LLM API Key not configured', { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(GOOGLE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
      Eres un asistente de enseñanza para una plataforma de e-learning.
      Tu tarea es generar un cuestionario (quiz) basado en el contenido de la lección proporcionada.
      El cuestionario debe estar en español.

      Requisitos del cuestionario:
      1.  Debe contener exactamente ${numQuestions} preguntas.
      2.  Cada pregunta debe tener 4 opciones de respuesta.
      3.  Una (y solo una) de las opciones debe ser la correcta.
      4.  La respuesta debe ser un objeto JSON válido, sin ningún texto o explicación adicional antes o después.
      5.  El objeto JSON debe tener una única clave "questions", que es un array de objetos.
      6.  Cada objeto en el array "questions" debe tener las siguientes claves:
          - "question": La pregunta (string).
          - "options": Un array de 4 strings con las opciones de respuesta.
          - "correctAnswer": El string exacto de la opción de respuesta correcta.

      Contenido de la lección:
      """
      ${content}
      """

      Ejemplo de formato de salida JSON:
      {
        "questions": [
          {
            "question": "¿Cuál es la capital de Francia?",
            "options": ["Madrid", "Berlín", "París", "Roma"],
            "correctAnswer": "París"
          }
        ]
      }

      Ahora, genera el cuestionario en el formato JSON especificado.
    `;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Clean the response to ensure it is valid JSON
      const jsonText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const generatedQuiz = JSON.parse(jsonText);

      return NextResponse.json({ lessonId, ...generatedQuiz });

    } catch (llmError) {
      console.error('[GENERATE_QUIZ_POST] LLM Error:', llmError);
      return new NextResponse('Failed to generate quiz from LLM.', { status: 500 });
    }

  } catch (error) {
    console.error('[GENERATE_QUIZ_POST]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
