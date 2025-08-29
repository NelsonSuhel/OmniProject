'use client';

import React, { useState, useRef, MouseEvent } from 'react';

interface Hazard {
  id: number;
  x: number; // Percentage from left
  y: number; // Percentage from top
  description: string;
}

interface HazardIdentificationProps {
  imageUrl: string;
  hazards: Hazard[];
}

const HazardIdentification: React.FC<HazardIdentificationProps> = ({ imageUrl, hazards }) => {
  const [foundHazards, setFoundHazards] = useState<number[]>([]);
  const [showAll, setShowAll] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

  const handleImageClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    hazards.forEach(hazard => {
      // Check if click is within a 5% radius of the hazard
      if (Math.abs(x - hazard.x) < 5 && Math.abs(y - hazard.y) < 5) {
        if (!foundHazards.includes(hazard.id)) {
          setFoundHazards([...foundHazards, hazard.id]);
        }
      }
    });
  };

  return (
    <div className="w-full">
      <h3 className="text-xl font-bold mb-2">Ejercicio: Identificación de Peligros</h3>
      <p className="mb-4">Haz clic en las áreas de la imagen donde identifiques un peligro potencial.</p>
      <div ref={imageRef} className="relative w-full cursor-pointer" onClick={handleImageClick}>
        <img src={imageUrl} alt="Escenario de trabajo" className="w-full h-auto rounded-md" />
        {hazards.map(hazard => {
          const isFound = foundHazards.includes(hazard.id);
          if (isFound || showAll) {
            return (
              <div key={hazard.id} className="absolute" style={{ left: `${hazard.x}%`, top: `${hazard.y}%`, transform: 'translate(-50%, -50%)' }}>
                <div className={`w-12 h-12 rounded-full border-4 ${isFound ? 'border-green-500' : 'border-red-500'} bg-opacity-50 flex items-center justify-center`}>
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
      <div className="mt-4">
        <p>Peligros encontrados: {foundHazards.length} de {hazards.length}</p>
        <button onClick={() => setShowAll(!showAll)} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          {showAll ? 'Ocultar todos los peligros' : 'Mostrar todos los peligros'}
        </button>
      </div>
    </div>
  );
};

export default HazardIdentification;