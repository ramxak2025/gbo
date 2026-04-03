import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import PageHeader from '../components/PageHeader';
import GlassCard from '../components/GlassCard';
import Avatar from '../components/Avatar';
import { TrashIcon, UsersIcon, MapPinIcon } from '../icons';

export default function ClubDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { colors } = useTheme();
  const { clubs, users, branches, deleteClub } = useData();

  const club = clubs.find(c => c.id === id);
  if (!club) return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <PageHeader title="Клуб" back />
      <Text style={[styles.empty, { color: colors.textSecondary }]}>Клуб не найден</Text>
    </View>
  );

  const trainers = users.filter(u => u.clubId === id && u.role === 'trainer');
  const clubBranches = branches.filter(b => b.clubId === id);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <PageHeader title="Клуб" back />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text }]}>{club.name}</Text>
        {club.description && (
          <Text style={[styles.desc, { color: colors.textSecondary, marginTop: 4 }]}>{club.description}</Text>
        )}
        {club.address && (
          <View style={[styles.row, { marginTop: 8 }]}>
            <MapPinIcon size={16} color={colors.textSecondary} />
            <Text style={[styles.meta, { color: colors.textSecondary }]}>{club.address}</Text>
          </View>
        )}

        <View style={styles.statsRow}>
          <GlassCard style={styles.stat}>
            <Text style={[styles.statNum, { color: colors.text }]}>{trainers.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Тренеров</Text>
          </GlassCard>
          <GlassCard style={styles.stat}>
            <Text style={[styles.statNum, { color: colors.text }]}>{clubBranches.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Филиалов</Text>
          </GlassCard>
        </View>

        {trainers.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Тренеры</Text>
            {trainers.map(t => (
              <GlassCard key={t.id}>
                <View style={styles.row}>
                  <Avatar name={t.name} photo={t.photo} size={40} />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={[styles.name, { color: colors.text }]}>{t.name}</Text>
                    {t.sportType && <Text style={[styles.sub, { color: colors.textSecondary }]}>{t.sportType}</Text>}
                  </View>
                  {t.isHeadTrainer && (
                    <View style={[styles.badge, { backgroundColor: colors.accentLight, marginLeft: 'auto' }]}>
                      <Text style={{ color: colors.accent, fontSize: 11, fontWeight: '600' }}>Главный</Text>
                    </View>
                  )}
                </View>
              </GlassCard>
            ))}
          </>
        )}

        {clubBranches.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Филиалы</Text>
            {clubBranches.map(b => (
              <GlassCard key={b.id}>
                <Text style={[styles.name, { color: colors.text }]}>{b.name}</Text>
                {b.address && <Text style={[styles.sub, { color: colors.textSecondary }]}>{b.address}</Text>}
              </GlassCard>
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },
  title: { fontSize: 24, fontWeight: '800' },
  desc: { fontSize: 14, lineHeight: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  meta: { fontSize: 14 },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 12, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', textTransform: 'uppercase', fontStyle: 'italic', marginTop: 20, marginBottom: 10 },
  name: { fontSize: 15, fontWeight: '600' },
  sub: { fontSize: 13, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 14 },
});
