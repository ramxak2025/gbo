/**
 * Shimmer Skeleton — плавный градиентный shimmer поверх placeholder
 * Работает через Reanimated worklet — 60fps без JS thread.
 */
import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';

type Props = {
  width?: number | string;
  height?: number;
  radius?: number;
  style?: ViewStyle;
  dark?: boolean;
};

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export default function ShimmerSkeleton({
  width = '100%',
  height = 20,
  radius = 12,
  style,
  dark = true,
}: Props) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      false
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(progress.value, [0, 1], [-200, 200]) }],
  }));

  const base = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const highlight = dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.1)';

  return (
    <View
      style={[
        { width: width as number, height, borderRadius: radius, backgroundColor: base, overflow: 'hidden' },
        style,
      ]}
    >
      <AnimatedLinearGradient
        colors={[base, highlight, base]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[StyleSheet.absoluteFillObject, { width: 200 }, animStyle]}
      />
    </View>
  );
}
