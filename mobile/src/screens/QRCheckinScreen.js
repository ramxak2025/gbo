import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import PageHeader from '../components/PageHeader';
import QRScanner from '../components/QRScanner';

export default function QRCheckinScreen({ navigation }) {
  const { colors } = useTheme();
  const { qrCheckin } = useData();
  const [result, setResult] = useState(null);

  const handleScan = async (data) => {
    // Extract token from URL if it's a full URL
    let token = data;
    if (data.includes('qr-checkin/')) {
      token = data.split('qr-checkin/').pop();
    }

    try {
      const res = await qrCheckin(token);
      if (res.ok) {
        setResult('success');
        Alert.alert('Отмечено!', 'Вы успешно отмечены на занятии', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        setResult('error');
        Alert.alert('Ошибка', res.message || 'Не удалось отметиться');
      }
    } catch (e) {
      setResult('error');
      Alert.alert('Ошибка', e.message);
    }
  };

  if (result) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <PageHeader title="QR Отметка" back />
        <View style={styles.center}>
          <Text style={[styles.resultText, { color: result === 'success' ? colors.success : colors.danger }]}>
            {result === 'success' ? 'Вы отмечены!' : 'Ошибка отметки'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <QRScanner onScan={handleScan} onClose={() => navigation.goBack()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  resultText: { fontSize: 24, fontWeight: '800' },
});
