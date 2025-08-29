'use client';

import React from 'react';

// Define the props for a single badge
interface BadgeProps {
  name: string;
  description: string;
  imageUrl: string;
  earned: boolean;
}

// Define the props for the display component
interface BadgesDisplayProps {
  badges: BadgeProps[];
}

const Badge: React.FC<BadgeProps> = ({ name, description, imageUrl, earned }) => (
  <div className={`text-center p-4 border rounded-lg ${earned ? 'border-yellow-500 bg-yellow-50' : 'border-gray-300 bg-gray-100'}`}>
    <img 
      src={imageUrl} 
      alt={name} 
      className={`w-24 h-24 mx-auto rounded-full ${earned ? '' : 'filter grayscale opacity-50'}`} 
    />
    <h3 className={`mt-2 text-lg font-semibold ${earned ? 'text-gray-800' : 'text-gray-500'}`}>{name}</h3>
    <p className={`text-sm ${earned ? 'text-gray-600' : 'text-gray-400'}`}>{description}</p>
    {!earned && <p className="text-xs text-gray-400 mt-1">(Bloqueado)</p>}
  </div>
);

const BadgesDisplay: React.FC<BadgesDisplayProps> = ({ badges }) => {
  if (!badges || badges.length === 0) {
    return <p>No hay insignias para mostrar.</p>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {badges.map((badge, index) => (
        <Badge key={index} {...badge} />
      ))}
    </div>
  );
};

export default BadgesDisplay;