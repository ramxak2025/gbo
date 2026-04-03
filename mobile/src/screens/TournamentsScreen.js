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
import { SearchIcon, PlusIcon, ChevronRightIcon, CalendarIcon, MapPinIcon, TrophyIcon } from '../icons';

export default function TournamentsScreen({ navigation }) {
  const { colors } = useTheme();
  const { auth } = useAuth();
  const { tournaments, internalTournaments, reload } = useData();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('upcoming');
  const [refreshing, setRefreshing] = useState(false);

  const canAdd = auth?.role === 'superadmin' || auth?.role === 'organizer';
  const canAddInternal = auth?.role === 'trainer';

  const now = new Date();
  const filtered = useMemo(() => {
    let list = [...tournaments];
    if (tab === 'upcoming') list = list.filter(t => new Date(t.date) >= now);
    if (tab === 'past') list = list.filter(t => new Date(t.date) < now);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(t => t.name?.toLowerCase().includes(q) || t.location?.toLowerCase().includes(q));
    }
    return list.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [tournaments, tab, search]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <PageHeader title="Турниры">
        {canAdd && (
          <TouchableOpacity onPress={() => navigation.navigate('AddTournament')} style={[styles.addBtn, { backgroundColor: colors.accent }]}>
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

      <View style={[styles.tabRow, { marginHorizontal: 16 }]}>
        {['upcoming', 'past', 'internal'].map(t => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tabBtn, tab === t && { backgroundColor: colors.accentLight }]}
          >
            <Text style={{ color: tab === t ? colors.accent : colors.textSecondary, fontSize: 13, fontWeight: '500' }}>
              {t === 'upcoming' ? 'Предстоящие' : t === 'past' ? 'Прошедшие' : 'Внутренние'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await reload(); setRefreshing(false); }} tintColor={colors.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {tab !== 'internal' ? filtered.map(t => (
          <GlassCard key={t.id} onPress={() => navigation.navigate('TournamentDetail', { id: t.id })}>
            <Text style={[styles.name, { color: colors.text }]}>{t.name}</Text>
            <View style={[styles.row, { marginTop: 6, gap: 12 }]}>
              <View style={styles.row}>
                <CalendarIcon size={14} color={colors.textSecondary} />
                <Text style={[styles.meta, { color: colors.textSecondary }]}>
                  {new Date(t.date).toLocaleDateString('ru-RU')}
                </Text>
              </View>
              {t.location && (
                <View style={styles.row}>
                  <MapPinIcon size={14} color={colors.textSecondary} />
                  <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>{t.location}</Text>
                </View>
              )}
            </View>
            {t.sportType && (
              <View style={[styles.sportBadge, { backgroundColor: colors.accentLight, marginTop: 8, alignSelf: 'flex-start' }]}>
                <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '500' }}>{t.sportType}</Text>
              </View>
            )}
          </GlassCard>
        )) : (
          <>
            {canAddInternal && (
              <TouchableOpacity
                onPress={() => navigation.navigate('CreateInternalTournament')}
                style={[styles.createBtn, { borderColor: colors.accent }]}
              >
                <PlusIcon size={20} color={colors.accent} />
                <Text style={{ color: colors.accent, fontWeight: '600', marginLeft: 8 }}>Создать внутренний турнир</Text>
              </TouchableOpacity>
            )}
            {internalTournaments.map(t => (
              <GlassCard key={t.id} onPress={() => navigation.navigate('InternalTournamentDetail', { id: t.id })}>
                <Text style={[styles.name, { color: colors.text }]}>{t.name}</Text>
                <Text style={[styles.meta, { color: colors.textSecondary, marginTop: 4 }]}>
                  {t.sportType} · {new Date(t.date || t.createdAt).toLocaleDateString('ru-RU')}
                </Text>
              </GlassCard>
            ))}
          </>
        )}

        {((tab !== 'internal' && filtered.length === 0) || (tab === 'internal' && internalTournaments.length === 0)) && (
          <Text style={[styles.empty, { color: colors.textSecondary }]}>Нет турниров</Text>
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
  name: { fontSize: 16, fontWeight: '700' },
  meta: { fontSize: 13, marginLeft: 4 },
  sportBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 14 },
  addBtn: { padding: 8, borderRadius: 10 },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 16,
    paddingVertical: 16, marginBottom: 12,
  },
});
