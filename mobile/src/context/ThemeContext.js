import React, { createContext, useContext, useState, useEffect } from 'react';
import { StatusBar } from 'react-native';
import { storage } from '../utils/storage';
import { COLORS } from '../utils/constants';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    storage.getTheme().then(t => {
      if (t === 'light') setDark(false);
    });
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    storage.setTheme(next ? 'dark' : 'light');
  };

  const colors = dark ? COLORS.dark : COLORS.light;

  return (
    <ThemeContext.Provider value={{ dark, toggle, colors }}>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
