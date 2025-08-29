'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (!email || !password) {
      setMessage('Por favor, ingresa tu correo y contraseña.');
      return;
    }

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.ok) {
        // On successful sign-in, redirect to the dashboard.
        router.push('/dashboard');
      } else {
        // Handle errors, e.g., show a message to the user.
        setMessage(result?.error || 'Credenciales incorrectas. Inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setMessage('Ocurrió un error inesperado.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">Iniciar Sesión</h2>
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Correo Electrónico:</label>
            <input
              type="email"
              id="email"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">Contraseña:</label>
            <input
              type="password"
              id="password"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
          >
            Iniciar Sesión
          </button>
        </form>
        {message && <p className="text-center mt-4 text-sm text-red-500">{message}</p>}
        <p className="text-center text-gray-600 text-sm mt-4">
          ¿No tienes una cuenta? <Link href="/register" className="text-blue-600 hover:underline">Regístrate aquí</Link>
        </p>
      </div>
    </div>
  );
}
