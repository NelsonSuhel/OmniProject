'use client';

import { useState } from 'react';
import Link from 'next/link';
import IzipayPaymentForm from '../components/IzipayPaymentForm';

interface Plan {
  name: string;
  price: number;
  orderId: string;
}

export default function Pricing() {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const plans: Plan[] = [
    { name: 'Básico', price: 9.99, orderId: 'plan-basico-001' },
    { name: 'Estándar', price: 19.99, orderId: 'plan-estandar-001' },
    { name: 'Premium', price: 49.99, orderId: 'plan-premium-001' },
  ];

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 py-12">
      <h1 className="text-4xl font-bold text-gray-800 mb-12">Nuestros Planes de Suscripción</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl px-6">
        {/* Plan Básico */}
        <div className="bg-white rounded-lg shadow-lg p-8 flex flex-col items-center text-center border-t-4 border-blue-500">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Básico</h2>
          <p className="text-gray-600 mb-6">Ideal para individuos que inician.</p>
          <p className="text-4xl font-extrabold text-blue-600 mb-6">$9.99<span className="text-xl text-gray-500">/mes</span></p>
          <ul className="text-gray-700 mb-8 space-y-2">
            <li>Acceso a 5 cursos</li>
            <li>Soporte por correo electrónico</li>
            <li>Certificados de finalización</li>
          </ul>
          <button onClick={() => handleSelectPlan(plans[0])} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full transition duration-300 w-full">
            Seleccionar Plan
          </button>
        </div>

        {/* Plan Estándar */}
        <div className="bg-white rounded-lg shadow-lg p-8 flex flex-col items-center text-center border-t-4 border-green-500 transform scale-105">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Estándar</h2>
          <p className="text-gray-600 mb-6">Perfecto para estudiantes avanzados.</p>
          <p className="text-4xl font-extrabold text-green-600 mb-6">$19.99<span className="text-xl text-gray-500">/mes</span></p>
          <ul className="text-gray-700 mb-8 space-y-2">
            <li>Acceso ilimitado a cursos</li>
            <li>Soporte prioritario</li>
            <li>Proyectos prácticos</li>
            <li>Acceso a comunidad exclusiva</li>
          </ul>
          <button onClick={() => handleSelectPlan(plans[1])} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full transition duration-300 w-full">
            Seleccionar Plan
          </button>
        </div>

        {/* Plan Premium */}
        <div className="bg-white rounded-lg shadow-lg p-8 flex flex-col items-center text-center border-t-4 border-purple-500">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Premium</h2>
          <p className="text-gray-600 mb-6">Para equipos y empresas.</p>
          <p className="text-4xl font-extrabold text-purple-600 mb-6">$49.99<span className="text-xl text-gray-500">/mes</span></p>
          <ul className="text-gray-700 mb-8 space-y-2">
            <li>Todo lo del plan Estándar</li>
            <li>Cursos personalizados</li>
            <li>Consultoría 1 a 1</li>
            <li>Integración API</li>
          </ul>
          <button onClick={() => handleSelectPlan(plans[2])} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-full transition duration-300 w-full">
            Seleccionar Plan
          </button>
        </div>
      </div>

      {selectedPlan && (
        <div className="mt-12 w-full max-w-md px-6">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">Pagar por el plan: {selectedPlan.name}</h2>
          <IzipayPaymentForm
            amount={selectedPlan.price}
            currency="PEN" // Assuming Peruvian Soles, change if needed
            orderId={selectedPlan.orderId}
            customer={{
              email: 'test@example.com' // Replace with actual customer email
            }}
          />
        </div>
      )}

      <div className="mt-12 text-center text-gray-700">
        <p className="text-lg mb-4">Aceptamos todos los principales métodos de pago, incluyendo:</p>
        <div className="flex justify-center space-x-4 text-3xl">
          <span>💳</span>
          <span>🅿️</span>
        </div>
        <p className="mt-8 text-sm text-gray-500">
          Para opciones de pago con criptomonedas o integraciones empresariales, por favor <Link href="/contact" className="text-blue-600 hover:underline">contáctanos</Link>.
        </p>
      </div>
    </div>
  );
}
