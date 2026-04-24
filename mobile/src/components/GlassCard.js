/**
 * GlassCard — точная копия PWA компонента GlassCard.jsx
 *
 * PWA CSS:
 *   rounded-[20px] p-4 backdrop-blur-xl glass-hover
 *   dark: bg-white/[0.05] border border-white/[0.07]
 *   light: bg-white/70 border border-white/60 shadow-[0_2px_12px_rgba(0,0,0,0.04)]
 *   onClick → press-scale (scale 0.96, opacity 0.85, duration 120ms)
 */
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function GlassCard({ children, style, onPress, padding = 16, borderRadius = 20 }) {
  const { dark } = useTheme();

  const cardStyle = {
    borderRadius,
    padding,
    backgroundColor: dark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.70)',
    borderWidth: 1,
    borderColor: dark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(255, 255, 255, 0.60)',
    ...(dark ? {} : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 12,
      elevation: 2,
    }),
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          cardStyle,
          pressed && { transform: [{ scale: 0.96 }], opacity: 0.85 },
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[cardStyle, style]}>{children}</View>;
}
