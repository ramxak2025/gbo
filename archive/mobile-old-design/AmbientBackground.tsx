/**
 * AmbientBackground — анимированные цветные блобы на фоне (iOS 26 style)
 *
 * Медленные плавающие пятна с blur — создают атмосферу глубины.
 * Используется как подложка под экранами.
 */
import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';

const { width: W, height: H } = Dimensions.get('window');

type Props = {
  dark?: boolean;
  variant?: 'default' | 'warm' | 'cool' | 'fire';
};

export default function AmbientBackground({ dark = true, variant = 'default' }: Props) {
  const t1 = useSharedValue(0);
  const t2 = useSharedValue(0);
  const t3 = useSharedValue(0);

  useEffect(() => {
    t1.value = withRepeat(withTiming(1, { duration: 12000, easing: Easing.inOut(Easing.sin) }), -1, true);
    t2.value = withRepeat(withTiming(1, { duration: 16000, easing: Easing.inOut(Easing.sin) }), -1, true);
    t3.value = withRepeat(withTiming(1, { duration: 20000, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, []);

  const variants = {
    default: {
      blob1: dark ? '#dc2626' : '#fca5a5',
      blob2: dark ? '#6366f1' : '#a5b4fc',
      blob3: dark ? '#a855f7' : '#d8b4fe',
    },
    warm: {
      blob1: dark ? '#f97316' : '#fed7aa',
      blob2: dark ? '#dc2626' : '#fca5a5',
      blob3: dark ? '#fbbf24' : '#fde68a',
    },
    cool: {
      blob1: dark ? '#3b82f6' : '#bfdbfe',
      blob2: dark ? '#22c55e' : '#bbf7d0',
      blob3: dark ? '#06b6d4' : '#a5f3fc',
    },
    fire: {
      blob1: dark ? '#dc2626' : '#fca5a5',
      blob2: dark ? '#f97316' : '#fed7aa',
      blob3: dark ? '#fbbf24' : '#fde68a',
    },
  };

  const colors = variants[variant];

  const style1 = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(t1.value, [0, 1], [-80, 80]) },
      { translateY: interpolate(t1.value, [0, 1], [-40, 40]) },
      { scale: interpolate(t1.value, [0, 1], [1, 1.2]) },
    ],
  }));

  const style2 = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(t2.value, [0, 1], [60, -60]) },
      { translateY: interpolate(t2.value, [0, 1], [80, -80]) },
      { scale: interpolate(t2.value, [0, 1], [1.1, 0.9]) },
    ],
  }));

  const style3 = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(t3.value, [0, 1], [-40, 80]) },
      { translateY: interpolate(t3.value, [0, 1], [40, -40]) },
      { scale: interpolate(t3.value, [0, 1], [0.95, 1.15]) },
    ],
  }));

  const blobSize = W * 0.8;

  return (
    <View style={[StyleSheet.absoluteFillObject, { overflow: 'hidden' }]} pointerEvents="none">
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: -blobSize * 0.3,
            left: -blobSize * 0.2,
            width: blobSize,
            height: blobSize,
            borderRadius: blobSize / 2,
            backgroundColor: colors.blob1,
            opacity: dark ? 0.25 : 0.4,
          },
          style1,
        ]}
      />
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: H * 0.25,
            right: -blobSize * 0.3,
            width: blobSize,
            height: blobSize,
            borderRadius: blobSize / 2,
            backgroundColor: colors.blob2,
            opacity: dark ? 0.22 : 0.35,
          },
          style2,
        ]}
      />
      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: -blobSize * 0.2,
            left: W * 0.1,
            width: blobSize * 0.9,
            height: blobSize * 0.9,
            borderRadius: blobSize / 2,
            backgroundColor: colors.blob3,
            opacity: dark ? 0.2 : 0.3,
          },
          style3,
        ]}
      />
      {/* Overlay blur effect через полупрозрачный слой (кроссплатформенный) */}
      <View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: dark ? 'rgba(10, 10, 15, 0.4)' : 'rgba(242, 242, 247, 0.3)',
          },
        ]}
      />
    </View>
  );
}
