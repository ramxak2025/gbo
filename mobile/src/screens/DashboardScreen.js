import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../utils/theme';
import { getSportLabel } from '../utils/sports';
import GlassCard from '../components/GlassCard';
import Avatar from '../components/Avatar';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function isExpired(d) {
  if (!d) return true;
  return new Date(d) < new Date();
}

export default function DashboardScreen() {
  const { auth } = useAuth();
  const { data, loading, reload, addNews, deleteNews, approveRegistration, rejectRegistration } = useData();
  const { dark, toggle } = useTheme();
  const c = getColors(dark);
  const nav = useNavigation();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  const role = auth?.role;

  // Trainer computations
  const trainerData = useMemo(() => {
    if (role !== 'trainer') return null;
    const myStudents = data.students.filter(s => s.trainerId === auth.userId);
    const now = new Date();
    const active = myStudents.filter(s => s.abonementEnd && new Date(s.abonementEnd) >= now);
    const debtors = myStudents.filter(s => !s.abonementEnd || new Date(s.abonementEnd) < now);
    const myGroups = data.groups.filter(g => g.trainerId === auth.userId);
    const month = now.getMonth();
    const year = now.getFullYear();
    const monthTx = data.transactions.filter(t => {
      if (t.trainerId !== auth.userId) return false;
      const d = new Date(t.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });
    const income = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const expense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const club = data.clubs.find(cl => cl.id === auth.user?.clubId);
    const myNews = data.news.filter(n => n.trainerId === auth.userId).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    return { myStudents, active, debtors, myGroups, income, expense, club, myNews };
  }, [role, data, auth]);

  // Student computations
  const studentData = useMemo(() => {
    if (role !== 'student') return null;
    const student = data.students.find(s => s.id === auth.studentId);
    const groups = data.studentGroups.filter(sg => sg.studentId === auth.studentId).map(sg => data.groups.find(g => g.id === sg.groupId)).filter(Boolean);
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const monthAtt = data.attendance.filter(a => a.studentId === auth.studentId && a.present && new Date(a.date).getMonth() === month && new Date(a.date).getFullYear() === year);
    const regs = data.tournamentRegistrations.filter(r => r.studentId === auth.studentId);
    const regTournaments = regs.map(r => data.tournaments.find(t => t.id === r.tournamentId)).filter(t => t && new Date(t.date) >= now);
    return { student, groups, attendanceCount: monthAtt.length, regTournaments };
  }, [role, data, auth]);

  // Parent computations
  const parentData = useMemo(() => {
    if (role !== 'parent') return null;
    const myParent = data.parents.find(p => p.id === auth.parentId);
    const childrenIds = data.parents.filter(p => p.id === auth.parentId).map(p => p.studentId);
    const children = data.students.filter(s => childrenIds.includes(s.id));
    return { parent: myParent, children };
  }, [role, data, auth]);

  // Superadmin computations
  const adminData = useMemo(() => {
    if (role !== 'superadmin') return null;
    const trainers = data.users.filter(u => u.role === 'trainer');
    return {
      clubCount: data.clubs.length,
      trainerCount: trainers.length,
      studentCount: data.students.length,
      pending: data.pendingRegistrations || [],
    };
  }, [role, data]);

  // Club owner computations
  const clubData = useMemo(() => {
    if (role !== 'club_owner' && role !== 'club_admin') return null;
    const club = data.clubs.find(cl => cl.id === auth.user?.clubId);
    const trainers = data.users.filter(u => u.clubId === club?.id && u.role === 'trainer');
    const students = data.students.filter(s => trainers.some(t => t.id === s.trainerId));
    return { club, trainers, students };
  }, [role, data, auth]);

  const renderTrainer = () => {
    const d = trainerData;
    if (!d) return null;
    return (
      <>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.logoI, { color: c.textTertiary }]}>i</Text>
          </View>
          <Text style={[styles.logoText, { color: c.purple }]}>Borcuha</Text>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={toggle} style={[styles.themeBtn, { backgroundColor: c.glass }]}>
            <Ionicons name={dark ? 'sunny' : 'moon'} size={18} color={c.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Club card */}
        {d.club && (
          <GlassCard style={styles.clubCard}>
            <Text style={[styles.clubName, { color: c.text }]}>{d.club.name}</Text>
            {d.club.sportType && (
              <View style={[styles.badge, { backgroundColor: c.purpleBg }]}>
                <Text style={[styles.badgeText, { color: c.purple }]}>{getSportLabel(d.club.sportType)}</Text>
              </View>
            )}
          </GlassCard>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <GlassCard style={styles.statCard}>
            <Text style={[styles.statNum, { color: c.text }]}>{d.myStudents.length}</Text>
            <Text style={[styles.statLabel, { color: c.textTertiary }]}>Всего</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Text style={[styles.statNum, { color: c.green }]}>{d.active.length}</Text>
            <Text style={[styles.statLabel, { color: c.textTertiary }]}>Активных</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Text style={[styles.statNum, { color: c.accent }]}>{d.debtors.length}</Text>
            <Text style={[styles.statLabel, { color: c.textTertiary }]}>Должники</Text>
          </GlassCard>
        </View>

        {/* Balance */}
        <GlassCard style={styles.balanceCard}>
          <Text style={[styles.sectionTitle, { color: c.textTertiary }]}>БАЛАНС ЗА МЕСЯЦ</Text>
          <Text style={[styles.balanceAmount, { color: c.text }]}>
            {(d.income - d.expense).toLocaleString('ru-RU')} ₽
          </Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Ionicons name="arrow-up" size={14} color={c.green} />
              <Text style={[styles.balanceText, { color: c.green }]}>{d.income.toLocaleString('ru-RU')} ₽</Text>
            </View>
            <View style={styles.balanceItem}>
              <Ionicons name="arrow-down" size={14} color={c.accent} />
              <Text style={[styles.balanceText, { color: c.accent }]}>{d.expense.toLocaleString('ru-RU')} ₽</Text>
            </View>
          </View>
        </GlassCard>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: c.purpleBg }]} onPress={() => nav.navigate('AddStudent')}>
            <Ionicons name="person-add" size={20} color={c.purple} />
            <Text style={[styles.actionText, { color: c.purple }]}>Добавить</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: c.blueBg }]} onPress={() => nav.navigate('Groups')}>
            <Ionicons name="people" size={20} color={c.blue} />
            <Text style={[styles.actionText, { color: c.blue }]}>Группы</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: c.greenBg }]} onPress={() => nav.navigate('Profile')}>
            <Ionicons name="person" size={20} color={c.green} />
            <Text style={[styles.actionText, { color: c.green }]}>Профиль</Text>
          </TouchableOpacity>
        </View>

        {/* Groups */}
        <Text style={[styles.sectionHeader, { color: c.textTertiary }]}>ГРУППЫ</Text>
        {d.myGroups.map(g => {
          const count = data.studentGroups.filter(sg => sg.groupId === g.id).length;
          return (
            <TouchableOpacity key={g.id} onPress={() => g.attendanceEnabled ? nav.navigate('Attendance', { groupId: g.id }) : null}>
              <GlassCard style={styles.groupCard}>
                <View style={styles.groupHeader}>
                  <Text style={[styles.groupName, { color: c.text }]}>{g.name}</Text>
                  <View style={[styles.countBadge, { backgroundColor: c.purpleBg }]}>
                    <Text style={[styles.countText, { color: c.purple }]}>{count}</Text>
                  </View>
                </View>
                {g.schedule && <Text style={[styles.schedule, { color: c.textTertiary }]}>{g.schedule}</Text>}
              </GlassCard>
            </TouchableOpacity>
          );
        })}

        {/* News */}
        {d.myNews.length > 0 && (
          <>
            <Text style={[styles.sectionHeader, { color: c.textTertiary }]}>НОВОСТИ</Text>
            {d.myNews.map(n => (
              <GlassCard key={n.id} style={styles.newsCard}>
                <Text style={[styles.newsText, { color: c.text }]}>{n.text}</Text>
                <View style={styles.newsFooter}>
                  <Text style={[styles.newsDate, { color: c.textTertiary }]}>{formatDate(n.date)}</Text>
                  <TouchableOpacity onPress={() => Alert.alert('Удалить?', '', [
                    { text: 'Отмена' },
                    { text: 'Удалить', style: 'destructive', onPress: () => deleteNews(n.id) },
                  ])}>
                    <Ionicons name="trash-outline" size={16} color={c.accent} />
                  </TouchableOpacity>
                </View>
              </GlassCard>
            ))}
          </>
        )}
      </>
    );
  };

  const renderStudent = () => {
    const d = studentData;
    if (!d || !d.student) return null;
    const s = d.student;
    const expired = isExpired(s.abonementEnd);
    return (
      <>
        <View style={styles.headerRow}>
          <Text style={[styles.logoI, { color: c.textTertiary }]}>i</Text>
          <Text style={[styles.logoText, { color: c.purple }]}>Borcuha</Text>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={toggle} style={[styles.themeBtn, { backgroundColor: c.glass }]}>
            <Ionicons name={dark ? 'sunny' : 'moon'} size={18} color={c.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Student card */}
        <GlassCard style={styles.studentCard}>
          <Avatar name={s.name} photo={s.avatar} size={56} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={[styles.studentName, { color: c.text }]}>{s.name}</Text>
            {d.groups[0] && <Text style={[styles.groupLabel, { color: c.textSecondary }]}>{d.groups[0].name}</Text>}
            <View style={[styles.subBadge, { backgroundColor: expired ? c.redBg : c.greenBg }]}>
              <Text style={{ color: expired ? c.red : c.green, fontSize: 11, fontWeight: '600' }}>
                {expired ? 'Абонемент истёк' : `До ${formatDate(s.abonementEnd)}`}
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* QR Checkin */}
        <TouchableOpacity onPress={() => nav.navigate('QRCheckin')} style={[styles.qrBtn, { backgroundColor: c.purpleBg }]}>
          <Ionicons name="qr-code" size={24} color={c.purple} />
          <Text style={[styles.qrText, { color: c.purple }]}>Отметить посещение</Text>
        </TouchableOpacity>

        {/* Attendance */}
        <GlassCard style={styles.attCard}>
          <Text style={[styles.sectionTitle, { color: c.textTertiary }]}>ПОСЕЩАЕМОСТЬ В ЭТОМ МЕСЯЦЕ</Text>
          <Text style={[styles.attNum, { color: c.text }]}>{d.attendanceCount} дней</Text>
        </GlassCard>

        {/* Registered tournaments */}
        {d.regTournaments.length > 0 && (
          <>
            <Text style={[styles.sectionHeader, { color: c.textTertiary }]}>ЗАРЕГИСТРИРОВАН НА ТУРНИРЫ</Text>
            {d.regTournaments.map(t => (
              <TouchableOpacity key={t.id} onPress={() => nav.navigate('TournamentDetail', { id: t.id })}>
                <GlassCard style={styles.tournCard}>
                  <Text style={[styles.tournName, { color: c.text }]}>{t.name}</Text>
                  <Text style={[styles.tournDate, { color: c.textSecondary }]}>{formatDate(t.date)}</Text>
                </GlassCard>
              </TouchableOpacity>
            ))}
          </>
        )}
      </>
    );
  };

  const renderParent = () => {
    const d = parentData;
    if (!d) return null;
    return (
      <>
        <View style={styles.headerRow}>
          <Text style={[styles.logoI, { color: c.textTertiary }]}>i</Text>
          <Text style={[styles.logoText, { color: c.purple }]}>Borcuha</Text>
          <View style={{ flex: 1 }} />
        </View>

        {d.parent && (
          <GlassCard style={styles.parentCard}>
            <Ionicons name="people" size={24} color={c.purple} />
            <Text style={[styles.parentName, { color: c.text }]}>{d.parent.name}</Text>
          </GlassCard>
        )}

        <Text style={[styles.sectionHeader, { color: c.textTertiary }]}>ДЕТИ</Text>
        {d.children.map(child => {
          const expired = isExpired(child.abonementEnd);
          const group = data.groups.find(g => g.id === child.groupId);
          const now = new Date();
          const monthAtt = data.attendance.filter(a => a.studentId === child.id && a.present && new Date(a.date).getMonth() === now.getMonth());
          return (
            <TouchableOpacity key={child.id} onPress={() => nav.navigate('StudentDetail', { id: child.id })}>
              <GlassCard style={styles.childCard}>
                <Avatar name={child.name} photo={child.avatar} size={48} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={[styles.childName, { color: c.text }]}>{child.name}</Text>
                  {group && <Text style={[styles.childGroup, { color: c.textSecondary }]}>{group.name}</Text>}
                  <View style={[styles.subBadge, { backgroundColor: expired ? c.redBg : c.greenBg }]}>
                    <Text style={{ color: expired ? c.red : c.green, fontSize: 11, fontWeight: '600' }}>
                      {expired ? 'Абонемент истёк' : `До ${formatDate(child.abonementEnd)}`}
                    </Text>
                  </View>
                  <Text style={[styles.attText, { color: c.textTertiary }]}>Посещений: {monthAtt.length}</Text>
                </View>
              </GlassCard>
            </TouchableOpacity>
          );
        })}
      </>
    );
  };

  const renderSuperadmin = () => {
    const d = adminData;
    if (!d) return null;
    return (
      <>
        <View style={styles.headerRow}>
          <Text style={[styles.logoI, { color: c.textTertiary }]}>i</Text>
          <Text style={[styles.logoText, { color: c.purple }]}>Borcuha</Text>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={toggle} style={[styles.themeBtn, { backgroundColor: c.glass }]}>
            <Ionicons name={dark ? 'sunny' : 'moon'} size={18} color={c.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionHeader, { color: c.textTertiary }]}>ПЛАТФОРМА</Text>
        <View style={styles.statsRow}>
          <GlassCard style={styles.statCard}>
            <Text style={[styles.statNum, { color: c.purple }]}>{d.clubCount}</Text>
            <Text style={[styles.statLabel, { color: c.textTertiary }]}>Клубов</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Text style={[styles.statNum, { color: c.blue }]}>{d.trainerCount}</Text>
            <Text style={[styles.statLabel, { color: c.textTertiary }]}>Тренеров</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Text style={[styles.statNum, { color: c.green }]}>{d.studentCount}</Text>
            <Text style={[styles.statLabel, { color: c.textTertiary }]}>Спортсменов</Text>
          </GlassCard>
        </View>

        {/* Pending registrations */}
        {d.pending.length > 0 && (
          <>
            <Text style={[styles.sectionHeader, { color: c.yellow }]}>ЗАЯВКИ НА РЕГИСТРАЦИЮ</Text>
            {d.pending.map(p => (
              <GlassCard key={p.id} style={styles.pendingCard}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pendingName, { color: c.text }]}>{p.name}</Text>
                  <Text style={[styles.pendingInfo, { color: c.textSecondary }]}>{p.phone} · {p.clubName}</Text>
                </View>
                <TouchableOpacity onPress={() => approveRegistration(p.id)} style={[styles.approveBtn, { backgroundColor: c.greenBg }]}>
                  <Ionicons name="checkmark" size={18} color={c.green} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => rejectRegistration(p.id)} style={[styles.rejectBtn, { backgroundColor: c.redBg }]}>
                  <Ionicons name="close" size={18} color={c.red} />
                </TouchableOpacity>
              </GlassCard>
            ))}
          </>
        )}

        {/* Quick nav */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: c.purpleBg }]} onPress={() => nav.navigate('AddTrainer')}>
            <Ionicons name="person-add" size={20} color={c.purple} />
            <Text style={[styles.actionText, { color: c.purple }]}>Тренер</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: c.blueBg }]} onPress={() => nav.navigate('AddTournament')}>
            <Ionicons name="trophy" size={20} color={c.blue} />
            <Text style={[styles.actionText, { color: c.blue }]}>Турнир</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  };

  const renderClubOwner = () => {
    const d = clubData;
    if (!d) return null;
    return (
      <>
        <View style={styles.headerRow}>
          <Text style={[styles.logoI, { color: c.textTertiary }]}>i</Text>
          <Text style={[styles.logoText, { color: c.purple }]}>Borcuha</Text>
          <View style={{ flex: 1 }} />
        </View>

        {d.club && (
          <GlassCard style={styles.clubCard}>
            <Text style={[styles.clubName, { color: c.text }]}>{d.club.name}</Text>
            <View style={styles.clubStats}>
              <Text style={[styles.clubStat, { color: c.textSecondary }]}>{d.trainers.length} тренеров</Text>
              <Text style={[styles.clubStat, { color: c.textSecondary }]}>{d.students.length} спортсменов</Text>
            </View>
          </GlassCard>
        )}

        <Text style={[styles.sectionHeader, { color: c.textTertiary }]}>ТРЕНЕРЫ</Text>
        {d.trainers.map(t => {
          const tStudents = data.students.filter(s => s.trainerId === t.id);
          return (
            <TouchableOpacity key={t.id} onPress={() => nav.navigate('TrainerDetail', { id: t.id })}>
              <GlassCard style={styles.trainerCard}>
                <Avatar name={t.name} photo={t.avatar} size={40} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={[styles.trainerName, { color: c.text }]}>{t.name}</Text>
                  <Text style={[styles.trainerInfo, { color: c.textSecondary }]}>{tStudents.length} спортсменов</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={c.textTertiary} />
              </GlassCard>
            </TouchableOpacity>
          );
        })}
      </>
    );
  };

  const renderOrganizer = () => {
    const upcoming = data.tournaments.filter(t => new Date(t.date) >= new Date()).sort((a, b) => new Date(a.date) - new Date(b.date));
    return (
      <>
        <View style={styles.headerRow}>
          <Text style={[styles.logoI, { color: c.textTertiary }]}>i</Text>
          <Text style={[styles.logoText, { color: c.purple }]}>Borcuha</Text>
          <View style={{ flex: 1 }} />
        </View>

        <View style={styles.statsRow}>
          <GlassCard style={styles.statCard}>
            <Text style={[styles.statNum, { color: c.text }]}>{data.tournaments.length}</Text>
            <Text style={[styles.statLabel, { color: c.textTertiary }]}>Всего</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Text style={[styles.statNum, { color: c.green }]}>{upcoming.length}</Text>
            <Text style={[styles.statLabel, { color: c.textTertiary }]}>Предстоящих</Text>
          </GlassCard>
        </View>

        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: c.purpleBg, marginBottom: 16 }]} onPress={() => nav.navigate('AddTournament')}>
          <Ionicons name="add" size={20} color={c.purple} />
          <Text style={[styles.actionText, { color: c.purple }]}>Создать турнир</Text>
        </TouchableOpacity>

        {upcoming.slice(0, 5).map(t => (
          <TouchableOpacity key={t.id} onPress={() => nav.navigate('TournamentDetail', { id: t.id })}>
            <GlassCard style={styles.tournCard}>
              <Text style={[styles.tournName, { color: c.text }]}>{t.name}</Text>
              <Text style={[styles.tournDate, { color: c.textSecondary }]}>{formatDate(t.date)} · {getSportLabel(t.sportType)}</Text>
            </GlassCard>
          </TouchableOpacity>
        ))}
      </>
    );
  };

  const renderContent = () => {
    switch (role) {
      case 'trainer': return renderTrainer();
      case 'student': return renderStudent();
      case 'parent': return renderParent();
      case 'superadmin': return renderSuperadmin();
      case 'club_owner':
      case 'club_admin': return renderClubOwner();
      case 'organizer': return renderOrganizer();
      default: return <Text style={{ color: c.text, textAlign: 'center', marginTop: 40 }}>Неизвестная роль</Text>;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.purple} />}
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 120 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  logoI: { fontSize: 24, fontWeight: '800' },
  logoText: { fontSize: 24, fontWeight: '800' },
  themeBtn: { padding: 10, borderRadius: 12 },
  clubCard: { marginBottom: 16, padding: 16 },
  clubName: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  clubStats: { flexDirection: 'row', gap: 12 },
  clubStat: { fontSize: 13 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statCard: { flex: 1, alignItems: 'center', padding: 14 },
  statNum: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', marginTop: 2 },
  balanceCard: { padding: 16, marginBottom: 16, alignItems: 'center' },
  balanceAmount: { fontSize: 28, fontWeight: '800', marginTop: 4, marginBottom: 8 },
  balanceRow: { flexDirection: 'row', gap: 24 },
  balanceItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  balanceText: { fontSize: 14, fontWeight: '600' },
  sectionTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  sectionHeader: { fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, marginTop: 8 },
  actionsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  actionBtn: { flex: 1, alignItems: 'center', padding: 14, borderRadius: 16, gap: 4 },
  actionText: { fontSize: 11, fontWeight: '700' },
  groupCard: { marginBottom: 8, padding: 14 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  groupName: { fontSize: 15, fontWeight: '700' },
  countBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  countText: { fontSize: 12, fontWeight: '700' },
  schedule: { fontSize: 12, marginTop: 4 },
  newsCard: { marginBottom: 8, padding: 14 },
  newsText: { fontSize: 14, lineHeight: 20 },
  newsFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  newsDate: { fontSize: 11 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  studentCard: { flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 16 },
  studentName: { fontSize: 18, fontWeight: '700' },
  groupLabel: { fontSize: 13, marginTop: 2 },
  subBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 4 },
  qrBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, borderRadius: 16, marginBottom: 16 },
  qrText: { fontSize: 15, fontWeight: '700' },
  attCard: { padding: 16, marginBottom: 16 },
  attNum: { fontSize: 28, fontWeight: '800', marginTop: 4 },
  attText: { fontSize: 11, marginTop: 4 },
  tournCard: { marginBottom: 8, padding: 14 },
  tournName: { fontSize: 15, fontWeight: '600' },
  tournDate: { fontSize: 12, marginTop: 4 },
  parentCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, marginBottom: 16 },
  parentName: { fontSize: 18, fontWeight: '700' },
  childCard: { flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 8 },
  childName: { fontSize: 15, fontWeight: '600' },
  childGroup: { fontSize: 12, marginTop: 2 },
  pendingCard: { flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 8, gap: 8 },
  pendingName: { fontSize: 14, fontWeight: '600' },
  pendingInfo: { fontSize: 12, marginTop: 2 },
  approveBtn: { padding: 8, borderRadius: 10 },
  rejectBtn: { padding: 8, borderRadius: 10 },
  trainerCard: { flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 8 },
  trainerName: { fontSize: 14, fontWeight: '600' },
  trainerInfo: { fontSize: 12, marginTop: 2 },
});
