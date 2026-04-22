/**
 * ParallaxScroll — скролл с hero-секцией и параллаксом
 * + динамический blur шапки при скролле (iOS 26 style)
 */
import React, { ReactNode } from 'react';
import { View, StyleSheet, Dimensions, ScrollViewProps } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

const { width: W } = Dimensions.get('window');

type Props = {
  children: ReactNode;
  heroHeight?: number;
  hero: ReactNode;
  stickyHeader?: ReactNode;
  dark?: boolean;
} & Omit<ScrollViewProps, 'children'>;

export default function ParallaxScroll({
  children,
  heroHeight = 280,
  hero,
  stickyHeader,
  dark = true,
  ...rest
}: Props) {
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const heroAnimStyle = useAnimatedStyle(() => {
    const scale = interpolate(scrollY.value, [-200, 0], [1.3, 1], Extrapolation.CLAMP);
    const translateY = interpolate(scrollY.value, [0, heroHeight], [0, -heroHeight * 0.4], Extrapolation.CLAMP);
    const opacity = interpolate(scrollY.value, [0, heroHeight * 0.8], [1, 0], Extrapolation.CLAMP);
    return {
      transform: [{ scale }, { translateY }],
      opacity,
    };
  });

  const headerBlurStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, heroHeight * 0.5, heroHeight * 0.8], [0, 0.5, 1], Extrapolation.CLAMP);
    return {
      opacity,
    };
  });

  return (
    <View style={{ flex: 1 }}>
      <Animated.ScrollView
        {...rest}
        scrollEventThrottle={16}
        onScroll={scrollHandler}
        showsVerticalScrollIndicator={false}
        bounces
      >
        <Animated.View style={[{ height: heroHeight, width: W }, heroAnimStyle]}>
          {hero}
        </Animated.View>
        <View style={{ backgroundColor: 'transparent' }}>{children}</View>
      </Animated.ScrollView>

      {stickyHeader && (
        <Animated.View style={[styles.stickyWrap, headerBlurStyle]} pointerEvents="box-none">
          <BlurView
            intensity={60}
            tint={dark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFillObject}
          />
          <View
            style={[
              StyleSheet.absoluteFillObject,
              { backgroundColor: dark ? 'rgba(10,10,15,0.65)' : 'rgba(242,242,247,0.75)' },
            ]}
          />
          <View style={{ paddingTop: 50, paddingBottom: 12 }}>{stickyHeader}</View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stickyWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
});
