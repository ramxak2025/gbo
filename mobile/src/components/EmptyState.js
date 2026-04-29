/**
 * EmptyState — reusable empty/not-found state component
 * Consistent across all screens: centered icon (48px, 0.3 opacity) + title + optional subtitle + action
 */
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function EmptyState({ icon: Icon, title, subtitle, actionLabel, onAction, style }) {
  const { dark } = useTheme();
  const t = dark ? '#fff' : '#111';
  const t2 = dark ? 'rgba(255,255,255,0.30)' : 'rgba(0,0,0,0.30)';

  return (
    <View style={[{ alignItems: 'center', paddingVertical: 48 }, style]}>
      {Icon && <Icon size={48} color={t2} strokeWidth={1.5} />}
      <Text style={{ fontSize: 16, fontWeight: '600', color: dark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)', marginTop: 12, textAlign: 'center' }}>
        {title}
      </Text>
      {subtitle && (
        <Text style={{ fontSize: 13, color: t2, marginTop: 4, textAlign: 'center', paddingHorizontal: 32 }}>
          {subtitle}
        </Text>
      )}
      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          style={({ pressed }) => ({
            marginTop: 16,
            paddingVertical: 10,
            paddingHorizontal: 20,
            borderRadius: 14,
            backgroundColor: 'rgba(220, 38, 38, 0.12)',
            borderWidth: 1,
            borderColor: 'rgba(220, 38, 38, 0.20)',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#dc2626' }}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}
