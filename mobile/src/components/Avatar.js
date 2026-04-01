import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

const BASE_URL = 'https://iborcuha.ru';

export default function Avatar({ name, photo, size = 44 }) {
  const letter = (name || '?').charAt(0).toUpperCase();
  const fontSize = Math.round(size * 0.42);

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  if (photo) {
    const uri = photo.startsWith('http') ? photo : `${BASE_URL}${photo}`;
    return (
      <Image
        source={{ uri }}
        style={[styles.image, containerStyle]}
        resizeMode="cover"
      />
    );
  }

  return (
    <View style={[styles.fallback, containerStyle]}>
      <Text style={[styles.letter, { fontSize }]}>{letter}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: 'rgba(139,92,246,0.15)',
  },
  fallback: {
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
