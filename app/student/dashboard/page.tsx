'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import AIChatbot from '@/app/components/AIChatbot';

// Define the Course interface based on the API response
interface Course {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  price: number | null;
  isPublished: boolean;
  category: {
    name: string;
  };
  user: {
    username: string;
  };
  lessons: {
    id: string;
    title: string;
    position: number;
  }[];
  completedLessons: string[]; // Added for progress tracking
}

export default function StudentDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      const fetchEnrolledCourses = async () => {
        try {
          const response = await fetch('/api/student/courses');
          if (!response.ok) {
            throw new Error('Failed to fetch enrolled courses');
          }
          const data = await response.json();
          setEnrolledCourses(data);
        } catch (err) {
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      };
      fetchEnrolledCourses();
    }
    if (status === 'unauthenticated') {
        router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading' || isLoading) {
    return <div className="text-center py-12">Cargando panel de estudiante...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-500">Error: {error}</div>;
  }

  // Find the next uncompleted lesson
  let nextLessonToContinue: { courseId: string; lessonId: string; courseTitle: string; lessonTitle: string } | null = null;

  for (const course of enrolledCourses) {
    // Sort lessons by position to ensure correct order
    const sortedLessons = [...course.lessons].sort((a, b) => a.position - b.position);
    for (const lesson of sortedLessons) {
      if (!course.completedLessons?.includes(lesson.id)) {
        nextLessonToContinue = {
          courseId: course.id,
          lessonId: lesson.id,
          courseTitle: course.title,
          lessonTitle: lesson.title,
        };
        break; // Found the first uncompleted lesson
      }
    }
    if (nextLessonToContinue) {
      break; // Found the first uncompleted lesson in any course
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Mis Cursos Inscritos</h1>

        {/* Overall Progress Summary */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Resumen de Progreso</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-gray-500 text-sm">Cursos Inscritos</p>
              <p className="text-blue-600 text-3xl font-bold">{enrolledCourses.length}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Lecciones Completadas</p>
              <p className="text-green-600 text-3xl font-bold">{
                enrolledCourses.reduce((acc, course) => acc + (course.completedLessons?.length || 0), 0)
              }</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Progreso General</p>
              <p className="text-purple-600 text-3xl font-bold">{
                (() => {
                  const totalAllLessons = enrolledCourses.reduce((acc, course) => acc + course.lessons.length, 0);
                  const completedAllLessons = enrolledCourses.reduce((acc, course) => acc + (course.completedLessons?.length || 0), 0);
                  return totalAllLessons > 0 ? `${Math.round((completedAllLessons / totalAllLessons) * 100)}%` : '0%';
                })()
              }</p>
            </div>
          </div>
        </div>

        {/* AI Tutor Section */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Tutor de Inteligencia Artificial</h2>
          <AIChatbot lessonContent="" />
        </div>

        {/* Continue Learning Section */}
        {nextLessonToContinue ? (
          <div className="bg-white p-6 rounded-lg shadow-md mb-8 border-l-4 border-blue-500">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">¡Continúa Aprendiendo!</h2>
            <p className="text-gray-700 mb-2">
              Tu próxima lección es: <span className="font-bold">{nextLessonToContinue.lessonTitle}</span> en el curso <span className="font-bold">{nextLessonToContinue.courseTitle}</span>.
            </p>
            <Link href={`/courses/${nextLessonToContinue.courseId}/learn/${nextLessonToContinue.lessonId}`}>
              <a className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition duration-300 mt-4">
                Ir a la Lección
              </a>
            </Link>
          </div>
        ) : (
          enrolledCourses.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-md mb-8 border-l-4 border-green-500">
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">¡Felicidades!</h2>
              <p className="text-gray-700 mb-2">Has completado todas las lecciones de tus cursos inscritos.</p>
              <Link href="/courses">
                <a className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition duration-300 mt-4">
                  Explorar Nuevos Cursos
                </a>
              </Link>
            </div>
          )
        )}

        <h2 className="text-2xl font-bold text-gray-800 mb-6">Tus Cursos</h2> {/* Changed h1 to h2 and added margin */}

        {enrolledCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledCourses.map(course => {
              const totalLessons = course.lessons.length;
              const completedCount = course.completedLessons ? course.completedLessons.length : 0;
              const progressPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

              return (
                <div key={course.id} className="bg-white p-6 rounded-lg shadow-md flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{course.title}</h3>
                    <p className="text-gray-600 text-sm mb-4">Por: {course.user.username} | Categoría: {course.category.name}</p>
                    <p className="text-gray-700">{course.description?.substring(0, 100)}...</p>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">Progreso: {progressPercentage}% ({completedCount}/{totalLessons} lecciones)</p>
                  </div>
                  <div className="mt-4">
                    <Link href={`/courses/${course.id}`}>
                      <a className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300">Ver Curso</a>
                    </Link>
                    {course.lessons.length > 0 && (
                      <Link href={`/courses/${course.id}/learn/${course.lessons[0].id}`}>
                        <a className="inline-block ml-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300">Continuar Lección</a>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">Aún no estás inscrito en ningún curso.</p>
            <Link href="/courses" className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Explorar Cursos</Link>
          </div>
        )}
      </div>
    </div>
  );
}