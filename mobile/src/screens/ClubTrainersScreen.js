import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import PageHeader from '../components/PageHeader';
import GlassCard from '../components/GlassCard';
import Avatar from '../components/Avatar';
import { SearchIcon, ChevronRightIcon } from '../icons';
import { TextInput } from 'react-native';

export default function ClubTrainersScreen({ navigation }) {
  const { colors } = useTheme();
  const { users, groups, students, reload } = useData();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const trainers = users.filter(u => u.role === 'trainer' && u.clubId);
  const filtered = trainers.filter(t =>
    !search || t.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <PageHeader title="Тренеры" />

      <View style={[styles.searchWrap, { marginHorizontal: 16 }]}>
        <SearchIcon size={18} color={colors.textSecondary} />
        <TextInput value={search} onChangeText={setSearch} placeholder="Поиск..." placeholderTextColor={colors.textSecondary} style={[styles.searchInput, { color: colors.text }]} />
      </View>

      <ScrollView
        style={styles.scroll} contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await reload(); setRefreshing(false); }} tintColor={colors.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {filtered.map(t => {
          const tGroups = groups.filter(g => g.trainerId === t.id);
          const tStudents = students.filter(s => tGroups.some(g => g.id === s.groupId));
          return (
            <GlassCard key={t.id}>
              <View style={styles.row}>
                <Avatar name={t.name} photo={t.photo} size={44} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.name, { color: colors.text }]}>{t.name}</Text>
                  <Text style={[styles.sub, { color: colors.textSecondary }]}>
                    {tGroups.length} групп · {tStudents.length} учеников
                  </Text>
                </View>
                {t.isHeadTrainer && (
                  <View style={[styles.badge, { backgroundColor: colors.accentLight }]}>
                    <Text style={{ color: colors.accent, fontSize: 11, fontWeight: '600' }}>Главный</Text>
                  </View>
                )}
              </View>
            </GlassCard>
          );
        })}
        {filtered.length === 0 && (
          <Text style={[styles.empty, { color: colors.textSecondary }]}>Нет тренеров</Text>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 14, paddingHorizontal: 14, height: 44,
    backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 15 },
  row: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '600' },
  sub: { fontSize: 13, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 14 },
});
