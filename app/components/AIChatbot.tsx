'use client';

import React, { useState, FormEvent } from 'react';

interface AIChatbotProps {
  lessonContent?: string;
}

const AIChatbot: React.FC<AIChatbotProps> = ({ lessonContent = '' }) => {
  const [messages, setMessages] = useState<{ text: string; sender: 'user' | 'ai' }[]>([]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { text: input, sender: 'user' as const };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai-tutor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input, lessonContent }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const aiMessage = { text: data.response, sender: 'ai' as const };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);
    } catch (error) {
      console.error('Error communicating with AI Tutor:', error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: 'Lo siento, hubo un error al conectar con el tutor IA.', sender: 'ai' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-96 border rounded-lg shadow-md p-4">
      <div className="flex-1 overflow-y-auto mb-4">
        {messages.length === 0 && (
          <p className="text-gray-500 text-center">
            ¡Hola! Pregúntame algo sobre la lección.
          </p>
        )}
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-2 p-2 rounded-lg ${
              msg.sender === 'user' ? 'bg-blue-100 self-end' : 'bg-gray-100 self-start'
            }`}
          >
            <p className="font-semibold">{msg.sender === 'user' ? 'Tú' : 'Tutor IA'}:</p>
            <p>{msg.text}</p>
          </div>
        ))}
        {loading && (
          <div className="text-center text-gray-500">Escribiendo...</div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="flex">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu pregunta aquí..."
          className="flex-1 border rounded-l-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        >
          Enviar
        </button>
      </form>
    </div>
  );
};

export default AIChatbot;
