/**
 * PhoneInput — точная копия PWA PhoneInput.jsx
 * Format: "8 (900) 123-45-67", type=tel, maxLength=18
 */
import React from 'react';
import { TextInput } from 'react-native';

export function formatPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';
  let d = digits;
  if (d.length > 0 && d[0] === '7' && d.length <= 11) d = '8' + d.slice(1);
  if (d.length > 0 && d[0] !== '8') d = '8' + d;
  let result = d[0] || '';
  if (d.length > 1) result += ' (' + d.slice(1, 4);
  if (d.length >= 4) result += ') ';
  if (d.length > 4) result += d.slice(4, 7);
  if (d.length > 7) result += '-' + d.slice(7, 9);
  if (d.length > 9) result += '-' + d.slice(9, 11);
  return result;
}

export function cleanPhone(value) {
  return (value || '').replace(/\D/g, '');
}

export default function PhoneInput({ value, onChange, style, placeholderTextColor, ...props }) {
  const handleChange = (text) => {
    onChange(formatPhone(text));
  };

  return (
    <TextInput
      value={value}
      onChangeText={handleChange}
      placeholder="8 (900) 123-45-67"
      keyboardType="phone-pad"
      maxLength={18}
      placeholderTextColor={placeholderTextColor}
      style={style}
      {...props}
    />
  );
}
