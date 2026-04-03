import React from 'react';
import {
  View, Text, ScrollView, StyleSheet,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import PageHeader from '../components/PageHeader';
import GlassCard from '../components/GlassCard';
import Avatar from '../components/Avatar';
import { CalendarIcon, CheckIcon, XIcon } from '../icons';

export default function ParentClubScreen() {
  const { colors } = useTheme();
  const { auth } = useAuth();
  const { students, groups, attendance, transactions } = useData();

  // Find child via parent's studentId link
  const child = students.find(s => s.id === auth?.student?.id) || students[0];
  const childGroup = child ? groups.find(g => g.id === child.groupId) : null;

  const childAttendance = child ? attendance.filter(a => a.studentId === child.id) : [];
  const childTx = child ? transactions.filter(t => t.studentId === child.id) : [];

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <PageHeader title="Клуб" />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {child ? (
          <>
            <View style={styles.profileSection}>
              <Avatar name={child.name} photo={child.photo} size={64} />
              <Text style={[styles.name, { color: colors.text }]}>{child.name}</Text>
              {childGroup && <Text style={[styles.sub, { color: colors.textSecondary }]}>{childGroup.name}</Text>}
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>Посещаемость</Text>
            <GlassCard>
              <Text style={[styles.statNum, { color: colors.text, textAlign: 'center' }]}>
                {childAttendance.filter(a => a.present).length}
              </Text>
              <Text style={[styles.sub, { color: colors.textSecondary, textAlign: 'center' }]}>
                занятий посещено
              </Text>
            </GlassCard>

            {childAttendance.slice(-10).reverse().map((a, i) => (
              <GlassCard key={i}>
                <View style={styles.row}>
                  <CalendarIcon size={16} color={colors.textSecondary} />
                  <Text style={[styles.dateText, { color: colors.text }]}>
                    {new Date(a.date).toLocaleDateString('ru-RU')}
                  </Text>
                  {a.present ?
                    <CheckIcon size={18} color={colors.success} /> :
                    <XIcon size={18} color={colors.danger} />
                  }
                </View>
              </GlassCard>
            ))}

            {childTx.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Платежи</Text>
                {childTx.slice(0, 5).map(tx => (
                  <GlassCard key={tx.id}>
                    <View style={styles.row}>
                      <Text style={{ color: tx.type === 'income' ? colors.success : colors.danger, fontWeight: '700' }}>
                        {tx.amount?.toLocaleString()}р
                      </Text>
                      <Text style={[styles.sub, { color: colors.textSecondary }]}>
                        {new Date(tx.date || tx.createdAt).toLocaleDateString('ru-RU')}
                      </Text>
                    </View>
                  </GlassCard>
                ))}
              </>
            )}
          </>
        ) : (
          <Text style={[styles.empty, { color: colors.textSecondary }]}>Информация о ребенке не найдена</Text>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },
  profileSection: { alignItems: 'center', paddingVertical: 16 },
  name: { fontSize: 20, fontWeight: '800', marginTop: 10 },
  sub: { fontSize: 14, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', textTransform: 'uppercase', fontStyle: 'italic', marginTop: 16, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateText: { fontSize: 14, flex: 1, marginLeft: 8 },
  statNum: { fontSize: 32, fontWeight: '800' },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 14 },
});
