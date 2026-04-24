import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image as ExpoImage } from 'expo-image';

// Cached avatar using expo-image (memory + disk cache by default)
export default function Avatar({ name, src, size = 44 }) {
  if (src) {
    return (
      <ExpoImage
        source={{ uri: src }}
        style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
        cachePolicy="memory-disk"
        contentFit="cover"
        transition={200}
      />
    );
  }

  const initials = (name || '?')
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

  const hue = name
    ? name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
    : 200;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: `hsl(${hue}, 60%, 35%)`,
        },
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: { backgroundColor: 'rgba(255,255,255,0.06)' },
  container: { alignItems: 'center', justifyContent: 'center' },
  text: { color: '#fff', fontWeight: '700' },
});
