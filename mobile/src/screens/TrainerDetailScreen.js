import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import GlassCard from '../components/GlassCard';
import PageHeader from '../components/PageHeader';
import Avatar from '../components/Avatar';

export default function TrainerDetailScreen() {
  const route = useRoute();
  const id = route.params?.id;
  const { data } = useData();
  const { t, dark } = useTheme();

  const trainer = data.users.find(u => u.id === id);
  const students = useMemo(() => data.students.filter(s => s.trainerId === id), [data.students, id]);
  const groups = useMemo(() => data.groups.filter(g => g.trainerId === id), [data.groups, id]);
  const club = trainer?.clubId ? (data.clubs || []).find(c => c.id === trainer.clubId) : null;

  if (!trainer) {
    return (
      <View style={[styles.container, { backgroundColor: t.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: t.textMuted }}>Тренер не найден</Text>
      </View>
    );
  }

  const stats = {
    total: students.length,
    active: students.filter(s => !s.subscriptionExpiresAt || new Date(s.subscriptionExpiresAt) >= new Date()).length,
    groups: groups.length,
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: t.bg }]} contentContainerStyle={styles.content}>
      <PageHeader title="Тренер" back />

      <GlassCard style={styles.hero}>
        <View style={{ alignItems: 'center' }}>
          <Avatar name={trainer.name} src={trainer.avatar} size={80} />
          {trainer.isHeadTrainer && (
            <View style={styles.crown}>
              <Ionicons name="ribbon" size={16} color="#fff" />
            </View>
          )}
          <Text style={[styles.name, { color: t.text }]}>{trainer.name}</Text>
          <View style={styles.badgeRow}>
            <Text style={[styles.badge, { backgroundColor: 'rgba(99,102,241,0.2)', color: '#6366f1' }]}>Тренер</Text>
            {trainer.isHeadTrainer && (
              <Text style={[styles.badge, { backgroundColor: 'rgba(250,204,21,0.15)', color: '#eab308' }]}>Главный</Text>
            )}
          </View>
          {(club?.name || trainer.clubName) && (
            <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 6 }}>
              <Ionicons name="shield" size={12} /> {club?.name || trainer.clubName}
            </Text>
          )}
          {trainer.city && (
            <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 2 }}>
              <Ionicons name="location" size={12} /> {trainer.city}
            </Text>
          )}
        </View>
      </GlassCard>

      <View style={styles.statsRow}>
        {[
          { label: 'Спортсменов', value: stats.total, icon: 'people', color: '#6366f1' },
          { label: 'Активных', value: stats.active, icon: 'flash', color: '#10b981' },
          { label: 'Групп', value: stats.groups, icon: 'layers', color: '#f59e0b' },
        ].map((s) => (
          <GlassCard key={s.label} style={styles.statCard}>
            <Ionicons name={s.icon} size={20} color={s.color} />
            <Text style={[styles.statValue, { color: t.text }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: t.textMuted }]}>{s.label}</Text>
          </GlassCard>
        ))}
      </View>

      {trainer.phone && (
        <GlassCard style={{ marginTop: 12 }}>
          <View style={styles.contactRow}>
            <Ionicons name="call" size={16} color={t.accent} />
            <Text style={{ color: t.text, marginLeft: 8 }}>{trainer.phone}</Text>
          </View>
        </GlassCard>
      )}

      {groups.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: t.text }]}>Группы</Text>
          {groups.map(g => (
            <GlassCard key={g.id} style={{ marginBottom: 8 }}>
              <Text style={{ color: t.text, fontWeight: '700' }}>{g.name}</Text>
              <Text style={{ color: t.textMuted, fontSize: 11, marginTop: 2 }}>{g.schedule}</Text>
            </GlassCard>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 80 },
  hero: { padding: 20 },
  name: { fontSize: 20, fontWeight: '900', marginTop: 12, textAlign: 'center' },
  crown: { position: 'absolute', top: -4, right: '42%', width: 28, height: 28, borderRadius: 14, backgroundColor: '#eab308', alignItems: 'center', justifyContent: 'center' },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, fontSize: 10, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  statCard: { flex: 1, padding: 12, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '900', marginTop: 4 },
  statLabel: { fontSize: 10, marginTop: 2 },
  contactRow: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginTop: 16, marginBottom: 8 },
});
