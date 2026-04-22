/**
 * LiquidGlassCard — эффект жидкого стекла в стиле iOS 26
 *
 * Техника:
 * 1. expo-blur для фонового размытия (настоящий GPU blur)
 * 2. LinearGradient сверху для glass-эффекта (highlight + shadow)
 * 3. Тонкий внутренний border для эффекта стеклянной грани
 * 4. Внешняя тень для глубины
 * 5. Опциональный press-animation через Reanimated (scale + shadow)
 */
import React, { ReactNode } from 'react';
import { View, StyleSheet, Pressable, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, radius, springs, shadows } from './tokens';

export type GlassIntensity = 'subtle' | 'regular' | 'strong' | 'frosted';

type Props = {
  children: ReactNode;
  dark?: boolean;
  intensity?: GlassIntensity;
  radius?: number;
  padding?: number;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  hapticFeedback?: 'light' | 'medium' | 'heavy' | false;
  glow?: boolean;
  tintColor?: string;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function LiquidGlassCard({
  children,
  dark = true,
  intensity = 'regular',
  radius: r = 20,
  padding = 16,
  style,
  onPress,
  hapticFeedback = 'light',
  glow = false,
  tintColor,
}: Props) {
  const scale = useSharedValue(1);
  const elevationShadow = useSharedValue(1);

  const blurIntensity = {
    subtle: 20,
    regular: 40,
    strong: 65,
    frosted: 80,
  }[intensity];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: 0.85 + elevationShadow.value * 0.15,
  }));

  const onPressIn = () => {
    scale.value = withSpring(0.97, springs.snappy);
    elevationShadow.value = withTiming(0, { duration: 120 });
    if (hapticFeedback && Haptics) {
      const styleMap = {
        light: Haptics.ImpactFeedbackStyle.Light,
        medium: Haptics.ImpactFeedbackStyle.Medium,
        heavy: Haptics.ImpactFeedbackStyle.Heavy,
      };
      Haptics.impactAsync(styleMap[hapticFeedback]).catch(() => undefined);
    }
  };

  const onPressOut = () => {
    scale.value = withSpring(1, springs.bounce);
    elevationShadow.value = withTiming(1, { duration: 220 });
  };

  const tint = dark ? 'dark' : 'light';
  const borderColor = dark ? colors.dark.border : colors.light.border;
  const highlightColors = (dark
    ? colors.gradients.glassHighlightDark
    : colors.gradients.glassHighlight) as unknown as [string, string, ...string[]];

  // Фоновый overlay для усиления стекла
  const overlayColor = dark
    ? `rgba(20, 20, 30, ${intensity === 'frosted' ? 0.75 : intensity === 'strong' ? 0.55 : intensity === 'regular' ? 0.35 : 0.2})`
    : `rgba(255, 255, 255, ${intensity === 'frosted' ? 0.85 : intensity === 'strong' ? 0.7 : intensity === 'regular' ? 0.5 : 0.35})`;

  const content = (
    <View style={[styles.container, { borderRadius: r, padding }]}>
      {/* Слой 1: настоящий blur (GPU) */}
      <BlurView
        intensity={blurIntensity}
        tint={tint}
        style={[StyleSheet.absoluteFill, { borderRadius: r, overflow: 'hidden' }]}
      />
      {/* Слой 2: цветной overlay (поверх blur — усиливает контраст) */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: tintColor || overlayColor, borderRadius: r },
        ]}
      />
      {/* Слой 3: верхний highlight (имитация грани стекла сверху) */}
      <LinearGradient
        colors={highlightColors}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.5, y: 0.6 }}
        style={[StyleSheet.absoluteFill, { borderRadius: r, opacity: 0.9 }]}
        pointerEvents="none"
      />
      {/* Слой 4: glow (опционально — светится акцентом) */}
      {glow && (
        <LinearGradient
          colors={['rgba(220,38,38,0.3)', 'rgba(220,38,38,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: r }]}
          pointerEvents="none"
        />
      )}
      {/* Слой 5: тонкий внутренний border (стеклянная грань) */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: r,
            borderWidth: 1,
            borderColor: borderColor,
          },
        ]}
        pointerEvents="none"
      />
      {/* Контент */}
      <View style={{ zIndex: 10 }}>{children}</View>
    </View>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[
          animatedStyle,
          glow ? shadows.glow : shadows.card,
          { borderRadius: r },
          style,
        ]}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return <View style={[glow ? shadows.glow : shadows.card, { borderRadius: r }, style]}>{content}</View>;
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
});
