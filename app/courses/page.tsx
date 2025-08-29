'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import CourseCard from '../components/CourseCard';

// Updated Course interface to include area
interface Course {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  price: number | null;
  area: string; // Added area
  category: {
    name: string;
  };
  lessons: { id: string }[];
}

// Grouping function
const groupCoursesByArea = (courses: Course[]) => {
  return courses.reduce((acc, course) => {
    const area = course.area || 'General';
    if (!acc[area]) {
      acc[area] = [];
    }
    acc[area].push(course);
    return acc;
  }, {} as Record<string, Course[]>);
};

function CoursesContent() {
  const searchParams = useSearchParams();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const term = searchParams.get('search') || '';
    setSearchTerm(term);
  }, [searchParams]);

  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (searchTerm) {
          params.append('search', searchTerm);
        }
        
        const response = await fetch(`/api/courses?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch courses');
        }
        const data = await response.json();
        setCourses(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourses();
  }, [searchTerm]);

  const groupedCourses = useMemo(() => groupCoursesByArea(courses), [courses]);
  const areas = Object.keys(groupedCourses);

  if (isLoading) {
    return <div className="text-center py-12">Cargando cursos...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-12 text-gray-800">Nuestros Cursos</h1>
      
      {courses.length === 0 && !isLoading && (
        <p className="text-center text-gray-500 text-xl">No se encontraron cursos que coincidan con su búsqueda.</p>
      )}

      <div className="space-y-16 mt-8">
        {areas.map((area) => (
          <section key={area} className="bg-white p-6 rounded-lg shadow-xl border border-gray-100">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-8 border-b-4 border-blue-600 pb-3 inline-block pr-8">{area}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {groupedCourses[area].map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export default function CoursesPage() {
  return (
    <Suspense fallback={<div>Cargando cursos...</div>}>
      <CoursesContent />
    </Suspense>
  );
}