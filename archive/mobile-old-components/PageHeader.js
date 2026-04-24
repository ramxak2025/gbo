import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function PageHeader({ title, children }) {
  const { t } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: t.text }]}>{title}</Text>
      <View style={styles.actions}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
