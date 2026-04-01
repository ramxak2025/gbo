import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  RefreshControl, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { getColors } from '../utils/theme';
import { api } from '../utils/api';
import { getRankLabel, getRankOptions, getSportLabel } from '../utils/sports';
import GlassCard from '../components/GlassCard';
import Avatar from '../components/Avatar';
import Modal from '../components/Modal';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatPhone(phone) {
  if (!phone) return '—';
  const d = phone.replace(/\D/g, '');
  if (d.length < 11) return phone;
  return `8 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9, 11)}`;
}

export default function StudentDetailScreen() {
  const { dark } = useTheme();
  const { auth } = useAuth();
  const { data, loading, reload, updateStudent, deleteStudent, updateStudentGroups, addParent, deleteParent } = useData();
  const navigation = useNavigation();
  const route = useRoute();
  const c = getColors(dark);

  const { id } = route.params || {};
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Edit form
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [editRank, setEditRank] = useState('');
  const [editBirthDate, setEditBirthDate] = useState('');
  const [editGroupIds, setEditGroupIds] = useState([]);
  const [editStatus, setEditStatus] = useState('');

  // Parent form
  const [parentModalVisible, setParentModalVisible] = useState(false);
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');

  const role = auth?.role;
  const isTrainer = role === 'trainer' || role === 'superadmin' || role === 'club_admin';

  const student = useMemo(() =>
    (data.students || []).find(s => s.id === id),
    [data.students, id]
  );

  const groups = data.groups || [];
  const studentGroupLinks = data.studentGroups || [];
  const studentGroupIds = useMemo(() =>
    studentGroupLinks.filter(sg => sg.studentId === id).map(sg => sg.groupId),
    [studentGroupLinks, id]
  );
  const studentGroupNames = useMemo(() =>
    studentGroupIds.map(gid => groups.find(g => g.id === gid)?.name).filter(Boolean),
    [studentGroupIds, groups]
  );

  const parents = useMemo(() =>
    (data.parents || []).filter(p => p.studentId === id),
    [data.parents, id]
  );

  // Monthly attendance stats
  const attendance = data.attendance || [];
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyAttendance = useMemo(() => {
    const records = attendance.filter(a => {
      if (a.studentId !== id) return false;
      const d = new Date(a.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const present = records.filter(r => r.present).length;
    const total = records.length;
    return { present, total, percentage: total > 0 ? Math.round((present / total) * 100) : 0 };
  }, [attendance, id, currentMonth, currentYear]);

  // Subscription status
  const transactions = data.transactions || [];
  const lastSubscription = useMemo(() => {
    const subs = transactions
      .filter(t => t.studentId === id && t.type === 'income' && t.category === 'subscription')
      .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
    return subs[0] || null;
  }, [transactions, id]);

  const subscriptionActive = useMemo(() => {
    if (!lastSubscription) return false;
    const subDate = new Date(lastSubscription.date || lastSubscription.createdAt);
    const expiryDate = new Date(subDate);
    expiryDate.setMonth(expiryDate.getMonth() + 1);
    return expiryDate > now;
  }, [lastSubscription, now]);

  const sportType = useMemo(() => {
    if (!studentGroupIds.length) return null;
    const group = groups.find(g => g.id === studentGroupIds[0]);
    return group?.sportType || null;
  }, [studentGroupIds, groups]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }, [reload]);

  const openEditModal = useCallback(() => {
    if (!student) return;
    setEditName(student.name || '');
    setEditPhone(student.phone || '');
    setEditWeight(student.weight ? String(student.weight) : '');
    setEditRank(student.rank || student.belt || '');
    setEditBirthDate(student.birthDate || '');
    setEditGroupIds([...studentGroupIds]);
    setEditStatus(student.status || '');
    setEditModalVisible(true);
  }, [student, studentGroupIds]);

  const handleSaveEdit = useCallback(async () => {
    if (!editName.trim()) {
      Alert.alert('Ошибка', 'Введите имя');
      return;
    }
    setSaving(true);
    try {
      await updateStudent(id, {
        name: editName.trim(),
        phone: editPhone.trim() || undefined,
        weight: editWeight ? Number(editWeight) : null,
        rank: editRank || null,
        belt: editRank || null,
        birthDate: editBirthDate || null,
        status: editStatus || null,
        groupIds: editGroupIds,
      });
      if (JSON.stringify(editGroupIds.sort()) !== JSON.stringify(studentGroupIds.sort())) {
        await updateStudentGroups(id, editGroupIds);
      }
      setEditModalVisible(false);
    } catch (e) {
      Alert.alert('Ошибка', e.message || 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  }, [id, editName, editPhone, editWeight, editRank, editBirthDate, editGroupIds, editStatus, studentGroupIds, updateStudent, updateStudentGroups]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Удалить ученика',
      `Вы уверены, что хотите удалить ${student?.name}?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить', style: 'destructive',
          onPress: async () => {
            try {
              await deleteStudent(id);
              navigation.goBack();
            } catch (e) {
              Alert.alert('Ошибка', e.message || 'Не удалось удалить');
            }
          },
        },
      ]
    );
  }, [id, student, deleteStudent, navigation]);

  const handlePickAvatar = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Ошибка', 'Нужен доступ к галерее');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;
    const uri = result.assets[0].uri;
    setUploading(true);
    try {
      const photoUrl = await api.uploadFile(uri);
      await updateStudent(id, { photo: photoUrl });
    } catch (e) {
      Alert.alert('Ошибка', e.message || 'Не удалось загрузить фото');
    } finally {
      setUploading(false);
    }
  }, [id, updateStudent]);

  const handleAddParent = useCallback(async () => {
    if (!parentName.trim()) {
      Alert.alert('Ошибка', 'Введите имя родителя');
      return;
    }
    setSaving(true);
    try {
      await addParent({
        name: parentName.trim(),
        phone: parentPhone.trim() || undefined,
        studentId: id,
      });
      setParentModalVisible(false);
      setParentName('');
      setParentPhone('');
    } catch (e) {
      Alert.alert('Ошибка', e.message || 'Не удалось добавить');
    } finally {
      setSaving(false);
    }
  }, [parentName, parentPhone, id, addParent]);

  const handleDeleteParent = useCallback((parentId, name) => {
    Alert.alert('Удалить родителя', `Удалить ${name}?`, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить', style: 'destructive',
        onPress: () => deleteParent(parentId),
      },
    ]);
  }, [deleteParent]);

  const toggleGroupSelection = useCallback((groupId) => {
    setEditGroupIds(prev =>
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    );
  }, []);

  if (loading || !student) {
    return (
      <View style={[styles.centered, { backgroundColor: c.bg }]}>
        {loading ? (
          <ActivityIndicator size="large" color={c.purple} />
        ) : (
          <Text style={[styles.notFound, { color: c.textSecondary }]}>Ученик не найден</Text>
        )}
      </View>
    );
  }

  const rankOptions = sportType ? getRankOptions(sportType) : [];
  const rankLabel = sportType ? getRankLabel(sportType) : 'Разряд';

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.purple} />
        }
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={isTrainer ? handlePickAvatar : undefined} activeOpacity={isTrainer ? 0.7 : 1}>
            <Avatar name={student.name} photo={student.photo} size={96} />
            {uploading && (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator color="#fff" />
              </View>
            )}
            {isTrainer && !uploading && (
              <View style={[styles.cameraIcon, { backgroundColor: c.purple }]}>
                <Ionicons name="camera" size={14} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
          <Text style={[styles.studentName, { color: c.text }]}>{student.name}</Text>
          {student.status && (
            <View style={[styles.statusBadgeLarge, {
              backgroundColor: student.status === 'sick' ? c.yellowBg : student.status === 'injury' ? c.redBg : c.purpleBg,
            }]}>
              <Text style={[styles.statusBadgeLargeText, {
                color: student.status === 'sick' ? c.yellow : student.status === 'injury' ? c.red : c.purple,
              }]}>
                {student.status === 'sick' ? 'Болеет' : student.status === 'injury' ? 'Травма' : 'Пропуск'}
              </Text>
            </View>
          )}
        </View>

        {/* Personal Info */}
        <GlassCard style={styles.infoCard}>
          <Text style={[styles.cardTitle, { color: c.text }]}>Личная информация</Text>

          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={16} color={c.textSecondary} />
            <Text style={[styles.infoLabel, { color: c.textSecondary }]}>Телефон</Text>
            <Text style={[styles.infoValue, { color: c.text }]}>{formatPhone(student.phone)}</Text>
          </View>

          <View style={[styles.infoRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }]}>
            <MaterialCommunityIcons name="scale" size={16} color={c.textSecondary} />
            <Text style={[styles.infoLabel, { color: c.textSecondary }]}>Вес</Text>
            <Text style={[styles.infoValue, { color: c.text }]}>{student.weight ? `${student.weight} кг` : '—'}</Text>
          </View>

          <View style={[styles.infoRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }]}>
            <MaterialCommunityIcons name="medal-outline" size={16} color={c.textSecondary} />
            <Text style={[styles.infoLabel, { color: c.textSecondary }]}>{rankLabel}</Text>
            <Text style={[styles.infoValue, { color: c.text }]}>{student.rank || student.belt || '—'}</Text>
          </View>

          <View style={[styles.infoRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }]}>
            <Ionicons name="calendar-outline" size={16} color={c.textSecondary} />
            <Text style={[styles.infoLabel, { color: c.textSecondary }]}>Дата рождения</Text>
            <Text style={[styles.infoValue, { color: c.text }]}>{formatDate(student.birthDate)}</Text>
          </View>

          <View style={[styles.infoRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }]}>
            <Ionicons name="time-outline" size={16} color={c.textSecondary} />
            <Text style={[styles.infoLabel, { color: c.textSecondary }]}>Начало тренировок</Text>
            <Text style={[styles.infoValue, { color: c.text }]}>{formatDate(student.startDate || student.createdAt)}</Text>
          </View>

          <View style={[styles.infoRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }]}>
            <MaterialCommunityIcons name="account-group-outline" size={16} color={c.textSecondary} />
            <Text style={[styles.infoLabel, { color: c.textSecondary }]}>Группы</Text>
            <Text style={[styles.infoValue, { color: c.text }]}>{studentGroupNames.join(', ') || '—'}</Text>
          </View>
        </GlassCard>

        {/* Subscription Status */}
        <GlassCard style={[styles.subCard, { borderColor: subscriptionActive ? c.green : c.red }]}>
          <View style={styles.subHeader}>
            <View style={[styles.subIcon, { backgroundColor: subscriptionActive ? c.greenBg : c.redBg }]}>
              <Ionicons
                name={subscriptionActive ? 'checkmark-circle' : 'close-circle'}
                size={20}
                color={subscriptionActive ? c.green : c.red}
              />
            </View>
            <View style={styles.subInfo}>
              <Text style={[styles.subTitle, { color: c.text }]}>
                {subscriptionActive ? 'Абонемент активен' : 'Абонемент истёк'}
              </Text>
              {lastSubscription && (
                <Text style={[styles.subDate, { color: c.textSecondary }]}>
                  Оплата: {formatDate(lastSubscription.date || lastSubscription.createdAt)}
                </Text>
              )}
            </View>
          </View>
        </GlassCard>

        {/* Attendance Stats */}
        <GlassCard style={styles.attendanceCard}>
          <Text style={[styles.cardTitle, { color: c.text }]}>Посещаемость (текущий месяц)</Text>
          <View style={styles.attendanceRow}>
            <View style={styles.attendanceStat}>
              <Text style={[styles.attendanceNumber, { color: c.green }]}>{monthlyAttendance.present}</Text>
              <Text style={[styles.attendanceLabel, { color: c.textSecondary }]}>Присутствий</Text>
            </View>
            <View style={styles.attendanceStat}>
              <Text style={[styles.attendanceNumber, { color: c.text }]}>{monthlyAttendance.total}</Text>
              <Text style={[styles.attendanceLabel, { color: c.textSecondary }]}>Всего</Text>
            </View>
            <View style={styles.attendanceStat}>
              <Text style={[styles.attendanceNumber, { color: c.purple }]}>{monthlyAttendance.percentage}%</Text>
              <Text style={[styles.attendanceLabel, { color: c.textSecondary }]}>Процент</Text>
            </View>
          </View>
        </GlassCard>

        {/* Parents */}
        <GlassCard style={styles.parentCard}>
          <View style={styles.parentHeader}>
            <Text style={[styles.cardTitle, { color: c.text }]}>Родители</Text>
            {isTrainer && (
              <TouchableOpacity
                onPress={() => { setParentName(''); setParentPhone(''); setParentModalVisible(true); }}
                style={[styles.addParentButton, { backgroundColor: c.purpleBg }]}
              >
                <Ionicons name="add" size={18} color={c.purple} />
              </TouchableOpacity>
            )}
          </View>
          {parents.length === 0 ? (
            <Text style={[styles.emptyText, { color: c.textTertiary }]}>Нет данных о родителях</Text>
          ) : (
            parents.map(p => (
              <View key={p.id} style={[styles.parentRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }]}>
                <Ionicons name="person-outline" size={16} color={c.textSecondary} />
                <View style={styles.parentInfo}>
                  <Text style={[styles.parentName, { color: c.text }]}>{p.name}</Text>
                  {p.phone && <Text style={[styles.parentPhone, { color: c.textSecondary }]}>{formatPhone(p.phone)}</Text>}
                </View>
                {isTrainer && (
                  <TouchableOpacity onPress={() => handleDeleteParent(p.id, p.name)}>
                    <Ionicons name="trash-outline" size={18} color={c.red} />
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </GlassCard>

        {/* Actions */}
        {isTrainer && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: c.purple }]}
              onPress={openEditModal}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={18} color="#fff" />
              <Text style={styles.editButtonText}>Редактировать</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.deleteButton, { backgroundColor: c.redBg, borderColor: c.red }]}
              onPress={handleDelete}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={18} color={c.red} />
              <Text style={[styles.deleteButtonText, { color: c.red }]}>Удалить</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={editModalVisible} onClose={() => setEditModalVisible(false)} title="Редактировать ученика">
        <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Имя</Text>
        <TextInput
          style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
          value={editName}
          onChangeText={setEditName}
          placeholder="ФИО"
          placeholderTextColor={c.placeholder}
        />

        <Text style={[styles.fieldLabel, { color: c.textSecondary, marginTop: 14 }]}>Телефон</Text>
        <TextInput
          style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
          value={editPhone}
          onChangeText={setEditPhone}
          placeholder="8 (900) 123-45-67"
          placeholderTextColor={c.placeholder}
          keyboardType="phone-pad"
        />

        <Text style={[styles.fieldLabel, { color: c.textSecondary, marginTop: 14 }]}>Вес (кг)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
          value={editWeight}
          onChangeText={setEditWeight}
          placeholder="0"
          placeholderTextColor={c.placeholder}
          keyboardType="numeric"
        />

        <Text style={[styles.fieldLabel, { color: c.textSecondary, marginTop: 14 }]}>{rankLabel}</Text>
        {rankOptions.length > 0 ? (
          <View style={styles.rankGrid}>
            {rankOptions.map(r => {
              const active = editRank === r;
              return (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.rankChip,
                    { backgroundColor: active ? c.purpleBg : c.glass, borderColor: active ? c.purple : c.glassBorder },
                  ]}
                  onPress={() => setEditRank(r)}
                >
                  <Text style={[styles.rankChipText, { color: active ? c.purple : c.textSecondary }]}>{r}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <TextInput
            style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
            value={editRank}
            onChangeText={setEditRank}
            placeholder="Разряд/пояс"
            placeholderTextColor={c.placeholder}
          />
        )}

        <Text style={[styles.fieldLabel, { color: c.textSecondary, marginTop: 14 }]}>Дата рождения</Text>
        <TextInput
          style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
          value={editBirthDate}
          onChangeText={setEditBirthDate}
          placeholder="ГГГГ-ММ-ДД"
          placeholderTextColor={c.placeholder}
        />

        <Text style={[styles.fieldLabel, { color: c.textSecondary, marginTop: 14 }]}>Статус</Text>
        <View style={styles.statusGrid}>
          {[{ id: '', label: 'Норма' }, { id: 'sick', label: 'Болеет' }, { id: 'injury', label: 'Травма' }, { id: 'skip', label: 'Пропуск' }].map(s => {
            const active = editStatus === s.id;
            return (
              <TouchableOpacity
                key={s.id}
                style={[
                  styles.rankChip,
                  { backgroundColor: active ? c.purpleBg : c.glass, borderColor: active ? c.purple : c.glassBorder },
                ]}
                onPress={() => setEditStatus(s.id)}
              >
                <Text style={[styles.rankChipText, { color: active ? c.purple : c.textSecondary }]}>{s.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.fieldLabel, { color: c.textSecondary, marginTop: 14 }]}>Группы</Text>
        <View style={styles.groupGrid}>
          {groups.map(g => {
            const selected = editGroupIds.includes(g.id);
            return (
              <TouchableOpacity
                key={g.id}
                style={[
                  styles.groupChip,
                  {
                    backgroundColor: selected ? c.purpleBg : c.glass,
                    borderColor: selected ? c.purple : c.glassBorder,
                  },
                ]}
                onPress={() => toggleGroupSelection(g.id)}
              >
                <Ionicons
                  name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={selected ? c.purple : c.textTertiary}
                />
                <Text style={[styles.groupChipText, { color: selected ? c.purple : c.textSecondary }]}>
                  {g.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: c.purple, opacity: saving ? 0.7 : 1 }]}
          onPress={handleSaveEdit}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#fff" /> : (
            <Text style={styles.saveButtonText}>Сохранить</Text>
          )}
        </TouchableOpacity>
      </Modal>

      {/* Add Parent Modal */}
      <Modal visible={parentModalVisible} onClose={() => setParentModalVisible(false)} title="Добавить родителя">
        <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Имя</Text>
        <TextInput
          style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
          value={parentName}
          onChangeText={setParentName}
          placeholder="ФИО родителя"
          placeholderTextColor={c.placeholder}
        />

        <Text style={[styles.fieldLabel, { color: c.textSecondary, marginTop: 14 }]}>Телефон</Text>
        <TextInput
          style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
          value={parentPhone}
          onChangeText={setParentPhone}
          placeholder="8 (900) 123-45-67"
          placeholderTextColor={c.placeholder}
          keyboardType="phone-pad"
        />

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: c.purple, opacity: saving ? 0.7 : 1 }]}
          onPress={handleAddParent}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#fff" /> : (
            <Text style={styles.saveButtonText}>Добавить</Text>
          )}
        </TouchableOpacity>
      </Modal>
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
  notFound: {
    fontSize: 16,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentName: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 12,
    letterSpacing: -0.3,
  },
  statusBadgeLarge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 8,
  },
  statusBadgeLargeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  infoCard: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  infoLabel: {
    fontSize: 13,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
  },
  subCard: {
    marginBottom: 12,
    borderWidth: 1,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  subIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subInfo: {
    flex: 1,
  },
  subTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  subDate: {
    fontSize: 12,
    marginTop: 2,
  },
  attendanceCard: {
    marginBottom: 12,
  },
  attendanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  attendanceStat: {
    alignItems: 'center',
    gap: 4,
  },
  attendanceNumber: {
    fontSize: 24,
    fontWeight: '800',
  },
  attendanceLabel: {
    fontSize: 12,
  },
  parentCard: {
    marginBottom: 12,
  },
  parentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addParentButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  parentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  parentInfo: {
    flex: 1,
  },
  parentName: {
    fontSize: 14,
    fontWeight: '600',
  },
  parentPhone: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyText: {
    fontSize: 13,
    marginTop: 8,
  },
  actions: {
    gap: 10,
    marginTop: 8,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 14,
    gap: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginLeft: 2,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    height: 50,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  rankGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rankChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  rankChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  groupGrid: {
    gap: 8,
  },
  groupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  groupChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  saveButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 14,
    marginTop: 24,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
