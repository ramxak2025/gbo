import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import GlassCard from '../components/GlassCard';
import PageHeader from '../components/PageHeader';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function InternalTournamentsScreen() {
  const { auth } = useAuth();
  const { data } = useData();
  const { t } = useTheme();

  const myTournaments = (data.internalTournaments || [])
    .filter(x => x.trainerId === auth?.userId || auth?.role === 'superadmin')
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  return (
    <ScrollView style={[styles.container, { backgroundColor: t.bg }]} contentContainerStyle={styles.content}>
      <PageHeader title="Внутренние турниры" back />

      {myTournaments.length === 0 ? (
        <View style={{ alignItems: 'center', marginTop: 40 }}>
          <Ionicons name="trophy-outline" size={48} color={t.textMuted} />
          <Text style={{ color: t.textMuted, marginTop: 12, textAlign: 'center', paddingHorizontal: 40 }}>
            Внутренние турниры создаются на веб-версии. Здесь вы увидите их в режиме чтения.
          </Text>
        </View>
      ) : (
        myTournaments.map(tour => {
          const brackets = tour.brackets || {};
          const cats = brackets.categories || [];
          const finishedCats = cats.filter(c => {
            const last = c.rounds?.[c.rounds.length - 1];
            return last?.[0]?.winner;
          });
          return (
            <GlassCard key={tour.id} style={{ marginBottom: 10 }}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.text, fontWeight: '700', fontSize: 15 }}>{tour.title}</Text>
                  <Text style={{ color: t.textMuted, fontSize: 11, marginTop: 4 }}>{formatDate(tour.date)}</Text>
                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Ionicons name="grid" size={11} color={t.textMuted} />
                      <Text style={[styles.meta, { color: t.textMuted }]}>
                        {cats.length} категорий
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="trophy" size={11} color="#eab308" />
                      <Text style={[styles.meta, { color: '#eab308' }]}>
                        {finishedCats.length} завершено
                      </Text>
                    </View>
                    <Text style={[
                      styles.statusBadge,
                      tour.status === 'finished' ? { backgroundColor: 'rgba(16,185,129,0.2)', color: '#10b981' } : { backgroundColor: 'rgba(99,102,241,0.2)', color: '#6366f1' }
                    ]}>
                      {tour.status === 'finished' ? 'Завершён' : 'Активный'}
                    </Text>
                  </View>
                </View>
              </View>
            </GlassCard>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 80 },
  row: { flexDirection: 'row', alignItems: 'center' },
  metaRow: { flexDirection: 'row', gap: 10, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { fontSize: 11 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, fontSize: 10, fontWeight: '700' },
});
