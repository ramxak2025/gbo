import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, RefreshControl,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import PageHeader from '../components/PageHeader';
import GlassCard from '../components/GlassCard';
import Avatar from '../components/Avatar';
import { SearchIcon, PlusIcon, ChevronRightIcon } from '../icons';

export default function TeamScreen({ navigation }) {
  const { colors } = useTheme();
  const { auth } = useAuth();
  const { students, groups, reload, loading } = useData();
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const filtered = useMemo(() => {
    let list = students;
    if (selectedGroup) list = list.filter(s => s.groupId === selectedGroup);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s => s.name?.toLowerCase().includes(q));
    }
    return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [students, search, selectedGroup]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <PageHeader title="Команда">
        {auth?.role === 'trainer' && (
          <TouchableOpacity onPress={() => navigation.navigate('AddStudent')} style={[styles.addBtn, { backgroundColor: colors.accent }]}>
            <PlusIcon size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </PageHeader>

      <View style={[styles.searchWrap, { marginHorizontal: 16 }]}>
        <SearchIcon size={18} color={colors.textSecondary} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Поиск..."
          placeholderTextColor={colors.textSecondary}
          style={[styles.searchInput, { color: colors.text }]}
        />
      </View>

      {groups.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupFilter} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          <TouchableOpacity
            onPress={() => setSelectedGroup(null)}
            style={[styles.groupBtn, !selectedGroup && { backgroundColor: colors.accentLight }]}
          >
            <Text style={{ color: !selectedGroup ? colors.accent : colors.textSecondary, fontSize: 13 }}>Все</Text>
          </TouchableOpacity>
          {groups.map(g => (
            <TouchableOpacity
              key={g.id}
              onPress={() => setSelectedGroup(selectedGroup === g.id ? null : g.id)}
              style={[styles.groupBtn, selectedGroup === g.id && { backgroundColor: colors.accentLight }]}
            >
              <Text style={{ color: selectedGroup === g.id ? colors.accent : colors.textSecondary, fontSize: 13 }}>{g.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await reload(); setRefreshing(false); }} tintColor={colors.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {filtered.map(s => (
          <GlassCard key={s.id} onPress={() => navigation.navigate('StudentDetail', { id: s.id })}>
            <View style={styles.row}>
              <Avatar name={s.name} photo={s.photo} size={44} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.name, { color: colors.text }]}>{s.name}</Text>
                <Text style={[styles.sub, { color: colors.textSecondary }]}>
                  {groups.find(g => g.id === s.groupId)?.name || 'Без группы'}
                  {s.sportType ? ` · ${s.sportType}` : ''}
                </Text>
              </View>
              <ChevronRightIcon size={20} color={colors.textSecondary} />
            </View>
          </GlassCard>
        ))}

        {filtered.length === 0 && (
          <Text style={[styles.empty, { color: colors.textSecondary }]}>
            {search ? 'Ничего не найдено' : 'Нет учеников'}
          </Text>
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
  groupFilter: { marginBottom: 8, maxHeight: 40 },
  groupBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10 },
  row: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '600' },
  sub: { fontSize: 13, marginTop: 2 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 14 },
  addBtn: { padding: 8, borderRadius: 10 },
});
