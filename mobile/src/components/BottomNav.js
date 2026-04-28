/**
 * BottomNav — iOS 26 floating glass tab bar with blur
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

export default function BottomNav({ state, descriptors, navigation }) {
  const { dark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 10) + 10 }]}>
      <View style={[styles.container, dark ? styles.containerDark : styles.containerLight]}>
        <BlurView
          intensity={80}
          tint={dark ? 'dark' : 'light'}
          style={[StyleSheet.absoluteFillObject, { borderRadius: 22 }]}
        />
        <View style={[StyleSheet.absoluteFillObject, {
          backgroundColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.50)',
          borderRadius: 22,
        }]} />
        <View style={[StyleSheet.absoluteFillObject, {
          borderRadius: 22,
          borderWidth: 0.5,
          borderColor: dark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.80)',
        }]} pointerEvents="none" />

        <View style={styles.tabs}>
          {state.routes.map((route, index) => {
            const descriptor = descriptors[route.key];
            if (!descriptor) return null;
            const { options } = descriptor;
            const isFocused = state.index === index;
            const label = typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel : options.title ?? route.name;
            const Icon = options.tabBarIcon;

            return (
              <Pressable
                key={route.key}
                onPress={() => {
                  if (!isFocused) {
                    if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
                    navigation.navigate(route.name);
                  }
                }}
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
                    : (dark ? 'rgba(255,255,255,0.40)' : 'rgba(0,0,0,0.35)'),
                  size: 22,
                })}
                <Text
                  style={[
                    styles.label,
                    { color: isFocused ? (dark ? '#fff' : '#111') : (dark ? 'rgba(255,255,255,0.40)' : 'rgba(0,0,0,0.35)'), fontWeight: isFocused ? '700' : '500' },
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
  wrapper: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, zIndex: 50 },
  container: { borderRadius: 22, height: 62, overflow: 'hidden', maxWidth: 500, alignSelf: 'center', width: '100%' },
  containerDark: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 32, elevation: 16 },
  containerLight: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 32, elevation: 8 },
  tabs: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', height: 62, paddingHorizontal: 8 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, paddingVertical: 6, borderRadius: 16 },
  tabActiveDark: { backgroundColor: 'rgba(255,255,255,0.12)' },
  tabActiveLight: { backgroundColor: 'rgba(0,0,0,0.06)' },
  label: { fontSize: 9, letterSpacing: 0.3 },
});
