import React from 'react';
import {
  View, Text, TouchableOpacity, Modal as RNModal,
  StyleSheet, ScrollView, Dimensions, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { XIcon } from '../icons';
import { RADIUS } from '../utils/constants';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function Modal({ visible, onClose, title, children }) {
  const { dark, colors } = useTheme();

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.modalBg }]}>
          <View style={[styles.handle, { backgroundColor: dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' }]} />
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]}
            >
              <XIcon size={18} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    maxHeight: SCREEN_HEIGHT * 0.85,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    fontStyle: 'italic',
  },
  closeBtn: {
    padding: 8,
    borderRadius: 12,
  },
  content: {
    flexGrow: 0,
  },
});
