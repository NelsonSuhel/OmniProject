'use client';

import React, { createContext, useState, useContext, ReactNode } from 'react';

// Define the shape of the context
interface LanguageContextType {
  currentLanguage: string;
  setLanguage: (language: string) => void;
}

// Create the context with a default value
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Create a provider component
interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [currentLanguage, setCurrentLanguage] = useState('es'); // Default language is Spanish

  const setLanguage = (language: string) => {
    setCurrentLanguage(language);
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Create a custom hook to use the language context
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};