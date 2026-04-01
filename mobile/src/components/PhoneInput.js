import React, { useCallback } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../utils/theme';

/**
 * Formats a digit string into Russian phone format: 8 (900) 123-45-67
 */
function formatPhone(digits) {
  // Keep only digits, max 11
  const d = digits.replace(/\D/g, '').slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 1) return d;
  if (d.length <= 4) return `${d[0]} (${d.slice(1)}`;
  if (d.length <= 7) return `${d[0]} (${d.slice(1, 4)}) ${d.slice(4)}`;
  if (d.length <= 9) return `${d[0]} (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  return `${d[0]} (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9)}`;
}

/**
 * Extracts raw digits from a formatted phone string.
 */
function extractDigits(text) {
  return text.replace(/\D/g, '');
}

export default function PhoneInput({ value, onChange, dark: darkProp, style }) {
  const theme = useTheme();
  const dark = darkProp !== undefined ? darkProp : theme?.dark ?? true;
  const c = getColors(dark);

  const displayValue = formatPhone(value || '');

  const handleChange = useCallback(
    (text) => {
      let digits = extractDigits(text);
      // Auto-prefix with 8 if user starts with 9
      if (digits.length === 1 && digits[0] === '9') {
        digits = '8' + digits;
      }
      if (onChange) {
        onChange(digits);
      }
    },
    [onChange],
  );

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.label, { color: c.textSecondary }]}>
        Телефон
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: c.inputBg,
            borderColor: c.inputBorder,
            color: c.text,
          },
        ]}
        value={displayValue}
        onChangeText={handleChange}
        keyboardType="phone-pad"
        placeholder="8 (900) 123-45-67"
        placeholderTextColor={c.placeholder}
        maxLength={18}
        returnKeyType="done"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
    marginLeft: 4,
  },
  input: {
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    letterSpacing: 0.3,
  },
});
