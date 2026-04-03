import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, RefreshControl,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import PageHeader from '../components/PageHeader';
import GlassCard from '../components/GlassCard';
import Avatar from '../components/Avatar';
import { SearchIcon, ChevronRightIcon } from '../icons';

export default function CatalogScreen({ navigation }) {
  const { colors } = useTheme();
  const { students, groups, users, reload } = useData();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('students');
  const [refreshing, setRefreshing] = useState(false);

  const filteredStudents = useMemo(() => {
    if (!search) return students;
    const q = search.toLowerCase();
    return students.filter(s => s.name?.toLowerCase().includes(q));
  }, [students, search]);

  const filteredTrainers = useMemo(() => {
    const trainers = users.filter(u => u.role === 'trainer');
    if (!search) return trainers;
    const q = search.toLowerCase();
    return trainers.filter(t => t.name?.toLowerCase().includes(q));
  }, [users, search]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <PageHeader title="Каталог" />

      <View style={[styles.searchWrap, { marginHorizontal: 16 }]}>
        <SearchIcon size={18} color={colors.textSecondary} />
        <TextInput value={search} onChangeText={setSearch} placeholder="Поиск..." placeholderTextColor={colors.textSecondary} style={[styles.searchInput, { color: colors.text }]} />
      </View>

      <View style={[styles.tabRow, { marginHorizontal: 16 }]}>
        <TouchableOpacity onPress={() => setTab('students')} style={[styles.tabBtn, tab === 'students' && { backgroundColor: colors.accentLight }]}>
          <Text style={{ color: tab === 'students' ? colors.accent : colors.textSecondary, fontSize: 13, fontWeight: '500' }}>Ученики ({filteredStudents.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTab('trainers')} style={[styles.tabBtn, tab === 'trainers' && { backgroundColor: colors.accentLight }]}>
          <Text style={{ color: tab === 'trainers' ? colors.accent : colors.textSecondary, fontSize: 13, fontWeight: '500' }}>Тренеры ({filteredTrainers.length})</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll} contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await reload(); setRefreshing(false); }} tintColor={colors.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {tab === 'students' ? filteredStudents.map(s => (
          <GlassCard key={s.id} onPress={() => navigation.navigate('StudentDetail', { id: s.id })}>
            <View style={styles.row}>
              <Avatar name={s.name} photo={s.photo} size={40} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.name, { color: colors.text }]}>{s.name}</Text>
                <Text style={[styles.sub, { color: colors.textSecondary }]}>
                  {groups.find(g => g.id === s.groupId)?.name || 'Без группы'}
                </Text>
              </View>
              <ChevronRightIcon size={20} color={colors.textSecondary} />
            </View>
          </GlassCard>
        )) : filteredTrainers.map(t => (
          <GlassCard key={t.id}>
            <View style={styles.row}>
              <Avatar name={t.name} photo={t.photo} size={40} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.name, { color: colors.text }]}>{t.name}</Text>
                <Text style={[styles.sub, { color: colors.textSecondary }]}>{t.sportType || 'Тренер'}</Text>
              </View>
            </View>
          </GlassCard>
        ))}
        {((tab === 'students' && filteredStudents.length === 0) || (tab === 'trainers' && filteredTrainers.length === 0)) && (
          <Text style={[styles.empty, { color: colors.textSecondary }]}>Ничего не найдено</Text>
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
    backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 8,
  },
  searchInput: { flex: 1, fontSize: 15 },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tabBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10 },
  row: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '600' },
  sub: { fontSize: 13, marginTop: 2 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 14 },
});
