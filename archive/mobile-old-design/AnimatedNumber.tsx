/**
 * AnimatedNumber — число которое плавно анимируется при изменении
 *
 * Создаёт эффект "счётчика" как в Apple Health / Finance apps.
 * Работает полностью на нативном потоке через Reanimated.
 */
import React, { useEffect } from 'react';
import { TextStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  useDerivedValue,
  Easing,
} from 'react-native-reanimated';

const AnimatedText = Animated.createAnimatedComponent(
  require('react-native').TextInput
) as any;

type Props = {
  value: number;
  duration?: number;
  style?: StyleProp<TextStyle>;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  formatter?: (n: number) => string;
};

export default function AnimatedNumber({
  value,
  duration = 800,
  style,
  prefix = '',
  suffix = '',
  decimals = 0,
  formatter,
}: Props) {
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withTiming(value, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [value, duration]);

  const animatedText = useDerivedValue(() => {
    const v = animatedValue.value;
    if (formatter) return formatter(v);
    const formatted = decimals > 0
      ? v.toFixed(decimals)
      : Math.round(v).toLocaleString('ru-RU');
    return `${prefix}${formatted}${suffix}`;
  });

  const animatedProps = useAnimatedProps(() => ({
    text: animatedText.value,
    defaultValue: animatedText.value,
  }));

  return (
    // @ts-ignore — AnimatedProps on TextInput
    <AnimatedText
      editable={false}
      animatedProps={animatedProps}
      style={[
        {
          fontVariant: ['tabular-nums'],
          padding: 0,
          margin: 0,
        },
        style,
      ]}
    />
  );
}
