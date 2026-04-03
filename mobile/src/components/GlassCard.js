import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { RADIUS } from '../utils/constants';

export default function GlassCard({ children, style, onPress }) {
  const { colors } = useTheme();
  const cardStyle = [
    styles.card,
    {
      backgroundColor: colors.card,
      borderColor: colors.cardBorder,
    },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={cardStyle}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
});
