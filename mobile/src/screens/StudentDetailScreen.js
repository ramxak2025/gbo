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
import Modal from '../components/Modal';
import { EditIcon, TrashIcon } from '../icons';
import { getRankLabel, getRankOptions, getSportLabel } from '../utils/sports';

export default function StudentDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { colors } = useTheme();
  const { auth } = useAuth();
  const { students, groups, transactions, attendance, deleteStudent, studentGroups } = useData();

  const student = students.find(s => s.id === id);
  if (!student) return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <PageHeader title="Ученик" back />
      <Text style={[styles.empty, { color: colors.textSecondary }]}>Ученик не найден</Text>
    </View>
  );

  const group = groups.find(g => g.id === student.groupId);
  const stuGroups = studentGroups.filter(sg => sg.studentId === id).map(sg => groups.find(g => g.id === sg.groupId)).filter(Boolean);
  const stuTx = transactions.filter(t => t.studentId === id);
  const stuAttendance = attendance.filter(a => a.studentId === id);

  const handleDelete = () => {
    Alert.alert('Удалить ученика?', student.name, [
      { text: 'Отмена' },
      { text: 'Удалить', style: 'destructive', onPress: async () => {
        try { await deleteStudent(id); navigation.goBack(); } catch (e) { Alert.alert('Ошибка', e.message); }
      }},
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <PageHeader title="Ученик" back>
        {auth?.role === 'trainer' && (
          <TouchableOpacity onPress={handleDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <TrashIcon size={20} color={colors.danger} />
          </TouchableOpacity>
        )}
      </PageHeader>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <Avatar name={student.name} photo={student.photo} size={80} />
          <Text style={[styles.name, { color: colors.text }]}>{student.name}</Text>
          {student.phone && <Text style={[styles.sub, { color: colors.textSecondary }]}>{student.phone}</Text>}
        </View>

        <GlassCard>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Вид спорта</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{getSportLabel(student.sportType)}</Text>
          </View>
          {student.rank && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{getRankLabel(student.sportType)}</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{student.rank}</Text>
            </View>
          )}
          {student.weight && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Вес</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{student.weight} кг</Text>
            </View>
          )}
          {student.birthDate && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Дата рождения</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {new Date(student.birthDate).toLocaleDateString('ru-RU')}
              </Text>
            </View>
          )}
        </GlassCard>

        {stuGroups.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Группы</Text>
            {stuGroups.map(g => (
              <GlassCard key={g.id}>
                <Text style={[styles.infoValue, { color: colors.text }]}>{g.name}</Text>
              </GlassCard>
            ))}
          </>
        )}

        {stuTx.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Платежи</Text>
            {stuTx.slice(0, 10).map(tx => (
              <GlassCard key={tx.id}>
                <View style={styles.row}>
                  <Text style={{ color: tx.type === 'income' ? colors.success : colors.danger, fontWeight: '700', fontSize: 15 }}>
                    {tx.type === 'income' ? '+' : '-'}{tx.amount?.toLocaleString()}р
                  </Text>
                  <Text style={[styles.sub, { color: colors.textSecondary, marginLeft: 8 }]}>
                    {new Date(tx.date || tx.createdAt).toLocaleDateString('ru-RU')}
                  </Text>
                </View>
              </GlassCard>
            ))}
          </>
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
  profileSection: { alignItems: 'center', paddingVertical: 16, marginBottom: 8 },
  name: { fontSize: 22, fontWeight: '800', marginTop: 12 },
  sub: { fontSize: 14, marginTop: 4 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  infoLabel: { fontSize: 14 },
  infoValue: { fontSize: 14, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '700', textTransform: 'uppercase', fontStyle: 'italic', marginTop: 16, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center' },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 14 },
});
