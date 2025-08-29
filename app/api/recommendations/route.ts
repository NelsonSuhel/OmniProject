import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Helper function to safely call the LLM and parse the response
async function generateLlmContent(model: any, prompt: string, errorContext: string) {
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text);
  } catch (e) {
    console.error(`Error generating ${errorContext}:`, e);
    return null; // Return null on failure
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const userId = session.user.id;

    // 1. Fetch user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { enrollments: { include: { course: true } } },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // 2. Course Recommendations
    const enrolledCourseIds = user.enrollments.map(e => e.courseId);
    const popularCourses = await prisma.course.findMany({
      where: { isPublished: true, id: { notIn: enrolledCourseIds } },
      take: 5,
      orderBy: { enrollments: { _count: 'desc' } },
      include: { category: true, user: { select: { username: true } } },
    });

    // 3. Advanced Recommendations
    const GOOGLE_GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
    if (!GOOGLE_GEMINI_API_KEY) {
      // Don't block the whole response if LLM is not configured
      console.error('LLM API Key not configured');
      return NextResponse.json({ courses: popularCourses, advanced: { projects: [], studyPartners: [], jobOpportunities: [] } });
    }

    const genAI = new GoogleGenerativeAI(GOOGLE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const userSkills = user.skills.join(', ') || 'ninguna especificada';
    const userInterests = user.interests.join(', ') || 'ninguno especificado';
    const completedCourses = user.enrollments.map(e => e.course.title).join(', ') || 'ninguno';

    // --- AI Project Recommendations ---
    const projectPrompt = `{"projects": [{"title": "Blog Personal con Astro y React", "description": "Crea un blog..."}]}`;
    const projectData = await generateLlmContent(model, projectPrompt, 'project recommendations');

    // --- AI Job Recommendations ---
    const jobPrompt = `
      Eres un reclutador de talento para una plataforma de e-learning. Tu tarea es generar 2 ofertas de trabajo simuladas que se ajusten bien al perfil de un estudiante.

      Perfil del estudiante:
      - Habilidades: ${userSkills}
      - Cursos completados: ${completedCourses}

      Instrucciones:
      1.  Genera 2 ofertas de trabajo simuladas, incluyendo nombre de la empresa (inventado) y ubicación.
      2.  Las ofertas deben ser relevantes para las habilidades y cursos del estudiante.
      3.  Tu respuesta debe ser un objeto JSON con una clave "jobs", que es un array de objetos. Cada objeto debe tener "title", "company", y "location".
      4.  No incluyas texto o explicaciones adicionales fuera del JSON.

      Ejemplo de formato de salida JSON:
      {
        "jobs": [
          {
            "title": "Desarrollador Frontend Junior",
            "company": "Innovatech Solutions",
            "location": "Remoto"
          },
          {
            "title": "Analista de Datos en Prácticas",
            "company": "Data Insights Corp.",
            "location": "Híbrido"
          }
        ]
      }
    `;
    const jobData = await generateLlmContent(model, jobPrompt, 'job recommendations');

    // --- Rule-Based Study Partner Recommendations ---
    let studyPartnerRecommendations = [];
    if (user.interests.length > 0) {
      const potentialPartners = await prisma.user.findMany({
        where: { id: { not: userId }, interests: { hasSome: user.interests } },
        take: 5,
        select: { username: true, interests: true },
      });
      studyPartnerRecommendations = potentialPartners.map(p => ({
        name: p.username,
        interest: `Intereses en común: ${p.interests.filter(i => user.interests.includes(i)).join(', ')}`,
        link: '#',
      }));
    }

    return NextResponse.json({
      courses: popularCourses,
      advanced: {
        projects: projectData?.projects || [],
        studyPartners: studyPartnerRecommendations,
        jobOpportunities: jobData?.jobs || [],
      },
    });

  } catch (error) {
    console.error('[RECOMMENDATIONS_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
