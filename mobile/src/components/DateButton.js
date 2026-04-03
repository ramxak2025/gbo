import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { CalendarIcon } from '../icons';

export default function DateButton({ value, onChange, label }) {
  const { dark, colors } = useTheme();

  const formatDate = (dateStr) => {
    if (!dateStr) return label || 'Выбрать дату';
    const d = new Date(dateStr);
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Simple date input - on press shows a text prompt
  // In production, use @react-native-community/datetimepicker
  const handlePress = () => {
    const today = new Date().toISOString().split('T')[0];
    onChange(today);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[styles.btn, {
        backgroundColor: colors.inputBg,
        borderColor: colors.inputBorder,
      }]}
    >
      <CalendarIcon size={18} color={colors.textSecondary} />
      <Text style={[styles.text, { color: value ? colors.text : colors.textSecondary }]}>
        {formatDate(value)}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  text: {
    fontSize: 15,
  },
});
