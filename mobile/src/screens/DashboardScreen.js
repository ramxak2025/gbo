import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  TextInput,
  Alert,
  Linking,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Users,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Calendar,
  Flame,
  Zap,
  MapPin,
  Plus,
  Award,
  ChevronRight,
  Dumbbell,
  CreditCard,
  Shield,
  UserPlus,
  Check,
  X,
  Trophy,
  Newspaper,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../utils/theme';
import Avatar from '../components/Avatar';
import GlassCard from '../components/GlassCard';
import PageHeader from '../components/PageHeader';

/* ───── helpers ───── */

function isExpired(dateStr) {
  if (!dateStr) return true;
  return new Date(dateStr) < new Date();
}

function formatDate(iso) {
  if (!iso) return '\u2014';
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  });
}

function daysUntil(dateStr) {
  if (!dateStr) return -1;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/* ======================================================================== */
/*  TRAINER DASHBOARD                                                       */
/* ======================================================================== */

function TrainerDashboard({ navigation, data, auth, c, dark, addNews, deleteNews, updateStudent }) {
  const [newsText, setNewsText] = useState('');

  const myStudents = useMemo(
    () => data.students.filter((s) => s.trainerId === auth.userId),
    [data.students, auth.userId],
  );

  const myGroups = useMemo(
    () => data.groups.filter((g) => g.trainerId === auth.userId),
    [data.groups, auth.userId],
  );

  const activeStudents = useMemo(
    () => myStudents.filter((s) => !isExpired(s.subscriptionEnd)),
    [myStudents],
  );

  const monthlyIncome = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return data.transactions
      .filter(
        (t) =>
          t.trainerId === auth.userId &&
          new Date(t.date) >= start &&
          t.type !== 'expense',
      )
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [data.transactions, auth.userId]);

  const expiringSoon = useMemo(
    () =>
      myStudents
        .filter((s) => {
          const d = daysUntil(s.subscriptionEnd);
          return d >= 0 && d <= 7;
        })
        .sort((a, b) => daysUntil(a.subscriptionEnd) - daysUntil(b.subscriptionEnd)),
    [myStudents],
  );

  const myNews = useMemo(
    () =>
      [...data.news]
        .filter((n) => n.trainerId === auth.userId)
        .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
        .slice(0, 5),
    [data.news, auth.userId],
  );

  const handleAddNews = useCallback(async () => {
    const trimmed = newsText.trim();
    if (!trimmed) return;
    try {
      await addNews({ text: trimmed });
      setNewsText('');
    } catch {
      Alert.alert('Error', 'Could not add news');
    }
  }, [newsText, addNews]);

  const handleDeleteNews = useCallback(
    (id) => {
      Alert.alert('Delete', 'Remove this news?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteNews(id).catch(() => {}),
        },
      ]);
    },
    [deleteNews],
  );

  const setStudentStatus = useCallback(
    (student, status) => {
      const newStatus = student.status === status ? null : status;
      updateStudent(student.id, { status: newStatus }).catch(() =>
        Alert.alert('Error', 'Could not update status'),
      );
    },
    [updateStudent],
  );

  /* ── stat items ── */
  const stats = [
    {
      label: 'Students',
      value: myStudents.length,
      icon: Users,
      color: c.purple,
      bg: c.purpleBg,
    },
    {
      label: 'Active',
      value: activeStudents.length,
      icon: Zap,
      color: c.green,
      bg: c.greenBg,
    },
    {
      label: 'Groups',
      value: myGroups.length,
      icon: Dumbbell,
      color: c.blue,
      bg: c.blueBg,
    },
    {
      label: 'Income',
      value: `${monthlyIncome.toLocaleString()}\u20BD`,
      icon: CreditCard,
      color: c.yellow,
      bg: c.yellowBg,
    },
  ];

  const statusBadges = [
    { key: 'sick', label: 'Sick', color: c.red },
    { key: 'injury', label: 'Injury', color: c.yellow },
    { key: 'skip', label: 'Skip', color: c.textSecondary },
  ];

  return (
    <>
      {/* ── Hero Stats ── */}
      <LinearGradient
        colors={dark ? ['#581c87', '#1e1b4b', '#0f0f23'] : ['#c084fc', '#818cf8', '#e0e7ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroGradient}
      >
        <Text style={[styles.heroTitle, { color: '#fff' }]}>Dashboard</Text>
        <View style={styles.statsGrid}>
          {stats.map((s) => (
            <View key={s.label} style={styles.statItem}>
              <View style={[styles.statIconWrap, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                <s.icon size={18} color="#fff" />
              </View>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* ── Quick Actions ── */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: c.text }]}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: c.purpleBg }]}
            onPress={() => navigation.navigate('AddStudent')}
          >
            <UserPlus size={20} color={c.purple} />
            <Text style={[styles.actionLabel, { color: c.purple }]}>Add Student</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: c.blueBg }]}
            onPress={() => navigation.navigate('Groups')}
          >
            <Users size={20} color={c.blue} />
            <Text style={[styles.actionLabel, { color: c.blue }]}>Groups</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: c.greenBg }]}
            onPress={() => navigation.navigate('Attendance')}
          >
            <Calendar size={20} color={c.green} />
            <Text style={[styles.actionLabel, { color: c.green }]}>Attendance</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Expiring Subscriptions ── */}
      {expiringSoon.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AlertCircle size={18} color={c.yellow} />
            <Text style={[styles.sectionTitle, { color: c.yellow, marginLeft: 6 }]}>
              Expiring Soon
            </Text>
          </View>
          {expiringSoon.map((s) => {
            const d = daysUntil(s.subscriptionEnd);
            return (
              <GlassCard
                key={s.id}
                style={styles.expiringCard}
                onPress={() => navigation.navigate('StudentDetail', { id: s.id })}
              >
                <View style={styles.expiringRow}>
                  <Avatar src={s.photo} name={s.name} size={36} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.expiringName, { color: c.text }]}>{s.name}</Text>
                    <Text style={[styles.expiringDate, { color: c.textSecondary }]}>
                      {d === 0
                        ? 'Expires today'
                        : d === 1
                        ? 'Expires tomorrow'
                        : `${d} days left`}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={c.textTertiary} />
                </View>
              </GlassCard>
            );
          })}
        </View>
      )}

      {/* ── Student Status Badges ── */}
      {myStudents.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Student Status</Text>
          {myStudents
            .filter((s) => s.status)
            .map((s) => {
              const badge = statusBadges.find((b) => b.key === s.status);
              return (
                <GlassCard
                  key={s.id}
                  style={styles.statusCard}
                  onPress={() => navigation.navigate('StudentDetail', { id: s.id })}
                >
                  <View style={styles.statusRow}>
                    <Avatar src={s.photo} name={s.name} size={32} />
                    <Text
                      style={[styles.statusName, { color: c.text }]}
                      numberOfLines={1}
                    >
                      {s.name}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: badge ? badge.color + '22' : c.card },
                      ]}
                    >
                      <Text style={{ color: badge?.color || c.text, fontSize: 11, fontWeight: '600' }}>
                        {badge?.label || s.status}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setStudentStatus(s, s.status)}
                      style={styles.clearStatusBtn}
                    >
                      <X size={14} color={c.textTertiary} />
                    </TouchableOpacity>
                  </View>
                </GlassCard>
              );
            })}
          {/* Quick-set status for students without one */}
          {myStudents.filter((s) => !s.status).length > 0 && (
            <View style={{ marginTop: 8 }}>
              <Text style={[styles.subLabel, { color: c.textSecondary }]}>Set status:</Text>
              {myStudents
                .filter((s) => !s.status)
                .slice(0, 5)
                .map((s) => (
                  <View key={s.id} style={styles.setStatusRow}>
                    <TouchableOpacity
                      style={{ flex: 1 }}
                      onPress={() => navigation.navigate('StudentDetail', { id: s.id })}
                    >
                      <Text style={[styles.statusSetName, { color: c.text }]} numberOfLines={1}>
                        {s.name}
                      </Text>
                    </TouchableOpacity>
                    {statusBadges.map((b) => (
                      <TouchableOpacity
                        key={b.key}
                        style={[styles.miniStatusBtn, { borderColor: b.color + '55' }]}
                        onPress={() => setStudentStatus(s, b.key)}
                      >
                        <Text style={{ color: b.color, fontSize: 10, fontWeight: '600' }}>
                          {b.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}
            </View>
          )}
        </View>
      )}

      {/* ── News ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Newspaper size={18} color={c.purple} />
          <Text style={[styles.sectionTitle, { color: c.text, marginLeft: 6 }]}>News</Text>
        </View>
        <GlassCard style={{ marginBottom: 10 }}>
          <TextInput
            style={[
              styles.newsInput,
              {
                color: c.text,
                backgroundColor: c.inputBg,
                borderColor: c.inputBorder,
              },
            ]}
            placeholder="Write a news post..."
            placeholderTextColor={c.textTertiary}
            value={newsText}
            onChangeText={setNewsText}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.newsPostBtn,
              { backgroundColor: newsText.trim() ? c.purple : c.inputBg },
            ]}
            onPress={handleAddNews}
            disabled={!newsText.trim()}
          >
            <Plus size={16} color={newsText.trim() ? '#fff' : c.textTertiary} />
            <Text
              style={{
                color: newsText.trim() ? '#fff' : c.textTertiary,
                fontWeight: '600',
                marginLeft: 4,
                fontSize: 13,
              }}
            >
              Post
            </Text>
          </TouchableOpacity>
        </GlassCard>
        {myNews.map((n) => (
          <GlassCard key={n.id} style={styles.newsCard}>
            <View style={styles.newsRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.newsText, { color: c.text }]}>{n.text}</Text>
                <Text style={[styles.newsDate, { color: c.textTertiary }]}>
                  {formatDate(n.createdAt || n.date)}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleDeleteNews(n.id)} style={styles.newsDeleteBtn}>
                <X size={16} color={c.red} />
              </TouchableOpacity>
            </View>
          </GlassCard>
        ))}
        {myNews.length === 0 && (
          <Text style={[styles.emptyText, { color: c.textTertiary }]}>No news yet</Text>
        )}
      </View>
    </>
  );
}

/* ======================================================================== */
/*  STUDENT DASHBOARD                                                       */
/* ======================================================================== */

function StudentDashboard({ navigation, data, auth, c, dark }) {
  const student = useMemo(
    () => data.students.find((s) => s.id === auth.studentId),
    [data.students, auth.studentId],
  );

  const group = useMemo(
    () => (student?.groupId ? data.groups.find((g) => g.id === student.groupId) : null),
    [data.groups, student],
  );

  const subscriptionActive = student && !isExpired(student.subscriptionEnd);

  const pinnedMaterial = useMemo(
    () => data.materials.find((m) => m.pinned && m.trainerId === student?.trainerId),
    [data.materials, student],
  );

  const upcomingTournaments = useMemo(
    () =>
      data.tournaments
        .filter((t) => new Date(t.date) >= new Date())
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 3),
    [data.tournaments],
  );

  const latestNews = useMemo(
    () =>
      [...data.news]
        .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
        .slice(0, 5),
    [data.news],
  );

  const displayName = student?.name || auth.user?.name || 'Student';

  return (
    <>
      {/* ── Welcome Card ── */}
      <LinearGradient
        colors={dark ? ['#1e3a5f', '#1e1b4b', '#0f0f23'] : ['#93c5fd', '#818cf8', '#e0e7ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroGradient}
      >
        <Text style={styles.welcomeLabel}>Welcome back,</Text>
        <Text style={[styles.heroTitle, { color: '#fff' }]}>{displayName}</Text>
        {group && (
          <View style={styles.groupBadge}>
            <Dumbbell size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.groupBadgeText}>{group.name}</Text>
          </View>
        )}
      </LinearGradient>

      {/* ── Subscription Status ── */}
      <View style={styles.section}>
        <GlassCard>
          <View style={styles.subsRow}>
            <View
              style={[
                styles.subsIconWrap,
                { backgroundColor: subscriptionActive ? c.greenBg : c.redBg },
              ]}
            >
              <CreditCard size={20} color={subscriptionActive ? c.green : c.red} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.subsTitle, { color: c.text }]}>Subscription</Text>
              <Text
                style={[
                  styles.subsStatus,
                  { color: subscriptionActive ? c.green : c.red },
                ]}
              >
                {subscriptionActive ? 'Active' : 'Expired'}
              </Text>
            </View>
            <Text style={[styles.subsDate, { color: c.textSecondary }]}>
              {student?.subscriptionEnd
                ? formatDate(student.subscriptionEnd)
                : '\u2014'}
            </Text>
          </View>
        </GlassCard>
      </View>

      {/* ── Pinned Material ── */}
      {pinnedMaterial && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Flame size={18} color={c.purple} />
            <Text style={[styles.sectionTitle, { color: c.text, marginLeft: 6 }]}>
              Daily Workout
            </Text>
          </View>
          <GlassCard
            onPress={() => {
              if (pinnedMaterial.url) {
                Linking.openURL(pinnedMaterial.url).catch(() => {});
              }
            }}
          >
            <Text style={[styles.materialTitle, { color: c.text }]}>
              {pinnedMaterial.title || 'Workout Video'}
            </Text>
            {pinnedMaterial.description ? (
              <Text style={[styles.materialDesc, { color: c.textSecondary }]} numberOfLines={2}>
                {pinnedMaterial.description}
              </Text>
            ) : null}
            <View style={styles.materialFooter}>
              <Dumbbell size={14} color={c.purple} />
              <Text style={[styles.materialLink, { color: c.purple }]}>Watch now</Text>
              <ChevronRight size={14} color={c.purple} />
            </View>
          </GlassCard>
        </View>
      )}

      {/* ── Upcoming Tournaments ── */}
      {upcomingTournaments.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Trophy size={18} color={c.yellow} />
            <Text style={[styles.sectionTitle, { color: c.text, marginLeft: 6 }]}>
              Upcoming Tournaments
            </Text>
          </View>
          {upcomingTournaments.map((t) => (
            <GlassCard
              key={t.id}
              style={styles.tournamentCard}
              onPress={() => navigation.navigate('Tournaments')}
            >
              <View style={styles.tournamentRow}>
                <View style={[styles.tournamentIconWrap, { backgroundColor: c.yellowBg }]}>
                  <Trophy size={16} color={c.yellow} />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.tournamentName, { color: c.text }]}>{t.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                    <Calendar size={12} color={c.textTertiary} />
                    <Text style={[styles.tournamentDate, { color: c.textTertiary }]}>
                      {' '}{formatDate(t.date)}
                    </Text>
                    {t.location && (
                      <>
                        <MapPin size={12} color={c.textTertiary} style={{ marginLeft: 8 }} />
                        <Text style={[styles.tournamentDate, { color: c.textTertiary }]}>
                          {' '}{t.location}
                        </Text>
                      </>
                    )}
                  </View>
                </View>
                <ChevronRight size={16} color={c.textTertiary} />
              </View>
            </GlassCard>
          ))}
        </View>
      )}

      {/* ── Latest News ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Newspaper size={18} color={c.purple} />
          <Text style={[styles.sectionTitle, { color: c.text, marginLeft: 6 }]}>Latest News</Text>
        </View>
        {latestNews.map((n) => (
          <GlassCard key={n.id} style={styles.newsCard}>
            <Text style={[styles.newsText, { color: c.text }]}>{n.text}</Text>
            <Text style={[styles.newsDate, { color: c.textTertiary }]}>
              {formatDate(n.createdAt || n.date)}
            </Text>
          </GlassCard>
        ))}
        {latestNews.length === 0 && (
          <Text style={[styles.emptyText, { color: c.textTertiary }]}>No news yet</Text>
        )}
      </View>
    </>
  );
}

/* ======================================================================== */
/*  SUPERADMIN DASHBOARD                                                    */
/* ======================================================================== */

function SuperadminDashboard({ navigation, data, c, dark }) {
  const trainers = useMemo(
    () => data.users.filter((u) => u.role === 'trainer'),
    [data.users],
  );

  const stats = [
    { label: 'Trainers', value: trainers.length, icon: Shield, color: c.purple, bg: c.purpleBg },
    { label: 'Students', value: data.students.length, icon: Users, color: c.blue, bg: c.blueBg },
    { label: 'Clubs', value: data.clubs.length, icon: Award, color: c.green, bg: c.greenBg },
  ];

  const pendingRegs = data.pendingRegistrations || [];

  const latestNews = useMemo(
    () =>
      [...data.news]
        .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
        .slice(0, 5),
    [data.news],
  );

  const handleApprove = useCallback(
    async (id) => {
      try {
        await require('../utils/api').api.approveRegistration(id);
      } catch {
        Alert.alert('Error', 'Could not approve registration');
      }
    },
    [],
  );

  const handleReject = useCallback(
    async (id) => {
      try {
        await require('../utils/api').api.rejectRegistration(id);
      } catch {
        Alert.alert('Error', 'Could not reject registration');
      }
    },
    [],
  );

  return (
    <>
      {/* ── System Stats ── */}
      <LinearGradient
        colors={dark ? ['#4c1d95', '#1e1b4b', '#0f0f23'] : ['#a78bfa', '#818cf8', '#e0e7ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroGradient}
      >
        <Text style={[styles.heroTitle, { color: '#fff' }]}>System Overview</Text>
        <View style={styles.statsGrid}>
          {stats.map((s) => (
            <View key={s.label} style={styles.statItem}>
              <View style={[styles.statIconWrap, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                <s.icon size={18} color="#fff" />
              </View>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* ── Pending Registrations ── */}
      {pendingRegs.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <UserPlus size={18} color={c.yellow} />
            <Text style={[styles.sectionTitle, { color: c.text, marginLeft: 6 }]}>
              Pending Registrations ({pendingRegs.length})
            </Text>
          </View>
          {pendingRegs.map((reg) => (
            <GlassCard key={reg.id} style={styles.pendingCard}>
              <View style={styles.pendingRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pendingName, { color: c.text }]}>
                    {reg.name || reg.phone}
                  </Text>
                  <Text style={[styles.pendingRole, { color: c.textSecondary }]}>
                    {reg.role || 'trainer'} {reg.phone ? `\u2022 ${reg.phone}` : ''}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.approveBtn, { backgroundColor: c.greenBg }]}
                  onPress={() => handleApprove(reg.id)}
                >
                  <Check size={16} color={c.green} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.rejectBtn, { backgroundColor: c.redBg }]}
                  onPress={() => handleReject(reg.id)}
                >
                  <X size={16} color={c.red} />
                </TouchableOpacity>
              </View>
            </GlassCard>
          ))}
        </View>
      )}

      {/* ── Quick Links ── */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: c.text }]}>Manage</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: c.purpleBg }]}
            onPress={() => navigation.navigate('Trainers')}
          >
            <Shield size={20} color={c.purple} />
            <Text style={[styles.actionLabel, { color: c.purple }]}>Trainers</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: c.blueBg }]}
            onPress={() => navigation.navigate('Clubs')}
          >
            <Award size={20} color={c.blue} />
            <Text style={[styles.actionLabel, { color: c.blue }]}>Clubs</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: c.yellowBg }]}
            onPress={() => navigation.navigate('Tournaments')}
          >
            <Trophy size={20} color={c.yellow} />
            <Text style={[styles.actionLabel, { color: c.yellow }]}>Tournaments</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Latest News ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Newspaper size={18} color={c.purple} />
          <Text style={[styles.sectionTitle, { color: c.text, marginLeft: 6 }]}>Latest News</Text>
        </View>
        {latestNews.map((n) => (
          <GlassCard key={n.id} style={styles.newsCard}>
            <Text style={[styles.newsText, { color: c.text }]}>{n.text}</Text>
            <Text style={[styles.newsDate, { color: c.textTertiary }]}>
              {formatDate(n.createdAt || n.date)}
            </Text>
          </GlassCard>
        ))}
        {latestNews.length === 0 && (
          <Text style={[styles.emptyText, { color: c.textTertiary }]}>No news yet</Text>
        )}
      </View>
    </>
  );
}

