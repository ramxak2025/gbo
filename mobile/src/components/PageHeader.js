import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../utils/theme';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight || 0);

export default function PageHeader({ title, back, onBack, rightAction, gradient }) {
  const { dark, toggle } = useTheme();
  const c = getColors(dark);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: STATUS_BAR_HEIGHT + 8,
          backgroundColor: dark
            ? 'rgba(5,5,5,0.85)'
            : 'rgba(245,245,247,0.85)',
          borderBottomColor: c.border,
        },
      ]}
    >
      <View style={styles.row}>
        {/* Left side */}
        <View style={styles.left}>
          {back && (
            <TouchableOpacity
              onPress={onBack}
              style={styles.backButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.6}
            >
              <Ionicons name="chevron-back" size={26} color={c.text} />
            </TouchableOpacity>
          )}
        </View>

        {/* Title */}
        <View style={styles.center}>
          {gradient ? (
            <Text style={[styles.titleGradient, { color: c.purple }]} numberOfLines={1}>
              {title}
            </Text>
          ) : (
            <Text style={[styles.title, { color: c.text }]} numberOfLines={1}>
              {title}
            </Text>
          )}
        </View>

        {/* Right side */}
        <View style={styles.right}>
          {rightAction || (
            <TouchableOpacity
              onPress={toggle}
              style={styles.themeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.6}
            >
              <Ionicons
                name={dark ? 'sunny-outline' : 'moon-outline'}
                size={22}
                color={c.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
  },
  left: {
    width: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  right: {
    width: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  backButton: {
    padding: 4,
  },
  themeButton: {
    padding: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  titleGradient: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
});
