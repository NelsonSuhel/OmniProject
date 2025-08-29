import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { message, lessonContent } = await req.json();

    if (!message) {
      return new NextResponse('Message is required', { status: 400 });
    }

    // --- START: LLM Integration ---
    // 1. Configurar la clave de API del LLM desde las variables de entorno
    const GOOGLE_GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

    if (!GOOGLE_GEMINI_API_KEY) {
      return new NextResponse('LLM API Key not configured', { status: 500 });
    }

    // 2. Inicializar el cliente del LLM
    const genAI = new GoogleGenerativeAI(GOOGLE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    let llmResponse: string;

    // 3. Construir el prompt para el LLM
    const prompt = `Eres un tutor de e-learning amigable y servicial llamado 'Suhel'. Tu objetivo es ayudar a los estudiantes a entender el material del curso. Responde a la pregunta del estudiante basándote EXCLUSIVAMENTE en el siguiente contenido de la lección. Si la pregunta del estudiante no puede ser respondida usando el contenido de la lección, amablemente dile que no puedes responder porque la pregunta está fuera del alcance del material actual y que debe hacer preguntas relacionadas al curso. NO inventes información.

    Contenido de la lección:
    """
    ${lessonContent || 'No se proporcionó contenido de la lección.'}
    """

    Pregunta del estudiante: "${message}"

    Tu respuesta:`;

    try {
      // 4. Realizar la llamada a la API del LLM
      const result = await model.generateContent(prompt);
      const response = await result.response;
      llmResponse = response.text();

    } catch (llmError) {
      console.error('Error al llamar a la API del LLM:', llmError);
      return new NextResponse('Error al contactar al Tutor IA.', { status: 500 });
    }
    // --- END: LLM Integration ---

    return NextResponse.json({ response: llmResponse });
  } catch (error) {
    console.error('[AI_TUTOR_POST]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
