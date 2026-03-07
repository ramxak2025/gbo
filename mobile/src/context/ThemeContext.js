import React, { createContext, useContext, useState } from 'react';
import { colors } from '../utils/theme';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(true);

  const toggle = () => setDark(d => !d);
  const t = dark ? colors.dark : colors.light;

  return (
    <ThemeContext.Provider value={{ dark, toggle, t }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
