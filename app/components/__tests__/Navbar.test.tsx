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
  let mockUseSession: jest.Mock;
  let mockUseLanguage: jest.Mock;

  beforeEach(() => {
    // Assign the imported mock to the variable
    mockUseSession = useSession as jest.Mock;
    mockUseLanguage = useLanguage as jest.Mock;

    // Now use the variable to set the mock return value
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });
    mockUseLanguage.mockReturnValue({
      currentLanguage: 'es',
      setLanguage: jest.fn(),
    });
  });

  test('renders the logo and title', () => {
    render(<Navbar />);
    expect(screen.getByAltText('Suhel OmniProjects Logo')).toBeInTheDocument();
    expect(screen.getByText('Sistema de gestión de aprendizaje OmniProject')).toBeInTheDocument();
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
    mockUseSession.mockReturnValue({
      data: { user: { name: 'Test User' } },
      status: 'authenticated',
    });
    render(<Navbar />);
    expect(screen.getByRole('link', { name: /Dashboard/i })).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign Out/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Login/i })).not.toBeInTheDocument();
  });

  test('renders language selector', () => {
    render(<Navbar />);
    // The new component uses a button to open the dropdown
    expect(screen.getByRole('button', { name: /Español/i })).toBeInTheDocument();
  });
});
