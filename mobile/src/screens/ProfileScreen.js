import React, { useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Switch,
  SafeAreaView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { getColors } from '../utils/theme';
import { getSportLabel } from '../utils/sports';
import GlassCard from '../components/GlassCard';
import Avatar from '../components/Avatar';

const ROLE_CONFIG = {
  superadmin: { label: 'Суперадмин', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  trainer: { label: 'Тренер', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
  club_owner: { label: 'Владелец клуба', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  club_admin: { label: 'Админ клуба', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  organizer: { label: 'Организатор', color: '#06b6d4', bg: 'rgba(6,182,212,0.15)' },
  parent: { label: 'Родитель', color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
  student: { label: 'Ученик', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
};

export default function ProfileScreen() {
  const { dark, toggle } = useTheme();
  const { auth, logout } = useAuth();
  const { data } = useData();
  const navigation = useNavigation();
  const c = getColors(dark);

  const user = auth?.user;
  const role = auth?.role;
  const roleInfo = ROLE_CONFIG[role] || ROLE_CONFIG.student;

  // Trainer stats
  const trainerStats = useMemo(() => {
    if (role !== 'trainer') return null;
    const groups = (data.groups || []);
    const studentGroupLinks = data.studentGroups || [];
    const students = data.students || [];

    const groupIds = groups.map(g => g.id);
    const linkedStudentIds = [...new Set(
      studentGroupLinks.filter(sg => groupIds.includes(sg.groupId)).map(sg => sg.studentId)
    )];
    const activeStudents = students.filter(s => linkedStudentIds.includes(s.id) && s.active !== false);

    return {
      totalStudents: linkedStudentIds.length,
      activeStudents: activeStudents.length,
      groupsCount: groups.length,
    };
  }, [role, data.groups, data.studentGroups, data.students]);

  // Superadmin stats
  const adminStats = useMemo(() => {
    if (role !== 'superadmin') return null;
    const users = data.users || [];
    const counts = {};
    users.forEach(u => {
      counts[u.role] = (counts[u.role] || 0) + 1;
    });
    return {
      total: users.length,
      trainers: counts.trainer || 0,
      students: (data.students || []).length,
      parents: counts.parent || 0,
      clubs: (data.clubs || []).length,
    };
  }, [role, data.users, data.students, data.clubs]);

  // Student info
  const studentInfo = useMemo(() => {
    if (role !== 'student' || !auth?.studentId) return null;
    const student = (data.students || []).find(s => s.id === auth.studentId);
    if (!student) return null;
    const sgLinks = (data.studentGroups || []).filter(sg => sg.studentId === student.id);
    const groups = (data.groups || []).filter(g => sgLinks.some(sg => sg.groupId === g.id));
    return { student, groups };
  }, [role, auth?.studentId, data.students, data.studentGroups, data.groups]);

  const handleLogout = () => {
    logout();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Avatar
            name={user?.name || user?.phone || '?'}
            photo={user?.photo}
            size={80}
          />
          <Text style={[styles.userName, { color: c.text }]}>
            {user?.name || 'Пользователь'}
          </Text>
          <View style={[styles.roleBadge, { backgroundColor: roleInfo.bg }]}>
            <Text style={[styles.roleBadgeText, { color: roleInfo.color }]}>
              {roleInfo.label}
            </Text>
          </View>
          {user?.sportType && (
            <Text style={[styles.sportLabel, { color: c.textSecondary }]}>
              {getSportLabel(user.sportType)}
            </Text>
          )}
        </View>

        {/* Trainer Stats */}
        {trainerStats && (
          <GlassCard style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: c.blueBg }]}>
                  <Ionicons name="people" size={18} color={c.blue} />
                </View>
                <Text style={[styles.statValue, { color: c.text }]}>{trainerStats.totalStudents}</Text>
                <Text style={[styles.statLabel, { color: c.textSecondary }]}>Всего</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: c.border }]} />
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: c.greenBg }]}>
                  <Ionicons name="checkmark-circle" size={18} color={c.green} />
                </View>
                <Text style={[styles.statValue, { color: c.text }]}>{trainerStats.activeStudents}</Text>
                <Text style={[styles.statLabel, { color: c.textSecondary }]}>Активных</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: c.border }]} />
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: c.purpleBg }]}>
                  <MaterialCommunityIcons name="account-group" size={18} color={c.purple} />
                </View>
                <Text style={[styles.statValue, { color: c.text }]}>{trainerStats.groupsCount}</Text>
                <Text style={[styles.statLabel, { color: c.textSecondary }]}>Групп</Text>
              </View>
            </View>
          </GlassCard>
        )}

        {/* Superadmin Stats */}
        {adminStats && (
          <GlassCard style={styles.statsCard}>
            <Text style={[styles.sectionTitle, { color: c.text }]}>Платформа</Text>
            <View style={styles.adminStatsGrid}>
              <View style={[styles.adminStatItem, { backgroundColor: c.purpleBg }]}>
                <Ionicons name="people" size={20} color={c.purple} />
                <Text style={[styles.adminStatValue, { color: c.purple }]}>{adminStats.total}</Text>
                <Text style={[styles.adminStatLabel, { color: c.textSecondary }]}>Пользователей</Text>
              </View>
              <View style={[styles.adminStatItem, { backgroundColor: c.blueBg }]}>
                <Ionicons name="fitness" size={20} color={c.blue} />
                <Text style={[styles.adminStatValue, { color: c.blue }]}>{adminStats.trainers}</Text>
                <Text style={[styles.adminStatLabel, { color: c.textSecondary }]}>Тренеров</Text>
              </View>
              <View style={[styles.adminStatItem, { backgroundColor: c.greenBg }]}>
                <Ionicons name="school" size={20} color={c.green} />
                <Text style={[styles.adminStatValue, { color: c.green }]}>{adminStats.students}</Text>
                <Text style={[styles.adminStatLabel, { color: c.textSecondary }]}>Учеников</Text>
              </View>
              <View style={[styles.adminStatItem, { backgroundColor: c.yellowBg }]}>
                <Ionicons name="business" size={20} color={c.yellow} />
                <Text style={[styles.adminStatValue, { color: c.yellow }]}>{adminStats.clubs}</Text>
                <Text style={[styles.adminStatLabel, { color: c.textSecondary }]}>Клубов</Text>
              </View>
            </View>
          </GlassCard>
        )}

        {/* Student Info */}
        {studentInfo && (
          <GlassCard style={styles.statsCard}>
            {studentInfo.groups.length > 0 && (
              <View style={styles.studentInfoRow}>
                <Ionicons name="people-outline" size={18} color={c.textSecondary} />
                <Text style={[styles.studentInfoLabel, { color: c.textSecondary }]}>Группа:</Text>
                <Text style={[styles.studentInfoValue, { color: c.text }]}>
                  {studentInfo.groups.map(g => g.name).join(', ')}
                </Text>
              </View>
            )}
            {studentInfo.student.belt && (
              <View style={styles.studentInfoRow}>
                <MaterialCommunityIcons name="karate" size={18} color={c.textSecondary} />
                <Text style={[styles.studentInfoLabel, { color: c.textSecondary }]}>Пояс:</Text>
                <Text style={[styles.studentInfoValue, { color: c.text }]}>
                  {studentInfo.student.belt}
                </Text>
              </View>
            )}
            {studentInfo.student.rank && (
              <View style={styles.studentInfoRow}>
                <Ionicons name="ribbon-outline" size={18} color={c.textSecondary} />
                <Text style={[styles.studentInfoLabel, { color: c.textSecondary }]}>Разряд:</Text>
                <Text style={[styles.studentInfoValue, { color: c.text }]}>
                  {studentInfo.student.rank}
                </Text>
              </View>
            )}
            {studentInfo.student.subscriptionEnd && (
              <View style={styles.studentInfoRow}>
                <Ionicons name="card-outline" size={18} color={c.textSecondary} />
                <Text style={[styles.studentInfoLabel, { color: c.textSecondary }]}>Абонемент до:</Text>
                <Text style={[styles.studentInfoValue, { color: c.text }]}>
                  {new Date(studentInfo.student.subscriptionEnd).toLocaleDateString('ru-RU')}
                </Text>
              </View>
            )}
          </GlassCard>
        )}

        {/* Phone */}
        {user?.phone && (
          <GlassCard style={styles.phoneCard}>
            <View style={styles.phoneRow}>
              <View style={[styles.phoneIcon, { backgroundColor: c.greenBg }]}>
                <Ionicons name="call-outline" size={18} color={c.green} />
              </View>
              <View>
                <Text style={[styles.phoneLabel, { color: c.textSecondary }]}>Телефон</Text>
                <Text style={[styles.phoneValue, { color: c.text }]}>{user.phone}</Text>
              </View>
            </View>
          </GlassCard>
        )}

        {/* Settings */}
        <GlassCard style={styles.settingsCard}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Настройки</Text>

          <TouchableOpacity
            style={[styles.settingsRow, { borderBottomColor: c.border }]}
            onPress={() => navigation.navigate('NotificationSettings')}
            activeOpacity={0.7}
          >
            <View style={[styles.settingsIcon, { backgroundColor: c.blueBg }]}>
              <Ionicons name="notifications-outline" size={18} color={c.blue} />
            </View>
            <Text style={[styles.settingsLabel, { color: c.text }]}>Уведомления</Text>
            <Ionicons name="chevron-forward" size={18} color={c.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingsRow, { borderBottomColor: c.border }]}
            onPress={() => navigation.navigate('Author')}
            activeOpacity={0.7}
          >
            <View style={[styles.settingsIcon, { backgroundColor: c.purpleBg }]}>
              <Ionicons name="information-circle-outline" size={18} color={c.purple} />
            </View>
            <Text style={[styles.settingsLabel, { color: c.text }]}>Автор</Text>
            <Ionicons name="chevron-forward" size={18} color={c.textTertiary} />
          </TouchableOpacity>

          {/* Theme Toggle */}
          <View style={styles.settingsRow}>
            <View style={[styles.settingsIcon, { backgroundColor: c.yellowBg }]}>
              <Ionicons name={dark ? 'moon' : 'sunny'} size={18} color={c.yellow} />
            </View>
            <Text style={[styles.settingsLabel, { color: c.text, flex: 1 }]}>
              {dark ? 'Темная тема' : 'Светлая тема'}
            </Text>
            <Switch
              value={dark}
              onValueChange={toggle}
              trackColor={{ false: c.glass, true: c.purple }}
              thumbColor="#fff"
            />
          </View>
        </GlassCard>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: c.redBg }]}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color={c.red} />
          <Text style={[styles.logoutText, { color: c.red }]}>Выйти из аккаунта</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 12,
  },
  roleBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sportLabel: {
    fontSize: 14,
    marginTop: 2,
  },
  statsCard: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 50,
  },
  adminStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  adminStatItem: {
    width: '47%',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 4,
  },
  adminStatValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  adminStatLabel: {
    fontSize: 12,
  },
  studentInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  studentInfoLabel: {
    fontSize: 14,
  },
  studentInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  phoneCard: {
    marginBottom: 12,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  phoneIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneLabel: {
    fontSize: 12,
  },
  phoneValue: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
  },
  settingsCard: {
    marginBottom: 12,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsLabel: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 14,
    gap: 10,
    marginTop: 4,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
