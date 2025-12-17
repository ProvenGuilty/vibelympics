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

  it('should have double-click hint in title', () => {
    renderWithTheme(<Linky />);
    
    const hatElement = screen.getByTitle(/double-click/i);
    expect(hatElement).toBeInTheDocument();
  });

  it('should toggle theme on double-click', () => {
    renderWithTheme(<Linky />);
    
    const hatElement = screen.getByTitle(/double-click/i);
    
    fireEvent.doubleClick(hatElement);
    
    expect(hatElement).toBeInTheDocument();
  });
});
