'use client';

import React from 'react';

interface ProgressBarProps {
  value: number; // The current progress value (e.g., number of completed lessons)
  max: number;   // The total value (e.g., total number of lessons)
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, max, className }) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;

  return (
    <div className={`w-full bg-gray-200 rounded-full h-4 ${className}`}>
      <div
        className="bg-blue-600 h-4 rounded-full text-xs font-medium text-white text-center p-0.5 leading-none"
        style={{ width: `${percentage}%` }}
      >
        {Math.round(percentage)}%
      </div>
    </div>
  );
};

export default ProgressBar;