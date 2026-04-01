import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Dimensions, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { getColors } from '../utils/theme';
import {
  getSportLabel, getVictoryTypes, getVictoryLabel, setMatchWinner,
} from '../utils/sports';
import GlassCard from '../components/GlassCard';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MATCH_CARD_WIDTH = 200;
const ROUND_GAP = 24;

export default function InternalTournamentDetailScreen() {
  const { dark } = useTheme();
  const { auth } = useAuth();
  const { data, updateInternalTournament, deleteInternalTournament } = useData();
  const navigation = useNavigation();
  const route = useRoute();
  const c = getColors(dark);

  const { id } = route.params;
  const tournament = useMemo(
    () => (data.internalTournaments || []).find(t => t.id === id),
    [data.internalTournaments, id],
  );

  const [winnerModal, setWinnerModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null); // { roundIdx, matchIdx }
  const [selectedWinner, setSelectedWinner] = useState(null);
  const [selectedVictoryType, setSelectedVictoryType] = useState(null);
  const [saving, setSaving] = useState(false);

  const isAdmin = auth?.role === 'superadmin' || auth?.role === 'trainer' || auth?.role === 'club_admin';

  const studentsMap = useMemo(() => {
    const map = {};
    for (const s of data.students || []) {
      map[s.id] = s;
    }
    return map;
  }, [data.students]);

  const getStudentName = useCallback((sid) => {
    if (!sid) return 'TBD';
    return studentsMap[sid]?.name || 'Неизвестный';
  }, [studentsMap]);

  const brackets = tournament?.brackets || { rounds: [] };
  const rounds = brackets.rounds || [];
  const sportType = tournament?.sportType || 'bjj';
  const victoryTypes = useMemo(() => getVictoryTypes(sportType), [sportType]);

  const openWinnerModal = useCallback((roundIdx, matchIdx) => {
    const match = rounds[roundIdx]?.[matchIdx];
    if (!match || !match.s1 || !match.s2) return;
    if (!isAdmin) return;
    setSelectedMatch({ roundIdx, matchIdx });
    setSelectedWinner(match.winner || null);
    setSelectedVictoryType(match.victoryType || null);
    setWinnerModal(true);
  }, [rounds, isAdmin]);

  const handleSetWinner = useCallback(async () => {
    if (!selectedMatch || !selectedWinner) return;
    setSaving(true);
    try {
      const newBrackets = setMatchWinner(
        brackets,
        selectedMatch.roundIdx,
        selectedMatch.matchIdx,
        selectedWinner,
      );
      // Store victory type in the match
      const match = newBrackets.rounds[selectedMatch.roundIdx][selectedMatch.matchIdx];
      match.victoryType = selectedVictoryType;

      // Check if tournament is completed (final match has winner)
      const finalRound = newBrackets.rounds[newBrackets.rounds.length - 1];
      const isCompleted = finalRound && finalRound[0]?.winner;

      await updateInternalTournament(id, {
        brackets: newBrackets,
        status: isCompleted ? 'completed' : 'active',
        winner: isCompleted ? finalRound[0].winner : null,
      });
      setWinnerModal(false);
    } catch (e) {
      Alert.alert('Ошибка', e.message || 'Не удалось сохранить результат');
    } finally {
      setSaving(false);
    }
  }, [selectedMatch, selectedWinner, selectedVictoryType, brackets, id, updateInternalTournament]);

  const handleDelete = useCallback(() => {
    Alert.alert('Удалить турнир?', 'Это действие нельзя отменить.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить', style: 'destructive', onPress: async () => {
          try {
            await deleteInternalTournament(id);
            navigation.goBack();
          } catch (e) {
            Alert.alert('Ошибка', e.message);
          }
        },
      },
    ]);
  }, [id, deleteInternalTournament, navigation]);

  const getRoundLabel = (roundIdx, totalRounds) => {
    if (roundIdx === totalRounds - 1) return 'Финал';
    if (roundIdx === totalRounds - 2) return 'Полуфинал';
    if (roundIdx === totalRounds - 3) return '1/4 финала';
    return `Раунд ${roundIdx + 1}`;
  };

  if (!tournament) {
    return (
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <PageHeader title="Клубный турнир" back onBack={() => navigation.goBack()} />
        <View style={styles.loader}>
          <Text style={[styles.emptyText, { color: c.textSecondary }]}>Турнир не найден</Text>
        </View>
      </View>
    );
  }

  const totalRounds = rounds.length;
  const winner = tournament.winner;

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <PageHeader
        title="Клубный турнир"
        back
        onBack={() => navigation.goBack()}
        rightAction={
          isAdmin ? (
            <TouchableOpacity onPress={handleDelete} activeOpacity={0.6}>
              <Ionicons name="trash-outline" size={22} color={c.red} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Tournament Info Header */}
        <GlassCard style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={[styles.sportBadge, { backgroundColor: c.purpleBg }]}>
              <MaterialCommunityIcons name="karate" size={14} color={c.purple} />
              <Text style={[styles.sportBadgeText, { color: c.purple }]}>
                {getSportLabel(sportType)}
              </Text>
            </View>
            {tournament.weightClass && (
              <View style={[styles.sportBadge, { backgroundColor: c.blueBg }]}>
                <MaterialCommunityIcons name="weight" size={14} color={c.blue} />
                <Text style={[styles.sportBadgeText, { color: c.blue }]}>
                  {tournament.weightClass}
                </Text>
              </View>
            )}
            {tournament.status === 'completed' && (
              <View style={[styles.sportBadge, { backgroundColor: c.greenBg }]}>
                <Ionicons name="checkmark-circle" size={14} color={c.green} />
                <Text style={[styles.sportBadgeText, { color: c.green }]}>Завершён</Text>
              </View>
            )}
          </View>

          <Text style={[styles.participantCount, { color: c.textSecondary }]}>
            {(tournament.participants || []).length} участников
          </Text>

          {/* Winner */}
          {winner && (
            <View style={[styles.winnerBanner, { backgroundColor: c.yellowBg }]}>
              <MaterialCommunityIcons name="trophy" size={20} color={c.yellow} />
              <Text style={[styles.winnerText, { color: c.yellow }]}>
                Победитель: {getStudentName(winner)}
              </Text>
            </View>
          )}
        </GlassCard>

        {/* Bracket View */}
        {rounds.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.bracketContainer}
          >
            {rounds.map((round, roundIdx) => {
              const roundMatchCount = round.length;
              const totalBracketHeight = Math.max(rounds[0].length * 90, 300);
              const matchSpacing = totalBracketHeight / roundMatchCount;

              return (
                <View key={roundIdx} style={styles.roundColumn}>
                  <Text style={[styles.roundLabel, { color: c.textSecondary }]}>
                    {getRoundLabel(roundIdx, totalRounds)}
                  </Text>
                  <View style={[styles.roundMatches, { minHeight: totalBracketHeight }]}>
                    {round.map((match, matchIdx) => {
                      const isClickable = isAdmin && match.s1 && match.s2 && !match.winner;
                      const hasWinner = !!match.winner;
                      const topY = matchSpacing * matchIdx + (matchSpacing - 80) / 2;

                      return (
                        <TouchableOpacity
                          key={matchIdx}
                          style={[
                            styles.matchCard,
                            {
                              backgroundColor: dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.8)',
                              borderColor: hasWinner ? c.green : c.border,
                              top: topY,
                            },
                          ]}
                          onPress={() => isClickable && openWinnerModal(roundIdx, matchIdx)}
                          activeOpacity={isClickable ? 0.7 : 1}
                          disabled={!isClickable}
                        >
                          {/* Slot 1 */}
                          <View style={[
                            styles.matchSlot,
                            { borderBottomColor: c.border },
                            match.winner === match.s1 && match.s1 && { backgroundColor: c.greenBg },
                          ]}>
                            <Text
                              style={[
                                styles.matchName,
                                { color: match.s1 ? c.text : c.textTertiary },
                                match.winner === match.s1 && match.s1 && { fontWeight: '700' },
                              ]}
                              numberOfLines={1}
                            >
                              {getStudentName(match.s1)}
                            </Text>
                            {match.winner === match.s1 && match.s1 && (
                              <Ionicons name="checkmark-circle" size={14} color={c.green} />
                            )}
                          </View>

                          {/* Slot 2 */}
                          <View style={[
                            styles.matchSlot,
                            match.winner === match.s2 && match.s2 && { backgroundColor: c.greenBg },
                          ]}>
                            <Text
                              style={[
                                styles.matchName,
                                { color: match.s2 ? c.text : c.textTertiary },
                                match.winner === match.s2 && match.s2 && { fontWeight: '700' },
                              ]}
                              numberOfLines={1}
                            >
                              {getStudentName(match.s2)}
                            </Text>
                            {match.winner === match.s2 && match.s2 && (
                              <Ionicons name="checkmark-circle" size={14} color={c.green} />
                            )}
                          </View>

                          {/* Victory type label */}
                          {match.victoryType && (
                            <View style={[styles.victoryLabel, { backgroundColor: c.purpleBg }]}>
                              <Text style={[styles.victoryLabelText, { color: c.purple }]}>
                                {getVictoryLabel(sportType, match.victoryType)}
                              </Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="tournament" size={48} color={c.textTertiary} />
            <Text style={[styles.emptyText, { color: c.textSecondary }]}>
              Сетка не сгенерирована
            </Text>
          </View>
        )}

        {/* Participants List */}
        <GlassCard style={styles.participantsCard}>
          <View style={styles.participantsHeader}>
            <Ionicons name="people-outline" size={18} color={c.purple} />
            <Text style={[styles.participantsTitle, { color: c.text }]}>Участники</Text>
          </View>
          {(tournament.participants || []).map((pid, idx) => {
            const student = studentsMap[pid];
            const isWinner = pid === winner;
            return (
              <View key={pid || idx} style={[styles.participantRow, { borderBottomColor: c.border }]}>
                <View style={[styles.participantAvatar, { backgroundColor: isWinner ? c.yellowBg : c.purpleBg }]}>
                  {isWinner ? (
                    <MaterialCommunityIcons name="trophy" size={14} color={c.yellow} />
                  ) : (
                    <Text style={[styles.participantAvatarText, { color: c.purple }]}>
                      {(student?.name || '?')[0].toUpperCase()}
                    </Text>
                  )}
                </View>
                <Text style={[styles.participantName, { color: c.text }]}>
                  {student?.name || 'Неизвестный'}
                </Text>
              </View>
            );
          })}
        </GlassCard>
      </ScrollView>

      {/* Set Winner Modal */}
      <Modal visible={winnerModal} onClose={() => setWinnerModal(false)} title="Результат поединка">
        {selectedMatch && rounds[selectedMatch.roundIdx]?.[selectedMatch.matchIdx] && (() => {
          const match = rounds[selectedMatch.roundIdx][selectedMatch.matchIdx];
          return (
            <View>
              <Text style={[styles.modalSubtitle, { color: c.textSecondary }]}>
                Выберите победителя
              </Text>

              {/* Fighter 1 */}
              <TouchableOpacity
                style={[
                  styles.fighterOption,
                  { borderColor: selectedWinner === match.s1 ? c.purple : c.border },
                  selectedWinner === match.s1 && { backgroundColor: c.purpleBg },
                ]}
                onPress={() => setSelectedWinner(match.s1)}
              >
                <View style={[styles.radioCircle, {
                  borderColor: selectedWinner === match.s1 ? c.purple : c.textTertiary,
                  backgroundColor: selectedWinner === match.s1 ? c.purple : 'transparent',
                }]}>
                  {selectedWinner === match.s1 && (
                    <View style={styles.radioInner} />
                  )}
                </View>
                <Text style={[styles.fighterName, { color: c.text }]}>
                  {getStudentName(match.s1)}
                </Text>
              </TouchableOpacity>

              {/* Fighter 2 */}
              <TouchableOpacity
                style={[
                  styles.fighterOption,
                  { borderColor: selectedWinner === match.s2 ? c.purple : c.border },
                  selectedWinner === match.s2 && { backgroundColor: c.purpleBg },
                ]}
                onPress={() => setSelectedWinner(match.s2)}
              >
                <View style={[styles.radioCircle, {
                  borderColor: selectedWinner === match.s2 ? c.purple : c.textTertiary,
                  backgroundColor: selectedWinner === match.s2 ? c.purple : 'transparent',
                }]}>
                  {selectedWinner === match.s2 && (
                    <View style={styles.radioInner} />
                  )}
                </View>
                <Text style={[styles.fighterName, { color: c.text }]}>
                  {getStudentName(match.s2)}
                </Text>
              </TouchableOpacity>

              {/* Victory Type */}
              <Text style={[styles.modalSubtitle, { color: c.textSecondary, marginTop: 20 }]}>
                Тип победы
              </Text>
              <View style={styles.victoryTypesWrap}>
                {victoryTypes.map(vt => (
                  <TouchableOpacity
                    key={vt.id}
                    style={[
                      styles.victoryTypeChip,
                      {
                        borderColor: selectedVictoryType === vt.id ? c.purple : c.glassBorder,
                        backgroundColor: selectedVictoryType === vt.id ? c.purpleBg : c.glass,
                      },
                    ]}
                    onPress={() => setSelectedVictoryType(vt.id)}
                  >
                    <Text style={{
                      color: selectedVictoryType === vt.id ? c.purple : c.textSecondary,
                      fontSize: 13,
                      fontWeight: selectedVictoryType === vt.id ? '600' : '400',
                    }}>
                      {vt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Confirm Button */}
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  { backgroundColor: c.purple, opacity: (!selectedWinner || saving) ? 0.5 : 1 },
                ]}
                onPress={handleSetWinner}
                disabled={!selectedWinner || saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Подтвердить</Text>
                )}
              </TouchableOpacity>
            </View>
          );
        })()}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 100 },
  infoCard: { marginHorizontal: 16, marginTop: 16 },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  sportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  sportBadgeText: { fontSize: 12, fontWeight: '600' },
  participantCount: { fontSize: 13, marginTop: 4 },
  winnerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
  },
  winnerText: { fontSize: 14, fontWeight: '700', flex: 1 },

  // Bracket
  bracketContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: ROUND_GAP,
  },
  roundColumn: {
    width: MATCH_CARD_WIDTH + ROUND_GAP,
  },
  roundLabel: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  roundMatches: {
    position: 'relative',
  },
  matchCard: {
    position: 'absolute',
    left: 0,
    width: MATCH_CARD_WIDTH,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  matchSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  matchName: {
    fontSize: 13,
    flex: 1,
    marginRight: 4,
  },
  victoryLabel: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignItems: 'center',
  },
  victoryLabelText: { fontSize: 10, fontWeight: '600' },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: { fontSize: 15, fontWeight: '500' },

  // Participants
  participantsCard: { marginHorizontal: 16, marginTop: 16 },
  participantsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  participantsTitle: { fontSize: 15, fontWeight: '700' },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  participantAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  participantAvatarText: { fontSize: 13, fontWeight: '700' },
  participantName: { fontSize: 14, fontWeight: '500' },

  // Winner Modal
  modalSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  fighterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  fighterName: { fontSize: 15, fontWeight: '600', flex: 1 },
  victoryTypesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  victoryTypeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  confirmButton: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
