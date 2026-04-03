import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function Avatar({ name, photo, size = 40 }) {
  const { dark, colors } = useTheme();

  if (photo) {
    const uri = photo.startsWith('http') ? photo : `https://iborcuha.ru${photo}`;
    return (
      <Image
        source={{ uri }}
        style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
      />
    );
  }

  const initials = (name || '?')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View
      style={[
        styles.placeholder,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.accentLight,
        },
      ]}
    >
      <Text style={[styles.initials, { color: colors.accent, fontSize: size * 0.38 }]}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    resizeMode: 'cover',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '700',
  },
});
