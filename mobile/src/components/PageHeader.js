import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { ChevronLeftIcon, SunIcon, MoonIcon } from '../icons';

export default function PageHeader({ title, back, logo, gradient, children }) {
  const { dark, toggle, colors } = useTheme();
  const navigation = useNavigation();

  const renderTitle = () => {
    if (gradient && title === 'iBorcuha') {
      return (
        <Text style={[styles.title, { color: colors.accent }]}>
          <Text style={{ color: dark ? 'rgba(255,255,255,0.6)' : '#6b7280' }}>i</Text>
          Borcuha
        </Text>
      );
    }
    return <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{title}</Text>;
  };

  return (
    <View style={[styles.header, { backgroundColor: colors.bg }]}>
      <View style={styles.left}>
        {back && (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronLeftIcon size={24} color={colors.text} />
          </TouchableOpacity>
        )}
        {logo && (
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logo}
          />
        )}
        {renderTitle()}
      </View>
      <View style={styles.right}>
        {children}
        <TouchableOpacity
          onPress={toggle}
          style={[styles.themeBtn, {
            backgroundColor: dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.6)',
          }]}
        >
          {dark ? <SunIcon size={18} color={colors.text} /> : <MoonIcon size={18} color={colors.text} />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    padding: 4,
    marginLeft: -4,
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    fontStyle: 'italic',
  },
  themeBtn: {
    padding: 10,
    borderRadius: 12,
  },
});
