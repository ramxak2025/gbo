import { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    SecureStore.getItemAsync('iborcuha_theme').then(saved => {
      if (saved !== null) setDark(saved === 'dark');
    });
  }, []);

  const toggle = () => {
    setDark(d => {
      const next = !d;
      SecureStore.setItemAsync('iborcuha_theme', next ? 'dark' : 'light');
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
