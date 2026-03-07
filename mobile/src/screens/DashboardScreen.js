import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import GlassCard from '../components/GlassCard';
import Avatar from '../components/Avatar';
import PageHeader from '../components/PageHeader';
import { getSportLabel } from '../utils/sports';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function isExpired(dateStr) {
  if (!dateStr) return true;
  return new Date(dateStr) < new Date();
}

export default function DashboardScreen({ navigation }) {
  const { auth } = useAuth();
  const { data } = useData();
  const { t, dark } = useTheme();

  const isTrainer = auth.role === 'trainer';
  const isAdmin = auth.role === 'superadmin';

  const myStudents = isAdmin ? data.students : data.students.filter(s => s.trainerId === auth.userId);
  const myGroups = isAdmin ? data.groups : data.groups.filter(g => g.trainerId === auth.userId);

  const stats = useMemo(() => {
    const now = new Date();
    const monthTx = data.transactions.filter(tx => {
      const d = new Date(tx.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const income = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const expense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    const expired = myStudents.filter(s => isExpired(s.subscriptionExpiresAt)).length;
    const active = myStudents.length - expired;
    const sick = myStudents.filter(s => s.status === 'sick' || s.status === 'injury').length;

    return { income, expense, total: myStudents.length, active, expired, sick };
  }, [data, myStudents]);

  const upcomingTournaments = data.tournaments
    .filter(t => new Date(t.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);

  const recentNews = data.news.slice(0, 3);

  if (auth.role === 'student') {
    return <StudentDashboard auth={auth} data={data} t={t} dark={dark} navigation={navigation} />;
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: t.bg }]} contentContainerStyle={styles.content}>
      <PageHeader title={isAdmin ? 'Панель' : 'Главная'} />

      {/* Stats cards */}
      <View style={styles.statsRow}>
        <GlassCard style={styles.statCard}>
          <Ionicons name="people" size={20} color={t.accent} />
          <Text style={[styles.statNum, { color: t.text }]}>{stats.total}</Text>
          <Text style={[styles.statLabel, { color: t.textSecondary }]}>Всего</Text>
        </GlassCard>
        <GlassCard style={styles.statCard}>
          <Ionicons name="checkmark-circle" size={20} color={t.green} />
          <Text style={[styles.statNum, { color: t.text }]}>{stats.active}</Text>
          <Text style={[styles.statLabel, { color: t.textSecondary }]}>Активных</Text>
        </GlassCard>
        <GlassCard style={styles.statCard}>
          <Ionicons name="alert-circle" size={20} color={t.red} />
          <Text style={[styles.statNum, { color: t.text }]}>{stats.expired}</Text>
          <Text style={[styles.statLabel, { color: t.textSecondary }]}>Просрочено</Text>
        </GlassCard>
      </View>

      {/* Finance summary for trainer */}
      {isTrainer && (
        <GlassCard onPress={() => navigation.navigate('Cash')}>
          <View style={styles.financeRow}>
            <View style={styles.financeItem}>
              <Ionicons name="trending-up" size={18} color={t.green} />
              <Text style={[styles.financeNum, { color: t.green }]}>
                +{stats.income.toLocaleString('ru-RU')}
              </Text>
            </View>
            <View style={styles.financeItem}>
              <Ionicons name="trending-down" size={18} color={t.red} />
              <Text style={[styles.financeNum, { color: t.red }]}>
                -{stats.expense.toLocaleString('ru-RU')}
              </Text>
            </View>
          </View>
          <Text style={[styles.financeLabel, { color: t.textMuted }]}>Финансы за месяц</Text>
        </GlassCard>
      )}

      {/* Groups */}
      {myGroups.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: t.textSecondary }]}>ГРУППЫ</Text>
          {myGroups.map(g => {
            const count = myStudents.filter(s => s.groupId === g.id).length;
            return (
              <GlassCard key={g.id} onPress={() => navigation.navigate('Groups')}>
                <View style={styles.groupRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.groupName, { color: t.text }]}>{g.name}</Text>
                    <Text style={[styles.groupSchedule, { color: t.textMuted }]}>{g.schedule || '—'}</Text>
                  </View>
                  <View style={styles.groupBadge}>
                    <Ionicons name="people-outline" size={14} color={t.textSecondary} />
                    <Text style={[styles.groupCount, { color: t.textSecondary }]}>{count}</Text>
                  </View>
                </View>
              </GlassCard>
            );
          })}
        </View>
      )}

      {/* Upcoming tournaments */}
      {upcomingTournaments.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: t.textSecondary }]}>БЛИЖАЙШИЕ ТУРНИРЫ</Text>
          {upcomingTournaments.map(tour => (
            <GlassCard key={tour.id} onPress={() => navigation.navigate('Tournaments')}>
              <Text style={[styles.tourTitle, { color: t.text }]}>{tour.title}</Text>
              <View style={styles.tourMeta}>
                <Ionicons name="calendar-outline" size={12} color={t.textMuted} />
                <Text style={[styles.tourDate, { color: t.textMuted }]}>{formatDate(tour.date)}</Text>
                {tour.location && (
                  <>
                    <Ionicons name="location-outline" size={12} color={t.textMuted} style={{ marginLeft: 8 }} />
                    <Text style={[styles.tourDate, { color: t.textMuted }]}>{tour.location}</Text>
                  </>
                )}
              </View>
            </GlassCard>
          ))}
        </View>
      )}

      {/* Recent news */}
      {recentNews.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: t.textSecondary }]}>НОВОСТИ</Text>
          {recentNews.map(n => (
            <GlassCard key={n.id}>
              <Text style={[styles.newsTitle, { color: t.text }]}>{n.title}</Text>
              <Text style={[styles.newsContent, { color: t.textSecondary }]} numberOfLines={2}>{n.content}</Text>
            </GlassCard>
          ))}
        </View>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

