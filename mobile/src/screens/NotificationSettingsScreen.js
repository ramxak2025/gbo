import React, { useState } from 'react';
import { View, Text, ScrollView, Switch, StyleSheet } from 'react-native';
import { LiquidGlassCard, HapticPressable, AmbientBackground } from '../design';
import { colors, radius, spacing, typography } from '../design/tokens';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import {
  Bell,
  BellOff,
  Newspaper,
  Trophy,
  Wallet,
  CalendarDays,
  ChevronLeft,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

const NOTIFICATION_CATEGORIES = [
  {
    key: 'news',
    label: 'Новости',
    description: 'Новости клуба и обновления',
    icon: Newspaper,
    gradient: ['#3b82f6', '#6366f1'],
  },
  {
    key: 'tournaments',
    label: 'Турниры',
    description: 'Предстоящие турниры и результаты',
    icon: Trophy,
    gradient: ['#f97316', '#ef4444'],
  },
  {
    key: 'payments',
    label: 'Оплаты',
    description: 'Напоминания об оплате абонемента',
    icon: Wallet,
    gradient: ['#22c55e', '#10b981'],
  },
  {
    key: 'schedule',
    label: 'Расписание',
    description: 'Изменения в расписании тренировок',
    icon: CalendarDays,
    gradient: ['#a855f7', '#6366f1'],
  },
];

export default function NotificationSettingsScreen({ navigation }) {
  const { dark } = useTheme();
  const theme = dark ? colors.dark : colors.light;

  const [pushEnabled, setPushEnabled] = useState(true);
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
    <View style={[styles.root, { backgroundColor: dark ? colors.dark.bg : colors.light.bg }]}>
      <AmbientBackground dark={dark} variant="default" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with back */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <HapticPressable onPress={() => navigation.goBack()} haptic="light" style={styles.backBtn}>
            <ChevronLeft size={24} color={theme.text} />
          </HapticPressable>
          <Text style={[typography.title2, { color: theme.text, flex: 1 }]}>Уведомления</Text>
        </Animated.View>

        {/* Main push toggle */}
        <Animated.View entering={FadeInDown.delay(50).springify()}>
          <LiquidGlassCard
            dark={dark}
            intensity="regular"
            radius={radius.xl}
            padding={spacing.lg}
            style={styles.mainToggleCard}
          >
            <View style={styles.mainToggleRow}>
              <LinearGradient
                colors={pushEnabled ? colors.gradients.brand : ['#6b7280', '#4b5563']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.mainIcon}
              >
                {pushEnabled ? (
                  <Bell size={22} color="#fff" strokeWidth={2.5} />
                ) : (
                  <BellOff size={22} color="#fff" strokeWidth={2.5} />
                )}
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={[typography.bodyBold, { color: theme.text }]}>Push-уведомления</Text>
                <Text style={[typography.caption, { color: theme.textSecondary, marginTop: 2 }]}>
                  {pushEnabled ? 'Включены' : 'Отключены'}
                </Text>
              </View>
              <Switch
                value={pushEnabled}
                onValueChange={setPushEnabled}
                trackColor={{
                  false: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  true: colors.accent[500],
                }}
                thumbColor="#fff"
              />
            </View>
          </LiquidGlassCard>
        </Animated.View>

        {/* Categories section */}
        <Text style={[styles.sectionLabel, { color: theme.textTertiary }]}>
          КАТЕГОРИИ УВЕДОМЛЕНИЙ
        </Text>

        {NOTIFICATION_CATEGORIES.map((cat, index) => {
          const CatIcon = cat.icon;
          const isEnabled = pushEnabled && settings[cat.key];
          return (
            <Animated.View
              key={cat.key}
              entering={FadeInDown.delay(120 + index * 70).springify()}
            >
              <LiquidGlassCard
                dark={dark}
                intensity="subtle"
                radius={radius.lg}
                padding={spacing.lg}
                style={[styles.categoryCard, !pushEnabled && { opacity: 0.5 }]}
              >
                <View style={styles.categoryRow}>
                  <LinearGradient
                    colors={cat.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.categoryIcon}
                  >
                    <CatIcon size={16} color="#fff" strokeWidth={2.5} />
                  </LinearGradient>
                  <View style={styles.categoryText}>
                    <Text style={[typography.callout, { color: theme.text }]}>
                      {cat.label}
                    </Text>
                    <Text style={[{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }]}>
                      {cat.description}
                    </Text>
                  </View>
                  <Switch
                    value={isEnabled}
                    onValueChange={() => toggleSetting(cat.key)}
                    disabled={!pushEnabled}
                    trackColor={{
                      false: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                      true: cat.gradient[0],
                    }}
                    thumbColor="#fff"
                  />
                </View>
              </LiquidGlassCard>
            </Animated.View>
          );
        })}

        {/* Footer note */}
        <Animated.View entering={FadeInDown.delay(450).springify()}>
          <Text style={[styles.note, { color: theme.textTertiary }]}>
            Push-уведомления будут отправляться на ваше устройство в соответствии с выбранными настройками.
          </Text>
        </Animated.View>

        <View style={{ height: 140 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1 },
  content: { paddingHorizontal: spacing.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  backBtn: { padding: spacing.xs },
  mainToggleCard: { marginBottom: spacing.xl },
  mainToggleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  mainIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    ...typography.micro,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  categoryCard: { marginBottom: spacing.sm },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryText: { flex: 1 },
  note: {
    fontSize: 13,
    marginTop: spacing.xl,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: spacing.lg,
  },
});
