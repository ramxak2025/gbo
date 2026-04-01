import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { getColors } from '../utils/theme';
import { api } from '../utils/api';
import GlassCard from '../components/GlassCard';
import Avatar from '../components/Avatar';
import QRGenerator from '../components/QRGenerator';

const TABS = [
  { id: 'mark', label: 'Отметить', icon: 'checkbox-outline' },
  { id: 'stats', label: 'Статистика', icon: 'stats-chart-outline' },
  { id: 'qr', label: 'QR', icon: 'qr-code-outline' },
];

const MONTHS_RU = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

function formatDateShort(date) {
  const d = new Date(date);
  const day = d.getDate();
  const month = MONTHS_RU[d.getMonth()];
  const weekDays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const weekDay = weekDays[d.getDay()];
  return `${weekDay}, ${day} ${month.toLowerCase().slice(0, 3)}`;
}

function toDateString(date) {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

export default function AttendanceScreen() {
  const { dark } = useTheme();
  const { auth } = useAuth();
  const { data, loading, reload, saveAttendanceBulk } = useData();
  const route = useRoute();
  const c = getColors(dark);

  const { groupId } = route.params || {};

  const [activeTab, setActiveTab] = useState('mark');
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [attendanceMap, setAttendanceMap] = useState({});
  const [qrValue, setQrValue] = useState('');
  const [qrLoading, setQrLoading] = useState(false);

  // Stats month navigation
  const [statsMonth, setStatsMonth] = useState(new Date().getMonth());
  const [statsYear, setStatsYear] = useState(new Date().getFullYear());

  const groups = data.groups || [];
  const studentGroupLinks = data.studentGroups || [];
  const students = data.students || [];
  const attendance = data.attendance || [];

  const group = useMemo(() => groups.find(g => g.id === groupId), [groups, groupId]);

  const groupStudentIds = useMemo(() =>
    studentGroupLinks.filter(sg => sg.groupId === groupId).map(sg => sg.studentId),
    [studentGroupLinks, groupId]
  );

  const groupStudents = useMemo(() =>
    students.filter(s => groupStudentIds.includes(s.id)).sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [students, groupStudentIds]
  );

  const dateStr = toDateString(currentDate);

  // Initialize attendance map from data for current date
  useEffect(() => {
    const dayRecords = attendance.filter(a => a.groupId === groupId && a.date === dateStr);
    const map = {};
    groupStudents.forEach(s => {
      const record = dayRecords.find(r => r.studentId === s.id);
      map[s.id] = record ? record.present : false;
    });
    setAttendanceMap(map);
  }, [attendance, groupId, dateStr, groupStudents]);

  // Load QR token when tab changes
  useEffect(() => {
    if (activeTab === 'qr' && groupId) {
      setQrLoading(true);
      api.getQrToken(groupId)
        .then(res => setQrValue(res.token || ''))
        .catch(() => setQrValue(''))
        .finally(() => setQrLoading(false));
    }
  }, [activeTab, groupId]);

  const presentCount = useMemo(() =>
    Object.values(attendanceMap).filter(Boolean).length,
    [attendanceMap]
  );

  const absentCount = groupStudents.length - presentCount;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }, [reload]);

  const navigateDate = useCallback((direction) => {
    setCurrentDate(prev => {
      const next = new Date(prev);
      next.setDate(next.getDate() + direction);
      return next;
    });
  }, []);

  const toggleAttendance = useCallback((studentId) => {
    setAttendanceMap(prev => ({ ...prev, [studentId]: !prev[studentId] }));
  }, []);

  const toggleAll = useCallback((value) => {
    const map = {};
    groupStudents.forEach(s => { map[s.id] = value; });
    setAttendanceMap(map);
  }, [groupStudents]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const records = Object.entries(attendanceMap).map(([studentId, present]) => ({
        studentId,
        present,
      }));
      await saveAttendanceBulk(groupId, dateStr, records);
      Alert.alert('Сохранено', 'Посещаемость успешно сохранена');
    } catch (e) {
      Alert.alert('Ошибка', e.message || 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  }, [attendanceMap, groupId, dateStr, saveAttendanceBulk]);

  const handleRegenerateQR = useCallback(async () => {
    setQrLoading(true);
    try {
      const res = await api.regenerateQrToken(groupId);
      setQrValue(res.token || '');
    } catch (e) {
      Alert.alert('Ошибка', e.message || 'Не удалось обновить QR');
    } finally {
      setQrLoading(false);
    }
  }, [groupId]);

  // Stats calculations
  const monthlyStats = useMemo(() => {
    const daysInMonth = getDaysInMonth(statsYear, statsMonth);
    const monthAttendance = attendance.filter(a => {
      if (a.groupId !== groupId) return false;
      const d = new Date(a.date);
      return d.getMonth() === statsMonth && d.getFullYear() === statsYear;
    });

    return groupStudents.map(student => {
      const records = monthAttendance.filter(a => a.studentId === student.id);
      const present = records.filter(r => r.present).length;
      const total = records.length;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
      return { student, present, total, percentage };
    }).sort((a, b) => b.percentage - a.percentage);
  }, [attendance, groupId, groupStudents, statsMonth, statsYear]);

  const navigateStatsMonth = useCallback((direction) => {
    let m = statsMonth + direction;
    let y = statsYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setStatsMonth(m);
    setStatsYear(y);
  }, [statsMonth, statsYear]);

  const renderTabs = () => (
    <View style={styles.tabRow}>
      {TABS.map(tab => {
        const active = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              { backgroundColor: active ? c.purple : c.glass, borderColor: active ? c.purple : c.glassBorder },
            ]}
            onPress={() => setActiveTab(tab.id)}
            activeOpacity={0.7}
          >
            <Ionicons name={tab.icon} size={16} color={active ? '#fff' : c.textSecondary} />
            <Text style={[styles.tabText, { color: active ? '#fff' : c.textSecondary }]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderMarkTab = () => (
    <View>
      {/* Date Navigation */}
      <View style={styles.dateNav}>
        <TouchableOpacity onPress={() => navigateDate(-1)} style={styles.dateNavButton}>
          <Ionicons name="chevron-back" size={22} color={c.text} />
        </TouchableOpacity>
        <View style={styles.dateCenter}>
          <Text style={[styles.dateText, { color: c.text }]}>{formatDateShort(currentDate)}</Text>
          <Text style={[styles.dateYear, { color: c.textSecondary }]}>{currentDate.getFullYear()}</Text>
        </View>
        <TouchableOpacity onPress={() => navigateDate(1)} style={styles.dateNavButton}>
          <Ionicons name="chevron-forward" size={22} color={c.text} />
        </TouchableOpacity>
      </View>

      {/* Summary Pills */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryPill, { backgroundColor: c.greenBg }]}>
          <Ionicons name="checkmark-circle" size={16} color={c.green} />
          <Text style={[styles.summaryText, { color: c.green }]}>Присутствуют: {presentCount}</Text>
        </View>
        <View style={[styles.summaryPill, { backgroundColor: c.redBg }]}>
          <Ionicons name="close-circle" size={16} color={c.red} />
          <Text style={[styles.summaryText, { color: c.red }]}>Отсутствуют: {absentCount}</Text>
        </View>
      </View>

      {/* Quick actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.quickAction, { backgroundColor: c.greenBg }]}
          onPress={() => toggleAll(true)}
        >
          <Text style={[styles.quickActionText, { color: c.green }]}>Все присутствуют</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickAction, { backgroundColor: c.redBg }]}
          onPress={() => toggleAll(false)}
        >
          <Text style={[styles.quickActionText, { color: c.red }]}>Все отсутствуют</Text>
        </TouchableOpacity>
      </View>

      {/* Student List */}
      {groupStudents.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={40} color={c.textTertiary} />
          <Text style={[styles.emptyText, { color: c.textTertiary }]}>Нет учеников в группе</Text>
        </View>
      ) : (
        <GlassCard style={styles.studentList}>
          {groupStudents.map((student, i) => {
            const isPresent = attendanceMap[student.id];
            return (
              <TouchableOpacity
                key={student.id}
                style={[
                  styles.studentRow,
                  i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
                ]}
                onPress={() => toggleAttendance(student.id)}
                activeOpacity={0.7}
              >
                <Avatar name={student.name} photo={student.photo} size={38} />
                <Text style={[styles.studentName, { color: c.text }]} numberOfLines={1}>
                  {student.name}
                </Text>
                <View
                  style={[
                    styles.checkbox,
                    {
                      backgroundColor: isPresent ? c.green : 'transparent',
                      borderColor: isPresent ? c.green : c.textTertiary,
                    },
                  ]}
                >
                  {isPresent && <Ionicons name="checkmark" size={16} color="#fff" />}
                </View>
              </TouchableOpacity>
            );
          })}
        </GlassCard>
      )}

      {/* Save Button */}
      {groupStudents.length > 0 && (
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: c.purple, opacity: saving ? 0.7 : 1 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.7}
        >
          {saving ? <ActivityIndicator color="#fff" /> : (
            <>
              <Ionicons name="save-outline" size={18} color="#fff" />
              <Text style={styles.saveButtonText}>Сохранить</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  const renderStatsTab = () => (
    <View>
      {/* Month Navigation */}
      <View style={styles.dateNav}>
        <TouchableOpacity onPress={() => navigateStatsMonth(-1)} style={styles.dateNavButton}>
          <Ionicons name="chevron-back" size={22} color={c.text} />
        </TouchableOpacity>
        <View style={styles.dateCenter}>
          <Text style={[styles.dateText, { color: c.text }]}>{MONTHS_RU[statsMonth]}</Text>
          <Text style={[styles.dateYear, { color: c.textSecondary }]}>{statsYear}</Text>
        </View>
        <TouchableOpacity onPress={() => navigateStatsMonth(1)} style={styles.dateNavButton}>
          <Ionicons name="chevron-forward" size={22} color={c.text} />
        </TouchableOpacity>
      </View>

      {monthlyStats.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="stats-chart-outline" size={40} color={c.textTertiary} />
          <Text style={[styles.emptyText, { color: c.textTertiary }]}>Нет данных за этот месяц</Text>
        </View>
      ) : (
        <GlassCard style={styles.statsCard}>
          {monthlyStats.map((item, i) => {
            const barWidth = Math.max(item.percentage, 2);
            let barColor = c.green;
            if (item.percentage < 50) barColor = c.red;
            else if (item.percentage < 75) barColor = c.yellow;

            return (
              <View
                key={item.student.id}
                style={[
                  styles.statsRow,
                  i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
                ]}
              >
                <Avatar name={item.student.name} photo={item.student.photo} size={34} />
                <View style={styles.statsInfo}>
                  <View style={styles.statsNameRow}>
                    <Text style={[styles.statsName, { color: c.text }]} numberOfLines={1}>
                      {item.student.name}
                    </Text>
                    <Text style={[styles.statsPercent, { color: barColor }]}>
                      {item.percentage}%
                    </Text>
                  </View>
                  <View style={[styles.statsBarBg, { backgroundColor: c.glass }]}>
                    <View style={[styles.statsBar, { width: `${barWidth}%`, backgroundColor: barColor }]} />
                  </View>
                  <Text style={[styles.statsDetail, { color: c.textTertiary }]}>
                    {item.present} из {item.total} занятий
                  </Text>
                </View>
              </View>
            );
          })}
        </GlassCard>
      )}
    </View>
  );

  const renderQRTab = () => (
    <View style={styles.qrContainer}>
      <GlassCard style={styles.qrCard}>
        <Text style={[styles.qrTitle, { color: c.text }]}>QR-код для отметки</Text>
        <Text style={[styles.qrSubtitle, { color: c.textSecondary }]}>
          Ученики могут отсканировать этот код для отметки присутствия
        </Text>

        {qrLoading ? (
          <View style={styles.qrLoading}>
            <ActivityIndicator size="large" color={c.purple} />
          </View>
        ) : qrValue ? (
          <View style={styles.qrWrapper}>
            <QRGenerator value={qrValue} size={200} />
          </View>
        ) : (
          <View style={styles.qrLoading}>
            <Ionicons name="qr-code-outline" size={48} color={c.textTertiary} />
            <Text style={[styles.emptyText, { color: c.textTertiary }]}>QR-код недоступен</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.regenerateButton, { backgroundColor: c.purpleBg }]}
          onPress={handleRegenerateQR}
          disabled={qrLoading}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh-outline" size={18} color={c.purple} />
          <Text style={[styles.regenerateText, { color: c.purple }]}>Обновить QR-код</Text>
        </TouchableOpacity>
      </GlassCard>

      {group && (
        <GlassCard style={styles.groupInfoCard}>
          <View style={styles.groupInfoRow}>
            <MaterialCommunityIcons name="account-group" size={18} color={c.purple} />
            <Text style={[styles.groupInfoName, { color: c.text }]}>{group.name}</Text>
          </View>
          <Text style={[styles.groupInfoSub, { color: c.textSecondary }]}>
            {groupStudents.length} учеников
          </Text>
        </GlassCard>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: c.bg }]}>
        <ActivityIndicator size="large" color={c.purple} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.purple} />
        }
      >
        {group && (
          <View style={styles.groupBanner}>
            <MaterialCommunityIcons name="account-group" size={20} color={c.purple} />
            <Text style={[styles.groupBannerText, { color: c.text }]}>{group.name}</Text>
          </View>
        )}

        {renderTabs()}

        {activeTab === 'mark' && renderMarkTab()}
        {activeTab === 'stats' && renderStatsTab()}
        {activeTab === 'qr' && renderQRTab()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  groupBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  groupBannerText: {
    fontSize: 18,
    fontWeight: '700',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateNavButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCenter: {
    alignItems: 'center',
  },
  dateText: {
    fontSize: 17,
    fontWeight: '700',
  },
  dateYear: {
    fontSize: 13,
    marginTop: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  summaryPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  summaryText: {
    fontSize: 13,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  studentList: {
    padding: 0,
    overflow: 'hidden',
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  studentName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 14,
    marginTop: 16,
    gap: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  statsCard: {
    padding: 0,
    overflow: 'hidden',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  statsInfo: {
    flex: 1,
  },
  statsNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  statsName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  statsPercent: {
    fontSize: 14,
    fontWeight: '700',
  },
  statsBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  statsBar: {
    height: '100%',
    borderRadius: 3,
  },
  statsDetail: {
    fontSize: 11,
  },
  qrContainer: {
    gap: 12,
  },
  qrCard: {
    alignItems: 'center',
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  qrSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  },
  qrWrapper: {
    marginVertical: 16,
  },
  qrLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    gap: 12,
  },
  regenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
    marginTop: 12,
  },
  regenerateText: {
    fontSize: 14,
    fontWeight: '600',
  },
  groupInfoCard: {
    marginTop: 0,
  },
  groupInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  groupInfoName: {
    fontSize: 16,
    fontWeight: '700',
  },
  groupInfoSub: {
    fontSize: 13,
    marginLeft: 26,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
  },
});
