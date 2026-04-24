/**
 * PageHeader — точная копия PWA PageHeader.jsx
 *
 * PWA: sticky top, z-10
 * dynamic blur on scroll (0→16px as scroll 0→30px)
 * dark bg: rgba(5,5,5, 0.55×scroll)
 * light bg: rgba(245,245,247, 0.6×scroll)
 * back: ChevronLeft 20px
 * title: text-lg font-bold uppercase italic
 * theme toggle: Sun/Moon 18px
 */
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Sun, Moon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

export default function PageHeader({ title, back, gradient, children }) {
  const { dark, toggle } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const renderTitle = () => {
    if (gradient && title === 'iBorcuha') {
      return (
        <Text style={{ fontSize: 18, fontWeight: '700', textTransform: 'uppercase', letterSpacing: -0.5 }}>
          <Text style={{ color: dark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }}>i</Text>
          <Text style={{ color: '#8b5cf6' }}>Borcuha</Text>
        </Text>
      );
    }
    return (
      <Text
        style={{
          fontSize: 18,
          fontWeight: '700',
          textTransform: 'uppercase',
          fontStyle: 'italic',
          color: dark ? '#fff' : '#111',
        }}
        numberOfLines={1}
      >
        {title}
      </Text>
    );
  };

  return (
    <View
      style={{
        paddingTop: insets.top + 8,
        paddingBottom: 8,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        {back && (
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => ({
              padding: 8,
              borderRadius: 12,
              backgroundColor: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
              marginRight: 8,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <ChevronLeft size={20} color={dark ? '#fff' : '#111'} />
          </Pressable>
        )}
        {renderTitle()}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {children}
        <Pressable
          onPress={toggle}
          style={({ pressed }) => ({
            padding: 8,
            borderRadius: 12,
            backgroundColor: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
            opacity: pressed ? 0.6 : 1,
          })}
        >
          {dark
            ? <Sun size={18} color="rgba(255,255,255,0.6)" />
            : <Moon size={18} color="rgba(0,0,0,0.5)" />
          }
        </Pressable>
      </View>
    </View>
  );
}
