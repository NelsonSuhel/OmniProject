'use client';

import React, { useState, DragEvent } from 'react';

interface PpeItem {
  id: string;
  name: string;
  imageUrl: string;
}

interface PpeScenario {
  id: string;
  description: string;
  requiredPpe: string[]; // Array of PpeItem ids
}

interface PpeSelectionProps {
  availablePpe: PpeItem[];
  scenario: PpeScenario;
}

const PpeSelection: React.FC<PpeSelectionProps> = ({ availablePpe, scenario }) => {
  const [selectedPpe, setSelectedPpe] = useState<PpeItem[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const handleDragStart = (e: DragEvent<HTMLDivElement>, ppe: PpeItem) => {
    e.dataTransfer.setData('application/json', JSON.stringify(ppe));
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const ppeJson = e.dataTransfer.getData('application/json');
    if (ppeJson) {
      const ppe = JSON.parse(ppeJson) as PpeItem;
      if (!selectedPpe.find(p => p.id === ppe.id)) {
        setSelectedPpe([...selectedPpe, ppe]);
      }
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const isCorrect = (ppeId: string) => {
    return scenario.requiredPpe.includes(ppeId);
  };

  const score = selectedPpe.filter(p => isCorrect(p.id)).length;
  const totalCorrect = scenario.requiredPpe.length;

  return (
    <div className="w-full">
      <h3 className="text-xl font-bold mb-2">Ejercicio: Selección de EPP</h3>
      <p className="mb-4">{scenario.description}</p>
      <p className="mb-4">Arrastra y suelta el EPP requerido en el área designada.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Available PPE */}
        <div>
          <h4 className="font-semibold mb-2">EPP Disponible</h4>
          <div className="p-4 bg-gray-100 rounded-lg grid grid-cols-3 gap-2">
            {availablePpe.map(ppe => (
              <div key={ppe.id} draggable onDragStart={(e) => handleDragStart(e, ppe)} className="p-2 bg-white rounded shadow cursor-pointer text-center">
                <img src={ppe.imageUrl} alt={ppe.name} className="w-16 h-16 mx-auto" />
                <p className="text-sm mt-1">{ppe.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Drop Zone */}
        <div onDrop={handleDrop} onDragOver={handleDragOver} className="p-4 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg min-h-[200px]">
          <h4 className="font-semibold mb-2">Área de Selección</h4>
          <div className="grid grid-cols-3 gap-2">
            {selectedPpe.map(ppe => (
              <div key={ppe.id} className={`p-2 bg-white rounded shadow text-center ${submitted ? (isCorrect(ppe.id) ? 'outline outline-green-500' : 'outline outline-red-500') : ''}`}>
                <img src={ppe.imageUrl} alt={ppe.name} className="w-16 h-16 mx-auto" />
                <p className="text-sm mt-1">{ppe.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4">
        {!submitted ? (
          <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Verificar Selección</button>
        ) : (
          <div className="p-4 bg-yellow-100 border border-yellow-300 rounded-lg">
            <h4 className="font-bold">Resultados</h4>
            <p>Tu puntuación: {score} de {totalCorrect} correctos.</p>
            <p className="text-sm">Los elementos con borde verde son correctos, los de borde rojo son incorrectos.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PpeSelection;