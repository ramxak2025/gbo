import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { getColors } from '../utils/theme';
import { getSportLabel } from '../utils/sports';
import GlassCard from '../components/GlassCard';
import Avatar from '../components/Avatar';
import PageHeader from '../components/PageHeader';

const STATUS_OPTIONS = [
  { id: 'training', label: 'Тренируется', icon: 'fitness-outline', color: 'green' },
  { id: 'sick', label: 'Болеет', icon: 'medical-outline', color: 'red' },
  { id: 'injury', label: 'Травма', icon: 'bandage-outline', color: 'yellow' },
  { id: 'skip', label: 'Пропуск', icon: 'close-circle-outline', color: 'textSecondary' },
];

export default function ParentClubScreen() {
  const { dark } = useTheme();
  const c = getColors(dark);
  const { auth } = useAuth();
  const { data } = useData();

  const [childStatuses, setChildStatuses] = useState({});

  const parent = useMemo(() => {
    if (!auth) return null;
    return (data.parents || []).find(p => p.userId === auth.id) || {
      name: auth.name, phone: auth.phone,
    };
  }, [data.parents, auth]);

  const children = useMemo(() => {
    if (!auth) return [];
    const parentRecord = (data.parents || []).find(p => p.userId === auth.id);
    if (!parentRecord?.studentIds) return [];
    return parentRecord.studentIds
      .map(sid => (data.students || []).find(s => s.id === sid))
      .filter(Boolean);
  }, [data.parents, data.students, auth]);

  const getTrainer = useCallback((trainerId) => {
    return (data.users || []).find(u => u.id === trainerId);
  }, [data.users]);

  const getSubscriptionStatus = useCallback((student) => {
    if (!student.subscriptionExpiry) return { active: false, label: 'Не указан' };
    const expiry = new Date(student.subscriptionExpiry);
    const now = new Date();
    const active = expiry >= now;
    const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    return {
      active,
      label: active
        ? `Активен (${diffDays} дн.)`
        : `Истёк ${expiry.toLocaleDateString('ru-RU')}`,
    };
  }, []);

  const getAttendancePercent = useCallback((studentId) => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const records = (data.attendance || []).filter(
      a => a.studentId === studentId && a.date >= monthStart
    );
    if (records.length === 0) return 0;
    const present = records.filter(a => a.present).length;
    return Math.round((present / records.length) * 100);
  }, [data.attendance]);

  const getChildNews = useCallback((trainerId) => {
    if (!trainerId) return [];
    return (data.news || [])
      .filter(n => n.trainerId === trainerId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3);
  }, [data.news]);

  const handleStatusChange = useCallback((studentId, statusId) => {
    setChildStatuses(prev => ({ ...prev, [studentId]: statusId }));
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <PageHeader title="Мой клуб" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Parent Info */}
        <GlassCard style={styles.parentCard}>
          <View style={styles.parentRow}>
            <Avatar name={parent?.name || auth?.name} size={48} />
            <View style={styles.parentInfo}>
              <Text style={[styles.parentName, { color: c.text }]}>{parent?.name || auth?.name}</Text>
              <Text style={[styles.parentPhone, { color: c.textSecondary }]}>{parent?.phone || auth?.phone}</Text>
            </View>
            <View style={[styles.roleBadge, { backgroundColor: c.purpleBg }]}>
              <Text style={[styles.roleText, { color: c.purple }]}>Родитель</Text>
            </View>
          </View>
        </GlassCard>

        {/* Children */}
        {children.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color={c.textTertiary} />
            <Text style={[styles.emptyText, { color: c.textSecondary }]}>Нет привязанных детей</Text>
          </View>
        ) : (
          children.map(child => {
            const sub = getSubscriptionStatus(child);
            const trainer = getTrainer(child.trainerId);
            const attendance = getAttendancePercent(child.id);
            const currentStatus = childStatuses[child.id] || 'training';
            const news = getChildNews(child.trainerId);

            return (
              <GlassCard key={child.id} style={styles.childCard}>
                {/* Child Header */}
                <View style={styles.childHeader}>
                  <Avatar name={child.name} size={44} />
                  <View style={styles.childInfo}>
                    <Text style={[styles.childName, { color: c.text }]}>{child.name}</Text>
                    {child.rank && (
                      <Text style={[styles.childRank, { color: c.textSecondary }]}>{child.rank}</Text>
                    )}
                  </View>
                </View>

                {/* Subscription */}
                <View style={styles.subsRow}>
                  <Text style={[styles.subsLabel, { color: c.textSecondary }]}>Абонемент:</Text>
                  <View style={[
                    styles.subsBadge,
                    { backgroundColor: sub.active ? c.greenBg : c.redBg },
                  ]}>
                    <View style={[styles.subsDot, { backgroundColor: sub.active ? c.green : c.red }]} />
                    <Text style={[styles.subsText, { color: sub.active ? c.green : c.red }]}>
                      {sub.label}
                    </Text>
                  </View>
                </View>

                {/* Status Selector */}
                <View style={styles.statusSection}>
                  <Text style={[styles.statusLabel, { color: c.textSecondary }]}>Статус:</Text>
                  <View style={styles.statusRow}>
                    {STATUS_OPTIONS.map(opt => {
                      const active = currentStatus === opt.id;
                      const optColor = c[opt.color] || c.textSecondary;
                      const optBg = c[opt.color + 'Bg'] || c.glass;
                      return (
                        <TouchableOpacity
                          key={opt.id}
                          style={[
                            styles.statusBtn,
                            { backgroundColor: active ? optBg : 'transparent', borderColor: active ? optColor : c.border },
                          ]}
                          onPress={() => handleStatusChange(child.id, opt.id)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name={opt.icon} size={14} color={active ? optColor : c.textTertiary} />
                          <Text style={[styles.statusBtnText, { color: active ? optColor : c.textTertiary }]}>
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Attendance */}
                <View style={styles.attendanceRow}>
                  <Ionicons name="calendar-outline" size={16} color={c.textSecondary} />
                  <Text style={[styles.attendanceLabel, { color: c.textSecondary }]}>
                    Посещаемость за месяц:
                  </Text>
                  <Text style={[
                    styles.attendanceValue,
                    { color: attendance >= 70 ? c.green : attendance >= 40 ? c.yellow : c.red },
                  ]}>
                    {attendance}%
                  </Text>
                </View>

                {/* Trainer */}
                {trainer && (
                  <View style={[styles.trainerSection, { borderTopColor: c.border }]}>
                    <Text style={[styles.trainerLabel, { color: c.textSecondary }]}>Тренер</Text>
                    <View style={styles.trainerRow}>
                      <Avatar name={trainer.name} photo={trainer.photo} size={36} />
                      <View style={styles.trainerInfo}>
                        <Text style={[styles.trainerName, { color: c.text }]}>{trainer.name}</Text>
                        <View style={styles.trainerContact}>
                          <Ionicons name="call-outline" size={12} color={c.textTertiary} />
                          <Text style={[styles.trainerPhone, { color: c.textSecondary }]}>{trainer.phone}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                )}

                {/* News */}
                {news.length > 0 && (
                  <View style={[styles.newsSection, { borderTopColor: c.border }]}>
                    <Text style={[styles.newsTitle, { color: c.textSecondary }]}>Новости от тренера</Text>
                    {news.map(n => (
                      <View key={n.id} style={[styles.newsItem, { backgroundColor: c.glass }]}>
                        <Text style={[styles.newsText, { color: c.text }]} numberOfLines={2}>{n.text || n.title}</Text>
                        <Text style={[styles.newsDate, { color: c.textTertiary }]}>
                          {new Date(n.createdAt).toLocaleDateString('ru-RU')}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </GlassCard>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  parentCard: { marginBottom: 16 },
  parentRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  parentInfo: { flex: 1 },
  parentName: { fontSize: 17, fontWeight: '600' },
  parentPhone: { fontSize: 13, marginTop: 2 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  roleText: { fontSize: 12, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15 },
  childCard: { marginBottom: 16 },
  childHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  childInfo: { flex: 1 },
  childName: { fontSize: 17, fontWeight: '600' },
  childRank: { fontSize: 13, marginTop: 2 },
  subsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  subsLabel: { fontSize: 13 },
  subsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  subsDot: { width: 6, height: 6, borderRadius: 3 },
  subsText: { fontSize: 13, fontWeight: '500' },
  statusSection: { marginBottom: 12 },
  statusLabel: { fontSize: 13, marginBottom: 8 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  statusBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1,
  },
  statusBtnText: { fontSize: 12, fontWeight: '500' },
  attendanceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  attendanceLabel: { fontSize: 13, flex: 1 },
  attendanceValue: { fontSize: 18, fontWeight: '800' },
  trainerSection: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 14, marginTop: 4 },
  trainerLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  trainerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  trainerInfo: { flex: 1 },
  trainerName: { fontSize: 14, fontWeight: '600' },
  trainerContact: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  trainerPhone: { fontSize: 13 },
  newsSection: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 14, marginTop: 14 },
  newsTitle: { fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  newsItem: { padding: 10, borderRadius: 10, marginBottom: 6 },
  newsText: { fontSize: 14 },
  newsDate: { fontSize: 11, marginTop: 4 },
});
