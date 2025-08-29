
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import ProgressBar from '@/app/components/ProgressBar';
import Image from 'next/image';

const IzipayPaymentForm = dynamic(() => import('@/app/components/IzipayPaymentForm'), {
  ssr: false,
  loading: () => <p>Cargando formulario de pago...</p>,
});

interface Lesson {
  id: string;
  title: any;
  videoUrl: string | null;
  modelUrl: string | null;
  position: number;
  isPublished: boolean;
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  price: number | null;
  isPublished: boolean;
  category: { name: string; };
  user: { username: string; };
  lessons: Lesson[];
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  user: { username: string; };
  createdAt: string;
}

const getLessonTitle = (title: any, lang = 'es') => {
    if (typeof title === 'object' && title !== null && title[lang]) {
        return title[lang];
    }
    if (typeof title === 'string') {
        return title;
    }
    return 'Lección sin título';
};

export default function CourseDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { courseId } = params;
  const { data: session, status } = useSession();

  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [enrollmentMessage, setEnrollmentMessage] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [completedLessonsIds, setCompletedLessonsIds] = useState<string[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [newReviewRating, setNewReviewRating] = useState(0);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [userHasReviewed, setUserHasReviewed] = useState(false);

  useEffect(() => {
    if (courseId) {
      const fetchCourse = async () => {
        try {
          const response = await fetch(`/api/courses/${courseId}`);
          if (!response.ok) throw new Error('Failed to fetch course data.');
          const data = await response.json();
          setCourse(data);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      };
      fetchCourse();
    }
  }, [courseId]);

  useEffect(() => {
    if (status === 'authenticated' && courseId) {
      const checkEnrollment = async () => {
        try {
          const response = await fetch(`/api/enrollments/check/${courseId}`);
          if (!response.ok) throw new Error('Failed to check enrollment status.');
          const data = await response.json();
          setIsEnrolled(data.isEnrolled);
          setCompletedLessonsIds(data.completedLessons || []);
        } catch (err: any) {
          console.error('Error checking enrollment:', err);
        }
      };
      checkEnrollment();
    }
  }, [status, courseId]);

  useEffect(() => {
    if (courseId) {
      const fetchReviews = async () => {
        try {
          const response = await fetch(`/api/courses/${courseId}/reviews`);
          if (!response.ok) throw new Error('Failed to fetch reviews.');
          const data = await response.json();
          setReviews(data);
          if (session?.user?.id) {
            setUserHasReviewed(data.some((review: any) => review.userId === session.user.id));
          }
        } catch (err: any) {
          console.error('Error fetching reviews:', err);
        } finally {
          setReviewsLoading(false);
        }
      };
      fetchReviews();
    }
  }, [courseId, session?.user?.id]);

  const handleEnrollment = async (isPaid: boolean) => {
    if (status !== 'authenticated') {
      router.push('/login');
      return;
    }
    if (!course) return;
    try {
      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: course.id, isPaid: isPaid }),
      });
      if (response.ok) {
        setEnrollmentMessage('¡Inscripción exitosa! Ahora puedes acceder al curso.');
        setIsEnrolled(true);
      } else {
        const errorData = await response.json();
        setEnrollmentMessage(errorData.message || 'Error al procesar la inscripción.');
      }
    } catch (err) {
      setEnrollmentMessage('Error de red al inscribirse.');
    }
  };

  const handlePaymentSuccess = (paymentResponse: any) => {
    console.log('Payment successful, now creating enrollment:', paymentResponse);
    handleEnrollment(true);
  };

  const handlePaymentError = (paymentError: any) => {
    console.error('Payment error:', paymentError);
    setEnrollmentMessage('Error en el pago. Por favor, inténtalo de nuevo.');
    setShowPaymentForm(false);
  };

  const handleEnrollClick = () => {
    if (status !== 'authenticated') {
      router.push('/login');
      return;
    }
    if (!course) return;
    if (course.price === 0 || course.price === null) {
      handleEnrollment(false);
    } else {
      setShowPaymentForm(true);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewRating || isSubmittingReview) return;
    setIsSubmittingReview(true);
    try {
      const response = await fetch(`/api/courses/${courseId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: newReviewRating, comment: newReviewComment }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit review.');
      }
      const newReview = await response.json();
      setReviews(prevReviews => [newReview, ...prevReviews]);
      setNewReviewRating(0);
      setNewReviewComment('');
      setUserHasReviewed(true);
      alert('Reseña enviada exitosamente!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const totalLessons = course?.lessons.length || 0;
  const completedCount = completedLessonsIds.length;

  if (isLoading) return <div className="text-center py-12">Cargando detalles del curso...</div>;
  if (error) return <div className="text-center py-12 text-red-500">Error: {error}</div>;
  if (!course) return <div className="text-center py-12">Curso no encontrado.</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <Link href="/courses" className="mb-4 text-blue-600 hover:underline block">← Volver a Cursos</Link>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">{course.title}</h1>
        <p className="text-gray-600 mb-2">Por: {course.user.username}</p>
        <p className="text-gray-600 mb-4">Categoría: {course.category.name}</p>
        {course.imageUrl && <div className="mb-4"><Image src={course.imageUrl} alt={course.title} width={600} height={400} className="w-full h-64 object-cover rounded-lg" /></div>}
        <p className="text-gray-700 mb-6">{course.description}</p>
        <div className="flex justify-between items-center mb-8">
          <span className="text-2xl font-bold text-blue-600">{course.price ? `${course.price.toFixed(2)}` : 'Gratis'}</span>
          {!isEnrolled && !showPaymentForm && <button onClick={handleEnrollClick} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition duration-300">Inscribirse</button>}
          {isEnrolled && <span className="bg-blue-100 text-blue-800 text-lg font-semibold px-4 py-2 rounded-full">Inscrito</span>}
        </div>
        {enrollmentMessage && <p className="text-center text-sm mb-4 text-blue-600">{enrollmentMessage}</p>}
        {showPaymentForm && course.price && course.price > 0 && session?.user?.email && (
          <div className="mt-8 p-4 border rounded-lg bg-gray-50">
            <h3 className="text-xl font-semibold mb-4">Completa tu Pago</h3>
            <IzipayPaymentForm amount={course.price} currency="PEN" orderId={`COURSE-${course.id}-${Date.now()}`} customer={{ email: session.user.email }} onPaymentSuccess={handlePaymentSuccess} onPaymentError={handlePaymentError} />
          </div>
        )}
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Lecciones del Curso</h2>
        {isEnrolled && totalLessons > 0 && <div className="mb-4"><ProgressBar value={completedCount} max={totalLessons} /></div>}
        <div className="space-y-3">
          {course.lessons.length > 0 ? (
            course.lessons.map(lesson => {
              // DEBUGGING: Log the title to see its structure
              console.log('Rendering lesson title:', lesson.title);
              const titleToRender = getLessonTitle(lesson.title);
              return (
                <div key={lesson.id} className="bg-gray-50 p-4 rounded-lg shadow-sm flex justify-between items-center">
                  <Link href={isEnrolled ? `/courses/${course.id}/learn/${lesson.id}` : `#`} className={`font-semibold ${isEnrolled ? 'text-blue-600 hover:underline' : 'text-gray-500 cursor-not-allowed'}`}>
                    {lesson.position}. {titleToRender}
                  </Link>
                  {isEnrolled && completedLessonsIds.includes(lesson.id) && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Completada</span>}
                </div>
              );
            })
          ) : (
            <p className="text-gray-500">Este curso aún no tiene lecciones publicadas.</p>
          )}
        </div>
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Reseñas del Curso</h2>
          {reviewsLoading ? <p>Cargando reseñas...</p> : reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map(review => (
                <div key={review.id} className="border-b pb-4 last:border-b-0">
                  <div className="flex items-center mb-2">
                    <p className="font-bold mr-2">{review.user.username}</p>
                    <span className="text-yellow-500">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                  </div>
                  <p className="text-gray-700">{review.comment}</p>
                  <p className="text-gray-500 text-sm mt-1">{new Date(review.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-500">Aún no hay reseñas para este curso.</p>}
          {status === 'authenticated' && isEnrolled && !userHasReviewed && (
            <div className="mt-6 border-t pt-6">
              <h3 className="text-xl font-semibold mb-4">Escribe tu Reseña</h3>
              <form onSubmit={handleSubmitReview}>
                <div className="mb-4">
                  <label htmlFor="rating" className="block text-gray-700 text-sm font-bold mb-2">Calificación:</label>
                  <select id="rating" value={newReviewRating} onChange={(e) => setNewReviewRating(parseInt(e.target.value))} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required>
                    <option value="0">Selecciona una calificación</option>
                    <option value="1">1 - Muy Malo</option>
                    <option value="2">2 - Malo</option>
                    <option value="3">3 - Regular</option>
                    <option value="4">4 - Bueno</option>
                    <option value="5">5 - Excelente</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label htmlFor="comment" className="block text-gray-700 text-sm font-bold mb-2">Comentario (opcional):</label>
                  <textarea id="comment" value={newReviewComment} onChange={(e) => setNewReviewComment(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 h-24 leading-tight focus:outline-none focus:shadow-outline" placeholder="Comparte tu experiencia..."></textarea>
                </div>
                <button type="submit" disabled={isSubmittingReview} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-blue-300">{isSubmittingReview ? 'Enviando...' : 'Enviar Reseña'}</button>
              </form>
            </div>
          )}
          {status === 'authenticated' && isEnrolled && userHasReviewed && <p className="mt-6 text-gray-600">Ya has enviado una reseña para este curso.</p>}
          {status !== 'authenticated' && <p className="mt-6 text-gray-600">Inicia sesión para dejar una reseña.</p>}
          {status === 'authenticated' && !isEnrolled && <p className="mt-6 text-gray-600">Inscríbete en el curso para dejar una reseña.</p>}
        </div>
      </div>
    </div>
  );
}
