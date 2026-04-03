import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import PageHeader from '../components/PageHeader';
import GlassCard from '../components/GlassCard';
import Avatar from '../components/Avatar';
import { CheckIcon, XIcon, QRCodeIcon } from '../icons';
import QRGenerator from '../components/QRGenerator';
import { api } from '../api/client';

export default function AttendanceScreen({ route }) {
  const { groupId } = route.params;
  const { colors } = useTheme();
  const { auth } = useAuth();
  const { groups, students, attendance, saveAttendanceBulk } = useData();
  const [date] = useState(new Date().toISOString().split('T')[0]);
  const [marks, setMarks] = useState({});
  const [showQR, setShowQR] = useState(false);
  const [qrToken, setQrToken] = useState(null);

  const group = groups.find(g => g.id === groupId);
  const groupStudents = students.filter(s => s.groupId === groupId);

  const todayAttendance = attendance.filter(a => a.groupId === groupId && a.date === date);

  const isPresent = (studentId) => {
    if (marks[studentId] !== undefined) return marks[studentId];
    return todayAttendance.some(a => a.studentId === studentId && a.present);
  };

  const toggleMark = (studentId) => {
    setMarks(prev => ({ ...prev, [studentId]: !isPresent(studentId) }));
  };

  const handleSave = async () => {
    const records = groupStudents.map(s => ({
      studentId: s.id,
      present: isPresent(s.id),
    }));
    try {
      await saveAttendanceBulk(groupId, date, records);
      Alert.alert('Сохранено', 'Посещаемость сохранена');
    } catch (e) { Alert.alert('Ошибка', e.message); }
  };

  const handleShowQR = async () => {
    try {
      const result = await api.getQrToken(groupId);
      setQrToken(result.token);
      setShowQR(true);
    } catch (e) { Alert.alert('Ошибка', e.message); }
  };

  const presentCount = groupStudents.filter(s => isPresent(s.id)).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <PageHeader title={group?.name || 'Посещаемость'} back>
        {auth?.role === 'trainer' && (
          <TouchableOpacity onPress={handleShowQR} style={styles.iconBtn}>
            <QRCodeIcon size={22} color={colors.accent} />
          </TouchableOpacity>
        )}
      </PageHeader>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <GlassCard>
          <View style={styles.row}>
            <Text style={[styles.dateText, { color: colors.text }]}>
              {new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
            </Text>
            <Text style={[styles.countText, { color: colors.accent }]}>
              {presentCount}/{groupStudents.length}
            </Text>
          </View>
        </GlassCard>

        {showQR && qrToken && (
          <View style={styles.qrSection}>
            <QRGenerator value={`https://iborcuha.ru/qr-checkin/${qrToken}`} size={180} />
            <Text style={[styles.qrHint, { color: colors.textSecondary }]}>
              Покажите QR ученикам для отметки
            </Text>
          </View>
        )}

        {groupStudents.map(s => (
          <TouchableOpacity
            key={s.id}
            onPress={() => auth?.role === 'trainer' && toggleMark(s.id)}
            activeOpacity={auth?.role === 'trainer' ? 0.7 : 1}
          >
            <GlassCard>
              <View style={styles.row}>
                <Avatar name={s.name} photo={s.photo} size={40} />
                <Text style={[styles.name, { color: colors.text, flex: 1, marginLeft: 12 }]}>{s.name}</Text>
                <View style={[styles.mark, { backgroundColor: isPresent(s.id) ? colors.success : 'rgba(255,255,255,0.1)' }]}>
                  {isPresent(s.id) ? <CheckIcon size={16} color="#fff" /> : <XIcon size={16} color={colors.textSecondary} />}
                </View>
              </View>
            </GlassCard>
          </TouchableOpacity>
        ))}

        {auth?.role === 'trainer' && groupStudents.length > 0 && (
          <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: colors.accent }]}>
            <Text style={styles.saveText}>Сохранить</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateText: { fontSize: 16, fontWeight: '600' },
  countText: { fontSize: 16, fontWeight: '700' },
  name: { fontSize: 15, fontWeight: '500' },
  mark: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  iconBtn: { padding: 4 },
  qrSection: { alignItems: 'center', marginVertical: 16 },
  qrHint: { fontSize: 13, marginTop: 12, textAlign: 'center' },
  saveBtn: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
