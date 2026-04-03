import React from 'react';
import { View, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useTheme } from '../context/ThemeContext';

export default function QRGenerator({ value, size = 200 }) {
  const { dark, colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: '#fff', borderRadius: 16, padding: 16 }]}>
      <QRCode
        value={value || ' '}
        size={size}
        color="#000"
        backgroundColor="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
