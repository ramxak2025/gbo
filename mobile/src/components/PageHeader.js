import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Sun, Moon } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../utils/theme';

export default function PageHeader({ title, back, children, onBack }) {
  const { dark, toggle } = useTheme();
  const c = getColors(dark);
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.row}>
        {/* Left side */}
        <View style={styles.left}>
          {back && (
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <ChevronLeft size={24} color={c.text} />
            </TouchableOpacity>
          )}
          <Text style={[styles.title, { color: c.text }]} numberOfLines={1}>
            {title}
          </Text>
        </View>

        {/* Right side */}
        <View style={styles.right}>
          {children}
          <TouchableOpacity onPress={toggle} style={styles.themeButton}>
            {dark ? (
              <Sun size={20} color={c.textSecondary} />
            ) : (
              <Moon size={20} color={c.textSecondary} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  themeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
