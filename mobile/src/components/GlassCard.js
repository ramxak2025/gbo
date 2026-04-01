import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../utils/theme';

export default function GlassCard({ children, style, dark: darkProp }) {
  const theme = useTheme();
  const dark = darkProp !== undefined ? darkProp : theme?.dark ?? true;
  const c = getColors(dark);

  return (
    <View
      style={[
        styles.card,
        dark ? styles.cardDark : styles.cardLight,
        { borderColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.6)' },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
  },
  cardDark: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  cardLight: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});
