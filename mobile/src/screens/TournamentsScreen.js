import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  RefreshControl, Dimensions, ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { getColors } from '../utils/theme';
import { getSportLabel } from '../utils/sports';
import GlassCard from '../components/GlassCard';
import PageHeader from '../components/PageHeader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48 - 12) / 2;

const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()].toLowerCase().slice(0, 3)}`;
}

function getCountdown(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const target = new Date(dateStr);
  const diff = target - now;
  if (diff <= 0) return 'Сегодня';
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days === 1) return '1 день';
  if (days < 5) return `${days} дня`;
  return `${days} дней`;
}

function groupByMonth(tournaments) {
  const groups = {};
  for (const t of tournaments) {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const label = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
    if (!groups[key]) groups[key] = { label, items: [] };
    groups[key].items.push(t);
  }
  return Object.values(groups);
}

export default function TournamentsScreen() {
  const { dark } = useTheme();
  const { auth } = useAuth();
  const { data, loading, reload } = useData();
  const navigation = useNavigation();
  const c = getColors(dark);

  const [tab, setTab] = useState('upcoming');
  const [internalSubTab, setInternalSubTab] = useState('active');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }, [reload]);

  const now = new Date();

  const upcoming = useMemo(() => {
    return (data.tournaments || [])
      .filter(t => new Date(t.date) >= now)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [data.tournaments]);

  const archive = useMemo(() => {
    return (data.tournaments || [])
      .filter(t => new Date(t.date) < now)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [data.tournaments]);

  const internalActive = useMemo(() => {
    return (data.internalTournaments || [])
      .filter(t => t.status !== 'completed')
      .sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0));
  }, [data.internalTournaments]);

  const internalCompleted = useMemo(() => {
    return (data.internalTournaments || [])
      .filter(t => t.status === 'completed')
      .sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0));
  }, [data.internalTournaments]);

  const monthGroups = useMemo(() => groupByMonth(upcoming), [upcoming]);

  const isAdmin = auth?.role === 'superadmin' || auth?.role === 'trainer' || auth?.role === 'club_admin';

  const tabs = [
    { key: 'upcoming', label: 'Предстоящие', icon: 'calendar-outline' },
    { key: 'internal', label: 'Клубные', icon: 'trophy-outline' },
    { key: 'archive', label: 'Архив', icon: 'archive-outline' },
  ];

  const renderTournamentCard = (t, isSmall) => {
    const countdown = getCountdown(t.date);
    return (
      <TouchableOpacity
        key={t.id}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('TournamentDetail', { id: t.id })}
        style={isSmall ? { width: CARD_WIDTH } : {}}
      >
        <GlassCard style={isSmall ? styles.smallCard : styles.listCard}>
          {/* Sport badge */}
          <View style={[styles.sportBadge, { backgroundColor: c.purpleBg }]}>
            <MaterialCommunityIcons name="karate" size={14} color={c.purple} />
            <Text style={[styles.sportBadgeText, { color: c.purple }]}>
              {getSportLabel(t.sportType)}
            </Text>
          </View>

          <Text style={[styles.cardTitle, { color: c.text }]} numberOfLines={2}>
            {t.name}
          </Text>

          <View style={styles.cardMeta}>
            <Ionicons name="calendar-outline" size={13} color={c.textSecondary} />
            <Text style={[styles.cardMetaText, { color: c.textSecondary }]}>
              {formatDate(t.date)}
            </Text>
          </View>

          {t.location && (
            <View style={styles.cardMeta}>
              <Ionicons name="location-outline" size={13} color={c.textSecondary} />
              <Text style={[styles.cardMetaText, { color: c.textSecondary }]} numberOfLines={1}>
                {t.location}
              </Text>
            </View>
          )}

          {countdown && (
            <View style={[styles.countdownBadge, { backgroundColor: c.blueBg }]}>
              <Ionicons name="time-outline" size={12} color={c.blue} />
              <Text style={[styles.countdownText, { color: c.blue }]}>{countdown}</Text>
            </View>
          )}
        </GlassCard>
      </TouchableOpacity>
    );
  };

  const renderInternalCard = (t) => {
    const studentNames = (t.participants || []).map(pid => {
      const student = (data.students || []).find(s => s.id === pid);
      return student?.name || 'Неизвестный';
    });
    return (
      <TouchableOpacity
        key={t.id}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('InternalTournamentDetail', { id: t.id })}
      >
        <GlassCard style={styles.listCard}>
          <View style={styles.internalHeader}>
            <View style={[styles.sportBadge, { backgroundColor: c.purpleBg }]}>
              <MaterialCommunityIcons name="karate" size={14} color={c.purple} />
              <Text style={[styles.sportBadgeText, { color: c.purple }]}>
                {getSportLabel(t.sportType)}
              </Text>
            </View>
            {t.status === 'completed' && (
              <View style={[styles.statusBadge, { backgroundColor: c.greenBg }]}>
                <Text style={[styles.statusText, { color: c.green }]}>Завершён</Text>
              </View>
            )}
          </View>

          <Text style={[styles.cardTitle, { color: c.text }]} numberOfLines={1}>
            {t.weightClass || 'Клубный турнир'}
          </Text>

          <View style={styles.cardMeta}>
            <Ionicons name="people-outline" size={13} color={c.textSecondary} />
            <Text style={[styles.cardMetaText, { color: c.textSecondary }]}>
              {(t.participants || []).length} участников
            </Text>
          </View>

          {t.date && (
            <View style={styles.cardMeta}>
              <Ionicons name="calendar-outline" size={13} color={c.textSecondary} />
              <Text style={[styles.cardMetaText, { color: c.textSecondary }]}>
                {formatDate(t.date)}
              </Text>
            </View>
          )}

          {studentNames.length > 0 && (
            <Text style={[styles.participantPreview, { color: c.textTertiary }]} numberOfLines={1}>
              {studentNames.slice(0, 3).join(', ')}{studentNames.length > 3 ? '...' : ''}
            </Text>
          )}
        </GlassCard>
      </TouchableOpacity>
    );
  };

  const renderUpcoming = () => {
    if (upcoming.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={48} color={c.textTertiary} />
          <Text style={[styles.emptyText, { color: c.textSecondary }]}>
            Нет предстоящих турниров
          </Text>
        </View>
      );
    }

    return monthGroups.map((group) => (
      <View key={group.label}>
        <Text style={[styles.monthLabel, { color: c.textSecondary }]}>{group.label}</Text>
        <View style={styles.twoColumnGrid}>
          {group.items.map(t => renderTournamentCard(t, true))}
        </View>
      </View>
    ));
  };

  const renderInternal = () => {
    const list = internalSubTab === 'active' ? internalActive : internalCompleted;
    return (
      <View>
        {/* Sub-tabs */}
        <View style={[styles.subTabRow, { backgroundColor: c.glass, borderColor: c.glassBorder }]}>
          <TouchableOpacity
            style={[
              styles.subTab,
              internalSubTab === 'active' && { backgroundColor: c.purple },
            ]}
            onPress={() => setInternalSubTab('active')}
          >
            <Text style={[
              styles.subTabText,
              { color: internalSubTab === 'active' ? '#fff' : c.textSecondary },
            ]}>
              Активные
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.subTab,
              internalSubTab === 'completed' && { backgroundColor: c.purple },
            ]}
            onPress={() => setInternalSubTab('completed')}
          >
            <Text style={[
              styles.subTabText,
              { color: internalSubTab === 'completed' ? '#fff' : c.textSecondary },
            ]}>
              Завершённые
            </Text>
          </TouchableOpacity>
        </View>

        {list.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="trophy-outline" size={48} color={c.textTertiary} />
            <Text style={[styles.emptyText, { color: c.textSecondary }]}>
              {internalSubTab === 'active' ? 'Нет активных турниров' : 'Нет завершённых турниров'}
            </Text>
          </View>
        ) : (
          list.map(t => renderInternalCard(t))
        )}
      </View>
    );
  };

  const renderArchive = () => {
    if (archive.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="archive-outline" size={48} color={c.textTertiary} />
          <Text style={[styles.emptyText, { color: c.textSecondary }]}>Архив пуст</Text>
        </View>
      );
    }

    return archive.map(t => (
      <TouchableOpacity
        key={t.id}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('TournamentDetail', { id: t.id })}
      >
        <GlassCard style={styles.listCard}>
          <View style={styles.internalHeader}>
            <View style={[styles.sportBadge, { backgroundColor: c.purpleBg }]}>
              <Text style={[styles.sportBadgeText, { color: c.purple }]}>
                {getSportLabel(t.sportType)}
              </Text>
            </View>
            <Text style={[styles.archiveDate, { color: c.textTertiary }]}>
              {formatDate(t.date)}
            </Text>
          </View>
          <Text style={[styles.cardTitle, { color: c.text }]} numberOfLines={1}>
            {t.name}
          </Text>
          {t.location && (
            <View style={styles.cardMeta}>
              <Ionicons name="location-outline" size={13} color={c.textSecondary} />
              <Text style={[styles.cardMetaText, { color: c.textSecondary }]} numberOfLines={1}>
                {t.location}
              </Text>
            </View>
          )}
        </GlassCard>
      </TouchableOpacity>
    ));
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <PageHeader title="Турниры" gradient />
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={c.purple} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <PageHeader
        title="Турниры"
        gradient
        rightAction={
          isAdmin ? (
            <TouchableOpacity
              onPress={() => navigation.navigate('AddTournament')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.6}
            >
              <Ionicons name="add-circle-outline" size={24} color={c.purple} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      {/* Tabs */}
      <View style={[styles.tabRow, { borderBottomColor: c.border }]}>
        {tabs.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Ionicons
              name={t.icon}
              size={18}
              color={tab === t.key ? c.purple : c.textTertiary}
            />
            <Text style={[
              styles.tabText,
              { color: tab === t.key ? c.purple : c.textTertiary },
              tab === t.key && styles.tabTextActive,
            ]}>
              {t.label}
            </Text>
            {tab === t.key && <View style={[styles.tabIndicator, { backgroundColor: c.purple }]} />}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.purple} />
        }
      >
        {tab === 'upcoming' && renderUpcoming()}
        {tab === 'internal' && renderInternal()}
        {tab === 'archive' && renderArchive()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    position: 'relative',
  },
  tabActive: {},
  tabText: { fontSize: 13, fontWeight: '500' },
  tabTextActive: { fontWeight: '700' },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    right: '20%',
    height: 2,
    borderRadius: 1,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  monthLabel: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 8,
  },
  twoColumnGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  smallCard: {
    width: CARD_WIDTH - 2,
    padding: 14,
  },
  listCard: {
    marginBottom: 12,
  },
  sportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    marginBottom: 8,
  },
  sportBadgeText: { fontSize: 11, fontWeight: '600' },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  cardMetaText: { fontSize: 12 },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
    marginTop: 6,
  },
  countdownText: { fontSize: 11, fontWeight: '600' },
  subTabRow: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    marginBottom: 16,
  },
  subTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  subTabText: { fontSize: 13, fontWeight: '600' },
  internalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: { fontSize: 11, fontWeight: '600' },
  participantPreview: { fontSize: 12, marginTop: 4 },
  archiveDate: { fontSize: 12 },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: { fontSize: 15, fontWeight: '500' },
});
