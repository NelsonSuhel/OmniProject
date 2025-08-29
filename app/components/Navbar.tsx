
'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import SearchBar from './SearchBar';
import Image from 'next/image';

const Navbar = () => {
  const { data: session, status } = useSession();
  const { currentLanguage, setLanguage } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
  };

  return (
    <nav className="bg-white shadow-md fixed w-full z-10 top-0">
      <div className="container mx-auto px-6 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Image src="/Logo_Suhel_OmniProjects.png" alt="Suhel OmniProjects Logo" width={40} height={40} />
              <span className="font-bold text-xl ml-2">Sistema de gestión de aprendizaje OmniProject</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <SearchBar className="w-64" />
            <Link href="/" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">Home</Link>
            <Link href="/courses" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">Courses</Link>
            <Link href="/pricing" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">Pricing</Link>
            
            {status === 'authenticated' ? (
              <>
                <Link href="/dashboard" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">Dashboard</Link>
                <button onClick={() => signOut()} className="px-3 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700">Sign Out</button>
                <span className="text-gray-800 font-medium">{session.user?.name}</span>
              </>
            ) : (
              <>
                <Link href="/login" className="px-3 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">Login</Link>
                <Link href="/register" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">Register</Link>
              </>
            )}

            {/* Language Switcher */}
            <div className="relative">
              <select onChange={(e) => handleLanguageChange(e.target.value)} value={currentLanguage} className="appearance-none bg-transparent border-none text-gray-700 py-2 pr-8 leading-tight focus:outline-none">
                <option value="en">EN</option>
                <option value="es">ES</option>
              </select>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button onClick={toggleMobileMenu} className="text-gray-800 hover:text-gray-600 focus:outline-none">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4">
            <SearchBar className="w-full mb-4" />
            <Link href="/" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100">Home</Link>
            <Link href="/courses" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100">Courses</Link>
            <Link href="/pricing" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100">Pricing</Link>
            
            {status === 'authenticated' ? (
              <>
                <Link href="/dashboard" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100">Dashboard</Link>
                <button onClick={() => signOut()} className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-gray-100">Sign Out</button>
              </>
            ) : (
              <>
                <Link href="/login" className="block px-3 py-2 rounded-md text-base font-medium text-blue-600 hover:bg-gray-100">Login</Link>
                <Link href="/register" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100">Register</Link>
              </>
            )}
             {/* Language Switcher */}
             <div className="relative mt-2">
              <select onChange={(e) => handleLanguageChange(e.target.value)} value={currentLanguage} className="w-full bg-gray-100 border-none text-gray-700 py-2 px-3 leading-tight focus:outline-none">
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
