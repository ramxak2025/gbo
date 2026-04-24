/**
 * DateButton — точная копия PWA DateButton.jsx
 *
 * PWA: pill shape rounded-full, px-3 py-1.5
 * Calendar icon 12px + date text 12px
 * selected: bg-accent/15 text-accent border-accent/30
 * empty: bg-white/[0.06] text-white/40 border-white/[0.08]
 */
import React, { useState } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { Calendar } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

function formatDateShort(iso) {
  if (!iso) return null;
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function DateButton({ label, value, onChange, style }) {
  const { dark } = useTheme();
  const display = formatDateShort(value);

  const pillStyle = display
    ? {
        backgroundColor: 'rgba(220, 38, 38, 0.15)',
        borderColor: 'rgba(220, 38, 38, 0.30)',
      }
    : {
        backgroundColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.70)',
        borderColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.60)',
      };

  const textColor = display
    ? '#dc2626'
    : dark ? 'rgba(255,255,255,0.40)' : 'rgba(0,0,0,0.40)';

  return (
    <View style={style}>
      {label && (
        <Text style={{
          fontSize: 10,
          textTransform: 'uppercase',
          fontWeight: '600',
          marginBottom: 4,
          color: dark ? 'rgba(255,255,255,0.40)' : 'rgba(0,0,0,0.50)',
        }}>
          {label}
        </Text>
      )}
      <Pressable
        onPress={() => {
          const today = new Date().toISOString().split('T')[0];
          onChange(value ? '' : today);
        }}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 999,
          borderWidth: 1,
          ...pillStyle,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Calendar size={12} color={textColor} />
        <Text style={{ fontSize: 12, fontWeight: '500', color: textColor }}>
          {display || 'Выбрать'}
        </Text>
      </Pressable>
    </View>
  );
}
