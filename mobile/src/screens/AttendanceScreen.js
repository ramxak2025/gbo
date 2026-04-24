import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, Pressable,
} from 'react-native';
import {
  ChevronLeft, ChevronRight, Check, X, BarChart3, Users,
  Thermometer, HeartCrack, Zap,
} from 'lucide-react-native';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import PageHeader from '../components/PageHeader';
import GlassCard from '../components/GlassCard';
import Avatar from '../components/Avatar';
import StatusBadge from '../components/StatusBadge';

function toDateStr(d) {
  return d.toISOString().split('T')[0];
}

function formatDayShort(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('ru-RU', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

function formatMonthYear(d) {
  return d.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
}

export default function AttendanceScreen({ route }) {
  const { groupId } = route.params;
  const { data, saveAttendanceBulk } = useData();
  const { dark } = useTheme();

  const [selectedDate, setSelectedDate] = useState(toDateStr(new Date()));
  const [tab, setTab] = useState('mark');
  const [saving, setSaving] = useState(false);
  const [localMarks, setLocalMarks] = useState({});
  const [dirty, setDirty] = useState(false);

  const group = data.groups.find(g => g.id === groupId);
  const students = data.students
    .filter(s => s.groupId === groupId)
    .sort((a, b) => a.name.localeCompare(b.name));

  // Existing attendance for selected date
  const dayAttendance = useMemo(() => {
    const map = {};
    data.attendance
      .filter(a => a.groupId === groupId && a.date === selectedDate)
      .forEach(a => { map[a.studentId] = a.present; });
    return map;
  }, [data.attendance, groupId, selectedDate]);

  // Merge server data with local edits
  const getPresent = (studentId) => {
    if (localMarks[studentId] !== undefined) return localMarks[studentId];
    if (dayAttendance[studentId] !== undefined) return dayAttendance[studentId];
    return null;
  };

  const toggle = (studentId) => {
    const current = getPresent(studentId);
    const next = current === true ? false : true;
    setLocalMarks(m => ({ ...m, [studentId]: next }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const records = students.map(s => ({
        studentId: s.id,
        present: getPresent(s.id) === true,
      }));
      await saveAttendanceBulk(groupId, selectedDate, records);
      setLocalMarks({});
      setDirty(false);
    } catch (e) {
      console.error('Save attendance failed:', e);
    }
    setSaving(false);
  };

  // Navigate dates
  const shiftDate = (days) => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + days);
    setSelectedDate(toDateStr(d));
    setLocalMarks({});
    setDirty(false);
  };

  const isToday = selectedDate === toDateStr(new Date());

  // Stats calculation for current month
  const statsDate = new Date(selectedDate + 'T00:00:00');
  const statsYear = statsDate.getFullYear();
  const statsMonth = statsDate.getMonth();

  const monthAttendance = useMemo(() => {
    const monthPrefix = `${statsYear}-${String(statsMonth + 1).padStart(2, '0')}`;
    return data.attendance.filter(a => a.groupId === groupId && a.date.startsWith(monthPrefix));
  }, [data.attendance, groupId, statsYear, statsMonth]);

  const studentStats = useMemo(() => {
    const map = {};
    students.forEach(s => { map[s.id] = { present: 0, absent: 0 }; });
    monthAttendance.forEach(a => {
      if (!map[a.studentId]) return;
      if (a.present) map[a.studentId].present++;
      else map[a.studentId].absent++;
    });
    return map;
  }, [monthAttendance, students]);

  const totalDaysTracked = useMemo(() => {
    return new Set(monthAttendance.map(a => a.date)).size;
  }, [monthAttendance]);

  const presentCount = students.filter(s => getPresent(s.id) === true).length;
  const absentCount = students.filter(s => getPresent(s.id) === false).length;
  const unmarkedCount = students.filter(s => getPresent(s.id) === null).length;

  if (!group) {
    return (
      <View style={{ flex: 1, backgroundColor: dark ? '#050505' : '#f5f5f7' }}>
        <PageHeader title="Посещаемость" back />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <Text style={{ color: dark ? 'rgba(255,255,255,0.4)' : '#6b7280', fontSize: 14 }}>
            Группа не найдена
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: dark ? '#050505' : '#f5f5f7' }}>
      <PageHeader title={group.name} back>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <Pressable
            onPress={() => setTab('mark')}
            style={({ pressed }) => ({
              flexDirection: 'row', alignItems: 'center', gap: 4,
              paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999,
              backgroundColor: tab === 'mark'
                ? '#dc2626'
                : (dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)'),
              borderWidth: tab === 'mark' ? 0 : 1,
              borderColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.6)',
              opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.96 : 1 }],
            })}
          >
            <Users size={12} color={tab === 'mark' ? '#fff' : (dark ? 'rgba(255,255,255,0.5)' : '#9ca3af')} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: tab === 'mark' ? '#fff' : (dark ? 'rgba(255,255,255,0.5)' : '#9ca3af') }}>
              Отметить
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setTab('stats')}
            style={({ pressed }) => ({
              flexDirection: 'row', alignItems: 'center', gap: 4,
              paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999,
              backgroundColor: tab === 'stats'
                ? '#dc2626'
                : (dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)'),
              borderWidth: tab === 'stats' ? 0 : 1,
              borderColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.6)',
              opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.96 : 1 }],
            })}
          >
            <BarChart3 size={12} color={tab === 'stats' ? '#fff' : (dark ? 'rgba(255,255,255,0.5)' : '#9ca3af')} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: tab === 'stats' ? '#fff' : (dark ? 'rgba(255,255,255,0.5)' : '#9ca3af') }}>
              Статистика
            </Text>
          </Pressable>
        </View>
      </PageHeader>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 128, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Date navigator */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable
            onPress={() => shiftDate(-1)}
            style={({ pressed }) => ({ padding: 8, opacity: pressed ? 0.6 : 1 })}
          >
            <ChevronLeft size={20} color={dark ? '#fff' : '#111'} />
          </Pressable>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontWeight: '700', fontSize: 14, color: dark ? '#fff' : '#111' }}>
              {formatDayShort(selectedDate)}
            </Text>
            {isToday && (
              <Text style={{ fontSize: 10, textTransform: 'uppercase', fontWeight: '700', color: '#dc2626' }}>
                Сегодня
              </Text>
            )}
          </View>
          <Pressable
            onPress={() => shiftDate(1)}
            style={({ pressed }) => ({ padding: 8, opacity: pressed ? 0.6 : 1 })}
          >
            <ChevronRight size={20} color={dark ? '#fff' : '#111'} />
          </Pressable>
        </View>

        {tab === 'mark' && (
          <>
            {/* Summary pills */}
            <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
              <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(34,197,94,0.15)' }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#4ade80' }}>
                  {presentCount} пришли
                </Text>
              </View>
              <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(239,68,68,0.15)' }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#f87171' }}>
                  {absentCount} нет
                </Text>
              </View>
              {unmarkedCount > 0 && (
                <View style={{
                  paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
                  backgroundColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)',
                  borderWidth: 1,
                  borderColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.6)',
                }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: dark ? 'rgba(255,255,255,0.4)' : '#9ca3af' }}>
                    {unmarkedCount} не отмечено
                  </Text>
                </View>
              )}
            </View>

            {/* Student list */}
            <View style={{ gap: 6 }}>
              {students.map(s => {
                const present = getPresent(s.id);
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => toggle(s.id)}
                    style={({ pressed }) => ({
                      width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12,
                      paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16,
                      backgroundColor: present === true
                        ? 'rgba(34,197,94,0.1)'
                        : present === false
                          ? (dark ? 'rgba(239,68,68,0.05)' : 'rgba(254,242,242,1)')
                          : (dark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.5)'),
                      borderWidth: 1,
                      borderColor: present === true
                        ? 'rgba(34,197,94,0.3)'
                        : present === false
                          ? 'rgba(239,68,68,0.2)'
                          : (dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.6)'),
                      opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.96 : 1 }],
                    })}
                  >
                    <Avatar name={s.name} src={s.avatar} size={36} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text
                          numberOfLines={1}
                          style={{ fontWeight: '600', fontSize: 14, color: dark ? '#fff' : '#111' }}
                        >
                          {s.name}
                        </Text>
                        {s.status ? <StatusBadge status={s.status} /> : null}
                      </View>
                      <Text style={{ fontSize: 10, color: dark ? 'rgba(255,255,255,0.3)' : '#6b7280', marginTop: 1 }}>
                        {s.belt || ''}{s.weight ? ` • ${s.weight} кг` : ''}
                      </Text>
                    </View>
                    <View
                      style={{
                        width: 32, height: 32, borderRadius: 16,
                        alignItems: 'center', justifyContent: 'center',
                        backgroundColor: present === true
                          ? '#22c55e'
                          : present === false
                            ? 'rgba(239,68,68,0.2)'
                            : (dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)'),
                      }}
                    >
                      {present === true ? (
                        <Check size={16} color="#fff" strokeWidth={3} />
                      ) : present === false ? (
                        <X size={16} color="#f87171" strokeWidth={3} />
                      ) : (
                        <View style={{
                          width: 8, height: 8, borderRadius: 4,
                          backgroundColor: dark ? 'rgba(255,255,255,0.2)' : '#9ca3af',
                        }} />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {students.length === 0 && (
              <Text style={{ textAlign: 'center', paddingVertical: 32, fontSize: 14, color: dark ? 'rgba(255,255,255,0.3)' : '#6b7280' }}>
                В группе пока нет учеников
              </Text>
            )}

            {/* Save button */}
            {students.length > 0 && (
              <Pressable
                onPress={handleSave}
                disabled={saving}
                style={({ pressed }) => ({
                  width: '100%', paddingVertical: 14, borderRadius: 16,
                  alignItems: 'center',
                  backgroundColor: dirty
                    ? '#dc2626'
                    : '#22c55e',
                  opacity: saving ? 0.5 : (pressed ? 0.85 : 1),
                  transform: [{ scale: pressed ? 0.96 : 1 }],
                  shadowColor: dirty ? '#dc2626' : '#22c55e',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: dirty ? 0.25 : 0,
                  shadowRadius: 8,
                  elevation: dirty ? 4 : 0,
                })}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
                  {saving ? 'Сохранение...' : dirty ? 'Сохранить' : 'Сохранено ✓'}
                </Text>
              </Pressable>
            )}
          </>
        )}

        {tab === 'stats' && (
          <>
            <GlassCard style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 12, textTransform: 'uppercase', fontWeight: '600', color: dark ? 'rgba(255,255,255,0.4)' : '#6b7280' }}>
                {formatMonthYear(statsDate)}
              </Text>
              <Text style={{ fontSize: 30, fontWeight: '900', marginTop: 4, color: dark ? '#fff' : '#111' }}>
                {totalDaysTracked}
              </Text>
              <Text style={{ fontSize: 10, textTransform: 'uppercase', color: dark ? 'rgba(255,255,255,0.3)' : '#6b7280' }}>
                тренировок отмечено
              </Text>
            </GlassCard>

            <View style={{ gap: 6 }}>
              {students.map(s => {
                const st = studentStats[s.id] || { present: 0, absent: 0 };
                const total = st.present + st.absent;
                const pct = total > 0 ? Math.round((st.present / total) * 100) : 0;
                const barColor = pct >= 80 ? '#22c55e' : pct >= 50 ? '#eab308' : '#ef4444';
                const textColor = pct >= 80 ? '#22c55e' : pct >= 50 ? '#eab308' : '#ef4444';

                return (
                  <GlassCard key={s.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Avatar name={s.name} src={s.avatar} size={36} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text numberOfLines={1} style={{ fontWeight: '600', fontSize: 14, color: dark ? '#fff' : '#111' }}>
                        {s.name}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <View style={{
                          flex: 1, height: 6, borderRadius: 3,
                          backgroundColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                        }}>
                          <View
                            style={{
                              height: '100%', borderRadius: 3,
                              backgroundColor: barColor,
                              width: `${pct}%`,
                            }}
                          />
                        </View>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
                      <Text style={{ fontSize: 18, fontWeight: '900', color: textColor }}>
                        {pct}%
                      </Text>
                      <Text style={{ fontSize: 9, color: dark ? 'rgba(255,255,255,0.3)' : '#6b7280' }}>
                        {st.present}/{total}
                      </Text>
                    </View>
                  </GlassCard>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
