import { render, screen } from '@testing-library/react';
import Navbar from '../Navbar';
import { useSession, signOut } from 'next-auth/react';
import { useLanguage } from '@/app/context/LanguageContext';

// Mock the next-auth/react useSession hook
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
}));

// Mock the language context
jest.mock('@/app/context/LanguageContext', () => ({
  useLanguage: jest.fn(),
}));

// Mock next/navigation's useRouter
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    // Add other router methods if needed by your components
  })),
}));

describe('Navbar', () => {
  beforeEach(() => {
    // Default mocks for each test
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });
    (useLanguage as jest.Mock).mockReturnValue({
      currentLanguage: 'es',
      setLanguage: jest.fn(),
    });
  });

  test('renders the logo and title', () => {
    render(<Navbar />);
    expect(screen.getByAltText('Suhel OmniProject Logo')).toBeInTheDocument();
    expect(screen.getByText('Suhel OmniProject')).toBeInTheDocument();
  });

  test('renders navigation links', () => {
    render(<Navbar />);
    expect(screen.getByRole('link', { name: /Home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Courses/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Pricing/i })).toBeInTheDocument();
  });

  test('renders login and register links when unauthenticated', () => {
    render(<Navbar />);
    expect(screen.getByRole('link', { name: /Login/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Register/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Dashboard/i })).not.toBeInTheDocument();
  });

  test('renders dashboard and logout button when authenticated', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { email: 'test@example.com' } },
      status: 'authenticated',
    });
    render(<Navbar />);
    expect(screen.getByRole('link', { name: /Dashboard/i })).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cerrar Sesión/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Login/i })).not.toBeInTheDocument();
  });

  test('renders language selector', () => {
    render(<Navbar />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Español' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'English' })).toBeInTheDocument();
  });
});
