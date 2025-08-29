import Link from 'next/link';
import Image from 'next/image';

// Define the Course interface for CourseCard based on the API response
interface Course {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  price: number | null;
  isPublished: boolean;
  categoryId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  area: string; // Added area property
  category: {
    id: string;
    name: string;
  };
  user: {
    username: string;
  };
  _count: {
    lessons: number;
  };
}

const CourseCard: React.FC<{ course: Course }> = ({ course }) => {
  const getAreaColor = (areaName: string) => {
    switch (areaName) {
      case 'Sistema de Gestión de Seguridad':
        return 'bg-red-100 text-red-700 border border-red-200';
      case 'Proyectos':
        return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'Textiles':
        return 'bg-green-100 text-green-700 border border-green-200';
      case 'Gestión de Riesgos':
        return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
      case 'Gestión de aguas y relaves':
        return 'bg-purple-100 text-purple-700 border border-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  };

  return (
    <Link href={`/courses/${course.id}`} className="block p-6 bg-white rounded-lg border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
        {course.imageUrl && (
            <div className="relative w-full h-40 mb-4 rounded-lg overflow-hidden">
                <Image src={course.imageUrl} alt={course.title} fill style={{ objectFit: 'cover' }} />
            </div>
        )}
        <div className="flex justify-between items-center mb-2">
            <h5 className="text-xl font-bold tracking-tight text-gray-900">{course.title}</h5>
            <span className={`text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full ${getAreaColor(course.area)}`}>{course.area}</span>
        </div>
        <p className="font-normal text-gray-700 mb-2"><span className="font-semibold">Descripción:</span> {course.description}</p>
        {/* You can add more course details here if needed */}
    </Link>
  );
};

export default CourseCard;
