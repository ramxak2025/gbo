/**
 * GlassCard — iOS 26 Liquid Glass style
 * Real backdrop blur + gradient highlight + press-scale with haptic
 */
import React from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';

export default function GlassCard({ children, style, onPress, padding = 16, borderRadius = 20, intensity = 'regular', glow, disabled }) {
  const { dark } = useTheme();

  const blurAmount = intensity === 'strong' ? 60 : intensity === 'subtle' ? 20 : 40;

  const handlePress = () => {
    if (disabled) return;
    if (onPress) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
      onPress();
    }
  };

  const cardContent = (
    <View style={[{ borderRadius, overflow: 'hidden', position: 'relative' }, glow && { shadowColor: '#dc2626', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8 }]}>
      {/* Real blur layer */}
      <BlurView
        intensity={blurAmount}
        tint={dark ? 'dark' : 'light'}
        style={[StyleSheet.absoluteFillObject, { borderRadius }]}
      />
      {/* Glass overlay */}
      <View style={[StyleSheet.absoluteFillObject, {
        backgroundColor: dark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.70)',
        borderRadius,
      }]} />
      {/* Top highlight (glass edge) */}
      <View style={[StyleSheet.absoluteFillObject, {
        borderRadius,
        borderWidth: 1,
        borderColor: dark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(255, 255, 255, 0.60)',
      }]} pointerEvents="none" />
      {/* Content */}
      <View style={{ padding, position: 'relative', zIndex: 1 }}>
        {children}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        style={({ pressed }) => [
          pressed && !disabled && { transform: [{ scale: 0.96 }], opacity: 0.85 },
          disabled && { opacity: 0.5 },
          !dark && !glow && { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
          style,
        ]}
      >
        {cardContent}
      </Pressable>
    );
  }

  return <View style={[!dark && { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }, disabled && { opacity: 0.5 }, style]}>{cardContent}</View>;
}
