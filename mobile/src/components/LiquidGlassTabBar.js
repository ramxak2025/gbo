import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { RADIUS } from '../utils/constants';

export default function LiquidGlassTabBar({ state, descriptors, navigation }) {
  const { dark, colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      styles.wrapper,
      { paddingBottom: Math.max(insets.bottom, 8) },
    ]}>
      <View style={[
        styles.container,
        {
          backgroundColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.5)',
          borderColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.6)',
          // Liquid glass shadow
          shadowColor: dark ? '#000' : '#000',
          shadowOpacity: dark ? 0.3 : 0.08,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: -4 },
          elevation: 12,
        },
      ]}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const label = options.tabBarLabel || options.title || route.name;
          const IconComponent = options.tabBarIcon;

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              style={styles.tab}
              activeOpacity={0.7}
            >
              <View style={[
                styles.iconWrap,
                isFocused && {
                  backgroundColor: dark ? 'rgba(139,92,246,0.2)' : 'rgba(124,58,237,0.12)',
                },
              ]}>
                {IconComponent && (
                  <IconComponent
                    size={22}
                    color={isFocused ? colors.accent : colors.textSecondary}
                  />
                )}
              </View>
              <Text
                style={[
                  styles.label,
                  {
                    color: isFocused ? colors.accent : colors.textSecondary,
                    fontWeight: isFocused ? '600' : '400',
                  },
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
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
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  container: {
    flexDirection: 'row',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    height: 60,
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconWrap: {
    width: 36,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    marginTop: 2,
  },
});
