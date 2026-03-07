import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../utils/theme';
import GlassCard from '../components/GlassCard';
import PageHeader from '../components/PageHeader';

const NOTIFICATION_CATEGORIES = [
  { key: 'news', label: 'Новости', description: 'Новости клуба и обновления' },
  { key: 'tournaments', label: 'Турниры', description: 'Предстоящие турниры и результаты' },
  { key: 'payments', label: 'Оплаты', description: 'Напоминания об оплате абонемента' },
  { key: 'schedule', label: 'Расписание', description: 'Изменения в расписании тренировок' },
];

export default function NotificationSettingsScreen({ navigation }) {
  const { dark } = useTheme();
  const c = getColors(dark);

  const [settings, setSettings] = useState({
    news: true,
    tournaments: true,
    payments: true,
    schedule: true,
  });

  const toggleSetting = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <PageHeader title="Уведомления" back onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>
          Категории уведомлений
        </Text>

        {NOTIFICATION_CATEGORIES.map((cat) => (
          <GlassCard key={cat.key} style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: c.text }]}>
                  {cat.label}
                </Text>
                <Text style={[styles.settingDesc, { color: c.textSecondary }]}>
                  {cat.description}
                </Text>
              </View>
              <Switch
                value={settings[cat.key]}
                onValueChange={() => toggleSetting(cat.key)}
                trackColor={{ false: c.inputBg, true: c.purpleBg }}
                thumbColor={settings[cat.key] ? c.purple : c.textTertiary}
              />
            </View>
          </GlassCard>
        ))}

        <Text style={[styles.note, { color: c.textTertiary }]}>
          Push-уведомления будут отправляться на ваше устройство в соответствии с выбранными настройками.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  settingCard: {
    marginBottom: 10,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingText: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  note: {
    fontSize: 13,
    marginTop: 16,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
});
