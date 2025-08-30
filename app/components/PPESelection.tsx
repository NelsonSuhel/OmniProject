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

  const getUnselectedPpe = () => {
    return availablePpe.filter(p => !selectedPpe.find(sp => sp.id === p.id));
  };

  const handleDragStart = (e: DragEvent<HTMLDivElement>, ppe: PpeItem) => {
    e.dataTransfer.setData('application/json', JSON.stringify(ppe));
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (submitted) return;
    const ppeJson = e.dataTransfer.getData('application/json');
    if (ppeJson) {
      const ppe = JSON.parse(ppeJson) as PpeItem;
      if (!selectedPpe.find(p => p.id === ppe.id)) {
        setSelectedPpe([...selectedPpe, ppe]);
      }
    }
  };

  const handleRemovePpe = (ppeToRemove: PpeItem) => {
    if (submitted) return;
    setSelectedPpe(selectedPpe.filter(p => p.id !== ppeToRemove.id));
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const handleReset = () => {
    setSelectedPpe([]);
    setSubmitted(false);
  };

  const isCorrect = (ppeId: string) => {
    return scenario.requiredPpe.includes(ppeId);
  };

  const calculateScore = () => {
    const correctSelections = selectedPpe.filter(p => isCorrect(p.id)).length;
    const incorrectSelections = selectedPpe.filter(p => !isCorrect(p.id)).length;
    return Math.max(0, correctSelections - incorrectSelections); // Score doesn't go below 0
  };

  const getMissedPpe = () => {
    return scenario.requiredPpe
      .filter(reqId => !selectedPpe.some(p => p.id === reqId))
      .map(id => availablePpe.find(p => p.id === id)?.name)
      .filter(Boolean) as string[];
  };

  const score = calculateScore();
  const totalCorrect = scenario.requiredPpe.length;
  const missedPpe = getMissedPpe();

  return (
    <div className="w-full p-4 border rounded-lg shadow-sm">
      <h3 className="text-xl font-bold mb-2">Ejercicio: Selección de EPP</h3>
      <p className="mb-4 text-gray-600">{scenario.description}</p>
      <p className="mb-4 text-gray-600">Arrastra y suelta el EPP requerido en el área designada. Para quitar un EPP, solo hazle clic.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Available PPE */}
        <div>
          <h4 className="font-semibold mb-2">EPP Disponible</h4>
          <div className="p-4 bg-gray-100 rounded-lg grid grid-cols-3 gap-2 min-h-[200px]">
            {getUnselectedPpe().map(ppe => (
              <div key={ppe.id} draggable={!submitted} onDragStart={(e) => handleDragStart(e, ppe)} className="p-2 bg-white rounded shadow cursor-pointer text-center transition-opacity hover:bg-gray-50">
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
              <div key={ppe.id} onClick={() => handleRemovePpe(ppe)} className={`p-2 bg-white rounded shadow text-center transition-all ${!submitted ? 'cursor-pointer' : ''} ${submitted ? (isCorrect(ppe.id) ? 'outline outline-2 outline-green-500' : 'outline outline-2 outline-red-500') : ''}`}>
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
            <h4 className="font-bold text-lg">Resultados</h4>
            <p>Tu puntuación: <span className="font-bold">{score}</span> (de un máximo posible de {totalCorrect}).</p>
            {missedPpe.length > 0 && (
              <div className="mt-2">
                <p className="font-semibold">EPP requerido que faltó seleccionar:</p>
                <ul className="list-disc list-inside text-sm">
                  {missedPpe.map(name => <li key={name}>{name}</li>)}
                </ul>
              </div>
            )}
            <button onClick={handleReset} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Intentar de Nuevo</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PpeSelection;
