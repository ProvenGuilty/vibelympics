import { createContext, useContext, useState, ReactNode } from 'react';

type Theme = 'default' | 'cyberpunk';

interface ThemeContextType {
  theme: Theme;
  toggleCyberpunk: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('default');

  const toggleCyberpunk = () => {
    setTheme(prev => prev === 'cyberpunk' ? 'default' : 'cyberpunk');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleCyberpunk }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
