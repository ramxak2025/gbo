import React, { useState, useCallback } from 'react';
import {
  View, Text, Switch, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../utils/theme';
import GlassCard from '../components/GlassCard';
import PageHeader from '../components/PageHeader';

const NOTIFICATION_OPTIONS = [
  { key: 'news', label: 'Новости', description: 'Уведомления о новостях клуба', icon: 'newspaper-outline' },
  { key: 'tournaments', label: 'Турниры', description: 'Информация о предстоящих турнирах', icon: 'trophy-outline' },
  { key: 'payments', label: 'Оплата', description: 'Напоминания об оплате абонемента', icon: 'card-outline' },
  { key: 'schedule', label: 'Расписание', description: 'Изменения в расписании тренировок', icon: 'calendar-outline' },
];

export default function NotificationSettingsScreen() {
  const { dark } = useTheme();
  const c = getColors(dark);
  const navigation = useNavigation();

  const [settings, setSettings] = useState({
    news: true,
    tournaments: true,
    payments: true,
    schedule: true,
  });

  const handleToggle = useCallback((key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <PageHeader title="Уведомления" back onBack={() => navigation.goBack()} />

      <View style={styles.content}>
        <Text style={[styles.subtitle, { color: c.textSecondary }]}>
          Настройте, какие уведомления вы хотите получать
        </Text>

        {NOTIFICATION_OPTIONS.map((option, index) => (
          <GlassCard key={option.key} style={styles.optionCard}>
            <View style={styles.optionRow}>
              <View style={[styles.optionIcon, { backgroundColor: c.purpleBg }]}>
                <Ionicons name={option.icon} size={20} color={c.purple} />
              </View>
              <View style={styles.optionInfo}>
                <Text style={[styles.optionLabel, { color: c.text }]}>{option.label}</Text>
                <Text style={[styles.optionDesc, { color: c.textSecondary }]}>{option.description}</Text>
              </View>
              <Switch
                value={settings[option.key]}
                onValueChange={() => handleToggle(option.key)}
                trackColor={{ false: c.inputBorder, true: c.purple }}
                thumbColor="#fff"
                ios_backgroundColor={c.inputBorder}
              />
            </View>
          </GlassCard>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  subtitle: { fontSize: 14, marginBottom: 20 },
  optionCard: { marginBottom: 10 },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  optionIcon: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
  },
  optionInfo: { flex: 1 },
  optionLabel: { fontSize: 15, fontWeight: '600' },
  optionDesc: { fontSize: 13, marginTop: 2 },
});
