import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Switch, Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { api } from '../api/client';
import PageHeader from '../components/PageHeader';
import GlassCard from '../components/GlassCard';

export default function NotificationSettingsScreen() {
  const { colors } = useTheme();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getNotificationSettings()
      .then(s => { setSettings(s || {}); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const toggle = async (key) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    try {
      await api.updateNotificationSettings(updated);
    } catch (e) {
      setSettings(settings);
      Alert.alert('Ошибка', e.message);
    }
  };

  const options = [
    { key: 'newStudent', label: 'Новый ученик' },
    { key: 'payment', label: 'Платежи' },
    { key: 'tournament', label: 'Турниры' },
    { key: 'attendance', label: 'Посещаемость' },
    { key: 'news', label: 'Новости' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <PageHeader title="Уведомления" back />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <GlassCard>
          {options.map((opt, i) => (
            <View key={opt.key} style={[styles.row, i < options.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.cardBorder }]}>
              <Text style={[styles.label, { color: colors.text }]}>{opt.label}</Text>
              <Switch
                value={!!settings[opt.key]}
                onValueChange={() => toggle(opt.key)}
                trackColor={{ false: colors.inputBg, true: colors.accent }}
                thumbColor="#fff"
              />
            </View>
          ))}
        </GlassCard>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  label: { fontSize: 15, fontWeight: '500' },
});
