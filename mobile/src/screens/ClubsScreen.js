import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, RefreshControl,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import PageHeader from '../components/PageHeader';
import GlassCard from '../components/GlassCard';
import { SearchIcon, PlusIcon, ChevronRightIcon, BuildingIcon } from '../icons';

export default function ClubsScreen({ navigation }) {
  const { colors } = useTheme();
  const { clubs, users, reload } = useData();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const filtered = clubs.filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <PageHeader title="Клубы">
        <TouchableOpacity onPress={() => navigation.navigate('AddTrainer')} style={[styles.addBtn, { backgroundColor: colors.accent }]}>
          <PlusIcon size={20} color="#fff" />
        </TouchableOpacity>
      </PageHeader>

      <View style={[styles.searchWrap, { marginHorizontal: 16 }]}>
        <SearchIcon size={18} color={colors.textSecondary} />
        <TextInput value={search} onChangeText={setSearch} placeholder="Поиск клуба..." placeholderTextColor={colors.textSecondary} style={[styles.searchInput, { color: colors.text }]} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await reload(); setRefreshing(false); }} tintColor={colors.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {filtered.map(c => {
          const trainers = users.filter(u => u.clubId === c.id && u.role === 'trainer');
          return (
            <GlassCard key={c.id} onPress={() => navigation.navigate('ClubDetail', { id: c.id })}>
              <View style={styles.row}>
                <BuildingIcon size={22} color={colors.accent} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.name, { color: colors.text }]}>{c.name}</Text>
                  <Text style={[styles.sub, { color: colors.textSecondary }]}>
                    {trainers.length} тренеров
                  </Text>
                </View>
                <ChevronRightIcon size={20} color={colors.textSecondary} />
              </View>
            </GlassCard>
          );
        })}
        {filtered.length === 0 && (
          <Text style={[styles.empty, { color: colors.textSecondary }]}>Нет клубов</Text>
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
  name: { fontSize: 16, fontWeight: '700' },
  sub: { fontSize: 13, marginTop: 2 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 14 },
  addBtn: { padding: 8, borderRadius: 10 },
});
