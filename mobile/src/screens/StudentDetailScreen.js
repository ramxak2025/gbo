import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput, Alert, StyleSheet,
} from 'react-native';
import {
  Phone, Calendar, Scale, Award, Trash2, Edit3, Camera, Dumbbell,
  CreditCard, ClipboardList, Key, Users,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../utils/api';
import PageHeader from '../components/PageHeader';
import GlassCard from '../components/GlassCard';
import PhoneInput, { formatPhone, cleanPhone } from '../components/PhoneInput';
import Avatar from '../components/Avatar';
import Modal from '../components/Modal';
import DateButton from '../components/DateButton';
import { getRankOptions, getRankLabel } from '../utils/sports';

/* ---------- helpers ---------- */
function isExpired(dateStr) {
  if (!dateStr) return true;
  return new Date(dateStr) < new Date();
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

/* ---------- Attendance ---------- */
function AttendanceStats({ studentId, groupId, data, dark }) {
  const group = data.groups.find(g => g.id === groupId);
  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const monthRecords = useMemo(
    () => data.attendance.filter(
      a => a.studentId === studentId && a.groupId === groupId && a.date.startsWith(monthPrefix),
    ),
    [data.attendance, studentId, groupId, monthPrefix],
  );

  if (!group?.attendanceEnabled) return null;
  const present = monthRecords.filter(a => a.present).length;
  const total = monthRecords.length;
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;
  const monthName = now.toLocaleDateString('ru-RU', { month: 'long' });
  if (total === 0) return null;

  const barColor = pct >= 80 ? '#22c55e' : pct >= 50 ? '#eab308' : '#ef4444';

  return (
    <GlassCard>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <ClipboardList size={14} color="#dc2626" />
        <Text style={{ fontSize: 12, textTransform: 'uppercase', fontWeight: '600', color: dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)' }}>
          {'Посещаемость за ' + monthName}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}>
          <View style={{ width: `${pct}%`, height: '100%', borderRadius: 4, backgroundColor: barColor }} />
        </View>
        <Text style={{ fontWeight: '900', fontSize: 18, color: barColor }}>{pct}%</Text>
      </View>
      <Text style={{ fontSize: 12, marginTop: 4, color: dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.5)' }}>
        {present} из {total} тренировок
      </Text>
    </GlassCard>
  );
}

/* ========== SCREEN ========== */
export default function StudentDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { auth } = useAuth();
  const { data, updateStudent, deleteStudent } = useData();
  const { dark } = useTheme();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);

  const student = data.students.find(s => s.id === id);

  if (!student) {
    return (
      <View style={{ flex: 1, backgroundColor: dark ? '#050505' : '#f5f5f7' }}>
        <PageHeader title="Ученик" back />
        <View style={{ paddingHorizontal: 16, paddingVertical: 48, alignItems: 'center' }}>
          <Users size={48} color={dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'} style={{ opacity: 0.3 }} />
          <Text style={{ color: dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)', fontSize: 14, marginTop: 12 }}>Ученик не найден</Text>
        </View>
      </View>
    );
  }

  const group = data.groups.find(g => g.id === student.groupId);
  const trainer = data.users.find(u => u.id === student.trainerId);
  const expired = isExpired(student.subscriptionExpiresAt);
  const canEdit = auth.role === 'trainer' && auth.userId === student.trainerId;
  const canEditAdmin = auth.role === 'superadmin';
  const rankOptions = getRankOptions(trainer?.sportType);
  const rankLabel = getRankLabel(trainer?.sportType);

  const startEdit = () => {
    setForm({ ...student, phone: formatPhone(student.phone || ''), newPassword: '' });
    setEditing(true);
  };

  const saveEdit = () => {
    const changes = {
      name: form.name,
      phone: cleanPhone(form.phone),
      weight: parseFloat(form.weight) || 0,
      belt: form.belt,
      birthDate: form.birthDate,
      trainingStartDate: form.trainingStartDate || null,
      subscriptionExpiresAt: form.subscriptionExpiresAt || null,
    };
    if (form.newPassword) {
      changes.password = form.newPassword;
      changes.plainPassword = form.newPassword;
    }
    updateStudent(student.id, changes);
    setEditing(false);
  };

  const handleDelete = () => {
    Alert.alert('Удалить ученика?', 'Это действие необратимо.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить', style: 'destructive', onPress: () => {
          deleteStudent(student.id);
          navigation.goBack();
        },
      },
    ]);
  };

  const handleAvatarUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]) {
        const uri = result.assets[0].uri;
        const url = await api.uploadFile({ uri, type: 'image/jpeg', name: 'avatar.jpg' });
        updateStudent(student.id, { avatar: url });
      }
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  const inputStyle = useMemo(() => ({
    width: '100%', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16,
    fontSize: 16,
    backgroundColor: dark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.70)',
    borderWidth: 1,
    borderColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.60)',
    color: dark ? '#fff' : '#111',
  }), [dark]);

  const labelColor = dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)';
  const dimColor = dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';

  return (
    <View style={{ flex: 1, backgroundColor: dark ? '#050505' : '#f5f5f7' }}>
      <PageHeader title="Досье" back>
        {(canEdit || canEditAdmin) && (
          <Pressable onPress={startEdit} style={({ pressed }) => ({ padding: 8, opacity: pressed ? 0.6 : 1 })}>
            <Edit3 size={18} color={dark ? '#fff' : '#111'} />
          </Pressable>
        )}
        {canEdit && (
          <Pressable onPress={handleDelete} style={({ pressed }) => ({ padding: 8, opacity: pressed ? 0.6 : 1 })}>
            <Trash2 size={18} color="#f87171" />
          </Pressable>
        )}
      </PageHeader>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 128, gap: 16 }} showsVerticalScrollIndicator={false}>
        {/* Avatar & Name */}
        <View style={{ alignItems: 'center' }}>
          <View>
            <Avatar name={student.name} src={student.avatar} size={80} />
            {canEdit && (
              <Pressable
                onPress={handleAvatarUpload}
                style={{
                  position: 'absolute', bottom: -4, right: -4,
                  width: 28, height: 28, borderRadius: 14,
                  backgroundColor: '#dc2626', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Camera size={14} color="#fff" />
              </Pressable>
            )}
          </View>
          <Text style={{ fontSize: 20, fontWeight: '700', marginTop: 12, color: dark ? '#fff' : '#111' }}>
            {student.name}
          </Text>
          <Text style={{ fontSize: 14, color: labelColor, marginTop: 2 }}>
            {trainer?.clubName} {'—'} {group?.name || 'Без группы'}
          </Text>
        </View>

        {/* Status */}
        <GlassCard>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: dimColor }}>Статус</Text>
            <View style={{
              paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999,
              backgroundColor: expired ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)',
            }}>
              <Text style={{ fontSize: 12, fontWeight: '700', textTransform: 'uppercase', color: expired ? '#f87171' : '#4ade80' }}>
                {expired ? 'Долг' : 'Активен'}
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Info Grid 2 col */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {/* Belt / Rank */}
          <View style={{ width: '48%' }}>
            <GlassCard>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Award size={14} color="#dc2626" />
                <Text style={{ fontSize: 12, textTransform: 'uppercase', color: labelColor }}>{rankLabel}</Text>
              </View>
              <Text style={{ fontWeight: '700', fontSize: 14, color: dark ? '#fff' : '#111' }}>{student.belt || '—'}</Text>
            </GlassCard>
          </View>
          {/* Weight */}
          <View style={{ width: '48%' }}>
            <GlassCard>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Scale size={14} color="#dc2626" />
                <Text style={{ fontSize: 12, textTransform: 'uppercase', color: labelColor }}>Вес</Text>
              </View>
              <Text style={{ fontWeight: '700', fontSize: 14, color: dark ? '#fff' : '#111' }}>{student.weight ? `${student.weight} кг` : '—'}</Text>
            </GlassCard>
          </View>
          {/* Birth */}
          <View style={{ width: '48%' }}>
            <GlassCard>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Calendar size={14} color="#dc2626" />
                <Text style={{ fontSize: 12, textTransform: 'uppercase', color: labelColor }}>Рождение</Text>
              </View>
              <Text style={{ fontWeight: '700', fontSize: 13, color: dark ? '#fff' : '#111' }}>{formatDate(student.birthDate)}</Text>
            </GlassCard>
          </View>
          {/* Phone */}
          <View style={{ width: '48%' }}>
            <GlassCard>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Phone size={14} color="#dc2626" />
                <Text style={{ fontSize: 12, textTransform: 'uppercase', color: labelColor }}>Телефон</Text>
              </View>
              <Text style={{ fontWeight: '700', fontSize: 13, color: dark ? '#fff' : '#111' }}>{student.phone || '—'}</Text>
            </GlassCard>
          </View>
        </View>

        {/* Subscription */}
        <GlassCard>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <CreditCard size={14} color={expired ? '#f87171' : '#4ade80'} />
              <Text style={{ fontSize: 14, color: dimColor }}>Абонемент до</Text>
            </View>
            <Text style={{ fontWeight: '700', fontSize: 14, color: expired ? '#f87171' : (dark ? '#fff' : '#111') }}>
              {formatDate(student.subscriptionExpiresAt)}
            </Text>
          </View>
        </GlassCard>

        {/* Training start */}
        <GlassCard>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Dumbbell size={14} color="#dc2626" />
              <Text style={{ fontSize: 14, color: dimColor }}>Тренируется с</Text>
            </View>
            <Text style={{ fontWeight: '700', fontSize: 14, color: dark ? '#fff' : '#111' }}>
              {formatDate(student.trainingStartDate || student.createdAt)}
            </Text>
          </View>
        </GlassCard>

        {/* Admin password */}
        {auth.role === 'superadmin' && student.plainPassword && (
          <GlassCard>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Key size={14} color="#facc15" />
              <Text style={{ fontSize: 14, color: dimColor }}>
                {'Пароль: '}
                <Text style={{ fontFamily: 'monospace', fontWeight: '700', color: dark ? '#fff' : '#111' }}>{student.plainPassword}</Text>
              </Text>
            </View>
          </GlassCard>
        )}

        {/* Attendance */}
        <AttendanceStats studentId={student.id} groupId={student.groupId} data={data} dark={dark} />
      </ScrollView>

      {/* Edit Modal */}
      <Modal open={editing} onClose={() => setEditing(false)} title="Редактировать">
        {form && (
          <View style={{ gap: 12 }}>
            <TextInput
              placeholder="ФИО"
              placeholderTextColor={dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.4)'}
              value={form.name}
              onChangeText={v => setForm(f => ({ ...f, name: v }))}
              style={inputStyle}
            />
            <PhoneInput
              value={form.phone}
              onChange={v => setForm(f => ({ ...f, phone: v }))}
              style={inputStyle}
              placeholderTextColor={dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.4)'}
            />
            <TextInput
              placeholder="Вес (кг)"
              placeholderTextColor={dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.4)'}
              value={String(form.weight || '')}
              onChangeText={v => setForm(f => ({ ...f, weight: v }))}
              keyboardType="decimal-pad"
              style={inputStyle}
            />

            {/* Belt / Rank picker */}
            <View style={[inputStyle, { paddingVertical: 0 }]}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 12 }}>
                {rankOptions.map(b => (
                  <Pressable
                    key={b}
                    onPress={() => setForm(f => ({ ...f, belt: b }))}
                    style={{
                      paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
                      backgroundColor: form.belt === b ? '#dc2626' : (dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                    }}
                  >
                    <Text style={{
                      fontSize: 12, fontWeight: '700',
                      color: form.belt === b ? '#fff' : (dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'),
                    }}>{b}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {canEditAdmin && (
              <TextInput
                placeholder="Новый пароль (оставьте пустым)"
                placeholderTextColor={dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.4)'}
                value={form.newPassword || ''}
                onChangeText={v => setForm(f => ({ ...f, newPassword: v }))}
                style={inputStyle}
              />
            )}

            <View style={{ borderTopWidth: 1, borderTopColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', paddingTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              <DateButton label="Рождение" value={form.birthDate || ''} onChange={v => setForm(f => ({ ...f, birthDate: v }))} />
              <DateButton label="Тренируется с" value={form.trainingStartDate || ''} onChange={v => setForm(f => ({ ...f, trainingStartDate: v }))} />
              <DateButton label="Абонемент до" value={form.subscriptionExpiresAt ? new Date(form.subscriptionExpiresAt).toISOString().split('T')[0] : ''} onChange={v => setForm(f => ({ ...f, subscriptionExpiresAt: v }))} />
            </View>

            <Pressable
              onPress={saveEdit}
              style={({ pressed }) => ({
                width: '100%', paddingVertical: 14, borderRadius: 16,
                backgroundColor: '#dc2626', alignItems: 'center',
                opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.96 : 1 }],
              })}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Сохранить</Text>
            </Pressable>
          </View>
        )}
      </Modal>
    </View>
  );
}
