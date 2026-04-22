import React, { ReactNode } from 'react';
import { Pressable, PressableProps, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { springs } from './tokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style'> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  scale?: number;
  haptic?: 'light' | 'medium' | 'heavy' | 'success' | 'selection' | false;
};

export default function HapticPressable({
  children,
  style,
  scale: targetScale = 0.96,
  haptic = 'light',
  onPressIn,
  onPressOut,
  onPress,
  ...rest
}: Props) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const triggerHaptic = () => {
    if (!haptic || !Haptics) return;
    if (haptic === 'success') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    } else if (haptic === 'selection') {
      Haptics.selectionAsync().catch(() => undefined);
    } else {
      const map = {
        light: Haptics.ImpactFeedbackStyle.Light,
        medium: Haptics.ImpactFeedbackStyle.Medium,
        heavy: Haptics.ImpactFeedbackStyle.Heavy,
      };
      Haptics.impactAsync(map[haptic]).catch(() => undefined);
    }
  };

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(e) => {
        scale.value = withSpring(targetScale, springs.snappy);
        opacity.value = withSpring(0.88, springs.snappy);
        triggerHaptic();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, springs.bounce);
        opacity.value = withSpring(1, springs.smooth);
        onPressOut?.(e);
      }}
      onPress={onPress}
      style={[animatedStyle, style]}
    >
      {children}
    </AnimatedPressable>
  );
}
