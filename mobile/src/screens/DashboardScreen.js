import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  TouchableOpacity, Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import PageHeader from '../components/PageHeader';
import GlassCard from '../components/GlassCard';
import Avatar from '../components/Avatar';
import { PlusIcon, ChevronRightIcon, UsersIcon, TrophyIcon, WalletIcon } from '../icons';

export default function DashboardScreen({ navigation }) {
  const { dark, colors } = useTheme();
  const { auth } = useAuth();
  const data = useData();
  const { loading, reload, students, groups, tournaments, transactions, news, pendingRegistrations, clubs, branches } = data;
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { reload(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  const role = auth?.role;

  const renderTrainerDashboard = () => {
    const myStudents = students.length;
    const myGroups = groups.length;
    const monthTx = transactions.filter(t => {
      const d = new Date(t.date || t.createdAt);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const income = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);

    return (
      <>
        <View style={styles.statsRow}>
          <GlassCard style={styles.statCard}>
            <UsersIcon size={20} color={colors.accent} />
            <Text style={[styles.statNum, { color: colors.text }]}>{myStudents}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Учеников</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <TrophyIcon size={20} color={colors.accent} />
            <Text style={[styles.statNum, { color: colors.text }]}>{myGroups}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Групп</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <WalletIcon size={20} color={colors.success} />
            <Text style={[styles.statNum, { color: colors.text }]}>{income.toLocaleString()}р</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Доход</Text>
          </GlassCard>
        </View>

        {groups.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Группы</Text>
            {groups.slice(0, 5).map(g => (
              <GlassCard key={g.id} onPress={() => navigation.navigate('Attendance', { groupId: g.id })}>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>{g.name}</Text>
                    <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                      {students.filter(s => s.groupId === g.id).length} учеников
                    </Text>
                  </View>
                  <ChevronRightIcon size={20} color={colors.textSecondary} />
                </View>
              </GlassCard>
            ))}
          </View>
        )}
      </>
    );
  };

  const renderSuperadminDashboard = () => (
    <>
      <View style={styles.statsRow}>
        <GlassCard style={styles.statCard}>
          <UsersIcon size={20} color={colors.accent} />
          <Text style={[styles.statNum, { color: colors.text }]}>{students.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Учеников</Text>
        </GlassCard>
        <GlassCard style={styles.statCard}>
          <TrophyIcon size={20} color={colors.accent} />
          <Text style={[styles.statNum, { color: colors.text }]}>{tournaments.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Турниров</Text>
        </GlassCard>
        <GlassCard style={styles.statCard}>
          <WalletIcon size={20} color={colors.success} />
          <Text style={[styles.statNum, { color: colors.text }]}>{clubs.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Клубов</Text>
        </GlassCard>
      </View>
      {pendingRegistrations?.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Заявки на регистрацию</Text>
          {pendingRegistrations.map(r => (
            <GlassCard key={r.id}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{r.name || r.phone}</Text>
              <Text style={[styles.cardSub, { color: colors.textSecondary }]}>{r.role} - {r.phone}</Text>
              <View style={[styles.row, { marginTop: 8, gap: 8 }]}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.success }]}
                  onPress={async () => {
                    try { await data.approveRegistration(r.id); } catch (e) { Alert.alert('Ошибка', e.message); }
                  }}
                >
                  <Text style={styles.actionBtnText}>Принять</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.danger }]}
                  onPress={async () => {
                    try { await data.rejectRegistration(r.id); } catch (e) { Alert.alert('Ошибка', e.message); }
                  }}
                >
                  <Text style={styles.actionBtnText}>Отклонить</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          ))}
        </View>
      )}
    </>
  );

  const renderStudentDashboard = () => {
    const myGroup = groups.find(g => g.id === auth?.student?.groupId);
    return (
      <View style={styles.section}>
        {myGroup && (
          <GlassCard>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Моя группа</Text>
            <Text style={[styles.cardSub, { color: colors.textSecondary }]}>{myGroup.name}</Text>
          </GlassCard>
        )}
        <GlassCard>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Ближайшие турниры</Text>
          <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
            {tournaments.filter(t => new Date(t.date) >= new Date()).length} предстоящих
          </Text>
        </GlassCard>
      </View>
    );
  };

  const renderParentDashboard = () => (
    <View style={styles.section}>
      <GlassCard>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Мой ребенок</Text>
        <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
          {auth?.parent?.childName || 'Не указан'}
        </Text>
      </GlassCard>
    </View>
  );

  const renderClubDashboard = () => (
    <>
      <View style={styles.statsRow}>
        <GlassCard style={styles.statCard}>
          <UsersIcon size={20} color={colors.accent} />
          <Text style={[styles.statNum, { color: colors.text }]}>{branches.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Филиалов</Text>
        </GlassCard>
        <GlassCard style={styles.statCard}>
          <TrophyIcon size={20} color={colors.accent} />
          <Text style={[styles.statNum, { color: colors.text }]}>
            {data.users?.filter(u => u.role === 'trainer' && u.clubId).length || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Тренеров</Text>
        </GlassCard>
      </View>
    </>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <PageHeader title="iBorcuha" logo gradient />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {/* News */}
        {news?.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Новости</Text>
            {news.slice(0, 3).map(n => (
              <GlassCard key={n.id}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{n.title}</Text>
                <Text style={[styles.cardSub, { color: colors.textSecondary }]} numberOfLines={2}>{n.text}</Text>
              </GlassCard>
            ))}
          </View>
        )}

        {role === 'superadmin' && renderSuperadminDashboard()}
        {role === 'trainer' && renderTrainerDashboard()}
        {role === 'student' && renderStudentDashboard()}
        {role === 'parent' && renderParentDashboard()}
        {(role === 'club_owner' || role === 'club_admin') && renderClubDashboard()}
        {role === 'organizer' && renderSuperadminDashboard()}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  statCard: { flex: 1, alignItems: 'center', padding: 12 },
  statNum: { fontSize: 22, fontWeight: '800', marginTop: 4 },
  statLabel: { fontSize: 11, marginTop: 2 },
  section: { marginTop: 8 },
  sectionTitle: {
    fontSize: 16, fontWeight: '700', textTransform: 'uppercase',
    fontStyle: 'italic', marginBottom: 10,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '600' },
  cardSub: { fontSize: 13, marginTop: 2 },
  actionBtn: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10,
  },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});