function StudentDashboard({ auth, data, t, dark, navigation }) {
  const student = data.students.find(s => s.id === auth.studentId);
  const group = data.groups.find(g => g.id === student?.groupId);
  const trainer = data.users.find(u => u.id === student?.trainerId);

  return (
    <ScrollView style={[styles.container, { backgroundColor: t.bg }]} contentContainerStyle={styles.content}>
      <PageHeader title="Главная" />

      {/* Student info */}
      <GlassCard>
        <View style={{ alignItems: 'center', gap: 8 }}>
          <Avatar name={student?.name} src={student?.avatar} size={72} />
          <Text style={[styles.studentName, { color: t.text }]}>{student?.name}</Text>
          {student?.belt && <Text style={[styles.studentBelt, { color: t.accent }]}>{student.belt}</Text>}
        </View>
      </GlassCard>

      {/* Subscription */}
      {student && (
        <GlassCard>
          <View style={styles.subRow}>
            <Ionicons
              name={isExpired(student.subscriptionExpiresAt) ? 'alert-circle' : 'checkmark-circle'}
              size={20}
              color={isExpired(student.subscriptionExpiresAt) ? t.red : t.green}
            />
            <View style={{ flex: 1 }}>
              <Text style={[{ color: t.text, fontWeight: '600', fontSize: 14 }]}>
                {isExpired(student.subscriptionExpiresAt) ? 'Абонемент истёк' : 'Абонемент активен'}
              </Text>
              <Text style={[{ color: t.textMuted, fontSize: 12 }]}>
                до {formatDate(student.subscriptionExpiresAt)}
              </Text>
            </View>
          </View>
        </GlassCard>
      )}

      {/* Group & trainer */}
      {group && (
        <GlassCard>
          <Text style={[styles.groupName, { color: t.text }]}>{group.name}</Text>
          <Text style={[styles.groupSchedule, { color: t.textMuted }]}>{group.schedule || '—'}</Text>
          {trainer && (
            <View style={[styles.trainerRow, { marginTop: 8 }]}>
              <Avatar name={trainer.name} src={trainer.avatar} size={28} />
              <Text style={[{ color: t.textSecondary, fontSize: 13 }]}>Тренер: {trainer.name}</Text>
            </View>
          )}
        </GlassCard>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  statCard: { flex: 1, alignItems: 'center', gap: 4 },
  statNum: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '600' },
  financeRow: { flexDirection: 'row', justifyContent: 'space-around' },
  financeItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  financeNum: { fontSize: 16, fontWeight: '700' },
  financeLabel: { textAlign: 'center', fontSize: 11, marginTop: 6, fontWeight: '500' },
  section: { marginTop: 16 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  groupRow: { flexDirection: 'row', alignItems: 'center' },
  groupName: { fontSize: 15, fontWeight: '700' },
  groupSchedule: { fontSize: 12, marginTop: 2 },
  groupBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  groupCount: { fontSize: 13, fontWeight: '600' },
  tourTitle: { fontSize: 14, fontWeight: '700' },
  tourMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  tourDate: { fontSize: 12 },
  newsTitle: { fontSize: 14, fontWeight: '700' },
  newsContent: { fontSize: 12, marginTop: 4 },
  studentName: { fontSize: 20, fontWeight: '800' },
  studentBelt: { fontSize: 14, fontWeight: '600' },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  trainerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
