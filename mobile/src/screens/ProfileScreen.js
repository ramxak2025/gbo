import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import {
  Camera,
  LogOut,
  Bell,
  Shield,
  Award,
  Users,
  ChevronRight,
  Dumbbell,
  CreditCard,
  Crown,
  UserMinus,
  TrendingUp,
  Activity,
  Zap,
  Phone,
  MapPin,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../utils/theme';
import { api } from '../utils/api';
import { getSportLabel, getRankLabel } from '../utils/sports';
import Avatar from '../components/Avatar';
import GlassCard from '../components/GlassCard';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';

function formatDate(iso) {
  if (!iso) return '\u2014';
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function isExpired(dateStr) {
  if (!dateStr) return true;
  return new Date(dateStr) < new Date();
}

export default function ProfileScreen({ navigation }) {
  const { auth, logout } = useAuth();
  const { data, updateStudent, updateTrainer, removeTrainerFromClub } = useData();
  const { dark } = useTheme();
  const c = getColors(dark);
  const [fireConfirm, setFireConfirm] = useState(null);

  const authUser = auth?.user;
  const user =
    auth?.role === 'trainer'
      ? data.users.find((u) => u.id === auth.userId) || authUser
      : authUser;
  const student =
    auth?.role === 'student'
      ? data.students.find((s) => s.id === auth.studentId)
      : null;
  const trainer =
    auth?.role === 'student'
      ? data.users.find((u) => u.id === auth.userId)
      : null;
  const displayName =
    auth?.role === 'student' ? student?.name : user?.name;
  const avatarSrc =
    auth?.role === 'student' ? student?.avatar : user?.avatar;

  const myGroups =
    auth?.role === 'trainer'
      ? data.groups.filter((g) => g.trainerId === auth.userId)
      : [];
  const myStudents =
    auth?.role === 'trainer'
      ? data.students.filter((s) => s.trainerId === auth.userId)
      : [];

  const isHeadTrainer =
    auth?.role === 'trainer' && user?.isHeadTrainer && user?.clubId;
  const myClub = isHeadTrainer
    ? (data.clubs || []).find((cl) => cl.id === user.clubId)
    : null;
  const clubTrainers = isHeadTrainer
    ? data.users.filter(
        (u) => u.role === 'trainer' && u.clubId === user.clubId,
      )
    : [];

  const clubStats = useMemo(() => {
    if (!isHeadTrainer) return null;
    const trainerIds = new Set(clubTrainers.map((t) => t.id));
    const allStudents = data.students.filter((s) =>
      trainerIds.has(s.trainerId),
    );
    const active = allStudents.filter(
      (s) => !isExpired(s.subscriptionExpiresAt),
    ).length;
    const allGroups = data.groups.filter((g) => trainerIds.has(g.trainerId));
    return {
      trainers: clubTrainers.length,
      students: allStudents.length,
      active,
      groups: allGroups.length,
    };
  }, [isHeadTrainer, clubTrainers, data.students, data.groups]);

  const trainerStats = useMemo(() => {
    if (auth?.role !== 'trainer') return null;
    const active = myStudents.filter(
      (s) => !isExpired(s.subscriptionExpiresAt),
    ).length;
    return { total: myStudents.length, active, groups: myGroups.length };
  }, [auth?.role, myStudents, myGroups]);

  const group = student
    ? data.groups.find((g) => g.id === student.groupId)
    : null;
  const expired = student ? isExpired(student.subscriptionExpiresAt) : false;
  const sportLabel = getSportLabel(
    auth?.role === 'student' ? trainer?.sportType : user?.sportType,
  );

  const handleAvatarUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]) {
      try {
        const url = await api.uploadFile(result.assets[0].uri);
        if (auth?.role === 'student' && student) {
          await updateStudent(student.id, { avatar: url });
        } else {
          await updateTrainer(auth.userId, { avatar: url });
        }
      } catch (e) {
        Alert.alert('\u041e\u0448\u0438\u0431\u043a\u0430', e.message);
      }
    }
  };

  const handleFireTrainer = (trainerId) => {
    removeTrainerFromClub(user.clubId, trainerId);
    setFireConfirm(null);
  };

  const handleLogout = () => {
    Alert.alert('\u0412\u044b\u0439\u0442\u0438?', '\u0412\u044b \u0443\u0432\u0435\u0440\u0435\u043d\u044b, \u0447\u0442\u043e \u0445\u043e\u0442\u0438\u0442\u0435 \u0432\u044b\u0439\u0442\u0438?', [
      { text: '\u041e\u0442\u043c\u0435\u043d\u0430', style: 'cancel' },
      { text: '\u0412\u044b\u0439\u0442\u0438', style: 'destructive', onPress: logout },
    ]);
  };

  const getRoleBadgeStyle = () => {
    if (auth?.role === 'superadmin')
      return { backgroundColor: c.purpleBg, color: c.purple };
    if (auth?.role === 'trainer')
      return { backgroundColor: c.blueBg, color: c.blue };
    return { backgroundColor: c.greenBg, color: c.green };
  };

  const getRoleLabel = () => {
    if (auth?.role === 'superadmin') return '\u0410\u0434\u043c\u0438\u043d';
    if (auth?.role === 'trainer') return '\u0422\u0440\u0435\u043d\u0435\u0440';
    return '\u0421\u043f\u043e\u0440\u0442\u0441\u043c\u0435\u043d';
  };

  const roleBadge = getRoleBadgeStyle();

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <PageHeader title={'\u041f\u0440\u043e\u0444\u0438\u043b\u044c'} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Profile Card */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: dark
                ? 'rgba(168,85,247,0.08)'
                : 'rgba(168,85,247,0.05)',
              borderColor: dark
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(255,255,255,0.7)',
            },
          ]}
        >
          <View style={styles.heroInner}>
            <View style={styles.heroRow}>
              {/* Avatar with ring */}
              <View style={styles.avatarOuter}>
                <View
                  style={[
                    styles.avatarRing,
                    {
                      borderColor: isHeadTrainer
                        ? '#eab308'
                        : auth?.role === 'trainer'
                        ? '#a855f7'
                        : '#22c55e',
                    },
                  ]}
                >
                  <Avatar
                    src={avatarSrc}
                    name={displayName}
                    size={76}
                  />
                </View>
                <TouchableOpacity
                  style={[
                    styles.cameraBtn,
                    {
                      backgroundColor: dark
                        ? 'rgba(255,255,255,0.1)'
                        : '#ffffff',
                      borderColor: dark
                        ? 'rgba(255,255,255,0.2)'
                        : 'rgba(0,0,0,0.1)',
                    },
                  ]}
                  onPress={handleAvatarUpload}
                >
                  <Camera
                    size={14}
                    color={dark ? 'rgba(255,255,255,0.7)' : '#666'}
                  />
                </TouchableOpacity>
                {isHeadTrainer && (
                  <View style={styles.crownBadge}>
                    <Crown size={12} color="#fff" />
                  </View>
                )}
              </View>

              {/* Info */}
              <View style={styles.heroInfo}>
                <Text
                  style={[styles.heroName, { color: c.text }]}
                  numberOfLines={1}
                >
                  {displayName}
                </Text>
                <View style={styles.badgeRow}>
                  <View
                    style={[
                      styles.roleBadge,
                      { backgroundColor: roleBadge.backgroundColor },
                    ]}
                  >
                    <Text
                      style={[styles.roleBadgeText, { color: roleBadge.color }]}
                    >
                      {getRoleLabel()}
                    </Text>
                  </View>
                  {sportLabel && (
                    <View
                      style={[
                        styles.roleBadge,
                        { backgroundColor: c.redBg },
                      ]}
                    >
                      <Text
                        style={[styles.roleBadgeText, { color: c.accent }]}
                      >
                        {sportLabel}
                      </Text>
                    </View>
                  )}
                </View>

                {(auth?.role === 'trainer' || auth?.role === 'student') && (
                  <View style={styles.metaRow}>
                    {(auth?.role === 'trainer'
                      ? user?.clubName
                      : trainer?.clubName) ? (
                      <View style={styles.metaItem}>
                        <Shield size={10} color={c.textTertiary} />
                        <Text
                          style={[styles.metaText, { color: c.textTertiary }]}
                        >
                          {auth?.role === 'trainer'
                            ? user?.clubName
                            : trainer?.clubName}
                        </Text>
                      </View>
                    ) : null}
                    {(auth?.role === 'trainer'
                      ? user?.city
                      : trainer?.city) ? (
                      <View style={styles.metaItem}>
                        <MapPin size={10} color={c.textTertiary} />
                        <Text
                          style={[styles.metaText, { color: c.textTertiary }]}
                        >
                          {auth?.role === 'trainer'
                            ? user?.city
                            : trainer?.city}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Trainer quick stats bar */}
          {auth?.role === 'trainer' && trainerStats && (
            <View style={styles.statsBarWrap}>
              <View
                style={[
                  styles.statsBar,
                  {
                    backgroundColor: dark
                      ? 'rgba(0,0,0,0.3)'
                      : 'rgba(255,255,255,0.5)',
                  },
                ]}
              >
                {[
                  {
                    Icon: Users,
                    value: trainerStats.total,
                    label: '\u0423\u0447\u0435\u043d\u0438\u043a\u043e\u0432',
                    iconColor: '#3b82f6',
                    iconBg: dark
                      ? 'rgba(59,130,246,0.15)'
                      : 'rgba(59,130,246,0.1)',
                  },
                  {
                    Icon: Zap,
                    value: trainerStats.active,
                    label: '\u0410\u043a\u0442\u0438\u0432\u043d\u044b\u0445',
                    iconColor: '#22c55e',
                    iconBg: dark
                      ? 'rgba(34,197,94,0.15)'
                      : 'rgba(34,197,94,0.1)',
                  },
                  {
                    Icon: Dumbbell,
                    value: trainerStats.groups,
                    label: '\u0413\u0440\u0443\u043f\u043f',
                    iconColor: '#a855f7',
                    iconBg: dark
                      ? 'rgba(168,85,247,0.15)'
                      : 'rgba(168,85,247,0.1)',
                  },
                ].map(({ Icon, value, label, iconColor, iconBg }) => (
                  <View key={label} style={styles.statItem}>
                    <View
                      style={[styles.statIconWrap, { backgroundColor: iconBg }]}
                    >
                      <Icon size={15} color={iconColor} />
                    </View>
                    <Text style={[styles.statValue, { color: c.text }]}>
                      {value}
                    </Text>
                    <Text style={[styles.statLabel, { color: c.textTertiary }]}>
                      {label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Head Trainer Club Management */}
        {isHeadTrainer && myClub && (
          <>
            {/* Club Stats Dashboard */}
            <View
              style={[
                styles.clubCard,
                {
                  backgroundColor: dark
                    ? 'rgba(234,179,8,0.06)'
                    : 'rgba(234,179,8,0.04)',
                  borderColor: dark
                    ? 'rgba(234,179,8,0.15)'
                    : 'rgba(234,179,8,0.2)',
                },
              ]}
            >
              <View style={styles.clubHeader}>
                <View
                  style={[
                    styles.clubIconWrap,
                    {
                      backgroundColor: dark
                        ? 'rgba(234,179,8,0.2)'
                        : 'rgba(234,179,8,0.1)',
                    },
                  ]}
                >
                  <Crown
                    size={20}
                    color={dark ? '#eab308' : '#d97706'}
                  />
                </View>
                <View style={styles.clubHeaderInfo}>
                  <Text
                    style={[
                      styles.clubSubtitle,
                      {
                        color: dark
                          ? 'rgba(234,179,8,0.5)'
                          : 'rgba(217,119,6,0.7)',
                      },
                    ]}
                  >
                    {'\u0423\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u0435 \u043a\u043b\u0443\u0431\u043e\u043c'}
                  </Text>
                  <Text
                    style={[styles.clubName, { color: c.text }]}
                    numberOfLines={1}
                  >
                    {myClub.name}
                  </Text>
                </View>
              </View>

              {clubStats && (
                <View style={styles.clubStatsGrid}>
                  {[
                    {
                      Icon: Users,
                      label: '\u0422\u0440\u0435\u043d\u0435\u0440\u044b',
                      value: clubStats.trainers,
                      gradient: '#3b82f6',
                    },
                    {
                      Icon: Award,
                      label: '\u0423\u0447\u0435\u043d\u0438\u043a\u0438',
                      value: clubStats.students,
                      gradient: '#ef4444',
                    },
                    {
                      Icon: TrendingUp,
                      label: '\u0410\u043a\u0442\u0438\u0432\u043d\u044b\u0445',
                      value: clubStats.active,
                      gradient: '#22c55e',
                    },
                    {
                      Icon: Dumbbell,
                      label: '\u0413\u0440\u0443\u043f\u043f',
                      value: clubStats.groups,
                      gradient: '#a855f7',
                    },
                  ].map(({ Icon, label, value, gradient }) => (
                    <View
                      key={label}
                      style={[
                        styles.clubStatCell,
                        {
                          backgroundColor: dark
                            ? 'rgba(0,0,0,0.25)'
                            : 'rgba(255,255,255,0.6)',
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.clubStatIcon,
                          { backgroundColor: gradient },
                        ]}
                      >
                        <Icon size={13} color="#fff" />
                      </View>
                      <Text style={[styles.clubStatValue, { color: c.text }]}>
                        {value}
                      </Text>
                      <Text
                        style={[
                          styles.clubStatLabel,
                          { color: c.textTertiary },
                        ]}
                      >
                        {label}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Club Trainers List */}
            <View style={styles.clubTrainersSection}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: c.textTertiary },
                ]}
              >
                {`\u0422\u0440\u0435\u043d\u0435\u0440\u044b \u043a\u043b\u0443\u0431\u0430 (${clubTrainers.length})`}
              </Text>
              <View style={styles.listGap}>
                {clubTrainers.map((t) => {
                  const tStudents = data.students.filter(
                    (s) => s.trainerId === t.id,
                  );
                  const tActive = tStudents.filter(
                    (s) => !isExpired(s.subscriptionExpiresAt),
                  ).length;
                  const tGroups = data.groups.filter(
                    (g) => g.trainerId === t.id,
                  );
                  const isMe = t.id === auth.userId;
                  return (
                    <View
                      key={t.id}
                      style={[
                        styles.clubTrainerCard,
                        {
                          backgroundColor: c.card,
                          borderColor: isMe
                            ? 'rgba(234,179,8,0.25)'
                            : c.cardBorder,
                        },
                      ]}
                    >
                      <View style={styles.clubTrainerRow}>
                        <View style={styles.clubTrainerAvatarWrap}>
                          <Avatar
                            src={t.avatar}
                            name={t.name}
                            size={42}
                          />
                          {t.isHeadTrainer && (
                            <View style={styles.miniCrown}>
                              <Crown size={10} color="#fff" />
                            </View>
                          )}
                        </View>
                        <View style={styles.clubTrainerInfo}>
                          <View style={styles.clubTrainerNameRow}>
                            <Text
                              style={[
                                styles.clubTrainerName,
                                { color: c.text },
                              ]}
                              numberOfLines={1}
                            >
                              {t.name}
                            </Text>
                            {isMe && (
                              <View
                                style={[
                                  styles.youBadge,
                                  {
                                    backgroundColor: dark
                                      ? 'rgba(255,255,255,0.1)'
                                      : 'rgba(0,0,0,0.05)',
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.youBadgeText,
                                    { color: c.textTertiary },
                                  ]}
                                >
                                  \u0432\u044b
                                </Text>
                              </View>
                            )}
                          </View>
                          <View style={styles.clubTrainerMeta}>
                            <View style={styles.metaItem}>
                              <Users size={9} color={c.textTertiary} />
                              <Text
                                style={[
                                  styles.metaSmallText,
                                  { color: c.textTertiary },
                                ]}
                              >
                                {tStudents.length}
                              </Text>
                            </View>
                            <View style={styles.metaItem}>
                              <Activity size={9} color={c.textTertiary} />
                              <Text
                                style={[
                                  styles.metaSmallText,
                                  { color: c.textTertiary },
                                ]}
                              >
                                {tActive} \u0430\u043a\u0442.
                              </Text>
                            </View>
                            <View style={styles.metaItem}>
                              <Dumbbell size={9} color={c.textTertiary} />
                              <Text
                                style={[
                                  styles.metaSmallText,
                                  { color: c.textTertiary },
                                ]}
                              >
                                {tGroups.length} \u0433\u0440.
                              </Text>
                            </View>
                          </View>
                        </View>
                        {!t.isHeadTrainer && (
                          <TouchableOpacity
                            style={styles.fireBtn}
                            onPress={() => setFireConfirm(t)}
                          >
                            <UserMinus size={15} color="#ef4444" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        )}

        {/* Student Info Cards */}
        {auth?.role === 'student' && student && (
          <>
            <View style={styles.studentInfoGrid}>
              <GlassCard style={styles.studentInfoHalf}>
                <Text style={[styles.studentInfoLabel, { color: c.textTertiary }]}>
                  {'\u0413\u0440\u0443\u043f\u043f\u0430'}
                </Text>
                <View style={styles.studentInfoValueRow}>
                  <Users size={16} color={c.purple} />
                  <Text
                    style={[styles.studentInfoValue, { color: c.text }]}
                    numberOfLines={1}
                  >
                    {group?.name || '\u0411\u0435\u0437 \u0433\u0440\u0443\u043f\u043f\u044b'}
                  </Text>
                </View>
              </GlassCard>
              <GlassCard style={styles.studentInfoHalf}>
                <Text style={[styles.studentInfoLabel, { color: c.textTertiary }]}>
                  {'\u0410\u0431\u043e\u043d\u0435\u043c\u0435\u043d\u0442'}
                </Text>
                <View style={styles.studentInfoValueRow}>
                  <CreditCard
                    size={16}
                    color={expired ? c.red : c.green}
                  />
                  <Text
                    style={[
                      styles.studentInfoValue,
                      { color: expired ? c.red : c.text },
                    ]}
                    numberOfLines={1}
                  >
                    {expired
                      ? '\u0418\u0441\u0442\u0451\u043a'
                      : formatDate(student.subscriptionExpiresAt)}
                  </Text>
                </View>
              </GlassCard>
            </View>

            <GlassCard style={styles.studentDetailCard}>
              {[
                {
                  Icon: Award,
                  label:
                    getRankLabel(trainer?.sportType) || '\u041f\u043e\u044f\u0441',
                  value: student.belt || '\u2014',
                  iconColor: c.accent,
                },
                {
                  Icon: Dumbbell,
                  label: '\u0422\u0440\u0435\u043d\u0438\u0440\u0443\u0435\u0442\u0441\u044f \u0441',
                  value: formatDate(
                    student.trainingStartDate || student.createdAt,
                  ),
                  iconColor: c.green,
                },
              ].map(({ Icon, label, value, iconColor }, i) => (
                <View
                  key={label}
                  style={[
                    styles.detailRow,
                    i > 0 && {
                      borderTopWidth: 1,
                      borderTopColor: c.separator,
                    },
                  ]}
                >
                  <View style={styles.detailLeft}>
                    <View
                      style={[
                        styles.detailIconWrap,
                        { backgroundColor: c.inputBg },
                      ]}
                    >
                      <Icon size={15} color={iconColor} />
                    </View>
                    <Text
                      style={[
                        styles.detailLabel,
                        { color: c.textSecondary },
                      ]}
                    >
                      {label}
                    </Text>
                  </View>
                  <Text style={[styles.detailValue, { color: c.text }]}>
                    {value}
                  </Text>
                </View>
              ))}
            </GlassCard>

            {trainer && (
              <GlassCard style={styles.trainerInfoCard}>
                <Avatar
                  src={trainer.avatar}
                  name={trainer.name || 'T'}
                  size={44}
                />
                <View style={styles.trainerInfoContent}>
                  <Text
                    style={[
                      styles.studentInfoLabel,
                      { color: c.textTertiary },
                    ]}
                  >
                    {'\u041c\u043e\u0439 \u0442\u0440\u0435\u043d\u0435\u0440'}
                  </Text>
                  <Text
                    style={[styles.trainerInfoName, { color: c.text }]}
                    numberOfLines={1}
                  >
                    {trainer.name}
                  </Text>
                </View>
                <Shield size={18} color={c.textMuted} />
              </GlassCard>
            )}
          </>
        )}

        {/* Phone info row */}
        {user?.phone && (
          <GlassCard style={styles.phoneRow}>
            <View
              style={[
                styles.detailIconWrap,
                { backgroundColor: c.inputBg },
              ]}
            >
              <Phone size={15} color={c.accent} />
            </View>
            <Text style={[styles.phoneLabel, { color: c.textSecondary }]}>
              {'\u0422\u0435\u043b\u0435\u0444\u043e\u043d'}
            </Text>
            <Text style={[styles.phoneValue, { color: c.text }]}>
              {user.phone}
            </Text>
          </GlassCard>
        )}

        {/* Action buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              {
                backgroundColor: c.card,
                borderColor: c.cardBorder,
              },
            ]}
            onPress={() => navigation.navigate('Notifications')}
          >
            <View
              style={[
                styles.actionIconWrap,
                { backgroundColor: c.blueBg },
              ]}
            >
              <Bell size={17} color={c.blue} />
            </View>
            <Text style={[styles.actionBtnText, { color: c.text }]}>
              {'\u0423\u0432\u0435\u0434\u043e\u043c\u043b\u0435\u043d\u0438\u044f'}
            </Text>
            <ChevronRight size={16} color={c.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionBtn,
              {
                backgroundColor: dark
                  ? 'rgba(239,68,68,0.08)'
                  : 'rgba(239,68,68,0.05)',
                borderColor: dark
                  ? 'rgba(239,68,68,0.15)'
                  : 'rgba(239,68,68,0.1)',
              },
            ]}
            onPress={handleLogout}
          >
            <View
              style={[
                styles.actionIconWrap,
                { backgroundColor: c.redBg },
              ]}
            >
              <LogOut size={17} color={c.red} />
            </View>
            <Text style={[styles.actionBtnText, { color: c.red }]}>
              {'\u0412\u044b\u0439\u0442\u0438 \u0438\u0437 \u0430\u043a\u043a\u0430\u0443\u043d\u0442\u0430'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Fire Trainer Confirmation Modal */}
      <Modal
        visible={!!fireConfirm}
        onClose={() => setFireConfirm(null)}
        title={'\u0423\u0432\u043e\u043b\u0438\u0442\u044c \u0442\u0440\u0435\u043d\u0435\u0440\u0430'}
      >
        {fireConfirm && (
          <View style={styles.fireModalContent}>
            <View
              style={[
                styles.fireModalCard,
                {
                  backgroundColor: c.redBg,
                  borderColor: dark
                    ? 'rgba(239,68,68,0.2)'
                    : 'rgba(239,68,68,0.1)',
                },
              ]}
            >
              <View style={styles.fireModalAvatarWrap}>
                <Avatar
                  src={fireConfirm.avatar}
                  name={fireConfirm.name}
                  size={56}
                />
              </View>
              <Text style={[styles.fireModalName, { color: c.text }]}>
                {fireConfirm.name}
              </Text>
              <Text
                style={[styles.fireModalDesc, { color: c.textSecondary }]}
              >
                {'\u0422\u0440\u0435\u043d\u0435\u0440 \u0441\u0442\u0430\u043d\u0435\u0442 \u0441\u0432\u043e\u0431\u043e\u0434\u043d\u044b\u043c \u0438 \u0441\u043e\u0445\u0440\u0430\u043d\u0438\u0442 \u0441\u0432\u043e\u0438 \u0433\u0440\u0443\u043f\u043f\u044b \u0438 \u0443\u0447\u0435\u043d\u0438\u043a\u043e\u0432'}
              </Text>
            </View>
            <View style={styles.fireModalActions}>
              <TouchableOpacity
                style={[
                  styles.fireModalCancelBtn,
                  {
                    backgroundColor: c.inputBg,
                  },
                ]}
                onPress={() => setFireConfirm(null)}
              >
                <Text
                  style={[styles.fireModalCancelText, { color: c.text }]}
                >
                  {'\u041e\u0442\u043c\u0435\u043d\u0430'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.fireModalConfirmBtn}
                onPress={() => handleFireTrainer(fireConfirm.id)}
              >
                <Text style={styles.fireModalConfirmText}>
                  {'\u0423\u0432\u043e\u043b\u0438\u0442\u044c'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  listGap: {
    gap: 8,
  },

  // Hero card
  heroCard: {
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  heroInner: {
    padding: 20,
    paddingBottom: 16,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  avatarOuter: {
    position: 'relative',
  },
  avatarRing: {
    borderWidth: 3,
    borderRadius: 44,
    padding: 2,
  },
  cameraBtn: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  crownBadge: {
    position: 'absolute',
    top: -4,
    left: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#eab308',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroInfo: {
    flex: 1,
    paddingTop: 4,
  },
  heroName: {
    fontSize: 20,
    fontWeight: '900',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '500',
  },
  metaSmallText: {
    fontSize: 11,
    fontWeight: '500',
  },

  // Stats bar
  statsBarWrap: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  statsBar: {
    flexDirection: 'row',
    borderRadius: 18,
    padding: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 20,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Club card
  clubCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  clubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  clubIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubHeaderInfo: {
    flex: 1,
  },
  clubSubtitle: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  clubName: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  clubStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  clubStatCell: {
    width: '23%',
    flexGrow: 1,
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
  },
  clubStatIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  clubStatValue: {
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 20,
  },
  clubStatLabel: {
    fontSize: 7,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 2,
  },

  // Club trainers
  clubTrainersSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    paddingLeft: 4,
  },
  clubTrainerCard: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
  },
  clubTrainerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clubTrainerAvatarWrap: {
    position: 'relative',
  },
  miniCrown: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#eab308',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubTrainerInfo: {
    flex: 1,
  },
  clubTrainerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clubTrainerName: {
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
  },
  youBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  youBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  clubTrainerMeta: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  fireBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Student info
  studentInfoGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  studentInfoHalf: {
    flex: 1,
  },
  studentInfoLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  studentInfoValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  studentInfoValue: {
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
  },
  studentDetailCard: {
    marginBottom: 12,
    padding: 0,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  trainerInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  trainerInfoContent: {
    flex: 1,
  },
  trainerInfoName: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Phone row
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  phoneLabel: {
    fontSize: 14,
    flex: 1,
  },
  phoneValue: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Actions
  actionsSection: {
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  actionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },

  bottomSpacer: {
    height: 16,
  },

  // Fire modal
  fireModalContent: {
    gap: 16,
  },
  fireModalCard: {
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  fireModalAvatarWrap: {
    marginBottom: 12,
  },
  fireModalName: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  fireModalDesc: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  fireModalActions: {
    flexDirection: 'row',
    gap: 8,
  },
  fireModalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  fireModalCancelText: {
    fontSize: 14,
    fontWeight: '700',
  },
  fireModalConfirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: '#ef4444',
  },
  fireModalConfirmText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
