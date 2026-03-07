import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('iborcuha_theme').then(saved => {
      if (saved !== null) setDark(saved === 'dark');
    });
  }, []);

  const toggle = () => {
    setDark(d => {
      const next = !d;
      AsyncStorage.setItem('iborcuha_theme', next ? 'dark' : 'light');
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
