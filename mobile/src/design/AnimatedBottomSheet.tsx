/**
 * AnimatedBottomSheet — модалка с pan gesture dismiss
 *
 * - Свайп вниз для закрытия (нативный gesture через Reanimated)
 * - Backdrop blur + fade
 * - Liquid Glass фон
 * - Haptic feedback при snap точках
 * - Spring анимация открытия/закрытия
 */
import React, { useEffect, ReactNode, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, radius, springs, shadows } from './tokens';

const { height: H } = Dimensions.get('window');
const MAX_TRANSLATE = H * 0.85;

type Props = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  dark?: boolean;
  snapPoint?: number; // 0-1, default 0.6 (60% of screen)
  fullHeight?: boolean;
};

export default function AnimatedBottomSheet({
  visible,
  onClose,
  children,
  dark = true,
  snapPoint = 0.6,
  fullHeight = false,
}: Props) {
  const translateY = useSharedValue(MAX_TRANSLATE);
  const backdropOpacity = useSharedValue(0);
  const context = useSharedValue({ y: 0 });

  const sheetHeight = fullHeight ? H * 0.92 : H * snapPoint;

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, springs.liquid);
      backdropOpacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
    } else {
      translateY.value = withSpring(MAX_TRANSLATE, springs.smooth);
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const hapticClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    onClose();
  }, [onClose]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      translateY.value = Math.max(0, context.value.y + event.translationY);
    })
    .onEnd((event) => {
      if (event.translationY > sheetHeight * 0.3 || event.velocityY > 500) {
        translateY.value = withSpring(MAX_TRANSLATE, springs.smooth);
        backdropOpacity.value = withTiming(0, { duration: 200 });
        runOnJS(hapticClose)();
      } else {
        translateY.value = withSpring(0, springs.bounce);
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
      }
    });

  const sheetAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropAnimStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View style={[StyleSheet.absoluteFillObject, backdropAnimStyle]}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFillObject} />
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.4)' }]} />
        </Pressable>
      </Animated.View>

      {/* Sheet */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            {
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: sheetHeight,
              borderTopLeftRadius: radius.xxxl,
              borderTopRightRadius: radius.xxxl,
              overflow: 'hidden',
            },
            shadows.elevated,
            sheetAnimStyle,
          ]}
        >
          {/* Glass background */}
          <BlurView
            intensity={80}
            tint={dark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFillObject}
          />
          <View
            style={[
              StyleSheet.absoluteFillObject,
              {
                backgroundColor: dark ? 'rgba(20,20,30,0.85)' : 'rgba(255,255,255,0.92)',
              },
            ]}
          />
          {/* Top highlight */}
          <LinearGradient
            colors={
              dark
                ? ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0)']
                : ['rgba(255,255,255,0.8)', 'rgba(255,255,255,0)']
            }
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.3 }}
            style={[StyleSheet.absoluteFillObject, { height: 80 }]}
            pointerEvents="none"
          />
          {/* Border */}
          <View
            style={[
              StyleSheet.absoluteFillObject,
              {
                borderTopLeftRadius: radius.xxxl,
                borderTopRightRadius: radius.xxxl,
                borderWidth: 1,
                borderBottomWidth: 0,
                borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
              },
            ]}
            pointerEvents="none"
          />

          {/* Handle */}
          <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 8 }}>
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
              }}
            />
          </View>

          {/* Content */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            <View style={{ flex: 1, paddingHorizontal: 20, paddingBottom: 20 }}>
              {children}
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
