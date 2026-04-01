import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '../utils/asyncStorage';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('iborcuha_theme').then(v => {
      if (v !== null) setDark(v === 'dark');
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('iborcuha_theme', dark ? 'dark' : 'light');
  }, [dark]);

  const toggle = () => setDark(d => !d);

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
