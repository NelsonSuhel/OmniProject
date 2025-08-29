'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
}

interface Course {
  id: string;
  title: string;
  isPublished: boolean;
  user: {
    username: string;
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = session?.user?.role === 'ADMIN';

  useEffect(() => {
    if (status === 'loading') return;

    if (!isAdmin) {
      router.push('/login'); // Redirect non-admins
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch Users
        const usersResponse = await fetch('/api/admin/users');
        if (!usersResponse.ok) throw new Error('Failed to fetch users');
        const usersData = await usersResponse.json();
        setUsers(usersData);

        // Fetch Courses
        const coursesResponse = await fetch('/api/admin/courses');
        if (!coursesResponse.ok) throw new Error('Failed to fetch courses');
        const coursesData = await coursesResponse.json();
        setCourses(coursesData);

      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [status, isAdmin, router]);

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar a este usuario?')) return;
    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId }),
      });
      if (!response.ok) throw new Error('Failed to delete user');
      setUsers(prev => prev.filter(user => user.id !== userId));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleCoursePublished = async (courseId: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/admin/courses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: courseId, isPublished: !currentStatus }),
      });
      if (!response.ok) throw new Error('Failed to update course status');
      const updatedCourse = await response.json();
      setCourses(prev => prev.map(course => course.id === courseId ? updatedCourse : course));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este curso y todo su contenido?')) return;
    try {
      const response = await fetch('/api/admin/courses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: courseId }),
      });
      if (!response.ok) throw new Error('Failed to delete course');
      setCourses(prev => prev.filter(course => course.id !== courseId));
    } catch (err) {
      setError(err.message);
    }
  };

  if (status === 'loading' || isLoading) {
    return <div className="text-center py-12">Cargando Panel de Administración...</div>;
  }

  if (!isAdmin) {
    return <div className="text-center py-12 text-red-500">Acceso Denegado. No tienes permisos de administrador.</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Panel de Administración</h1>

        {/* User Management */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Gestión de Usuarios</h2>
          {users.length > 0 ? (
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b">Usuario</th>
                  <th className="py-2 px-4 border-b">Email</th>
                  <th className="py-2 px-4 border-b">Rol</th>
                  <th className="py-2 px-4 border-b">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td className="py-2 px-4 border-b">{user.username}</td>
                    <td className="py-2 px-4 border-b">{user.email}</td>
                    <td className="py-2 px-4 border-b">{user.role}</td>
                    <td className="py-2 px-4 border-b">
                      <button onClick={() => handleDeleteUser(user.id)} className="bg-red-500 hover:bg-red-600 text-white text-sm py-1 px-3 rounded">Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500">No hay usuarios registrados.</p>
          )}
        </div>

        {/* Course Management */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Gestión de Cursos</h2>
          {courses.length > 0 ? (
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b">Título</th>
                  <th className="py-2 px-4 border-b">Instructor</th>
                  <th className="py-2 px-4 border-b">Publicado</th>
                  <th className="py-2 px-4 border-b">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {courses.map(course => (
                  <tr key={course.id}>
                    <td className="py-2 px-4 border-b">{course.title}</td>
                    <td className="py-2 px-4 border-b">{course.user.username}</td>
                    <td className="py-2 px-4 border-b">
                      <input type="checkbox" checked={course.isPublished} onChange={() => handleToggleCoursePublished(course.id, course.isPublished)} />
                    </td>
                    <td className="py-2 px-4 border-b flex space-x-2">
                      <button onClick={() => handleDeleteCourse(course.id)} className="bg-red-500 hover:bg-red-600 text-white text-sm py-1 px-3 rounded">Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500">No hay cursos registrados.</p>
          )}
        </div>
      </div>
    </div>
  );
}
