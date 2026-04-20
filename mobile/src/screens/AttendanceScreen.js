import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../utils/api';
import GlassCard from '../components/GlassCard';
import PageHeader from '../components/PageHeader';
import Avatar from '../components/Avatar';

function toDateKey(d) {
  return d.toISOString().split('T')[0];
}

export default function AttendanceScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const groupId = route.params?.groupId;
  const { data, reload } = useData();
  const { t, dark } = useTheme();

  const [date, setDate] = useState(toDateKey(new Date()));
  const [saving, setSaving] = useState(false);

  const group = useMemo(() => data.groups.find(g => g.id === groupId), [data.groups, groupId]);
  const students = useMemo(
    () => data.students.filter(s => s.groupId === groupId).sort((a, b) => a.name.localeCompare(b.name, 'ru')),
    [data.students, groupId]
  );
  const dayRecords = useMemo(
    () => data.attendance.filter(a => a.groupId === groupId && a.date === date),
    [data.attendance, groupId, date]
  );

  const isPresent = (studentId) => {
    const rec = dayRecords.find(r => r.studentId === studentId);
    return rec ? rec.present : false;
  };
  const isMarked = (studentId) => dayRecords.some(r => r.studentId === studentId);

  const toggle = async (studentId) => {
    if (saving) return;
    setSaving(true);
    try {
      const currentMarked = isMarked(studentId);
      const currentPresent = isPresent(studentId);
      if (currentMarked && currentPresent === false) {
        // cycle: absent → remove
        await api.deleteAttendance({ groupId, studentId, date });
      } else {
        await api.saveAttendance({ groupId, studentId, date, present: !currentPresent });
      }
      await reload();
    } finally { setSaving(false); }
  };

  const markAllPresent = async () => {
    setSaving(true);
    try {
      await api.saveAttendanceBulk({
        groupId, date,
        records: students.map(s => ({ studentId: s.id, present: true })),
      });
      await reload();
    } finally { setSaving(false); }
  };

  if (!group) {
    return (
      <View style={[styles.container, { backgroundColor: t.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: t.textMuted }}>Группа не найдена</Text>
      </View>
    );
  }

  const shiftDay = (delta) => {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    setDate(toDateKey(d));
  };

  const presentCount = dayRecords.filter(r => r.present).length;

  return (
    <ScrollView style={[styles.container, { backgroundColor: t.bg }]} contentContainerStyle={styles.content}>
      <PageHeader title="Посещаемость" back />

      <GlassCard style={{ marginBottom: 12 }}>
        <Text style={{ color: t.text, fontSize: 16, fontWeight: '700' }}>{group.name}</Text>
        <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 4 }}>{group.schedule}</Text>

        <View style={styles.dateRow}>
          <TouchableOpacity onPress={() => shiftDay(-1)} style={styles.dayBtn}>
            <Ionicons name="chevron-back" size={20} color={t.text} />
          </TouchableOpacity>
          <Text style={{ color: t.text, fontWeight: '700' }}>{new Date(date).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
          <TouchableOpacity onPress={() => shiftDay(1)} style={styles.dayBtn}>
            <Ionicons name="chevron-forward" size={20} color={t.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.summaryRow}>
          <Text style={{ color: t.textMuted, fontSize: 12 }}>
            Присутствуют: <Text style={{ color: t.accent, fontWeight: '700' }}>{presentCount}</Text> / {students.length}
          </Text>
          <TouchableOpacity onPress={markAllPresent} disabled={saving} style={[styles.markAllBtn, { borderColor: t.accent }]}>
            <Text style={{ color: t.accent, fontSize: 12, fontWeight: '700' }}>Все пришли</Text>
          </TouchableOpacity>
        </View>
      </GlassCard>

      {students.length === 0 ? (
        <Text style={{ color: t.textMuted, textAlign: 'center', marginTop: 40 }}>
          В группе пока нет спортсменов
        </Text>
      ) : (
        students.map(s => {
          const marked = isMarked(s.id);
          const present = isPresent(s.id);
          return (
            <TouchableOpacity
              key={s.id}
              onPress={() => toggle(s.id)}
              disabled={saving}
              style={[styles.row, { backgroundColor: dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)' }]}
            >
              <Avatar name={s.name} src={s.avatar} size={40} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: t.text, fontWeight: '600' }}>{s.name}</Text>
                {s.belt && <Text style={{ color: t.textMuted, fontSize: 11 }}>{s.belt}</Text>}
              </View>
              <View style={[
                styles.statusDot,
                !marked ? styles.statusUnset : (present ? styles.statusPresent : styles.statusAbsent),
              ]}>
                <Ionicons
                  name={!marked ? 'help' : (present ? 'checkmark' : 'close')}
                  size={18}
                  color="white"
                />
              </View>
            </TouchableOpacity>
          );
        })
      )}

      {saving && (
        <View style={styles.saving}>
          <ActivityIndicator size="small" color={t.accent} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 80 },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  dayBtn: { padding: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  markAllBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1 },
  row: {
    flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, marginBottom: 8,
  },
  statusDot: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
  },
  statusUnset: { backgroundColor: '#6b7280' },
  statusPresent: { backgroundColor: '#10b981' },
  statusAbsent: { backgroundColor: '#ef4444' },
  saving: { position: 'absolute', top: 20, right: 20 },
});
