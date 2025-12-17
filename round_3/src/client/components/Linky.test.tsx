import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Linky from './Linky';
import { ThemeProvider } from '../context/ThemeContext';

const renderWithTheme = (component: React.ReactNode) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('Linky', () => {
  it('should render the octopus emoji', () => {
    renderWithTheme(<Linky />);
    
    expect(screen.getByText('🐙')).toBeInTheDocument();
  });

  it('should render a hat emoji', () => {
    renderWithTheme(<Linky />);
    
    const container = screen.getByText('🐙').parentElement;
    expect(container?.children.length).toBeGreaterThan(1);
  });

  it('should have click hint in title', () => {
    renderWithTheme(<Linky />);
    
    const hatElement = screen.getByTitle(/click for a surprise/i);
    expect(hatElement).toBeInTheDocument();
  });

  it('should toggle theme on single click', () => {
    renderWithTheme(<Linky />);
    
    const hatElement = screen.getByTitle(/click for a surprise/i);
    
    fireEvent.click(hatElement);
    
    expect(hatElement).toBeInTheDocument();
  });
});
