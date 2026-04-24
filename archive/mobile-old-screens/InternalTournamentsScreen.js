import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, LayoutGrid } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { LiquidGlassCard, HapticPressable, AmbientBackground, GlowButton } from '../design';
import { colors, radius, typography } from '../design/tokens';
import PageHeader from '../components/PageHeader';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function InternalTournamentsScreen() {
  const { auth } = useAuth();
  const { data } = useData();
  const { t, dark } = useTheme();

  const theme = dark ? colors.dark : colors.light;

  const myTournaments = (data.internalTournaments || [])
    .filter(x => x.trainerId === auth?.userId || auth?.role === 'superadmin')
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} contentContainerStyle={styles.content}>
      <AmbientBackground />
      <PageHeader title="Внутренние турниры" back />

      {myTournaments.length === 0 ? (
        <Animated.View entering={FadeInDown.delay(100).springify()} style={{ alignItems: 'center', marginTop: 40 }}>
          <Trophy size={48} color={theme.textTertiary} />
          <Text style={{ color: theme.textTertiary, marginTop: 12, textAlign: 'center', paddingHorizontal: 40 }}>
            Внутренние турниры создаются на веб-версии. Здесь вы увидите их в режиме чтения.
          </Text>
        </Animated.View>
      ) : (
        myTournaments.map((tour, index) => {
          const brackets = tour.brackets || {};
          const cats = brackets.categories || [];
          const finishedCats = cats.filter(c => {
            const last = c.rounds?.[c.rounds.length - 1];
            return last?.[0]?.winner;
          });
          return (
            <Animated.View key={tour.id} entering={FadeInDown.delay(index * 80).springify()}>
              <LiquidGlassCard dark={dark} radius={20} padding={16} style={{ marginBottom: 10 }}>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.text, fontWeight: '700', fontSize: 15 }}>{tour.title}</Text>
                    <Text style={{ color: theme.textTertiary, fontSize: 11, marginTop: 4 }}>{formatDate(tour.date)}</Text>
                    <View style={styles.metaRow}>
                      <View style={styles.metaItem}>
                        <LayoutGrid size={11} color={theme.textTertiary} />
                        <Text style={[styles.meta, { color: theme.textTertiary }]}>
                          {cats.length} категорий
                        </Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Trophy size={11} color="#eab308" />
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
              </LiquidGlassCard>
            </Animated.View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 140 },
  row: { flexDirection: 'row', alignItems: 'center' },
  metaRow: { flexDirection: 'row', gap: 10, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { fontSize: 11 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, fontSize: 10, fontWeight: '700' },
});
