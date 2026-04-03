import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import PageHeader from '../components/PageHeader';
import GlassCard from '../components/GlassCard';
import Avatar from '../components/Avatar';
import { CalendarIcon, MapPinIcon, TrashIcon, CheckIcon, XIcon } from '../icons';

export default function TournamentDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { colors } = useTheme();
  const { auth } = useAuth();
  const { tournaments, students, tournamentRegistrations, registerTournament, unregisterTournament, deleteTournament } = useData();

  const tournament = tournaments.find(t => t.id === id);
  if (!tournament) return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <PageHeader title="Турнир" back />
      <Text style={[styles.empty, { color: colors.textSecondary }]}>Турнир не найден</Text>
    </View>
  );

  const regs = tournamentRegistrations.filter(r => r.tournamentId === id);
  const regStudents = regs.map(r => students.find(s => s.id === r.studentId)).filter(Boolean);

  const canManage = auth?.role === 'superadmin' || auth?.role === 'organizer';
  const canRegister = auth?.role === 'trainer' || auth?.role === 'student';

  const myStudents = auth?.role === 'trainer' ? students : (auth?.student ? [auth.student] : []);

  const handleRegister = async (studentId) => {
    try {
      const isRegged = regs.some(r => r.studentId === studentId);
      if (isRegged) {
        await unregisterTournament(id, studentId);
      } else {
        await registerTournament(id, studentId);
      }
    } catch (e) { Alert.alert('Ошибка', e.message); }
  };

  const handleDelete = () => {
    Alert.alert('Удалить турнир?', tournament.name, [
      { text: 'Отмена' },
      { text: 'Удалить', style: 'destructive', onPress: async () => {
        try { await deleteTournament(id); navigation.goBack(); } catch (e) { Alert.alert('Ошибка', e.message); }
      }},
    ]);
  };

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

        <View style={[styles.metaRow, { marginTop: 12 }]}>
          <CalendarIcon size={16} color={colors.textSecondary} />
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            {new Date(tournament.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
        </View>
        {tournament.location && (
          <View style={styles.metaRow}>
            <MapPinIcon size={16} color={colors.textSecondary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>{tournament.location}</Text>
          </View>
        )}

        {tournament.sportType && (
          <View style={[styles.badge, { backgroundColor: colors.accentLight, marginTop: 12, alignSelf: 'flex-start' }]}>
            <Text style={{ color: colors.accent, fontWeight: '600' }}>{tournament.sportType}</Text>
          </View>
        )}

        {tournament.description && (
          <GlassCard style={{ marginTop: 16 }}>
            <Text style={[styles.desc, { color: colors.text }]}>{tournament.description}</Text>
          </GlassCard>
        )}

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Участники ({regStudents.length})
        </Text>

        {regStudents.map(s => (
          <GlassCard key={s.id}>
            <View style={styles.row}>
              <Avatar name={s.name} photo={s.photo} size={36} />
              <Text style={[styles.regName, { color: colors.text }]}>{s.name}</Text>
            </View>
          </GlassCard>
        ))}

        {canRegister && myStudents.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Регистрация</Text>
            {myStudents.map(s => {
              const isRegged = regs.some(r => r.studentId === s.id);
              return (
                <GlassCard key={s.id}>
                  <View style={styles.row}>
                    <Avatar name={s.name} photo={s.photo} size={36} />
                    <Text style={[styles.regName, { color: colors.text, flex: 1 }]}>{s.name}</Text>
                    <TouchableOpacity
                      onPress={() => handleRegister(s.id)}
                      style={[styles.regBtn, { backgroundColor: isRegged ? colors.danger : colors.success }]}
                    >
                      {isRegged ? <XIcon size={16} color="#fff" /> : <CheckIcon size={16} color="#fff" />}
                    </TouchableOpacity>
                  </View>
                </GlassCard>
              );
            })}
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
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  metaText: { fontSize: 14 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  desc: { fontSize: 14, lineHeight: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', textTransform: 'uppercase', fontStyle: 'italic', marginTop: 20, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  regName: { fontSize: 15, fontWeight: '500' },
  regBtn: { padding: 8, borderRadius: 10 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 14 },
});
