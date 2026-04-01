import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { getColors } from '../utils/theme';
import PageHeader from '../components/PageHeader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCAN_SIZE = SCREEN_WIDTH * 0.7;

export default function QRCheckinScreen() {
  const { dark } = useTheme();
  const c = getColors(dark);
  const navigation = useNavigation();
  const route = useRoute();
  const { qrCheckin } = useData();

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const processedRef = useRef(false);

  // Handle deep link token
  useEffect(() => {
    const token = route.params?.token;
    if (token && !processedRef.current) {
      processedRef.current = true;
      handleCheckin(token);
    }
  }, [route.params?.token]);

  const handleCheckin = useCallback(async (token) => {
    if (loading) return;
    setLoading(true);
    setScanned(true);
    try {
      const res = await qrCheckin(token);
      setResult({
        success: true,
        message: res.message || 'Отметка успешно поставлена!',
        groupName: res.groupName || '',
      });
    } catch (e) {
      setResult({
        success: false,
        message: e.message || 'Ошибка при отметке',
      });
    } finally {
      setLoading(false);
    }
  }, [loading, qrCheckin]);

  const handleBarCodeScanned = useCallback(({ data: qrData }) => {
    if (scanned || loading) return;
    // Extract token from URL or use raw data
    let token = qrData;
    try {
      const url = new URL(qrData);
      const tokenParam = url.searchParams.get('token') || url.pathname.split('/').pop();
      if (tokenParam) token = tokenParam;
    } catch {}
    handleCheckin(token);
  }, [scanned, loading, handleCheckin]);

  const handleReset = useCallback(() => {
    setScanned(false);
    setResult(null);
    processedRef.current = false;
  }, []);

  if (!permission) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: c.bg }]}>
        <ActivityIndicator size="large" color={c.purple} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <PageHeader title="QR Отметка" back onBack={() => navigation.goBack()} />
        <View style={[styles.center, { flex: 1 }]}>
          <View style={[styles.permIcon, { backgroundColor: c.purpleBg }]}>
            <Ionicons name="camera-outline" size={48} color={c.purple} />
          </View>
          <Text style={[styles.permTitle, { color: c.text }]}>Доступ к камере</Text>
          <Text style={[styles.permDesc, { color: c.textSecondary }]}>
            Для сканирования QR-кода необходим доступ к камере
          </Text>
          <TouchableOpacity
            style={[styles.permButton, { backgroundColor: c.purple }]}
            onPress={requestPermission}
          >
            <Text style={styles.permButtonText}>Разрешить доступ</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <PageHeader title="QR Отметка" back onBack={() => navigation.goBack()} />

      {!scanned ? (
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={handleBarCodeScanned}
          >
            {/* Overlay */}
            <View style={styles.overlay}>
              <View style={styles.overlayTop} />
              <View style={styles.overlayMiddle}>
                <View style={styles.overlaySide} />
                <View style={styles.scanArea}>
                  {/* Corner markers */}
                  <View style={[styles.corner, styles.cornerTL, { borderColor: c.purple }]} />
                  <View style={[styles.corner, styles.cornerTR, { borderColor: c.purple }]} />
                  <View style={[styles.corner, styles.cornerBL, { borderColor: c.purple }]} />
                  <View style={[styles.corner, styles.cornerBR, { borderColor: c.purple }]} />
                </View>
                <View style={styles.overlaySide} />
              </View>
              <View style={styles.overlayBottom}>
                <Text style={styles.scanHint}>Наведите камеру на QR-код</Text>
              </View>
            </View>
          </CameraView>
        </View>
      ) : (
        <View style={[styles.center, { flex: 1 }]}>
          {loading ? (
            <>
              <ActivityIndicator size="large" color={c.purple} />
              <Text style={[styles.loadingText, { color: c.textSecondary }]}>Обработка...</Text>
            </>
          ) : result ? (
            <View style={styles.resultContainer}>
              <View style={[
                styles.resultIcon,
                { backgroundColor: result.success ? c.greenBg : c.redBg },
              ]}>
                <Ionicons
                  name={result.success ? 'checkmark-circle' : 'close-circle'}
                  size={64}
                  color={result.success ? c.green : c.red}
                />
              </View>
              <Text style={[styles.resultTitle, { color: c.text }]}>
                {result.success ? 'Успешно!' : 'Ошибка'}
              </Text>
              <Text style={[styles.resultMessage, { color: c.textSecondary }]}>
                {result.message}
              </Text>
              {result.groupName ? (
                <Text style={[styles.resultGroup, { color: c.purple }]}>
                  {result.groupName}
                </Text>
              ) : null}

              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: c.purple }]}
                onPress={handleReset}
              >
                <Ionicons name="scan-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.retryText}>Сканировать снова</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.closeButton, { borderColor: c.border }]}
                onPress={() => navigation.goBack()}
              >
                <Text style={[styles.closeText, { color: c.textSecondary }]}>Закрыть</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  cameraContainer: { flex: 1, overflow: 'hidden' },
  camera: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'transparent' },
  overlayTop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  overlayMiddle: { flexDirection: 'row' },
  overlaySide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  scanArea: {
    width: SCAN_SIZE, height: SCAN_SIZE,
  },
  overlayBottom: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', paddingTop: 30,
  },
  scanHint: { color: '#fff', fontSize: 15, fontWeight: '500' },
  corner: {
    position: 'absolute', width: 24, height: 24, borderWidth: 3,
  },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 8 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 8 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 8 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 8 },
  loadingText: { fontSize: 15, marginTop: 16 },
  resultContainer: { alignItems: 'center', paddingHorizontal: 32 },
  resultIcon: {
    width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  resultTitle: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  resultMessage: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 8 },
  resultGroup: { fontSize: 16, fontWeight: '600', marginBottom: 32 },
  retryButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 52, borderRadius: 14, paddingHorizontal: 24, width: '100%',
  },
  retryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  closeButton: {
    height: 48, borderRadius: 14, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 24, width: '100%', marginTop: 12,
  },
  closeText: { fontSize: 15, fontWeight: '600' },
  permIcon: {
    width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  permTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  permDesc: { fontSize: 15, textAlign: 'center', lineHeight: 22, paddingHorizontal: 32, marginBottom: 24 },
  permButton: {
    height: 52, borderRadius: 14, paddingHorizontal: 32,
    alignItems: 'center', justifyContent: 'center',
  },
  permButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
