import { render, screen } from '@testing-library/react';
import Footer from '../Footer';

describe('Footer', () => {
  it('renders the copyright text', () => {
    render(<Footer />);
    const copyrightText = screen.getByText(/© 2025 Suhel OmniProject. All rights reserved./i);
    expect(copyrightText).toBeInTheDocument();
  });
});
