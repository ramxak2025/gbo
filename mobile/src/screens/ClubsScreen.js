import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Shield, MapPin, Users, Award } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { LiquidGlassCard, HapticPressable, AmbientBackground, GlowButton } from '../design';
import { colors, radius, typography } from '../design/tokens';
import PageHeader from '../components/PageHeader';

export default function ClubsScreen() {
  const { auth } = useAuth();
  const { data } = useData();
  const { t, dark } = useTheme();
  const navigation = useNavigation();

  const theme = dark ? colors.dark : colors.light;
  const clubs = data.clubs || [];
  const trainers = useMemo(() => data.users.filter(u => u.role === 'trainer'), [data.users]);

  if (auth?.role !== 'superadmin') {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <AmbientBackground />
        <Text style={{ color: theme.textTertiary }}>Доступ только для администратора</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} contentContainerStyle={styles.content}>
      <AmbientBackground />
      <PageHeader title="Клубы" />

      {clubs.length === 0 ? (
        <Animated.View entering={FadeInDown.delay(100).springify()} style={{ alignItems: 'center', marginTop: 40 }}>
          <Shield size={48} color={theme.textTertiary} />
          <Text style={{ color: theme.textTertiary, marginTop: 12 }}>Клубов пока нет</Text>
        </Animated.View>
      ) : (
        clubs.map((c, index) => {
          const clubTrainers = trainers.filter(tr => tr.clubId === c.id);
          const head = clubTrainers.find(tr => tr.isHeadTrainer);
          return (
            <Animated.View key={c.id} entering={FadeInDown.delay(index * 80).springify()}>
              <LiquidGlassCard dark={dark} radius={20} padding={16} style={{ marginBottom: 10 }}>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.text, fontWeight: '700', fontSize: 16 }}>{c.name}</Text>
                    {c.city && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <MapPin size={11} color={theme.textTertiary} />
                        <Text style={{ color: theme.textTertiary, fontSize: 11 }}>{c.city}</Text>
                      </View>
                    )}
                    <View style={styles.metaRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Users size={11} color={theme.textTertiary} />
                        <Text style={[styles.meta, { color: theme.textTertiary }]}>{clubTrainers.length} тренеров</Text>
                      </View>
                      {head && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Award size={11} color="#eab308" />
                          <Text style={[styles.meta, { color: '#eab308' }]}>{head.name}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </LiquidGlassCard>
            </Animated.View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 140 },
  row: { flexDirection: 'row', alignItems: 'center' },
  metaRow: { flexDirection: 'row', gap: 12, marginTop: 6 },
  meta: { fontSize: 11 },
});
