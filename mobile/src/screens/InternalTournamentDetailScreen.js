import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import PageHeader from '../components/PageHeader';
import GlassCard from '../components/GlassCard';
import BracketView from '../components/BracketView';
import { TrashIcon } from '../icons';
import { generateBracket, setMatchWinner } from '../utils/sports';

export default function InternalTournamentDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { colors } = useTheme();
  const { auth } = useAuth();
  const { internalTournaments, students, updateInternalTournament, deleteInternalTournament } = useData();

  const tournament = internalTournaments.find(t => t.id === id);
  if (!tournament) return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <PageHeader title="Турнир" back />
      <Text style={[styles.empty, { color: colors.textSecondary }]}>Турнир не найден</Text>
    </View>
  );

  const handleDelete = () => {
    Alert.alert('Удалить турнир?', tournament.name, [
      { text: 'Отмена' },
      { text: 'Удалить', style: 'destructive', onPress: async () => {
        try { await deleteInternalTournament(id); navigation.goBack(); } catch (e) { Alert.alert('Ошибка', e.message); }
      }},
    ]);
  };

  const handleGenerateBracket = async () => {
    if (!tournament.participantIds?.length) return;
    const brackets = generateBracket(tournament.participantIds);
    try {
      await updateInternalTournament(id, { brackets });
    } catch (e) { Alert.alert('Ошибка', e.message); }
  };

  const participants = (tournament.participantIds || []).map(pid => students.find(s => s.id === pid)).filter(Boolean);
  const canManage = auth?.role === 'trainer';

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <PageHeader title="Турнир" back>
        {canManage && (
          <TouchableOpacity onPress={handleDelete}>
            <TrashIcon size={20} color={colors.danger} />
          </TouchableOpacity>
        )}
      </PageHeader>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text }]}>{tournament.name}</Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          {tournament.sportType} · {tournament.weightClass}
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Участники ({participants.length})</Text>
        <GlassCard>
          {participants.map(p => (
            <Text key={p.id} style={[styles.participant, { color: colors.text }]}>{p.name}</Text>
          ))}
        </GlassCard>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Сетка</Text>
        {tournament.brackets ? (
          <BracketView brackets={tournament.brackets} sportType={tournament.sportType} />
        ) : (
          canManage && (
            <TouchableOpacity onPress={handleGenerateBracket} style={[styles.genBtn, { backgroundColor: colors.accent }]}>
              <Text style={styles.genBtnText}>Сгенерировать сетку</Text>
            </TouchableOpacity>
          )
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
  meta: { fontSize: 14, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', textTransform: 'uppercase', fontStyle: 'italic', marginTop: 20, marginBottom: 10 },
  participant: { fontSize: 14, paddingVertical: 6 },
  genBtn: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  genBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 14 },
});
