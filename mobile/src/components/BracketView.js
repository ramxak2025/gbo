import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';

export default function BracketView({ brackets, sportType }) {
  const { dark, colors } = useTheme();
  const { students } = useData();

  if (!brackets?.rounds?.length) {
    return (
      <Text style={[styles.empty, { color: colors.textSecondary }]}>
        Сетка не создана
      </Text>
    );
  }

  const getName = (id) => {
    if (!id) return '—';
    const s = students.find(st => st.id === id);
    return s ? s.name : `#${id}`;
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.bracket}>
        {brackets.rounds.map((round, rIdx) => (
          <View key={rIdx} style={styles.round}>
            <Text style={[styles.roundTitle, { color: colors.textSecondary }]}>
              {rIdx === brackets.rounds.length - 1 ? 'Финал' : `Раунд ${rIdx + 1}`}
            </Text>
            {round.map((match, mIdx) => (
              <View
                key={mIdx}
                style={[styles.match, {
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                }]}
              >
                <View style={[styles.player, match.winner === match.player1 && styles.winner]}>
                  <Text
                    style={[
                      styles.playerName,
                      { color: match.winner === match.player1 ? colors.accent : colors.text },
                    ]}
                    numberOfLines={1}
                  >
                    {getName(match.player1)}
                  </Text>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />
                <View style={[styles.player, match.winner === match.player2 && styles.winner]}>
                  <Text
                    style={[
                      styles.playerName,
                      { color: match.winner === match.player2 ? colors.accent : colors.text },
                    ]}
                    numberOfLines={1}
                  >
                    {getName(match.player2)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bracket: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  round: {
    width: 160,
    justifyContent: 'space-around',
  },
  roundTitle: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  match: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    overflow: 'hidden',
  },
  player: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  winner: {
    backgroundColor: 'rgba(139,92,246,0.1)',
  },
  playerName: {
    fontSize: 13,
    fontWeight: '500',
  },
  divider: {
    height: 1,
  },
  empty: {
    textAlign: 'center',
    padding: 20,
    fontSize: 14,
  },
});
