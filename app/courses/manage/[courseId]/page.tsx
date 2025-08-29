'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useLanguage } from '@/app/context/LanguageContext';

// Define types for our data
interface Lesson {
  id: string;
  title: Record<string, string>; // Changed to Record<string, string>
  description: Record<string, string> | null; // Changed to Record<string, string>
  position: number;
}

interface Category {
  id: string;
  name: string;
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  isPublished: boolean;
  categoryId: string;
  category: {
    name: string;
  };
  lessons: Lesson[];
}

export default function ManageCoursePage() {
  const router = useRouter();
  const params = useParams();
  const { courseId } = params;
  const { status } = useSession();
  const { currentLanguage } = useLanguage();

  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for the new lesson form
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for inline lesson editing
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editingLessonTitle, setEditingLessonTitle] = useState('');

  // State for course details editing
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIsPublished, setEditIsPublished] = useState(false);
  const [editCategoryId, setEditCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSavingCourseDetails, setIsSavingCourseDetails] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && courseId) {
      const fetchCourseAndCategories = async () => {
        try {
          // Fetch course data
          const courseResponse = await fetch(`/api/instructor/courses/${courseId}`);
          if (!courseResponse.ok) throw new Error('Failed to fetch course data.');
          const courseData = await courseResponse.json();
          setCourse(courseData);
          
          // Initialize edit states with fetched course data
          setEditTitle(courseData.title);
          setEditDescription(courseData.description || '');
          setEditIsPublished(courseData.isPublished);
          setEditCategoryId(courseData.categoryId);

          // Fetch categories
          const categoriesResponse = await fetch('/api/categories');
          if (!categoriesResponse.ok) throw new Error('Failed to fetch categories.');
          const categoriesData = await categoriesResponse.json();
          setCategories(categoriesData);

        } catch (err) {
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      };
      fetchCourseAndCategories();
    }
    if (status === 'unauthenticated') router.push('/login');
  }, [status, courseId, router]);

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLessonTitle || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/courses/${courseId}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newLessonTitle }), // API expects string, converts to JSON
      });
      if (!response.ok) throw new Error('Failed to add lesson.');
      const newLesson = await response.json();
      setCourse(prev => prev ? { ...prev, lessons: [...prev.lessons, newLesson] } : null);
      setNewLessonTitle('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta lección?')) return;
    try {
      const response = await fetch(`/api/courses/${courseId}/lessons/${lessonId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete lesson.');
      setCourse(prev => prev ? { ...prev, lessons: prev.lessons.filter(l => l.id !== lessonId) } : null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateLesson = async (lessonId: string) => {
    if (!editingLessonTitle) return;
    try {
      const response = await fetch(`/api/courses/${courseId}/lessons/${lessonId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editingLessonTitle }), // API expects string, converts to JSON
      });
      if (!response.ok) throw new Error('Failed to update lesson.');
      const updatedLesson = await response.json();
      setCourse(prev => prev ? { ...prev, lessons: prev.lessons.map(l => l.id === lessonId ? updatedLesson : l) } : null);
      setEditingLessonId(null);
      setEditingLessonTitle('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateCourseDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCourseDetails(true);
    try {
      const response = await fetch(`/api/instructor/courses/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          isPublished: editIsPublished,
          categoryId: editCategoryId,
        }),
      });
      if (!response.ok) throw new Error('Failed to update course details.');
      const updatedCourse = await response.json();
      setCourse(updatedCourse);
      alert('Detalles del curso actualizados exitosamente!');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSavingCourseDetails(false);
    }
  };

  if (isLoading || status === 'loading') return <div className="text-center py-12">Cargando...</div>;
  if (error) return <div className="text-center py-12 text-red-500">Error: {error}</div>;
  if (!course) return <div className="text-center py-12">Curso no encontrado.</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => router.push('/dashboard')} className="mb-4 text-blue-600 hover:underline">← Volver al Panel</button>
        <h1 className="text-3xl font-bold text-gray-800">Gestionar Curso</h1>
        <p className="text-xl text-gray-600 mb-8">{course.title}</p>

        {/* Course Details Editing Section */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Editar Detalles del Curso</h2>
          <form onSubmit={handleUpdateCourseDetails}>
            <div className="mb-4">
              <label htmlFor="editTitle" className="block text-gray-700 text-sm font-bold mb-2">Título:</label>
              <input type="text" id="editTitle" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" required />
            </div>
            <div className="mb-4">
              <label htmlFor="editDescription" className="block text-gray-700 text-sm font-bold mb-2">Descripción:</label>
              <textarea id="editDescription" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 h-24"></textarea>
            </div>
            <div className="mb-4">
              <label htmlFor="editCategory" className="block text-gray-700 text-sm font-bold mb-2">Categoría:</label>
              <select id="editCategory" value={editCategoryId} onChange={(e) => setEditCategoryId(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" required>
                <option value="">Selecciona una categoría</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="mb-4 flex items-center">
              <input type="checkbox" id="editIsPublished" checked={editIsPublished} onChange={(e) => setEditIsPublished(e.target.checked)} className="mr-2" />
              <label htmlFor="editIsPublished" className="text-gray-700 text-sm font-bold">Publicar Curso</label>
            </div>
            <button type="submit" disabled={isSavingCourseDetails} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-blue-300">
              {isSavingCourseDetails ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </form>
        </div>

        {/* Lesson Management Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Lecciones</h2>
          
          {/* List of existing lessons */}
          <div className="space-y-3 mb-6">
            {course.lessons.length > 0 ? (
              course.lessons.map(lesson => (
                <div key={lesson.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                  {editingLessonId === lesson.id ? (
                    <input type="text" value={editingLessonTitle} onChange={(e) => setEditingLessonTitle(e.target.value)} className="flex-grow shadow appearance-none border rounded py-2 px-3 text-gray-700" />
                  ) : (
                    <p>{lesson.position}. {lesson.title[currentLanguage] || lesson.title.es || '[Sin Título]'}</p>
                  )}
                  <div className="flex space-x-2">
                    {editingLessonId === lesson.id ? (
                      <button onClick={() => handleUpdateLesson(lesson.id)} className="text-sm bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-3 rounded-lg">Guardar</button>
                    ) : (
                      <button onClick={() => { setEditingLessonId(lesson.id); setEditingLessonTitle(lesson.title[currentLanguage] || lesson.title.es || ''); }} className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-1 px-3 rounded-lg">Editar</button>
                    )}
                    <button onClick={() => handleDeleteLesson(lesson.id)} className="text-sm bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded-lg">Eliminar</button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">Este curso aún no tiene lecciones.</p>
            )}
          </div>

          {/* Form to add a new lesson */}
          <form onSubmit={handleAddLesson} className="mt-6 border-t pt-6">
            <h3 className="text-lg font-semibold mb-2">Añadir Nueva Lección</h3>
            <div className="flex space-x-2">
              <input type="text" value={newLessonTitle} onChange={(e) => setNewLessonTitle(e.target.value)} placeholder="Título de la nueva lección" className="flex-grow shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" />
              <button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-blue-300">{isSubmitting ? 'Añadiendo...' : 'Añadir'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
