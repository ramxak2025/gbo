/**
 * FloatingTabBar — плавающая нижняя навигация с Liquid Glass
 *
 * - Парит над контентом с blur-фоном
 * - Анимированный pill-индикатор активной вкладки (Reanimated 3)
 * - Haptic feedback при переключении
 * - Scale + opacity анимации иконок
 */
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import HapticPressable from './HapticPressable';
import { colors, radius, springs, shadows } from './tokens';

const { width: W } = Dimensions.get('window');
const TAB_BAR_WIDTH = Math.min(W - 32, 420);
const TAB_BAR_HEIGHT = 68;

export default function FloatingTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const dark = true; // можно пробрасывать через theme
  const tabWidth = TAB_BAR_WIDTH / state.routes.length;
  const indicatorX = useSharedValue(state.index * tabWidth);

  React.useEffect(() => {
    indicatorX.value = withSpring(state.index * tabWidth, springs.liquid);
  }, [state.index, tabWidth]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View
        style={[
          styles.container,
          shadows.elevated,
          { width: TAB_BAR_WIDTH, height: TAB_BAR_HEIGHT },
        ]}
      >
        {/* Настоящий blur */}
        <BlurView
          intensity={80}
          tint={dark ? 'dark' : 'light'}
          style={[StyleSheet.absoluteFillObject, { borderRadius: radius.pill }]}
        />
        {/* Фоновый overlay */}
        <View
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: dark ? 'rgba(20,20,30,0.6)' : 'rgba(255,255,255,0.65)',
              borderRadius: radius.pill,
            },
          ]}
        />
        {/* Highlight сверху */}
        <LinearGradient
          colors={
            dark
              ? (['rgba(255,255,255,0.15)', 'rgba(255,255,255,0)'] as const)
              : (['rgba(255,255,255,0.9)', 'rgba(255,255,255,0)'] as const)
          }
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.7 }}
          style={[StyleSheet.absoluteFillObject, { borderRadius: radius.pill }]}
          pointerEvents="none"
        />
        {/* Border highlight */}
        <View
          style={[
            StyleSheet.absoluteFillObject,
            {
              borderRadius: radius.pill,
              borderWidth: 1,
              borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
            },
          ]}
          pointerEvents="none"
        />

        {/* Animated pill indicator */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 8,
              left: 8,
              width: tabWidth - 8,
              height: TAB_BAR_HEIGHT - 16,
              borderRadius: radius.pill,
              overflow: 'hidden',
            },
            indicatorStyle,
          ]}
        >
          <LinearGradient
            colors={colors.gradients.brand as unknown as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <LinearGradient
            colors={['rgba(255,255,255,0.35)', 'rgba(255,255,255,0)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.7 }}
            style={StyleSheet.absoluteFillObject}
            pointerEvents="none"
          />
        </Animated.View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {state.routes.map((route, index) => {
            const descriptor = descriptors[route.key];
            if (!descriptor) return null;
            const { options } = descriptor;
            const isFocused = state.index === index;
            const label =
              typeof options.tabBarLabel === 'string'
                ? options.tabBarLabel
                : options.title ?? route.name;

            const onPress = () => {
              if (!isFocused) {
                Haptics.selectionAsync().catch(() => undefined);
                navigation.navigate(route.name as never);
              }
            };

            const Icon = options.tabBarIcon;

            return (
              <HapticPressable
                key={route.key}
                onPress={onPress}
                haptic={false}
                scale={0.92}
                style={{
                  width: tabWidth,
                  height: TAB_BAR_HEIGHT,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <TabIcon focused={isFocused}>
                  {Icon ? Icon({ focused: isFocused, color: isFocused ? '#ffffff' : dark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)', size: 22 }) : null}
                </TabIcon>
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '700',
                    marginTop: 3,
                    color: isFocused ? '#ffffff' : dark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)',
                    letterSpacing: 0.2,
                  }}
                  numberOfLines={1}
                >
                  {label as string}
                </Text>
              </HapticPressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function TabIcon({ focused, children }: { focused: boolean; children: React.ReactNode }) {
  const scale = useSharedValue(focused ? 1.1 : 1);

  React.useEffect(() => {
    scale.value = withSpring(focused ? 1.15 : 1, springs.bounce);
  }, [focused]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  container: {
    borderRadius: radius.pill,
    overflow: 'hidden',
    position: 'relative',
  },
  tabs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    height: '100%',
  },
});
