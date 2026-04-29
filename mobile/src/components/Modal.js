/**
 * Modal — Bottom Sheet точная копия PWA Modal.jsx
 *
 * PWA CSS:
 *   max-h-[85vh], rounded-t-[32px], p-5 pt-3
 *   dark: bg-dark-800/95 (#09090b/95%)
 *   light: bg-[#f5f5f7]/95
 *   backdrop: bg-black/60, backdrop-blur-sm
 *   handle: w-10 h-1 rounded-full, dark bg-white/20
 *   close: X icon 18px in rounded-xl, dark bg-white/[0.05]
 *   title: text-lg font-bold uppercase italic
 *   animation: sheetUp 0.4s cubic-bezier(0.22, 1, 0.36, 1)
 */
import React from 'react';
import { View, Text, Pressable, ScrollView, Modal as RNModal, Dimensions, KeyboardAvoidingView, Platform, Keyboard, ActivityIndicator, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

const { height: H } = Dimensions.get('window');

export default function Modal({ open, onClose, title, children, loading }) {
  const { dark } = useTheme();

  if (!open) return null;

  const handleBackdropPress = () => {
    Keyboard.dismiss();
    if (!loading) onClose();
  };

  return (
    <RNModal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={loading ? undefined : onClose}
      statusBarTranslucent
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.60)',
          justifyContent: 'flex-end',
        }}
        onPress={handleBackdropPress}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable
            onPress={e => e.stopPropagation()}
            style={{
              maxHeight: H * 0.85,
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              paddingHorizontal: 20,
              paddingTop: 12,
              paddingBottom: 100,
              backgroundColor: dark ? 'rgba(9, 9, 11, 0.95)' : 'rgba(245, 245, 247, 0.95)',
            }}
          >
            {/* Handle */}
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
              <View
                style={{
                  width: 40,
                  height: 5,
                  borderRadius: 2.5,
                  backgroundColor: dark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.15)',
                }}
              />
            </View>

            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{
                fontSize: 18,
                fontWeight: '700',
                textTransform: 'uppercase',
                fontStyle: 'italic',
                color: dark ? '#fff' : '#111',
              }}>
                {title}
              </Text>
              <Pressable
                onPress={loading ? undefined : onClose}
                disabled={loading}
                style={({ pressed }) => ({
                  padding: 8,
                  borderRadius: 12,
                  backgroundColor: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                  opacity: loading ? 0.3 : pressed ? 0.6 : 1,
                })}
              >
                <X size={18} color={dark ? '#fff' : '#111'} />
              </Pressable>
            </View>

            {/* Content */}
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              {children}
            </ScrollView>

            {/* Loading overlay */}
            {loading && (
              <View style={{
                ...StyleSheet.absoluteFillObject,
                backgroundColor: dark ? 'rgba(9,9,11,0.7)' : 'rgba(245,245,247,0.7)',
                borderTopLeftRadius: 32,
                borderTopRightRadius: 32,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <ActivityIndicator size="large" color={dark ? '#fff' : '#111'} />
              </View>
            )}
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </RNModal>
  );
}
