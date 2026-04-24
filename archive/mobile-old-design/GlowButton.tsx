/**
 * GlowButton — primary CTA с градиентом и свечением в стиле iOS 26
 */
import React, { ReactNode } from 'react';
import { Text, View, StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import HapticPressable from './HapticPressable';
import { colors, radius, springs, typography, shadows } from './tokens';

type Props = {
  title: string;
  onPress?: () => void;
  icon?: ReactNode;
  gradient?: readonly string[];
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  variant?: 'primary' | 'secondary' | 'ghost';
  dark?: boolean;
  haptic?: 'light' | 'medium' | 'heavy' | 'success';
};

export default function GlowButton({
  title,
  onPress,
  icon,
  gradient = colors.gradients.brand,
  disabled,
  loading,
  fullWidth = true,
  size = 'md',
  style,
  textStyle,
  variant = 'primary',
  dark = true,
  haptic = 'medium',
}: Props) {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.5);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const heights = { sm: 40, md: 52, lg: 60 };
  const fontSizes = { sm: 14, md: 16, lg: 18 };
  const height = heights[size];

  if (variant === 'ghost') {
    const textColor = dark ? '#ffffff' : '#000000';
    return (
      <HapticPressable
        onPress={disabled ? undefined : onPress}
        haptic={haptic}
        style={[
          { height, width: fullWidth ? '100%' : undefined, justifyContent: 'center', alignItems: 'center', flexDirection: 'row' },
          style,
        ]}
      >
        {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
        <Text style={[{ color: textColor, fontSize: fontSizes[size], fontWeight: '700' }, textStyle]}>{title}</Text>
      </HapticPressable>
    );
  }

  if (variant === 'secondary') {
    return (
      <HapticPressable
        onPress={disabled ? undefined : onPress}
        haptic={haptic}
        style={[
          {
            height,
            borderRadius: radius.md,
            backgroundColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
            borderWidth: 1,
            borderColor: dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'row',
            paddingHorizontal: 20,
            width: fullWidth ? '100%' : undefined,
          },
          style,
        ]}
      >
        {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
        <Text style={[{ color: dark ? '#fff' : '#000', fontSize: fontSizes[size], fontWeight: '700' }, textStyle]}>{title}</Text>
      </HapticPressable>
    );
  }

  return (
    <View style={[{ width: fullWidth ? '100%' : undefined }, style]}>
      {/* Glow behind button */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            borderRadius: radius.md,
            top: 4,
            shadowColor: gradient[0] as string,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.6,
            shadowRadius: 20,
            elevation: 10,
          },
          glowStyle,
        ]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={gradient as unknown as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFillObject, { borderRadius: radius.md, opacity: 0.6 }]}
        />
      </Animated.View>

      <HapticPressable
        onPress={disabled || loading ? undefined : onPress}
        haptic={haptic}
        style={{
          height,
          borderRadius: radius.md,
          overflow: 'hidden',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <LinearGradient
          colors={gradient as unknown as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', paddingHorizontal: 20 }}
        >
          {/* Inner highlight — блеск сверху */}
          <LinearGradient
            colors={['rgba(255,255,255,0.35)', 'rgba(255,255,255,0)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.7 }}
            style={StyleSheet.absoluteFillObject}
            pointerEvents="none"
          />
          {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
          <Text
            style={[
              {
                color: '#ffffff',
                fontSize: fontSizes[size],
                fontWeight: '800',
                letterSpacing: -0.2,
                textShadowColor: 'rgba(0,0,0,0.25)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
              },
              textStyle,
            ]}
          >
            {loading ? 'Загрузка...' : title}
          </Text>
        </LinearGradient>
      </HapticPressable>
    </View>
  );
}
