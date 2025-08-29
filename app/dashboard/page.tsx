'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

// Define the types for our data
interface Course {
  id: string;
  title: string;
  isPublished: boolean;
  category: {
    name: string;
  };
  _count: {
    lessons: number;
  };
}

export default function Dashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      const fetchCourses = async () => {
        try {
          const response = await fetch('/api/instructor/courses');
          if (!response.ok) {
            throw new Error('Failed to fetch courses');
          }
          const data = await response.json();
          setCourses(data);
        } catch (err) {
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      };

      fetchCourses();
    }
    if (status === 'unauthenticated') {
        router.push('/login');
    }
  }, [status, router]);

  const handleCreateCourse = () => {
    router.push('/courses/create');
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este curso y todas sus lecciones?')) {
      return;
    }

    try {
      const response = await fetch(`/api/instructor/courses/${courseId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete course.');
      }

      // Update UI by removing the deleted course
      setCourses(prevCourses => prevCourses.filter(course => course.id !== courseId));

    } catch (err) {
      setError(err.message);
    }
  };

  if (status === 'loading' || isLoading) {
    return <div className="text-center py-12">Cargando...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Panel de Instructor</h1>
          <button
            onClick={handleCreateCourse}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300"
          >
            Crear Nuevo Curso
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Mis Cursos</h2>
          {
            courses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map(course => (
                  <div key={course.id} className="border p-4 rounded-lg shadow-sm flex flex-col justify-between">
                    <div>
                        <div className={`text-sm font-bold py-1 px-2 rounded inline-block mb-2 ${course.isPublished ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>
                            {course.isPublished ? 'Publicado' : 'Borrador'}
                        </div>
                        <h3 className="text-xl font-bold">{course.title}</h3>
                        <p className="text-gray-600 mt-2">Categoría: {course.category.name}</p>
                        <p className="text-gray-500 text-sm mt-1">{course._count.lessons} lecciones</p>
                    </div>
                    <div className="flex justify-end space-x-2 mt-4">
                        <Link href={`/courses/manage/${course.id}`} className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-1 px-3 rounded-lg">
                          Gestionar
                        </Link>
                        <button 
                          onClick={() => handleDeleteCourse(course.id)}
                          className="text-sm bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded-lg"
                        >
                          Eliminar
                        </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">Aún no has creado ningún curso.</p>
                <p className="text-sm text-gray-400 mt-2">¡Haz clic en "Crear Nuevo Curso" para empezar!</p>
              </div>
            )
          }
        </div>
      </div>
    </div>
  );
}