/**
 * PulseGlow — пульсирующее свечение вокруг элемента
 *
 * Используется для:
 * - Активных/онлайн индикаторов
 * - Highlight важных карточек
 * - Champion badge glow
 * - Notification indicators
 */
import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';

type Props = {
  color?: string;
  size?: number;
  intensity?: number; // 0.1-1
  speed?: 'slow' | 'normal' | 'fast';
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

export default function PulseGlow({
  color = '#dc2626',
  size = 60,
  intensity = 0.5,
  speed = 'normal',
  style,
  children,
}: Props) {
  const pulse = useSharedValue(0);

  const durations = { slow: 3000, normal: 2000, fast: 1200 };

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: durations[speed], easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: durations[speed], easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [speed]);

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.6]) }],
    opacity: interpolate(pulse.value, [0, 1], [intensity * 0.6, 0]),
  }));

  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.3]) }],
    opacity: interpolate(pulse.value, [0, 1], [intensity * 0.4, 0]),
  }));

  return (
    <Animated.View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            borderRadius: size / 2,
            backgroundColor: color,
          },
          ring1Style,
        ]}
        pointerEvents="none"
      />
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            borderRadius: size / 2,
            backgroundColor: color,
          },
          ring2Style,
        ]}
        pointerEvents="none"
      />
      {children}
    </Animated.View>
  );
}
