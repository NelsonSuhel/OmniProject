'use client';

import React from 'react';

interface SearchBarProps {
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ className }) => {
  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        placeholder="Search..."
        className="w-full px-4 py-2 text-gray-900 bg-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
};

export default SearchBar;