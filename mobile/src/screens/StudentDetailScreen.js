import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import Avatar from '../components/Avatar';
import GlassCard from '../components/GlassCard';
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
  const { t } = useTheme();

  const student = data.students.find(s => s.id === id);
  const group = data.groups.find(g => g.id === student?.groupId);

  if (!student) {
    return (
      <View style={[styles.container, { backgroundColor: t.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: t.textMuted }}>Ученик не найден</Text>
      </View>
    );
  }

  const expired = isExpired(student.subscriptionExpiresAt);
  const cleanPhone = (ph) => ph?.replace(/[^\d+]/g, '') || '';

  return (
    <ScrollView style={[styles.container, { backgroundColor: t.bg }]} contentContainerStyle={styles.content}>
      {/* Header */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={22} color={t.text} />
      </TouchableOpacity>

      {/* Avatar & name */}
      <View style={styles.center}>
        <Avatar name={student.name} src={student.avatar} size={100} />
        <Text style={[styles.name, { color: t.text }]}>{student.name}</Text>
        {student.belt && (
          <View style={styles.beltRow}>
            <View style={[styles.beltDot, { backgroundColor: BELT_COLORS[student.belt] || '#888' }]} />
            <Text style={[styles.beltText, { color: t.accent }]}>{student.belt}</Text>
          </View>
        )}
      </View>

      {/* Subscription */}
      <GlassCard>
        <View style={styles.row}>
          <Ionicons
            name={expired ? 'alert-circle' : 'checkmark-circle'}
            size={22}
            color={expired ? t.red : t.green}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: t.text }]}>
              {expired ? 'Абонемент истёк' : 'Абонемент активен'}
            </Text>
            <Text style={[styles.sublabel, { color: t.textMuted }]}>
              до {formatDate(student.subscriptionExpiresAt)}
            </Text>
          </View>
        </View>
      </GlassCard>

      {/* Info */}
      <GlassCard>
        {student.phone && (
          <View style={styles.row}>
            <Ionicons name="call-outline" size={18} color={t.textMuted} />
            <Text style={[styles.infoText, { color: t.text }]}>{student.phone}</Text>
          </View>
        )}
        {group && (
          <View style={styles.row}>
            <Ionicons name="layers-outline" size={18} color={t.textMuted} />
            <Text style={[styles.infoText, { color: t.text }]}>{group.name}</Text>
          </View>
        )}
        {student.weight && (
          <View style={styles.row}>
            <Ionicons name="barbell-outline" size={18} color={t.textMuted} />
            <Text style={[styles.infoText, { color: t.text }]}>{student.weight} кг</Text>
          </View>
        )}
        {student.birthDate && (
          <View style={styles.row}>
            <Ionicons name="calendar-outline" size={18} color={t.textMuted} />
            <Text style={[styles.infoText, { color: t.text }]}>{formatDate(student.birthDate)}</Text>
          </View>
        )}
      </GlassCard>

      {/* Contact buttons */}
      {student.phone && (
        <View style={styles.contactRow}>
          <TouchableOpacity
            style={[styles.contactBtn, { backgroundColor: '#22c55e' }]}
            onPress={() => Linking.openURL(`https://wa.me/${cleanPhone(student.phone)}`)}
          >
            <Ionicons name="logo-whatsapp" size={18} color="#fff" />
            <Text style={styles.contactText}>WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.contactBtn, { backgroundColor: t.accent }]}
            onPress={() => Linking.openURL(`tel:${cleanPhone(student.phone)}`)}
          >
            <Ionicons name="call" size={18} color="#fff" />
            <Text style={styles.contactText}>Позвонить</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16 },
  backBtn: { marginBottom: 12 },
  center: { alignItems: 'center', gap: 6, marginBottom: 16 },
  name: { fontSize: 22, fontWeight: '800' },
  beltRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  beltDot: { width: 18, height: 10, borderRadius: 5 },
  beltText: { fontSize: 14, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  label: { fontSize: 14, fontWeight: '600' },
  sublabel: { fontSize: 12 },
  infoText: { fontSize: 14, flex: 1 },
  contactRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  contactBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: 14, paddingVertical: 12,
  },
  contactText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
