'use client';

import { useState, useEffect } from 'react';

const VisitCounter = () => {
  const [visits, setVisits] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVisits = async () => {
      try {
        const response = await fetch('/api/visit-counter');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setVisits(data.visits);
      } catch (e: unknown) { // Changed to unknown
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError("An unknown error occurred.");
        }
        console.error("Failed to fetch visit count:", e);
      }
    };

    fetchVisits();
  }, []);

  if (error) {
    return <p className="text-red-500">Error loading visit count: {error}</p>;
  }

  if (visits === null) {
    return <p className="text-gray-500">Loading visit count...</p>;
  }

  return (
    <div className="text-center mt-8">
      <p className="text-lg text-gray-700">Total visits: <span className="font-bold text-blue-600">{visits}</span></p>
    </div>
  );
};

export default VisitCounter;
