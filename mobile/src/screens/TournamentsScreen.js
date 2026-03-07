import React from 'react';
import { View, Text, ScrollView, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import GlassCard from '../components/GlassCard';
import PageHeader from '../components/PageHeader';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function TournamentsScreen() {
  const { data } = useData();
  const { t } = useTheme();

  const upcoming = data.tournaments
    .filter(tour => new Date(tour.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const past = data.tournaments
    .filter(tour => new Date(tour.date) < new Date())
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const internal = data.internalTournaments || [];

  return (
    <ScrollView style={[styles.container, { backgroundColor: t.bg }]} contentContainerStyle={styles.content}>
      <PageHeader title="Турниры" />

      {upcoming.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: t.textSecondary }]}>ПРЕДСТОЯЩИЕ</Text>
          {upcoming.map(tour => (
            <GlassCard key={tour.id}>
              {tour.coverImage && (
                <Image source={{ uri: tour.coverImage }} style={styles.cover} />
              )}
              <Text style={[styles.tourTitle, { color: t.text }]}>{tour.title}</Text>
              <View style={styles.meta}>
                <Ionicons name="calendar-outline" size={14} color={t.textMuted} />
                <Text style={[styles.metaText, { color: t.textMuted }]}>{formatDate(tour.date)}</Text>
              </View>
              {tour.location && (
                <View style={styles.meta}>
                  <Ionicons name="location-outline" size={14} color={t.textMuted} />
                  <Text style={[styles.metaText, { color: t.textMuted }]}>{tour.location}</Text>
                </View>
              )}
              {tour.description && (
                <Text style={[styles.desc, { color: t.textSecondary }]} numberOfLines={3}>{tour.description}</Text>
              )}
              {/* Registration count */}
              {(() => {
                const regs = data.tournamentRegistrations.filter(r => r.tournamentId === tour.id);
                if (regs.length === 0) return null;
                return (
                  <View style={[styles.regBadge, { backgroundColor: t.accent + '20' }]}>
                    <Ionicons name="people" size={12} color={t.accent} />
                    <Text style={[styles.regText, { color: t.accent }]}>{regs.length} участн.</Text>
                  </View>
                );
              })()}
            </GlassCard>
          ))}
        </View>
      )}

      {/* Internal tournaments */}
      {internal.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: t.textSecondary }]}>ВНУТРЕННИЕ</Text>
          {internal.map(tour => (
            <GlassCard key={tour.id}>
              <Text style={[styles.tourTitle, { color: t.text }]}>{tour.title}</Text>
              <View style={styles.meta}>
                <Ionicons name="calendar-outline" size={14} color={t.textMuted} />
                <Text style={[styles.metaText, { color: t.textMuted }]}>{formatDate(tour.date)}</Text>
              </View>
            </GlassCard>
          ))}
        </View>
      )}

      {past.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: t.textSecondary }]}>ПРОШЕДШИЕ</Text>
          {past.map(tour => (
            <GlassCard key={tour.id} style={{ opacity: 0.6 }}>
              <Text style={[styles.tourTitle, { color: t.text }]}>{tour.title}</Text>
              <View style={styles.meta}>
                <Ionicons name="calendar-outline" size={14} color={t.textMuted} />
                <Text style={[styles.metaText, { color: t.textMuted }]}>{formatDate(tour.date)}</Text>
              </View>
            </GlassCard>
          ))}
        </View>
      )}

      {data.tournaments.length === 0 && internal.length === 0 && (
        <Text style={[styles.empty, { color: t.textMuted }]}>Нет турниров</Text>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  cover: { width: '100%', height: 140, borderRadius: 12, marginBottom: 10, resizeMode: 'cover' },
  tourTitle: { fontSize: 16, fontWeight: '700' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  metaText: { fontSize: 13 },
  desc: { fontSize: 13, marginTop: 6 },
  regBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginTop: 8 },
  regText: { fontSize: 12, fontWeight: '600' },
  empty: { textAlign: 'center', paddingVertical: 40, fontSize: 14 },
});
