import React, { useState } from 'react';
import { View, Text, ScrollView, Image, StyleSheet } from 'react-native';
import { LiquidGlassCard, HapticPressable, AmbientBackground } from '../design';
import { colors, radius, spacing, typography } from '../design/tokens';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Trophy, Swords, Calendar, MapPin, Users, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function TournamentsScreen() {
  const { data } = useData();
  const { t, dark } = useTheme();
  const theme = dark ? colors.dark : colors.light;
  const [archiveOpen, setArchiveOpen] = useState(false);

  const upcoming = data.tournaments
    .filter(tour => new Date(tour.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const past = data.tournaments
    .filter(tour => new Date(tour.date) < new Date())
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const internal = data.internalTournaments || [];

  return (
    <View style={styles.root}>
      <AmbientBackground dark={dark} variant="fire" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <View style={styles.headerLeft}>
            <LinearGradient
              colors={colors.gradients.fire}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerIcon}
            >
              <Trophy size={22} color="#fff" strokeWidth={2.5} />
            </LinearGradient>
            <Text style={[typography.title1, { color: theme.text }]}>Турниры</Text>
          </View>
        </Animated.View>

        {/* Upcoming section */}
        {upcoming.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.textTertiary }]}>ПРЕДСТОЯЩИЕ</Text>
            {upcoming.map((tour, index) => {
              const regs = data.tournamentRegistrations.filter(r => r.tournamentId === tour.id);
              return (
                <Animated.View
                  key={tour.id}
                  entering={FadeInDown.delay(index * 80).springify()}
                >
                  <LiquidGlassCard
                    dark={dark}
                    intensity="regular"
                    radius={radius.xl}
                    padding={0}
                    style={styles.tourCard}
                  >
                    {tour.coverImage && (
                      <Image source={{ uri: tour.coverImage }} style={styles.cover} />
                    )}
                    <View style={styles.tourContent}>
                      <Text style={[typography.bodyBold, { color: theme.text }]}>{tour.title}</Text>
                      <View style={styles.meta}>
                        <Calendar size={14} color={theme.textTertiary} />
                        <Text style={[typography.caption, { color: theme.textSecondary }]}>
                          {formatDate(tour.date)}
                        </Text>
                      </View>
                      {tour.location && (
                        <View style={styles.meta}>
                          <MapPin size={14} color={theme.textTertiary} />
                          <Text style={[typography.caption, { color: theme.textSecondary }]}>
                            {tour.location}
                          </Text>
                        </View>
                      )}
                      {tour.description && (
                        <Text
                          style={[{ color: theme.textSecondary, fontSize: 13, marginTop: spacing.sm }]}
                          numberOfLines={3}
                        >
                          {tour.description}
                        </Text>
                      )}
                      {regs.length > 0 && (
                        <View style={styles.regBadge}>
                          <LinearGradient
                            colors={colors.gradients.student}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.regGradient}
                          >
                            <Users size={11} color="#fff" strokeWidth={2.5} />
                            <Text style={styles.regText}>{regs.length} участн.</Text>
                          </LinearGradient>
                        </View>
                      )}
                    </View>
                  </LiquidGlassCard>
                </Animated.View>
              );
            })}
          </View>
        )}

        {/* Internal tournaments */}
        {internal.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.textTertiary }]}>ВНУТРЕННИЕ</Text>
            {internal.map((tour, index) => (
              <Animated.View
                key={tour.id}
                entering={FadeInDown.delay((upcoming.length + index) * 80).springify()}
              >
                <LiquidGlassCard
                  dark={dark}
                  intensity="regular"
                  radius={radius.lg}
                  padding={spacing.lg}
                  style={styles.tourCardSimple}
                >
                  <View style={styles.internalRow}>
                    <LinearGradient
                      colors={colors.gradients.trainer}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.internalIcon}
                    >
                      <Swords size={16} color="#fff" strokeWidth={2.5} />
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.bodyBold, { color: theme.text }]}>{tour.title}</Text>
                      <View style={[styles.meta, { marginTop: spacing.xs }]}>
                        <Calendar size={13} color={theme.textTertiary} />
                        <Text style={[typography.caption, { color: theme.textSecondary }]}>
                          {formatDate(tour.date)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </LiquidGlassCard>
              </Animated.View>
            ))}
          </View>
        )}

        {/* Past tournaments (collapsible archive) */}
        {past.length > 0 && (
          <View style={styles.section}>
            <HapticPressable
              onPress={() => setArchiveOpen(o => !o)}
              haptic="selection"
              style={styles.archiveToggle}
            >
              <Text style={[styles.sectionLabel, { color: theme.textTertiary, marginBottom: 0 }]}>
                ПРОШЕДШИЕ ({past.length})
              </Text>
              {archiveOpen ? (
                <ChevronUp size={16} color={theme.textTertiary} />
              ) : (
                <ChevronDown size={16} color={theme.textTertiary} />
              )}
            </HapticPressable>

            {archiveOpen &&
              past.map((tour, index) => (
                <Animated.View
                  key={tour.id}
                  entering={FadeInDown.delay(index * 60).springify()}
                >
                  <LiquidGlassCard
                    dark={dark}
                    intensity="subtle"
                    radius={radius.lg}
                    padding={spacing.lg}
                    style={[styles.tourCardSimple, { opacity: 0.65 }]}
                  >
                    <Text style={[typography.bodyBold, { color: theme.text }]}>{tour.title}</Text>
                    <View style={[styles.meta, { marginTop: spacing.xs }]}>
                      <Calendar size={13} color={theme.textTertiary} />
                      <Text style={[typography.caption, { color: theme.textSecondary }]}>
                        {formatDate(tour.date)}
                      </Text>
                    </View>
                  </LiquidGlassCard>
                </Animated.View>
              ))}
          </View>
        )}

        {data.tournaments.length === 0 && internal.length === 0 && (
          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.emptyWrap}>
            <LinearGradient
              colors={colors.gradients.fire}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyIcon}
            >
              <Trophy size={28} color="#fff" strokeWidth={2} />
            </LinearGradient>
            <Text style={[typography.body, { color: theme.textTertiary, marginTop: spacing.md }]}>
              Нет турниров
            </Text>
          </Animated.View>
        )}

        <View style={{ height: 140 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.dark.bg },
  container: { flex: 1 },
  content: { paddingHorizontal: spacing.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { marginBottom: spacing.xl },
  sectionLabel: {
    ...typography.micro,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  tourCard: { marginBottom: spacing.sm, overflow: 'hidden' },
  tourCardSimple: { marginBottom: spacing.sm },
  cover: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  tourContent: { padding: spacing.lg },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  regBadge: { marginTop: spacing.sm, alignSelf: 'flex-start', borderRadius: radius.pill, overflow: 'hidden' },
  regGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
  },
  regText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  internalRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  internalIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  archiveToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.huge },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
