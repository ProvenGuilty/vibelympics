import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Header from './Header';
import { ThemeProvider } from '../context/ThemeContext';

const renderWithTheme = (component: React.ReactNode) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('Header', () => {
  it('should render the header', () => {
    renderWithTheme(<Header />);
    
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('should display the app title', () => {
    renderWithTheme(<Header />);
    
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('should display AI-Powered subtitle', () => {
    renderWithTheme(<Header />);
    
    expect(screen.getByText('AI-Powered Meme Creation')).toBeInTheDocument();
  });

  it('should have GitHub link', () => {
    renderWithTheme(<Header />);
    
    const githubLink = screen.getByTitle('View on GitHub');
    expect(githubLink).toBeInTheDocument();
    expect(githubLink).toHaveAttribute('href', expect.stringContaining('github.com'));
    expect(githubLink).toHaveAttribute('target', '_blank');
    expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('should render Linky component', () => {
    renderWithTheme(<Header />);
    
    expect(screen.getByText('🐙')).toBeInTheDocument();
  });

  it('should show 31337 M0D3 indicator in cyberpunk mode', () => {
    renderWithTheme(<Header />);
    
    expect(screen.getByText('[31337 M0D3]')).toBeInTheDocument();
  });
});
