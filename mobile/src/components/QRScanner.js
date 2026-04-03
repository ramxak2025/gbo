import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTheme } from '../context/ThemeContext';
import { XIcon } from '../icons';

export default function QRScanner({ onScan, onClose }) {
  const { colors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  const handleBarCodeScanned = ({ data }) => {
    if (scanned) return;
    setScanned(true);
    onScan(data);
  };

  if (!permission?.granted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <Text style={[styles.text, { color: colors.text }]}>
          Нужен доступ к камере для сканирования QR
        </Text>
        <TouchableOpacity onPress={requestPermission} style={[styles.btn, { backgroundColor: colors.accent }]}>
          <Text style={styles.btnText}>Разрешить</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose} style={styles.closeArea}>
          <XIcon size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />
      <View style={styles.overlay}>
        <View style={styles.frame} />
        <Text style={styles.hint}>Наведите камеру на QR-код</Text>
      </View>
      <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
        <XIcon size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    borderRadius: 20,
  },
  hint: {
    color: '#fff',
    fontSize: 16,
    marginTop: 20,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 4,
  },
  closeBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
  },
  closeArea: {
    marginTop: 20,
    padding: 12,
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 32,
  },
  btn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
