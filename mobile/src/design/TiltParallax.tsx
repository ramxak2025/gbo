/**
 * TiltParallax — 3D параллакс при наклоне устройства
 *
 * Использует акселерометр (expo-sensors) для создания эффекта
 * глубины при наклоне телефона. Работает на нативном потоке через
 * Reanimated shared values.
 */
import React, { useEffect, ReactNode } from 'react';
import { ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { springs } from './tokens';

type Props = {
  children: ReactNode;
  intensity?: number; // 1-20, default 8
  style?: StyleProp<ViewStyle>;
  perspective?: number;
};

let sensorModule: any = null;
try {
  sensorModule = require('expo-sensors');
} catch {
  // expo-sensors not available
}

export default function TiltParallax({
  children,
  intensity = 8,
  style,
  perspective = 800,
}: Props) {
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);

  useEffect(() => {
    if (!sensorModule?.Accelerometer) return;

    sensorModule.Accelerometer.setUpdateInterval(32); // ~30fps

    const subscription = sensorModule.Accelerometer.addListener(
      ({ x, y }: { x: number; y: number }) => {
        tiltX.value = withSpring(x * intensity, { damping: 20, stiffness: 100, mass: 0.5 });
        tiltY.value = withSpring(y * intensity, { damping: 20, stiffness: 100, mass: 0.5 });
      }
    );

    return () => subscription?.remove();
  }, [intensity]);

  const animatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(tiltX.value, [-10, 10], [-5, 5], Extrapolation.CLAMP);
    const rotateX = interpolate(tiltY.value, [-10, 10], [5, -5], Extrapolation.CLAMP);
    const translateX = interpolate(tiltX.value, [-10, 10], [-3, 3], Extrapolation.CLAMP);
    const translateY = interpolate(tiltY.value, [-10, 10], [-3, 3], Extrapolation.CLAMP);

    return {
      transform: [
        { perspective },
        { rotateY: `${rotateY}deg` },
        { rotateX: `${rotateX}deg` },
        { translateX },
        { translateY },
      ],
    };
  });

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}
