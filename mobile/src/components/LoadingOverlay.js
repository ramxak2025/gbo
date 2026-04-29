/**
 * LoadingOverlay — full-screen loading state
 * Semi-transparent backdrop with centered spinner
 */
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export default function LoadingOverlay({ visible, text }) {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <ActivityIndicator size="large" color="#dc2626" />
        {text && <Text style={styles.text}>{text}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  card: {
    backgroundColor: 'rgba(20, 20, 30, 0.90)',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  text: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '600',
  },
});
