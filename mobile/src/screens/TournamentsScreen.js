import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import {
  Plus,
  Calendar,
  MapPin,
  Trophy,
  Swords,
  Check,
  Archive,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { getColors } from '../utils/theme';
import GlassCard from '../components/GlassCard';
import PageHeader from '../components/PageHeader';

function formatDate(iso) {
  if (!iso) return '\u2014';
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function TournamentsScreen({ navigation }) {
  const { dark } = useTheme();
  const c = getColors(dark);
  const { auth } = useAuth();
  const { data } = useData();
  const [showArchive, setShowArchive] = useState(false);

  /* ── Official tournaments sorted by date ── */
  const sorted = useMemo(
    () => [...data.tournaments].sort((a, b) => new Date(a.date) - new Date(b.date)),
    [data.tournaments],
  );

  /* ── Internal (club) tournaments ── */
  const allInternal = useMemo(() => {
    return (data.internalTournaments || [])
      .filter(t => {
        if (auth.role === 'trainer') return t.trainerId === auth.userId;
        if (auth.role === 'student') {
          const student = data.students.find(s => s.id === auth.studentId);
          return student && t.trainerId === student.trainerId;
        }
        return true; // superadmin
      })
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [data.internalTournaments, data.students, auth]);

  const thirtyDaysAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  }, []);

  const activeInternalTournaments = useMemo(
    () => allInternal.filter(t => t.status !== 'completed'),
    [allInternal],
  );

  const archivedInternalTournaments = useMemo(
    () =>
      allInternal.filter(t => {
        if (t.status !== 'completed') return false;
        return new Date(t.date || 0) >= thirtyDaysAgo;
      }),
    [allInternal, thirtyDaysAgo],
  );

  /* ── helpers ── */
  const navigateToInternal = (id) => {
    navigation.navigate('InternalTournament', { id });
  };

  const navigateToOfficial = (id) => {
    navigation.navigate('TournamentDetail', { id });
  };

  const handleCreateInternal = () => {
    navigation.navigate('CreateInternalTournament');
  };

  const handleAddTournament = () => {
    navigation.navigate('AddTournament');
  };

  /* ── render internal tournament card ── */
  const renderInternalCard = (t) => {
    const cats = t.brackets?.categories || [];
    const isLegacy = !cats.length && t.brackets?.rounds;
    const totalParticipants = isLegacy
      ? (t.brackets?.participants?.length || 0)
      : cats.reduce((s, cat) => s + (cat.participants?.length || 0), 0);
    const catCount = isLegacy ? 1 : cats.length;

    return (
      <GlassCard
        key={t.id}
        onPress={() => navigateToInternal(t.id)}
        style={[
          styles.internalCard,
          {
            borderColor:
              t.status === 'completed'
                ? dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
                : 'rgba(239,68,68,0.2)',
          },
        ]}
      >
        <View style={styles.internalRow}>
          <View style={styles.internalContent}>
            <View style={styles.internalTitleRow}>
              <Text
                style={[styles.internalTitle, { color: c.text }]}
                numberOfLines={1}
              >
                {t.title}
              </Text>
              {t.status === 'completed' && (
                <View style={styles.completedBadge}>
                  <Check size={12} color="#4ade80" />
                </View>
              )}
            </View>
            <View style={styles.internalMeta}>
              <Calendar size={11} color={dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'} />
              <Text style={[styles.internalMetaText, { color: dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }]}>
                {formatDate(t.date)}
              </Text>
              <Text style={[styles.metaDot, { color: dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }]}>
                {'\u2022'}
              </Text>
              <Text style={[styles.internalMetaText, { color: dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }]}>
                {catCount} {catCount === 1 ? 'весовая' : 'весовых'}
              </Text>
              <Text style={[styles.metaDot, { color: dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }]}>
                {'\u2022'}
              </Text>
              <Text style={[styles.internalMetaText, { color: dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }]}>
                {totalParticipants} чел.
              </Text>
            </View>
          </View>
        </View>
      </GlassCard>
    );
  };

  /* ════════════════ RENDER ════════════════ */
  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <PageHeader title="Турниры">
        {auth.role === 'trainer' && (
          <TouchableOpacity onPress={handleCreateInternal} style={styles.headerBtn}>
            <Swords size={20} color={c.textSecondary} />
          </TouchableOpacity>
        )}
        {auth.role === 'superadmin' && (
          <TouchableOpacity onPress={handleAddTournament} style={styles.headerBtn}>
            <Plus size={20} color={c.textSecondary} />
          </TouchableOpacity>
        )}
      </PageHeader>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ═══ ACTIVE INTERNAL TOURNAMENTS ═══ */}
        {activeInternalTournaments.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Swords size={14} color="#ef4444" />
              <Text style={[styles.sectionTitle, { color: dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)' }]}>
                КЛУБНЫЕ ТУРНИРЫ
              </Text>
            </View>
            {activeInternalTournaments.map(renderInternalCard)}
          </View>
        )}

        {/* ═══ ARCHIVED INTERNAL TOURNAMENTS ═══ */}
        {archivedInternalTournaments.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity
              onPress={() => setShowArchive(!showArchive)}
              style={styles.archiveToggle}
              activeOpacity={0.7}
            >
              <View style={styles.archiveLeft}>
                <Archive
                  size={14}
                  color={dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)'}
                />
                <Text
                  style={[
                    styles.archiveText,
                    { color: dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' },
                  ]}
                >
                  АРХИВ ({archivedInternalTournaments.length})
                </Text>
              </View>
              {showArchive ? (
                <ChevronUp size={16} color={dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'} />
              ) : (
                <ChevronDown size={16} color={dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'} />
              )}
            </TouchableOpacity>
            {showArchive && (
              <View style={styles.archiveList}>
                {archivedInternalTournaments.map(renderInternalCard)}
              </View>
            )}
          </View>
        )}

        {/* ═══ OFFICIAL TOURNAMENTS ═══ */}
        {sorted.length > 0 && (
          <View style={styles.section}>
            {(activeInternalTournaments.length > 0 ||
              archivedInternalTournaments.length > 0) && (
              <View style={styles.sectionHeader}>
                <Trophy size={14} color="#fb923c" />
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)' },
                  ]}
                >
                  ОФИЦИАЛЬНЫЕ ТУРНИРЫ
                </Text>
              </View>
            )}

            {sorted.map(t => {
              const isPast = new Date(t.date) < new Date();
              return (
                <GlassCard
                  key={t.id}
                  onPress={() => navigateToOfficial(t.id)}
                  style={styles.officialCard}
                >
                  {/* Cover image or placeholder */}
                  {t.coverImage ? (
                    <Image
                      source={{ uri: t.coverImage }}
                      style={styles.coverImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={[
                        styles.coverPlaceholder,
                        {
                          backgroundColor: dark
                            ? 'rgba(255,255,255,0.05)'
                            : 'rgba(255,255,255,0.5)',
                        },
                      ]}
                    >
                      <Text style={styles.coverPlaceholderText}>BJJ</Text>
                    </View>
                  )}

                  <View style={styles.officialInfo}>
                    <View style={styles.officialLeft}>
                      <Text
                        style={[styles.officialTitle, { color: c.text }]}
                        numberOfLines={1}
                      >
                        {t.title}
                      </Text>
                      <View style={styles.officialMetaRow}>
                        <Calendar
                          size={12}
                          color={dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
                        />
                        <Text
                          style={[
                            styles.officialMetaText,
                            { color: dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' },
                          ]}
                        >
                          {formatDate(t.date)}
                        </Text>
                      </View>
                      <View style={styles.officialMetaRow}>
                        <MapPin
                          size={12}
                          color={dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
                        />
                        <Text
                          style={[
                            styles.officialMetaText,
                            { color: dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' },
                          ]}
                          numberOfLines={1}
                        >
                          {t.location}
                        </Text>
                      </View>
                    </View>

                    {isPast && (
                      <View
                        style={[
                          styles.pastBadge,
                          {
                            backgroundColor: dark
                              ? 'rgba(255,255,255,0.08)'
                              : 'rgba(255,255,255,0.6)',
                            borderColor: dark
                              ? 'transparent'
                              : 'rgba(255,255,255,0.6)',
                            borderWidth: dark ? 0 : 1,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.pastBadgeText,
                            {
                              color: dark
                                ? 'rgba(255,255,255,0.4)'
                                : 'rgba(0,0,0,0.35)',
                            },
                          ]}
                        >
                          ПРОШЁЛ
                        </Text>
                      </View>
                    )}
                  </View>
                </GlassCard>
              );
            })}
          </View>
        )}

        {/* ═══ EMPTY STATE ═══ */}
        {sorted.length === 0 && allInternal.length === 0 && (
          <View style={styles.emptyState}>
            <Swords
              size={48}
              color={dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
            />
            <Text
              style={[
                styles.emptyText,
                { color: dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)' },
              ]}
            >
              Нет турниров
            </Text>
            {auth.role === 'trainer' && (
              <TouchableOpacity
                style={styles.createBtn}
                onPress={handleCreateInternal}
                activeOpacity={0.8}
              >
                <Text style={styles.createBtnText}>Создать клубный турнир</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

/* ════════════════════════════════════════ */
/*               STYLES                    */
/* ════════════════════════════════════════ */

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Section */
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  /* Internal tournament card */
  internalCard: {
    marginBottom: 8,
    borderWidth: 1,
  },
  internalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  internalContent: {
    flex: 1,
    minWidth: 0,
  },
  internalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  internalTitle: {
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
  },
  completedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(74,222,128,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  internalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  internalMetaText: {
    fontSize: 12,
  },
  metaDot: {
    fontSize: 12,
  },

  /* Archive toggle */
  archiveToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  archiveLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  archiveText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  archiveList: {
    marginTop: 8,
  },

  /* Official tournament card */
  officialCard: {
    marginBottom: 12,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: 144,
    borderRadius: 16,
    marginBottom: 12,
  },
  coverPlaceholder: {
    width: '100%',
    height: 112,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverPlaceholderText: {
    fontSize: 32,
    fontWeight: '900',
    fontStyle: 'italic',
    color: 'rgba(239,68,68,0.3)',
  },
  officialInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  officialLeft: {
    flex: 1,
    minWidth: 0,
  },
  officialTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  officialMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  officialMetaText: {
    fontSize: 12,
    flexShrink: 1,
  },
  pastBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  pastBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },

  /* Empty state */
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
  },
  createBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#ef4444',
  },
  createBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
