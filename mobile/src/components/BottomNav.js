/**
 * BottomNav — точная копия PWA BottomNav.jsx
 *
 * PWA CSS:
 *   fixed bottom-0, z-50, px-4, pb-[calc(env(safe-area-inset-bottom)+10px)]
 *   rounded-[22px], h-[60px], max-w-lg, mx-auto
 *   dark: bg-white/[0.08], backdrop-blur-3xl, backdrop-saturate-[1.8]
 *         shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_0.5px_0_rgba(255,255,255,0.1)]
 *   light: bg-white/50
 *          shadow-[0_8px_32px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)]
 *   active: dark bg-white/[0.12] light bg-black/[0.06]
 *   icon: 22px, strokeWidth active 2.5, inactive 1.5
 *   label: 9px, active bold, inactive medium
 *
 * Это custom tabBar — передаётся в Tab.Navigator через tabBar={(props) => <BottomNav {...props} />}
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

export default function BottomNav({ state, descriptors, navigation }) {
  const { dark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 10) + 10 }]}>
      <View style={[
        styles.container,
        dark ? styles.containerDark : styles.containerLight,
      ]}>
        {/* Blur background */}
        <BlurView
          intensity={80}
          tint={dark ? 'dark' : 'light'}
          style={[StyleSheet.absoluteFillObject, { borderRadius: 22 }]}
        />

        <View style={styles.tabs}>
          {state.routes.map((route, index) => {
            const descriptor = descriptors[route.key];
            if (!descriptor) return null;
            const { options } = descriptor;
            const isFocused = state.index === index;
            const label = typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : options.title ?? route.name;

            const Icon = options.tabBarIcon;

            const onPress = () => {
              if (!isFocused) {
                navigation.navigate(route.name);
              }
            };

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                style={({ pressed }) => [
                  styles.tab,
                  isFocused && (dark ? styles.tabActiveDark : styles.tabActiveLight),
                  pressed && { opacity: 0.7 },
                ]}
              >
                {Icon && Icon({
                  focused: isFocused,
                  color: isFocused
                    ? (dark ? '#ffffff' : '#111111')
                    : (dark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.35)'),
                  size: 22,
                })}
                <Text
                  style={[
                    styles.label,
                    {
                      color: isFocused
                        ? (dark ? '#ffffff' : '#111111')
                        : (dark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.35)'),
                      fontWeight: isFocused ? '700' : '500',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 50,
  },
  container: {
    borderRadius: 22,
    height: 60,
    overflow: 'hidden',
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  containerDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 16,
  },
  containerLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.50)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 32,
    elevation: 8,
  },
  tabs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 60,
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tabActiveDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  tabActiveLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
  },
  label: {
    fontSize: 9,
    letterSpacing: 0.3,
  },
});
