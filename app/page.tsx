import Link from 'next/link';
import CourseCard from './components/CourseCard';
import Hero from './components/Hero';
import VisitCounter from './components/VisitCounter'; // Import VisitCounter

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
  lessons: any[]; // Simplified for this context
}

export default async function Home() {
  let featuredCourses: Course[] = [];
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/courses`, { next: { revalidate: 3600 } }); // Revalidate every hour
    if (!response.ok) {
      throw new Error('Failed to fetch courses');
    }
    const allCourses: Course[] = await response.json();

    // Filter courses by area as before, assuming the API returns all courses
    featuredCourses = [
      allCourses.find(course => course.category.name === 'Sistema de Gestión de Seguridad'),
      allCourses.find(course => course.category.name === 'Proyectos'),
      allCourses.find(course => course.category.name === 'Textiles'),
      allCourses.find(course => course.category.name === 'Gestión de Riesgos'),
      allCourses.find(course => course.category.name === 'Gestión de aguas y Relaves'),
    ].filter((course): course is Course => course !== undefined);

  } catch (error) {
    console.error("Error fetching featured courses:", error);
    // Fallback to empty array or handle error gracefully
    featuredCourses = [];
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Hero />
      {/* Featured Courses Section */}
      <section className="py-16 bg-gray-50 flex-grow">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">Cursos Destacados por Área</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {featuredCourses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/courses" className="bg-blue-600 text-white font-bold py-3 px-8 rounded-full hover:bg-blue-700 transition duration-300">
                Ver Todos los Cursos
            </Link>
          </div>
        </div>
      </section>

      {/* Key Points Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">Puntos Clave a Recordar</h2>
          <div className="max-w-4xl mx-auto">
            <ul className="list-disc list-inside space-y-4 text-lg text-gray-700">
              <li>
                <span className="font-semibold">Validez:</span> La mayoría de certificaciones para trabajos de alto riesgo tienen una validez de 2 años. Pasado ese tiempo, se debe realizar un curso de reentrenamiento.
              </li>
              <li>
                <span className="font-semibold">Centros Autorizados:</span> Los cursos deben ser impartidos por Centros de Entrenamiento autorizados y auditados por el Ministerio de Energía y Minas (MEM) o el Ministerio de Trabajo (MTPE), dependiendo del sector.
              </li>
              <li>
                <span className="font-semibold">Certificación:</span> Al finalizar, el trabajador debe recibir un certificado que acredite su capacitación. Este documento es fundamental para las inspecciones de SUNAT o SUNAFIL.
              </li>
              <li>
                <span className="font-semibold">Responsabilidad del Empleador:</span> La ley peruana obliga al empleador a capacitar a su personal y garantizar que solo realicen trabajos de alto riesgo si están debidamente certificados.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <VisitCounter /> {/* Add VisitCounter here */}
    </div>
  );
}