import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, useTheme } from './ThemeContext';

function TestComponent() {
  const { theme, isCyberpunk, toggleCyberpunk } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="is-cyberpunk">{isCyberpunk.toString()}</span>
      <button onClick={toggleCyberpunk}>Toggle</button>
    </div>
  );
}

describe('ThemeContext', () => {
  it('should provide default theme as cyberpunk', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    expect(screen.getByTestId('theme')).toHaveTextContent('cyberpunk');
    expect(screen.getByTestId('is-cyberpunk')).toHaveTextContent('true');
  });

  it('should toggle theme when toggleCyberpunk is called', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    const toggleButton = screen.getByRole('button', { name: 'Toggle' });
    
    fireEvent.click(toggleButton);
    
    expect(screen.getByTestId('theme')).toHaveTextContent('default');
    expect(screen.getByTestId('is-cyberpunk')).toHaveTextContent('false');
  });

  it('should toggle back to cyberpunk on second toggle', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    const toggleButton = screen.getByRole('button', { name: 'Toggle' });
    
    fireEvent.click(toggleButton);
    fireEvent.click(toggleButton);
    
    expect(screen.getByTestId('theme')).toHaveTextContent('cyberpunk');
    expect(screen.getByTestId('is-cyberpunk')).toHaveTextContent('true');
  });

  it('should throw error when useTheme is used outside provider', () => {
    const consoleError = console.error;
    console.error = () => {};
    
    expect(() => render(<TestComponent />)).toThrow('useTheme must be used within ThemeProvider');
    
    console.error = consoleError;
  });
});
