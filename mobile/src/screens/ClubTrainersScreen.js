import React, { useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { getColors } from '../utils/theme';
import { getSportLabel } from '../utils/sports';
import GlassCard from '../components/GlassCard';
import Avatar from '../components/Avatar';
import PageHeader from '../components/PageHeader';

export default function ClubTrainersScreen() {
  const { dark } = useTheme();
  const c = getColors(dark);
  const navigation = useNavigation();
  const route = useRoute();
  const clubId = route.params?.clubId;
  const { data } = useData();

  const trainers = useMemo(() => {
    const users = data.users || [];
    if (clubId) {
      return users.filter(u => u.role === 'trainer' && u.clubId === clubId);
    }
    return users.filter(u => u.role === 'trainer');
  }, [data.users, clubId]);

  const getStats = useCallback((trainerId) => {
    const students = (data.students || []).filter(s => s.trainerId === trainerId);
    const groups = (data.groups || []).filter(g => g.trainerId === trainerId);
    return { studentCount: students.length, groupCount: groups.length };
  }, [data.students, data.groups]);

  const club = useMemo(() => {
    if (!clubId) return null;
    return (data.clubs || []).find(c => c.id === clubId);
  }, [data.clubs, clubId]);

  const renderTrainer = useCallback(({ item }) => {
    const stats = getStats(item.id);
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => navigation.navigate('TrainerDetail', { id: item.id })}
      >
        <GlassCard style={styles.card}>
          <View style={styles.row}>
            <Avatar name={item.name} photo={item.photo} size={48} />
            <View style={styles.info}>
              <View style={styles.nameRow}>
                <Text style={[styles.name, { color: c.text }]} numberOfLines={1}>{item.name}</Text>
                {item.isHeadTrainer && (
                  <View style={[styles.headBadge, { backgroundColor: c.yellowBg }]}>
                    <Ionicons name="star" size={10} color={c.yellow} />
                    <Text style={[styles.headText, { color: c.yellow }]}>Главный</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.sport, { color: c.textSecondary }]}>
                {getSportLabel(item.sportType)}
              </Text>
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Ionicons name="people-outline" size={14} color={c.blue} />
                  <Text style={[styles.statText, { color: c.blue }]}>{stats.studentCount}</Text>
                </View>
                <View style={styles.stat}>
                  <MaterialCommunityIcons name="account-group-outline" size={14} color={c.green} />
                  <Text style={[styles.statText, { color: c.green }]}>{stats.groupCount}</Text>
                </View>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={c.textTertiary} />
          </View>
        </GlassCard>
      </TouchableOpacity>
    );
  }, [c, navigation, getStats]);

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <PageHeader
        title={club ? `Тренеры: ${club.name}` : 'Тренеры'}
        back
        onBack={() => navigation.goBack()}
      />

      <FlatList
        data={trainers}
        keyExtractor={item => String(item.id)}
        renderItem={renderTrainer}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color={c.textTertiary} />
            <Text style={[styles.emptyText, { color: c.textSecondary }]}>Нет тренеров</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },
  card: { marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 16, fontWeight: '600', flexShrink: 1 },
  headBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8,
  },
  headText: { fontSize: 11, fontWeight: '600' },
  sport: { fontSize: 13, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 16, marginTop: 6 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 13, fontWeight: '500' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15 },
});
