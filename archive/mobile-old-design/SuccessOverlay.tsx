/**
 * SuccessOverlay — полноэкранный celebration при успешном действии
 *
 * - Кольца расходящиеся от центра (ping effect)
 * - Confetti-частицы (floating sparkles)
 * - Haptic success feedback
 * - Auto-dismiss через 2s
 */
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  Easing,
  FadeIn,
  FadeOut,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, typography, springs } from './tokens';

const { width: W, height: H } = Dimensions.get('window');

type Props = {
  visible: boolean;
  onDismiss: () => void;
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  gradientColors?: readonly string[];
  duration?: number; // auto-dismiss ms
};

export default function SuccessOverlay({
  visible,
  onDismiss,
  icon,
  title,
  subtitle,
  gradientColors = colors.gradients.brand,
  duration = 2000,
}: Props) {
  const ring1 = useSharedValue(0);
  const ring2 = useSharedValue(0);
  const iconScale = useSharedValue(0);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);

      // Rings expand
      ring1.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) });
      ring2.value = withDelay(200, withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) }));

      // Icon bounce in
      iconScale.value = withDelay(100, withSpring(1, { damping: 8, stiffness: 200 }));

      // Text fade in
      textOpacity.value = withDelay(400, withTiming(1, { duration: 400 }));

      // Auto-dismiss
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    } else {
      ring1.value = 0;
      ring2.value = 0;
      iconScale.value = 0;
      textOpacity.value = 0;
    }
  }, [visible]);

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring1.value * 3 }],
    opacity: 1 - ring1.value,
  }));

  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring2.value * 2.5 }],
    opacity: 1 - ring2.value,
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: (1 - textOpacity.value) * 20 }],
  }));

  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(300)}
      style={[StyleSheet.absoluteFillObject, styles.overlay]}
    >
      {/* Rings */}
      <View style={styles.center}>
        <Animated.View style={[styles.ring, { backgroundColor: (gradientColors[0] || '#dc2626') + '40' }, ring1Style]} />
        <Animated.View style={[styles.ring, { backgroundColor: (gradientColors[0] || '#dc2626') + '25' }, ring2Style]} />

        {/* Icon */}
        <Animated.View style={[styles.iconWrap, iconStyle]}>
          <LinearGradient
            colors={gradientColors as unknown as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconCircle}
          >
            {icon}
          </LinearGradient>
        </Animated.View>

        {/* Text */}
        <Animated.View style={[styles.textWrap, textStyle]}>
          <Text style={[typography.title1, { color: '#fff', textAlign: 'center', marginBottom: 6 }]}>{title}</Text>
          {subtitle && (
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, textAlign: 'center' }}>{subtitle}</Text>
          )}
        </Animated.View>
      </View>

      {/* Floating particles */}
      {Array.from({ length: 8 }).map((_, i) => (
        <FloatingParticle key={i} index={i} color={gradientColors[i % gradientColors.length] as string || '#dc2626'} />
      ))}
    </Animated.View>
  );
}

function FloatingParticle({ index, color }: { index: number; color: string }) {
  const y = useSharedValue(0);
  const x = useSharedValue(0);
  const opacity = useSharedValue(0);

  const startX = ((index * 47) % W) - W / 2;
  const startY = H / 2 - 100;

  useEffect(() => {
    const delay = index * 100;
    const angle = (index / 8) * Math.PI * 2;
    const dist = 150 + (index % 3) * 60;

    opacity.value = withDelay(delay, withSequence(
      withTiming(0.9, { duration: 300 }),
      withDelay(800, withTiming(0, { duration: 600 }))
    ));
    x.value = withDelay(delay, withTiming(Math.cos(angle) * dist, { duration: 1400, easing: Easing.out(Easing.cubic) }));
    y.value = withDelay(delay, withTiming(Math.sin(angle) * dist - 100, { duration: 1400, easing: Easing.out(Easing.cubic) }));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: W / 2 + startX * 0.3,
          top: startY,
          width: 6 + (index % 3) * 4,
          height: 6 + (index % 3) * 4,
          borderRadius: 10,
          backgroundColor: color,
        },
        style,
      ]}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  iconWrap: {
    marginBottom: 24,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    paddingHorizontal: 40,
  },
});
