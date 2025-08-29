'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Category {
  id: string;
  name: string;
}

export default function CreateCoursePage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        } else {
          setMessage('Error al cargar las categorías.');
        }
      } catch (error) {
        setMessage('Error de red al cargar categorías.');
      }
    };

    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (!title || !categoryId) {
      setMessage('El título y la categoría son obligatorios.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, description, categoryId }),
      });

      if (response.ok) {
        setMessage('¡Curso creado exitosamente!');
        router.push('/dashboard');
      } else {
        const errorData = await response.json();
        setMessage(errorData.message || 'Ocurrió un error al crear el curso.');
      }
    } catch (error) {
      console.error('Failed to create course:', error);
      setMessage('Error de red. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Crear Nuevo Curso</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="title" className="block text-gray-700 text-sm font-bold mb-2">
              Título del Curso:
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Ej: Introducción a React"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="category" className="block text-gray-700 text-sm font-bold mb-2">
              Categoría:
            </label>
            <select
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
              <option value="" disabled>Selecciona una categoría</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">
              Descripción del Curso:
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32"
              placeholder="Describe de qué trata el curso..."
            />
          </div>

          {message && <p className="text-sm text-center text-red-500 mb-4">{message}</p>}

          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-blue-300"
            >
              {isLoading ? 'Guardando...' : 'Guardar Curso'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
