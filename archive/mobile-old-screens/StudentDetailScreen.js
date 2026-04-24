import React from 'react';
import { View, Text, ScrollView, Linking, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, AlertCircle, CheckCircle, Phone, Layers, Dumbbell, Calendar } from 'lucide-react-native';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import Avatar from '../components/Avatar';
import { LiquidGlassCard, HapticPressable, AmbientBackground, GlowButton } from '../design';
import { colors, radius, typography } from '../design/tokens';
import { BELT_COLORS, getSportLabel } from '../utils/sports';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function isExpired(dateStr) {
  if (!dateStr) return true;
  return new Date(dateStr) < new Date();
}

export default function StudentDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { data } = useData();
  const { t, dark } = useTheme();

  const theme = dark ? colors.dark : colors.light;

  const student = data.students.find(s => s.id === id);
  const group = data.groups.find(g => g.id === student?.groupId);

  if (!student) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <AmbientBackground />
        <Text style={{ color: theme.textTertiary }}>Ученик не найден</Text>
      </View>
    );
  }

  const expired = isExpired(student.subscriptionExpiresAt);
  const cleanPhone = (ph) => ph?.replace(/[^\d+]/g, '') || '';

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} contentContainerStyle={styles.content}>
      <AmbientBackground />

      {/* Header */}
      <Animated.View entering={FadeInDown.delay(0).springify()}>
        <HapticPressable haptic="light" style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={22} color={theme.text} />
        </HapticPressable>
      </Animated.View>

      {/* Avatar & name */}
      <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.center}>
        <Avatar name={student.name} src={student.avatar} size={100} />
        <Text style={[styles.name, { color: theme.text }]}>{student.name}</Text>
        {student.belt && (
          <View style={styles.beltRow}>
            <View style={[styles.beltDot, { backgroundColor: BELT_COLORS[student.belt] || '#888' }]} />
            <Text style={[styles.beltText, { color: colors.semantic.purple }]}>{student.belt}</Text>
          </View>
        )}
      </Animated.View>

      {/* Subscription */}
      <Animated.View entering={FadeInDown.delay(160).springify()}>
        <LiquidGlassCard dark={dark} radius={20} padding={16}>
          <View style={styles.row}>
            {expired ? (
              <AlertCircle size={22} color={colors.semantic.danger} />
            ) : (
              <CheckCircle size={22} color={colors.semantic.success} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: theme.text }]}>
                {expired ? 'Абонемент истёк' : 'Абонемент активен'}
              </Text>
              <Text style={[styles.sublabel, { color: theme.textSecondary }]}>
                до {formatDate(student.subscriptionExpiresAt)}
              </Text>
            </View>
          </View>
        </LiquidGlassCard>
      </Animated.View>

      {/* Info */}
      <Animated.View entering={FadeInDown.delay(240).springify()}>
        <LiquidGlassCard dark={dark} radius={20} padding={16}>
          {student.phone && (
            <View style={styles.row}>
              <Phone size={18} color={theme.textTertiary} />
              <Text style={[styles.infoText, { color: theme.text }]}>{student.phone}</Text>
            </View>
          )}
          {group && (
            <View style={styles.row}>
              <Layers size={18} color={theme.textTertiary} />
              <Text style={[styles.infoText, { color: theme.text }]}>{group.name}</Text>
            </View>
          )}
          {student.weight && (
            <View style={styles.row}>
              <Dumbbell size={18} color={theme.textTertiary} />
              <Text style={[styles.infoText, { color: theme.text }]}>{student.weight} кг</Text>
            </View>
          )}
          {student.birthDate && (
            <View style={styles.row}>
              <Calendar size={18} color={theme.textTertiary} />
              <Text style={[styles.infoText, { color: theme.text }]}>{formatDate(student.birthDate)}</Text>
            </View>
          )}
        </LiquidGlassCard>
      </Animated.View>

      {/* Contact buttons */}
      {student.phone && (
        <Animated.View entering={FadeInDown.delay(320).springify()} style={styles.contactRow}>
          <HapticPressable
            haptic="light"
            style={[styles.contactBtn, { backgroundColor: '#22c55e' }]}
            onPress={() => Linking.openURL(`https://wa.me/${cleanPhone(student.phone)}`)}
          >
            <Text style={styles.contactText}>WhatsApp</Text>
          </HapticPressable>
          <HapticPressable
            haptic="light"
            style={[styles.contactBtn, { backgroundColor: colors.semantic.purple }]}
            onPress={() => Linking.openURL(`tel:${cleanPhone(student.phone)}`)}
          >
            <Phone size={18} color="#fff" />
            <Text style={styles.contactText}>Позвонить</Text>
          </HapticPressable>
        </Animated.View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 140 },
  backBtn: { marginBottom: 12 },
  center: { alignItems: 'center', gap: 6, marginBottom: 16 },
  name: { ...typography.title2 },
  beltRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  beltDot: { width: 18, height: 10, borderRadius: 5 },
  beltText: { fontSize: 14, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  label: { ...typography.callout },
  sublabel: { ...typography.caption },
  infoText: { fontSize: 14, flex: 1 },
  contactRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  contactBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: radius.md, paddingVertical: 12,
  },
  contactText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