/* ======================================================================== */
/*  MAIN DASHBOARD SCREEN                                                   */
/* ======================================================================== */

export default function DashboardScreen({ navigation }) {
  const { auth } = useAuth();
  const { data, loading, reload, addNews, deleteNews, updateStudent } = useData();
  const { dark } = useTheme();
  const c = getColors(dark);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await reload();
    } catch {}
    setRefreshing(false);
  }, [reload]);

  const role = auth?.role;

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: c.bg }]}>
        <Flame size={40} color={c.purple} />
        <Text style={[styles.loadingText, { color: c.textSecondary }]}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <PageHeader title="iBorcuha" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.purple} />
        }
      >
        {role === 'trainer' && (
          <TrainerDashboard
            navigation={navigation}
            data={data}
            auth={auth}
            c={c}
            dark={dark}
            addNews={addNews}
            deleteNews={deleteNews}
            updateStudent={updateStudent}
          />
        )}

        {role === 'student' && (
          <StudentDashboard
            navigation={navigation}
            data={data}
            auth={auth}
            c={c}
            dark={dark}
          />
        )}

        {role === 'superadmin' && (
          <SuperadminDashboard
            navigation={navigation}
            data={data}
            c={c}
            dark={dark}
          />
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

/* ======================================================================== */
/*  STYLES                                                                  */
/* ======================================================================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },

  /* ── Hero / Gradient ── */
  heroGradient: {
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 16,
  },
  welcomeLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    marginBottom: 2,
  },
  groupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  groupBadgeText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },

  /* ── Sections ── */
  section: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  subLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
  },

  /* ── Quick Actions ── */
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 6,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '700',
  },

  /* ── Expiring ── */
  expiringCard: {
    marginBottom: 6,
  },
  expiringRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expiringName: {
    fontSize: 14,
    fontWeight: '600',
  },
  expiringDate: {
    fontSize: 12,
    marginTop: 1,
  },

  /* ── Student Status ── */
  statusCard: {
    marginBottom: 6,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  clearStatusBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 6,
  },
  statusSetName: {
    fontSize: 13,
    fontWeight: '500',
  },
  miniStatusBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },

  /* ── News ── */
  newsInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  newsPostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  newsCard: {
    marginBottom: 6,
  },
  newsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  newsText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  newsDate: {
    fontSize: 11,
    marginTop: 4,
  },
  newsDeleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 16,
  },

  /* ── Subscription (Student) ── */
  subsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subsIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subsTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  subsStatus: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 1,
  },
  subsDate: {
    fontSize: 13,
    fontWeight: '600',
  },

  /* ── Material (Student) ── */
  materialTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  materialDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  materialFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  materialLink: {
    fontSize: 13,
    fontWeight: '600',
  },

  /* ── Tournament (Student) ── */
  tournamentCard: {
    marginBottom: 6,
  },
  tournamentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tournamentIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tournamentName: {
    fontSize: 14,
    fontWeight: '600',
  },
  tournamentDate: {
    fontSize: 12,
  },

  /* ── Pending Registrations (Superadmin) ── */
  pendingCard: {
    marginBottom: 6,
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pendingName: {
    fontSize: 14,
    fontWeight: '600',
  },
  pendingRole: {
    fontSize: 12,
    marginTop: 1,
  },
  approveBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
