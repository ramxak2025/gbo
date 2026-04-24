/**
 * Avatar — точная копия PWA Avatar.jsx
 *
 * PWA: rounded-full, object-cover
 * fallback: bg-accent (#dc2626), initials (first 2 letters), fontSize = size × 0.35
 * default size = 40
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

export default function Avatar({ src, name = '?', size = 40, style }) {
  const initials = (name || '?')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (src) {
    return (
      <Image
        source={{ uri: src }}
        style={[{ width: size, height: size, borderRadius: size / 2 }, style]}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
    );
  }

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: '#dc2626',
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: size * 0.35 }}>
        {initials}
      </Text>
    </View>
  );
}
