/**
 * TeamScreen — iOS 26 Liquid Glass redesign
 *
 * - AmbientBackground + glass search bar
 * - Segmented control with animated pill
 * - LiquidGlassCard student/trainer cards
 * - Staggered entrance animations
 * - Status badges with lucide icons
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Search, UserPlus, Thermometer, HeartOff, Zap,
  ChevronRight, Users, Building2,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import Avatar from '../components/Avatar';
import { LiquidGlassCard, HapticPressable, AmbientBackground } from '../design';
import { colors, radius, spacing, typography } from '../design/tokens';
import { BELT_COLORS } from '../utils/sports';

const STATUS_CONFIG = {
  sick: { label: 'Болеет', Icon: Thermometer, color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)' },
  injury: { label: 'Травма', Icon: HeartOff, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
  skip: { label: 'Сачок', Icon: Zap, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' },
};

function isExpired(dateStr) {
  if (!dateStr) return true;
  return new Date(dateStr) < new Date();
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status];
  if (!cfg) return null;
  const { Icon } = cfg;
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Icon size={10} color={cfg.color} />
      <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

function StudentCard({ person, dark, theme, onPress, delay = 0 }) {
  const expired = isExpired(person.subscriptionExpiresAt);
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()}>
      <LiquidGlassCard dark={dark} radius={radius.lg} padding={spacing.lg} onPress={onPress}>
        <View style={styles.studentRow}>
          <View style={{
            borderWidth: 2,
            borderColor: expired ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.4)',
            borderRadius: 26,
            padding: 2,
          }}>
            <Avatar name={person.name} src={person.avatar} size={44} />
          </View>
          <View style={{ flex: 1, minWidth: 0, marginLeft: spacing.md }}>
            <View style={styles.nameRow}>
              <Text style={{ ...typography.callout, color: theme.text }} numberOfLines={1}>{person.name}</Text>
              {person.status && <StatusBadge status={person.status} />}
            </View>
            <Text style={{ ...typography.caption, color: theme.textTertiary, marginTop: 2 }}>{person.belt || '—'}</Text>
          </View>
          <View style={styles.indicators}>
            {person.belt && (
              <View style={[styles.beltDot, { backgroundColor: BELT_COLORS[person.belt] || '#888' }]} />
            )}
            <View style={[styles.statusDot, {
              backgroundColor: expired ? '#ef4444' : '#22c55e',
              shadowColor: expired ? '#ef4444' : '#22c55e',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6,
              shadowRadius: 4,
            }]} />
          </View>
        </View>
      </LiquidGlassCard>
    </Animated.View>
  );
}

function TrainerCard({ person, count, dark, theme, delay = 0 }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()}>
      <LiquidGlassCard dark={dark} radius={radius.lg} padding={spacing.lg}>
        <View style={styles.studentRow}>
          <View style={{
            borderWidth: 2,
            borderColor: 'rgba(168, 85, 247, 0.4)',
            borderRadius: 26,
            padding: 2,
          }}>
            <Avatar name={person.name} src={person.avatar} size={44} />
          </View>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={{ ...typography.callout, color: theme.text }}>{person.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
              <Building2 size={12} color={theme.textTertiary} />
              <Text style={{ ...typography.caption, color: theme.textTertiary }}>{person.clubName}</Text>
            </View>
          </View>
          <View style={{
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: radius.pill,
            backgroundColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
          }}>
            <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '700' }}>{count} чел.</Text>
          </View>
        </View>
      </LiquidGlassCard>
    </Animated.View>
  );
}

export default function TeamScreen({ navigation }) {
  const { auth } = useAuth();
  const { data } = useData();
  const { t, dark } = useTheme();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('students');

  const theme = dark ? colors.dark : colors.light;

  const isAdmin = auth.role === 'superadmin';
  const trainers = data.users.filter(u => u.role === 'trainer');
  const students = isAdmin ? data.students : data.students.filter(s => s.trainerId === auth.userId);
  const myGroups = isAdmin ? data.groups : data.groups.filter(g => g.trainerId === auth.userId);

  const filteredStudents = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  const filteredTrainers = trainers.filter(tr => tr.name.toLowerCase().includes(search.toLowerCase()));

  const studentsByGroup = myGroups.map(g => ({
    group: g,
    students: filteredStudents.filter(s => s.groupId === g.id),
  }));
  const ungrouped = filteredStudents.filter(s => !s.groupId || !myGroups.find(g => g.id === s.groupId));

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <AmbientBackground dark={dark} variant="cool" />

      <ScrollView
        contentContainerStyle={{ paddingTop: 60, paddingBottom: 140, paddingHorizontal: spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.duration(400)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl }}>
          <Text style={{ ...typography.hero, color: theme.text }}>
            {isAdmin ? 'Люди' : 'Команда'}
          </Text>
          {auth.role === 'trainer' && (
            <HapticPressable onPress={() => navigation.navigate('AddStudent')} haptic="light">
              <LinearGradient
                colors={colors.gradients.student}
                style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
              >
                <UserPlus size={20} color="#fff" />
              </LinearGradient>
            </HapticPressable>
          )}
        </Animated.View>

        {/* Search */}
        <Animated.View entering={FadeInDown.delay(50).springify()} style={{ marginBottom: spacing.md }}>
          <LiquidGlassCard dark={dark} radius={radius.lg} padding={0} intensity="subtle">
            <View style={styles.searchWrap}>
              <Search size={16} color={theme.textTertiary} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Поиск по имени..."
                placeholderTextColor={theme.textTertiary}
                value={search}
                onChangeText={setSearch}
              />
            </View>
          </LiquidGlassCard>
        </Animated.View>

        {/* Admin tabs — segmented control */}
        {isAdmin && (
          <Animated.View entering={FadeInDown.delay(100).springify()} style={{ marginBottom: spacing.lg }}>
            <LiquidGlassCard dark={dark} radius={radius.lg} padding={spacing.xs} intensity="subtle">
              <View style={styles.tabBar}>
                {[
                  { key: 'students', label: `Спортсмены (${filteredStudents.length})` },
                  { key: 'trainers', label: `Тренеры (${filteredTrainers.length})` },
                ].map(({ key, label }) => (
                  <HapticPressable
                    key={key}
                    onPress={() => setTab(key)}
                    haptic="selection"
                    style={{ flex: 1 }}
                  >
                    {tab === key ? (
                      <LinearGradient
                        colors={dark
                          ? ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.08)']
                          : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']
                        }
                        style={styles.tabActive}
                      >
                        <Text style={{ ...typography.caption, color: theme.text }}>{label}</Text>
                      </LinearGradient>
                    ) : (
                      <View style={styles.tabInactive}>
                        <Text style={{ ...typography.caption, color: theme.textTertiary }}>{label}</Text>
                      </View>
                    )}
                  </HapticPressable>
                ))}
              </View>
            </LiquidGlassCard>
          </Animated.View>
        )}

        {/* Trainers list */}
        {isAdmin && tab === 'trainers' && (
          <View style={{ gap: spacing.sm }}>
            {filteredTrainers.map((person, i) => {
              const count = data.students.filter(s => s.trainerId === person.id).length;
              return (
                <TrainerCard
                  key={person.id}
                  person={person}
                  count={count}
                  dark={dark}
                  theme={theme}
                  delay={150 + i * 60}
                />
              );
            })}
          </View>
        )}

        {/* Students list — grouped (trainer view) */}
        {(!isAdmin || tab === 'students') && !isAdmin && (
          <View style={{ gap: spacing.sm }}>
            {studentsByGroup.map(({ group, students: gs }) => {
              if (gs.length === 0) return null;
              return (
                <View key={group.id} style={{ marginBottom: spacing.md }}>
                  <Animated.View entering={FadeIn.duration(300)} style={styles.groupHeader}>
                    <Text style={{ ...typography.micro, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 1 }}>
                      {group.name}
                    </Text>
                    <Text style={{ ...typography.micro, color: theme.textTertiary }}>{group.schedule}</Text>
                  </Animated.View>
                  <View style={{ gap: spacing.sm }}>
                    {gs.map((person, i) => (
                      <StudentCard
                        key={person.id}
                        person={person}
                        dark={dark}
                        theme={theme}
                        delay={150 + i * 60}
                        onPress={() => navigation.navigate('StudentDetail', { id: person.id })}
                      />
                    ))}
                  </View>
                </View>
              );
            })}
            {ungrouped.length > 0 && (
              <View style={{ marginBottom: spacing.md }}>
                <Animated.View entering={FadeIn.duration(300)} style={styles.groupHeader}>
                  <Text style={{ ...typography.micro, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Без группы
                  </Text>
                </Animated.View>
                <View style={{ gap: spacing.sm }}>
                  {ungrouped.map((person, i) => (
                    <StudentCard
                      key={person.id}
                      person={person}
                      dark={dark}
                      theme={theme}
                      delay={150 + i * 60}
                      onPress={() => navigation.navigate('StudentDetail', { id: person.id })}
                    />
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Admin flat students */}
        {isAdmin && tab === 'students' && (
          <View style={{ gap: spacing.sm }}>
            {filteredStudents.map((person, i) => (
              <StudentCard
                key={person.id}
                person={person}
                dark={dark}
                theme={theme}
                delay={150 + i * 50}
                onPress={() => navigation.navigate('StudentDetail', { id: person.id })}
              />
            ))}
          </View>
        )}

        {filteredStudents.length === 0 && (!isAdmin || tab === 'students') && (
          <Animated.View entering={FadeIn.delay(200)}>
            <Text style={{ textAlign: 'center', paddingVertical: 40, ...typography.body, color: theme.textTertiary }}>
              {search ? 'Никого не найдено' : 'Список пуст'}
            </Text>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '500', padding: 0 },
  tabBar: { flexDirection: 'row', gap: 4 },
  tabActive: {
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabInactive: {
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  studentRow: { flexDirection: 'row', alignItems: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  indicators: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  beltDot: { width: 16, height: 8, borderRadius: 4 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
});
