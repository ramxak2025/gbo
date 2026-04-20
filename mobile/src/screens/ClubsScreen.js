import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import GlassCard from '../components/GlassCard';
import PageHeader from '../components/PageHeader';

export default function ClubsScreen() {
  const { auth } = useAuth();
  const { data } = useData();
  const { t, dark } = useTheme();
  const navigation = useNavigation();

  const clubs = data.clubs || [];
  const trainers = useMemo(() => data.users.filter(u => u.role === 'trainer'), [data.users]);

  if (auth?.role !== 'superadmin') {
    return (
      <View style={[styles.container, { backgroundColor: t.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: t.textMuted }}>Доступ только для администратора</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: t.bg }]} contentContainerStyle={styles.content}>
      <PageHeader title="Клубы" />

      {clubs.length === 0 ? (
        <View style={{ alignItems: 'center', marginTop: 40 }}>
          <Ionicons name="shield-outline" size={48} color={t.textMuted} />
          <Text style={{ color: t.textMuted, marginTop: 12 }}>Клубов пока нет</Text>
        </View>
      ) : (
        clubs.map(c => {
          const clubTrainers = trainers.filter(tr => tr.clubId === c.id);
          const head = clubTrainers.find(tr => tr.isHeadTrainer);
          return (
            <GlassCard key={c.id} style={{ marginBottom: 10 }}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.text, fontWeight: '700', fontSize: 16 }}>{c.name}</Text>
                  {c.city && (
                    <Text style={{ color: t.textMuted, fontSize: 11, marginTop: 2 }}>
                      <Ionicons name="location" size={11} /> {c.city}
                    </Text>
                  )}
                  <View style={styles.metaRow}>
                    <Text style={[styles.meta, { color: t.textMuted }]}>
                      <Ionicons name="people" size={11} /> {clubTrainers.length} тренеров
                    </Text>
                    {head && (
                      <Text style={[styles.meta, { color: '#eab308' }]}>
                        <Ionicons name="ribbon" size={11} /> {head.name}
                      </Text>
                    )}
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
  metaRow: { flexDirection: 'row', gap: 12, marginTop: 6 },
  meta: { fontSize: 11 },
});
