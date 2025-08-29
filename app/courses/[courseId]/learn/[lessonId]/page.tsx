'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

// Import all interactive components
import AIChatbot from '@/app/components/AIChatbot';
import InteractiveModelViewer from '@/app/components/InteractiveModelViewer';
import QuizComponent from '@/app/components/QuizComponent';
import HazardIdentification from '@/app/components/HazardIdentification';
import PPESelection from '@/app/components/PPESelection';
import InteractiveContent from '@/app/components/InteractiveContent';
import CommentsSection from '@/app/components/CommentsSection';

// Mock data for exercises - in a real app, this would come from an API or DB
const hazardScenarios = {
  construction: {
    imageUrl: '/images/hazard-scenario-1.jpg', // You need to provide this image
    hazards: [
      { id: 1, x: 25, y: 50, description: 'Trabajador sin arnés de seguridad.' },
      { id: 2, x: 60, y: 70, description: 'Escombros y materiales desordenados.' },
    ],
  },
};

const ppeScenarios = {
  welding: {
    description: 'Un trabajador necesita realizar una soldadura en un taller.',
    availablePpe: [
      { id: 'helmet', name: 'Casco', imageUrl: '/images/ppe-helmet.png' },
      { id: 'gloves', name: 'Guantes de soldador', imageUrl: '/images/ppe-gloves.png' },
      { id: 'mask', name: 'Máscara de soldar', imageUrl: '/images/ppe-mask.png' },
      { id: 'boots', name: 'Botas de seguridad', imageUrl: '/images/ppe-boots.png' },
    ],
    requiredPpe: ['gloves', 'mask', 'boots'],
  },
};

interface Lesson {
  id: string;
  title: any; // Can be string or JSON for translation
  videoUrl: string | null;
  modelUrl: string | null;
  content: string | null; // Markdown content
}

export default function LessonPage() {
  const params = useParams();
  const { courseId, lessonId } = params;

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lessonId) {
      const fetchLesson = async () => {
        setIsLoading(true);
        try {
          const courseResponse = await fetch(`/api/courses/${courseId}`);
          if (!courseResponse.ok) throw new Error('Failed to fetch course data.');
          const courseData = await courseResponse.json();
          const foundLesson = courseData.lessons.find((l: any) => l.id === lessonId);

          if (foundLesson) {
            setLesson(foundLesson);
          } else {
            setError('Lesson not found in this course.');
          }
        } catch (err: any) {
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      };
      fetchLesson();
    }
  }, [lessonId, courseId]);

  const lessonTitle = typeof lesson?.title === 'object' && lesson.title !== null ? (lesson.title as any).es : lesson?.title;
  const lessonContentForAI = lesson?.content || lesson?.videoUrl || lesson?.modelUrl || `Contenido de la lección ${lessonTitle}.`;

  const markdownComponents = {
    quiz(props: any) {
      return <QuizComponent quizId={props.id} />;
    },
    'hazard-identification'(props: any) {
      const scenario = hazardScenarios[props.scenario as keyof typeof hazardScenarios];
      if (!scenario) return <p>Escenario de identificación de peligros no encontrado.</p>;
      return <HazardIdentification imageUrl={scenario.imageUrl} hazards={scenario.hazards} />;
    },
    'ppe-selection'(props: any) {
      const scenario = ppeScenarios[props.scenario as keyof typeof ppeScenarios];
      if (!scenario) return <p>Escenario de selección de EPP no encontrado.</p>;
      return <PPESelection availablePpe={scenario.availablePpe} scenario={scenario} />;
    },
    'interactive-content'(props: any) {
        try {
            const items = JSON.parse(props.items);
            return <InteractiveContent type={props.type} items={items} />;
        } catch (e) {
            return <p>Error al parsear los items del contenido interactivo.</p>;
        }
    },
  };

  if (isLoading) return <div className="text-center py-12">Cargando lección...</div>;
  if (error) return <div className="text-center py-12 text-red-500">Error: {error}</div>;
  if (!lesson) return <div className="text-center py-12">Lección no encontrada.</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white p-6 md:p-8 rounded-lg shadow-lg">
        <Link href={`/courses/${courseId}`} className="mb-6 text-blue-600 hover:underline block">← Volver al Curso</Link>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{lessonTitle}</h1>

        {lesson.videoUrl && (
          <div className="mb-6">
            <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-md">
              <iframe src={lesson.videoUrl} title={lessonTitle} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full"></iframe>
            </div>
          </div>
        )}

        {lesson.modelUrl && (
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-2">Modelo 3D Interactivo</h2>
            <div className="h-96 bg-gray-200 rounded-lg"><InteractiveModelViewer modelUrl={lesson.modelUrl} /></div>
          </div>
        )}

        {lesson.content && (
          <div className="prose prose-lg max-w-none">
            <ReactMarkdown components={markdownComponents} rehypePlugins={[rehypeRaw]}>
              {lesson.content}
            </ReactMarkdown>
          </div>
        )}

        <hr className="my-8" />

        <div className="mt-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Comentarios y Preguntas</h2>
          <CommentsSection lessonId={lesson.id} />
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Tutor IA</h2>
          <AIChatbot lessonContent={lessonContentForAI} />
        </div>

      </div>
    </div>
  );
}