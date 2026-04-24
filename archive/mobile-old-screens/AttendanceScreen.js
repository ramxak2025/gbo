import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { LiquidGlassCard, HapticPressable, AmbientBackground, GlowButton } from '../design';
import { colors, radius, spacing, typography } from '../design/tokens';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { ChevronLeft, ChevronRight, Check, X, HelpCircle, Users, UserCheck } from 'lucide-react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../utils/api';
import Avatar from '../components/Avatar';

function toDateKey(d) {
  return d.toISOString().split('T')[0];
}

export default function AttendanceScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const groupId = route.params?.groupId;
  const { data, reload } = useData();
  const { t, dark } = useTheme();
  const theme = dark ? colors.dark : colors.light;

  const [date, setDate] = useState(toDateKey(new Date()));
  const [saving, setSaving] = useState(false);

  const group = useMemo(() => data.groups.find(g => g.id === groupId), [data.groups, groupId]);
  const students = useMemo(
    () => data.students.filter(s => s.groupId === groupId).sort((a, b) => a.name.localeCompare(b.name, 'ru')),
    [data.students, groupId]
  );
  const dayRecords = useMemo(
    () => data.attendance.filter(a => a.groupId === groupId && a.date === date),
    [data.attendance, groupId, date]
  );

  const isPresent = (studentId) => {
    const rec = dayRecords.find(r => r.studentId === studentId);
    return rec ? rec.present : false;
  };
  const isMarked = (studentId) => dayRecords.some(r => r.studentId === studentId);

  const toggle = async (studentId) => {
    if (saving) return;
    setSaving(true);
    try {
      const currentMarked = isMarked(studentId);
      const currentPresent = isPresent(studentId);
      if (currentMarked && currentPresent === false) {
        // cycle: absent -> remove
        await api.deleteAttendance({ groupId, studentId, date });
      } else {
        await api.saveAttendance({ groupId, studentId, date, present: !currentPresent });
      }
      await reload();
    } finally { setSaving(false); }
  };

  const markAllPresent = async () => {
    setSaving(true);
    try {
      await api.saveAttendanceBulk({
        groupId, date,
        records: students.map(s => ({ studentId: s.id, present: true })),
      });
      await reload();
    } finally { setSaving(false); }
  };

  if (!group) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <AmbientBackground dark={dark} />
        <Text style={[typography.body, { color: theme.textTertiary }]}>Группа не найдена</Text>
      </View>
    );
  }

  const shiftDay = (delta) => {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    setDate(toDateKey(d));
  };

  const presentCount = dayRecords.filter(r => r.present).length;

  const getStatusStyle = (studentId) => {
    const marked = isMarked(studentId);
    const present = isPresent(studentId);
    if (!marked) return { bg: 'rgba(107, 114, 128, 0.3)', icon: HelpCircle, iconColor: '#9ca3af' };
    if (present) return { bg: colors.semantic.successBg, icon: Check, iconColor: colors.semantic.success };
    return { bg: colors.semantic.dangerBg, icon: X, iconColor: colors.semantic.danger };
  };

  const getStatusPillStyle = (studentId) => {
    const marked = isMarked(studentId);
    const present = isPresent(studentId);
    if (!marked) return { bg: 'rgba(107, 114, 128, 0.2)', text: '#9ca3af', label: 'Не отмечен' };
    if (present) return { bg: colors.semantic.successBg, text: colors.semantic.success, label: 'Присутствует' };
    return { bg: colors.semantic.dangerBg, text: colors.semantic.danger, label: 'Отсутствует' };
  };

  return (
    <View style={[styles.root, { backgroundColor: dark ? colors.dark.bg : colors.light.bg }]}>
      <AmbientBackground dark={dark} variant="cool" />

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
          <Text style={[typography.title2, { color: theme.text, flex: 1 }]}>Посещаемость</Text>
        </Animated.View>

        {/* Group info card with date navigation */}
        <Animated.View entering={FadeInDown.delay(50).springify()}>
          <LiquidGlassCard
            dark={dark}
            intensity="regular"
            radius={radius.xl}
            padding={spacing.lg}
            style={styles.groupCard}
          >
            <View style={styles.groupHeader}>
              <LinearGradient
                colors={colors.gradients.student}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.groupIcon}
              >
                <Users size={18} color="#fff" strokeWidth={2.5} />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={[typography.bodyBold, { color: theme.text }]}>{group.name}</Text>
                <Text style={[typography.caption, { color: theme.textSecondary }]}>{group.schedule}</Text>
              </View>
            </View>

            {/* Date navigation with chevrons */}
            <View style={styles.dateRow}>
              <HapticPressable onPress={() => shiftDay(-1)} haptic="light" style={styles.dayBtn}>
                <ChevronLeft size={22} color={theme.text} />
              </HapticPressable>
              <Text style={[typography.callout, { color: theme.text, flex: 1, textAlign: 'center' }]}>
                {new Date(date).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
              </Text>
              <HapticPressable onPress={() => shiftDay(1)} haptic="light" style={styles.dayBtn}>
                <ChevronRight size={22} color={theme.text} />
              </HapticPressable>
            </View>

            {/* Summary row */}
            <View style={styles.summaryRow}>
              <View style={styles.summaryLeft}>
                <Text style={[typography.caption, { color: theme.textSecondary }]}>
                  Присутствуют:{' '}
                </Text>
                <Text style={[typography.callout, { color: colors.semantic.success }]}>
                  {presentCount}
                </Text>
                <Text style={[typography.caption, { color: theme.textSecondary }]}>
                  {' '}/ {students.length}
                </Text>
              </View>
              <HapticPressable
                onPress={markAllPresent}
                disabled={saving}
                haptic="success"
                style={[styles.markAllBtn, { borderColor: colors.semantic.success }]}
              >
                <UserCheck size={14} color={colors.semantic.success} />
                <Text style={[typography.caption, { color: colors.semantic.success }]}>Все пришли</Text>
              </HapticPressable>
            </View>
          </LiquidGlassCard>
        </Animated.View>

        {/* Student list */}
        {students.length === 0 ? (
          <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.emptyWrap}>
            <Text style={[typography.body, { color: theme.textTertiary }]}>
              В группе пока нет спортсменов
            </Text>
          </Animated.View>
        ) : (
          students.map((s, index) => {
            const status = getStatusStyle(s.id);
            const pill = getStatusPillStyle(s.id);
            const StatusIcon = status.icon;
            return (
              <Animated.View
                key={s.id}
                entering={FadeInDown.delay(120 + index * 50).springify()}
              >
                <HapticPressable
                  onPress={() => toggle(s.id)}
                  disabled={saving}
                  haptic="medium"
                >
                  <LiquidGlassCard
                    dark={dark}
                    intensity="subtle"
                    radius={radius.lg}
                    padding={spacing.md}
                    style={styles.studentCard}
                  >
                    <View style={styles.studentRow}>
                      <Avatar name={s.name} src={s.avatar} size={42} />
                      <View style={{ flex: 1, marginLeft: spacing.md }}>
                        <Text style={[typography.callout, { color: theme.text }]}>{s.name}</Text>
                        {s.belt && (
                          <Text style={[typography.micro, { color: theme.textTertiary, marginTop: 2, textTransform: 'uppercase' }]}>
                            {s.belt}
                          </Text>
                        )}
                      </View>
                      {/* Status pill */}
                      <View style={[styles.statusPill, { backgroundColor: pill.bg }]}>
                        <StatusIcon size={14} color={pill.text} strokeWidth={2.5} />
                      </View>
                    </View>
                  </LiquidGlassCard>
                </HapticPressable>
              </Animated.View>
            );
          })
        )}

        {/* Save indicator */}
        {saving && (
          <View style={styles.savingOverlay}>
            <ActivityIndicator size="small" color={colors.accent[500]} />
          </View>
        )}

        <View style={{ height: 140 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.dark.bg },
  container: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: 140 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  backBtn: { padding: spacing.xs },
  groupCard: { marginBottom: spacing.lg },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  groupIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  dayBtn: { padding: spacing.sm },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  summaryLeft: { flexDirection: 'row', alignItems: 'center' },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  studentCard: { marginBottom: spacing.sm },
  studentRow: { flexDirection: 'row', alignItems: 'center' },
  statusPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: { alignItems: 'center', paddingVertical: spacing.huge },
  savingOverlay: { position: 'absolute', top: spacing.xl, right: spacing.xl },
});
