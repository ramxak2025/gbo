import React from 'react';
import { View, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useTheme } from '../context/ThemeContext';

export default function QRGenerator({ value, size = 200, dark: darkProp }) {
  const theme = useTheme();
  const dark = darkProp !== undefined ? darkProp : theme?.dark ?? true;

  if (!value) return null;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: dark ? '#1a1a1f' : '#ffffff',
          borderColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        },
      ]}
    >
      <View style={styles.qrWrapper}>
        <QRCode
          value={value}
          size={size}
          color={dark ? '#ffffff' : '#111827'}
          backgroundColor={dark ? '#1a1a1f' : '#ffffff'}
          ecl="M"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  qrWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
