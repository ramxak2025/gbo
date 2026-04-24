import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Award, Shield, MapPin, Users, Zap, Layers, Phone } from 'lucide-react-native';
import { useRoute } from '@react-navigation/native';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { LiquidGlassCard, HapticPressable, AmbientBackground, GlowButton } from '../design';
import { colors, radius, typography } from '../design/tokens';
import PageHeader from '../components/PageHeader';
import Avatar from '../components/Avatar';

export default function TrainerDetailScreen() {
  const route = useRoute();
  const id = route.params?.id;
  const { data } = useData();
  const { t, dark } = useTheme();

  const theme = dark ? colors.dark : colors.light;

  const trainer = data.users.find(u => u.id === id);
  const students = useMemo(() => data.students.filter(s => s.trainerId === id), [data.students, id]);
  const groups = useMemo(() => data.groups.filter(g => g.trainerId === id), [data.groups, id]);
  const club = trainer?.clubId ? (data.clubs || []).find(c => c.id === trainer.clubId) : null;

  if (!trainer) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <AmbientBackground />
        <Text style={{ color: theme.textTertiary }}>Тренер не найден</Text>
      </View>
    );
  }

  const stats = {
    total: students.length,
    active: students.filter(s => !s.subscriptionExpiresAt || new Date(s.subscriptionExpiresAt) >= new Date()).length,
    groups: groups.length,
  };

  const statItems = [
    { label: 'Спортсменов', value: stats.total, icon: Users, color: '#6366f1' },
    { label: 'Активных', value: stats.active, icon: Zap, color: '#10b981' },
    { label: 'Групп', value: stats.groups, icon: Layers, color: '#f59e0b' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} contentContainerStyle={styles.content}>
      <AmbientBackground />
      <PageHeader title="Тренер" back />

      <Animated.View entering={FadeInDown.delay(0).springify()}>
        <LiquidGlassCard dark={dark} radius={20} padding={16} style={styles.hero}>
          <View style={{ alignItems: 'center' }}>
            <Avatar name={trainer.name} src={trainer.avatar} size={80} />
            {trainer.isHeadTrainer && (
              <View style={styles.crown}>
                <Award size={16} color="#fff" />
              </View>
            )}
            <Text style={[styles.name, { color: theme.text }]}>{trainer.name}</Text>
            <View style={styles.badgeRow}>
              <Text style={[styles.badge, { backgroundColor: 'rgba(99,102,241,0.2)', color: '#6366f1' }]}>Тренер</Text>
              {trainer.isHeadTrainer && (
                <Text style={[styles.badge, { backgroundColor: 'rgba(250,204,21,0.15)', color: '#eab308' }]}>Главный</Text>
              )}
            </View>
            {(club?.name || trainer.clubName) && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
                <Shield size={12} color={theme.textSecondary} />
                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{club?.name || trainer.clubName}</Text>
              </View>
            )}
            {trainer.city && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <MapPin size={12} color={theme.textSecondary} />
                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{trainer.city}</Text>
              </View>
            )}
          </View>
        </LiquidGlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.statsRow}>
        {statItems.map((s) => {
          const IconComp = s.icon;
          return (
            <LiquidGlassCard key={s.label} dark={dark} radius={20} padding={16} style={styles.statCard}>
              <IconComp size={20} color={s.color} />
              <Text style={[styles.statValue, { color: theme.text }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{s.label}</Text>
            </LiquidGlassCard>
          );
        })}
      </Animated.View>

      {trainer.phone && (
        <Animated.View entering={FadeInDown.delay(160).springify()}>
          <LiquidGlassCard dark={dark} radius={20} padding={16} style={{ marginTop: 12 }}>
            <View style={styles.contactRow}>
              <Phone size={16} color={colors.semantic.purple} />
              <Text style={{ color: theme.text, marginLeft: 8 }}>{trainer.phone}</Text>
            </View>
          </LiquidGlassCard>
        </Animated.View>
      )}

      {groups.length > 0 && (
        <>
          <Animated.View entering={FadeInDown.delay(240).springify()}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Группы</Text>
          </Animated.View>
          {groups.map((g, index) => (
            <Animated.View key={g.id} entering={FadeInDown.delay(320 + index * 60).springify()}>
              <LiquidGlassCard dark={dark} radius={20} padding={16} style={{ marginBottom: 8 }}>
                <Text style={{ color: theme.text, fontWeight: '700' }}>{g.name}</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2 }}>{g.schedule}</Text>
              </LiquidGlassCard>
            </Animated.View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 140 },
  hero: { padding: 20 },
  name: { ...typography.title2, marginTop: 12, textAlign: 'center' },
  crown: { position: 'absolute', top: -4, right: '42%', width: 28, height: 28, borderRadius: 14, backgroundColor: '#eab308', alignItems: 'center', justifyContent: 'center' },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.xs, fontSize: 10, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  statCard: { flex: 1, padding: 12, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '900', marginTop: 4 },
  statLabel: { ...typography.micro, marginTop: 2 },
  contactRow: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { ...typography.callout, marginTop: 16, marginBottom: 8 },
});
