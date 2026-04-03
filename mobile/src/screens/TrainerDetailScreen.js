import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import PageHeader from '../components/PageHeader';
import GlassCard from '../components/GlassCard';
import Avatar from '../components/Avatar';
import { TrashIcon } from '../icons';

export default function TrainerDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { colors } = useTheme();
  const { users, groups, students, deleteTrainer } = useData();

  const trainer = users.find(u => u.id === id && u.role === 'trainer');
  if (!trainer) return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <PageHeader title="Тренер" back />
      <Text style={[styles.empty, { color: colors.textSecondary }]}>Тренер не найден</Text>
    </View>
  );

  const trainerGroups = groups.filter(g => g.trainerId === id);
  const trainerStudents = students.filter(s => trainerGroups.some(g => g.id === s.groupId));

  const handleDelete = () => {
    Alert.alert('Удалить тренера?', trainer.name, [
      { text: 'Отмена' },
      { text: 'Удалить', style: 'destructive', onPress: async () => {
        try { await deleteTrainer(id); navigation.goBack(); } catch (e) { Alert.alert('Ошибка', e.message); }
      }},
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <PageHeader title="Тренер" back>
        <TouchableOpacity onPress={handleDelete}>
          <TrashIcon size={20} color={colors.danger} />
        </TouchableOpacity>
      </PageHeader>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <Avatar name={trainer.name} photo={trainer.photo} size={80} />
          <Text style={[styles.name, { color: colors.text }]}>{trainer.name}</Text>
          {trainer.phone && <Text style={[styles.sub, { color: colors.textSecondary }]}>{trainer.phone}</Text>}
          {trainer.sportType && (
            <View style={[styles.badge, { backgroundColor: colors.accentLight, marginTop: 8 }]}>
              <Text style={{ color: colors.accent, fontWeight: '600' }}>{trainer.sportType}</Text>
            </View>
          )}
        </View>

        <GlassCard>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: colors.text }]}>{trainerGroups.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Групп</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: colors.text }]}>{trainerStudents.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Учеников</Text>
            </View>
          </View>
        </GlassCard>

        {trainerGroups.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Группы</Text>
            {trainerGroups.map(g => (
              <GlassCard key={g.id}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{g.name}</Text>
                <Text style={[styles.sub, { color: colors.textSecondary }]}>
                  {students.filter(s => s.groupId === g.id).length} учеников
                </Text>
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
  profileSection: { alignItems: 'center', paddingVertical: 16, marginBottom: 8 },
  name: { fontSize: 22, fontWeight: '800', marginTop: 12 },
  sub: { fontSize: 14, marginTop: 4 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statNum: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 12, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', textTransform: 'uppercase', fontStyle: 'italic', marginTop: 16, marginBottom: 8 },
  cardTitle: { fontSize: 15, fontWeight: '600' },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 14 },
});
