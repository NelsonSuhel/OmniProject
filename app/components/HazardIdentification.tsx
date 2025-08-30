'use client';

import React, { useState, useRef, MouseEvent, useEffect } from 'react';

interface Hazard {
  id: number;
  x: number; // Percentage from left
  y: number; // Percentage from top
  description: string;
}

interface MissedClick {
  id: number;
  x: number;
  y: number;
}

interface HazardIdentificationProps {
  imageUrl: string;
  hazards: Hazard[];
  maxAttempts?: number;
}

const HazardIdentification: React.FC<HazardIdentificationProps> = ({ imageUrl, hazards, maxAttempts = 5 }) => {
  const [foundHazards, setFoundHazards] = useState<number[]>([]);
  const [missedClicks, setMissedClicks] = useState<MissedClick[]>([]);
  const [score, setScore] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(maxAttempts);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (foundHazards.length === hazards.length) {
      setIsCompleted(true);
    }
  }, [foundHazards, hazards.length]);

  const handleImageClick = (e: MouseEvent<HTMLDivElement>) => {
    if (isCompleted || attemptsLeft === 0 || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    let hazardFound = false;
    hazards.forEach(hazard => {
      if (Math.abs(x - hazard.x) < 5 && Math.abs(y - hazard.y) < 5) {
        hazardFound = true;
        if (!foundHazards.includes(hazard.id)) {
          setFoundHazards(prev => [...prev, hazard.id]);
          setScore(prev => prev + 10);
        }
      }
    });

    if (!hazardFound) {
      setAttemptsLeft(prev => prev - 1);
      const newMiss: MissedClick = { id: Date.now(), x, y };
      setMissedClicks(prev => [...prev, newMiss]);
      setTimeout(() => {
        setMissedClicks(prev => prev.filter(m => m.id !== newMiss.id));
      }, 1000);
    }
  };

  const handleReset = () => {
    setFoundHazards([]);
    setMissedClicks([]);
    setScore(0);
    setAttemptsLeft(maxAttempts);
    setIsCompleted(false);
    setShowAll(false);
  };

  return (
    <div className="w-full p-4 border rounded-lg shadow-sm">
      <h3 className="text-xl font-bold mb-2">Ejercicio: Identificación de Peligros</h3>
      <p className="mb-4 text-gray-600">Haz clic en las áreas de la imagen donde identifiques un peligro potencial.</p>
      
      <div className="flex justify-between items-center mb-4 p-2 bg-gray-100 rounded-md">
        <p className="text-lg">Puntuación: <span className="font-bold text-blue-600">{score}</span></p>
        <p className="text-lg">Peligros Encontrados: <span className="font-bold text-green-600">{foundHazards.length} / {hazards.length}</span></p>
        <p className="text-lg">Intentos Restantes: <span className="font-bold text-red-600">{attemptsLeft}</span></p>
      </div>

      <div ref={imageRef} className="relative w-full cursor-pointer" onClick={handleImageClick}>
        <img src={imageUrl} alt="Escenario de trabajo" className="w-full h-auto rounded-md" />
        
        {missedClicks.map(miss => (
          <div key={miss.id} className="absolute text-red-500 text-4xl font-bold animate-ping" style={{ left: `${miss.x}%`, top: `${miss.y}%`, transform: 'translate(-50%, -50%)' }}>
            X
          </div>
        ))}

        {hazards.map(hazard => {
          const isFound = foundHazards.includes(hazard.id);
          if (isFound || showAll) {
            return (
              <div key={hazard.id} className="absolute" style={{ left: `${hazard.x}%`, top: `${hazard.y}%`, transform: 'translate(-50%, -50%)' }}>
                <div className={`w-12 h-12 rounded-full border-4 ${isFound ? 'border-green-500' : 'border-red-500'} bg-opacity-50 flex items-center justify-center transition-all duration-300`}>
                  <span className="text-white font-bold text-xl">{hazard.id}</span>
                </div>
                <div className="absolute top-full left-1/2 mt-2 p-2 bg-black text-white text-xs rounded-md w-48 transform -translate-x-1/2 opacity-90 z-10">
                  {hazard.description}
                </div>
              </div>
            );
          }
          return null;
        })}
      </div>

      {isCompleted && (
        <div className="mt-4 p-4 text-center bg-green-100 text-green-800 rounded-lg">
          <h4 className="font-bold text-lg">¡Felicidades!</h4>
          <p>Has encontrado todos los peligros. Tu puntuación final es {score}.</p>
        </div>
      )}

      {attemptsLeft === 0 && !isCompleted && (
        <div className="mt-4 p-4 text-center bg-red-100 text-red-800 rounded-lg">
          <h4 className="font-bold text-lg">¡Juego Terminado!</h4>
          <p>Te has quedado sin intentos. Tu puntuación final es {score}.</p>
        </div>
      )}

      <div className="mt-4 flex space-x-4">
        <button onClick={() => setShowAll(!showAll)} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700" disabled={isCompleted || attemptsLeft === 0}>
          {showAll ? 'Ocultar Peligros' : 'Mostrar Peligros'}
        </button>
        <button onClick={handleReset} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Reiniciar Ejercicio
        </button>
      </div>
    </div>
  );
};

export default HazardIdentification;
