import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function PhoneInput({ value, onChangeText, label }) {
  const { dark, colors } = useTheme();

  const formatPhone = (text) => {
    const digits = text.replace(/\D/g, '');
    let formatted = '+7';
    if (digits.length > 1) formatted += ' (' + digits.slice(1, 4);
    if (digits.length > 4) formatted += ') ' + digits.slice(4, 7);
    if (digits.length > 7) formatted += '-' + digits.slice(7, 9);
    if (digits.length > 9) formatted += '-' + digits.slice(9, 11);
    return formatted;
  };

  const handleChange = (text) => {
    const digits = text.replace(/\D/g, '');
    let clean = digits;
    if (!clean.startsWith('7')) clean = '7' + clean;
    clean = clean.slice(0, 11);
    onChangeText('+' + clean);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>}
      <TextInput
        value={formatPhone(value || '')}
        onChangeText={handleChange}
        keyboardType="phone-pad"
        placeholder="+7 (___) ___-__-__"
        placeholderTextColor={colors.textSecondary}
        style={[styles.input, {
          color: colors.text,
          backgroundColor: colors.inputBg,
          borderColor: colors.inputBorder,
        }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  label: { fontSize: 13, marginBottom: 6, fontWeight: '500' },
  input: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
});
