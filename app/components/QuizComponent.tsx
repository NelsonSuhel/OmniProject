'use client';

import React, { useState } from 'react';
import { quizzes, QuizQuestion } from '../data/quizzes.data';

interface QuizComponentProps {
  quizId: string;
}

const QuizComponent: React.FC<QuizComponentProps> = ({ quizId }) => {
  const quiz = quizzes.find(q => q.id === quizId);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [submitted, setSubmitted] = useState(false);

  if (!quiz) {
    return <p>Cuestionario no encontrado.</p>;
  }

  const handleSingleChoiceChange = (questionId: string, option: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const handleMultiSelectChange = (questionId: string, option: string) => {
    const currentAnswers = (answers[questionId] as string[] || []);
    const newAnswers = currentAnswers.includes(option)
      ? currentAnswers.filter(a => a !== option)
      : [...currentAnswers, option];
    setAnswers(prev => ({ ...prev, [questionId]: newAnswers }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const isCorrect = (question: QuizQuestion) => {
    if (!submitted) return false;
    const answer = answers[question.id];
    if (question.type === 'multiple-select') {
      return JSON.stringify((answer as string[]).sort()) === JSON.stringify((question.correctAnswer as string[]).sort());
    } 
    return answer === question.correctAnswer.toString();
  };

  return (
    <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-lg">
      <h3 className="text-2xl font-bold text-gray-800 mb-4">{quiz.title}</h3>
      <form onSubmit={handleSubmit}>
        {quiz.questions.map((q, index) => (
          <div key={q.id} className="mb-6 pb-6 border-b last:border-b-0">
            <p className="font-semibold text-lg text-gray-800 mb-2">Pregunta {index + 1}: {q.question}</p>
            
            {q.type === 'single-choice' && q.options && q.options.map(option => (
              <label key={option} className="block text-gray-700 py-1">
                <input type="radio" name={q.id} value={option} onChange={() => handleSingleChoiceChange(q.id, option)} disabled={submitted} className="mr-2" />
                {option}
              </label>
            ))}

            {q.type === 'multiple-select' && q.options && q.options.map(option => (
              <label key={option} className="block text-gray-700 py-1">
                <input type="checkbox" value={option} onChange={() => handleMultiSelectChange(q.id, option)} disabled={submitted} className="mr-2" />
                {option}
              </label>
            ))}

            {q.type === 'true-false' && (
              <>
                <label className="block text-gray-700 py-1"><input type="radio" name={q.id} value="true" onChange={() => handleSingleChoiceChange(q.id, 'true')} disabled={submitted} className="mr-2" /> Verdadero</label>
                <label className="block text-gray-700 py-1"><input type="radio" name={q.id} value="false" onChange={() => handleSingleChoiceChange(q.id, 'false')} disabled={submitted} className="mr-2" /> Falso</label>
              </>
            )}

            {submitted && (
              <div className={`mt-2 text-sm font-bold ${isCorrect(q) ? 'text-green-600' : 'text-red-600'}`}>
                {isCorrect(q) ? '¡Correcto!' : `Incorrecto. La respuesta correcta es: ${Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer.toString()}`}
              </div>
            )}
          </div>
        ))}

        {!submitted && (
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300">
            Enviar Cuestionario
          </button>
        )}
      </form>
    </div>
  );
};

export default QuizComponent;