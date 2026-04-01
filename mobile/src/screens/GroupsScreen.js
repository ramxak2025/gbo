import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { getColors } from '../utils/theme';
import { SPORT_TYPES, getSportLabel } from '../utils/sports';
import GlassCard from '../components/GlassCard';
import Modal from '../components/Modal';

const DAYS = [
  { id: 'mon', label: 'Пн', full: 'Понедельник' },
  { id: 'tue', label: 'Вт', full: 'Вторник' },
  { id: 'wed', label: 'Ср', full: 'Среда' },
  { id: 'thu', label: 'Чт', full: 'Четверг' },
  { id: 'fri', label: 'Пт', full: 'Пятница' },
  { id: 'sat', label: 'Сб', full: 'Суббота' },
  { id: 'sun', label: 'Вс', full: 'Воскресенье' },
];

const HOURS = Array.from({ length: 15 }, (_, i) => {
  const h = i + 7;
  return `${h.toString().padStart(2, '0')}:00`;
});

function formatSchedule(schedule) {
  if (!schedule || !Array.isArray(schedule) || schedule.length === 0) return '—';
  return schedule.map(s => {
    const day = DAYS.find(d => d.id === s.day)?.label || s.day;
    return `${day} ${s.time || ''}`;
  }).join(', ');
}

export default function GroupsScreen() {
  const { dark } = useTheme();
  const { auth } = useAuth();
  const { data, loading, reload, addGroup, updateGroup, deleteGroup } = useData();
  const navigation = useNavigation();
  const c = getColors(dark);

  const [refreshing, setRefreshing] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formSchedule, setFormSchedule] = useState([]);
  const [formSportType, setFormSportType] = useState('bjj');
  const [formCost, setFormCost] = useState('');
  const [showSportPicker, setShowSportPicker] = useState(false);

  // Schedule builder
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedTime, setSelectedTime] = useState('10:00');
  const [showTimePicker, setShowTimePicker] = useState(false);

  const groups = data.groups || [];
  const studentGroups = data.studentGroups || [];
  const students = data.students || [];

  const groupsWithCounts = useMemo(() => {
    return groups.map(g => {
      const count = studentGroups.filter(sg => sg.groupId === g.id).length;
      return { ...g, studentCount: count };
    });
  }, [groups, studentGroups]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }, [reload]);

  const resetForm = useCallback(() => {
    setFormName('');
    setFormSchedule([]);
    setFormSportType('bjj');
    setFormCost('');
    setSelectedDay(null);
    setSelectedTime('10:00');
    setShowSportPicker(false);
    setShowTimePicker(false);
  }, []);

  const openCreateModal = useCallback(() => {
    resetForm();
    setCreateModalVisible(true);
  }, [resetForm]);

  const openEditModal = useCallback((group) => {
    setEditingGroup(group);
    setFormName(group.name || '');
    setFormSchedule(Array.isArray(group.schedule) ? [...group.schedule] : []);
    setFormSportType(group.sportType || 'bjj');
    setFormCost(group.cost ? String(group.cost) : '');
    setSelectedDay(null);
    setSelectedTime('10:00');
    setShowSportPicker(false);
    setShowTimePicker(false);
    setEditModalVisible(true);
  }, []);

  const addScheduleSlot = useCallback(() => {
    if (!selectedDay) return;
    const exists = formSchedule.some(s => s.day === selectedDay && s.time === selectedTime);
    if (exists) return;
    setFormSchedule(prev => [...prev, { day: selectedDay, time: selectedTime }]
      .sort((a, b) => {
        const dayOrder = DAYS.findIndex(d => d.id === a.day) - DAYS.findIndex(d => d.id === b.day);
        if (dayOrder !== 0) return dayOrder;
        return (a.time || '').localeCompare(b.time || '');
      })
    );
    setSelectedDay(null);
  }, [selectedDay, selectedTime, formSchedule]);

  const removeScheduleSlot = useCallback((index) => {
    setFormSchedule(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleCreate = useCallback(async () => {
    if (!formName.trim()) {
      Alert.alert('Ошибка', 'Введите название группы');
      return;
    }
    setSaving(true);
    try {
      await addGroup({
        name: formName.trim(),
        schedule: formSchedule,
        sportType: formSportType,
        cost: formCost ? Number(formCost) : null,
      });
      setCreateModalVisible(false);
      resetForm();
    } catch (e) {
      Alert.alert('Ошибка', e.message || 'Не удалось создать группу');
    } finally {
      setSaving(false);
    }
  }, [formName, formSchedule, formSportType, formCost, addGroup, resetForm]);

  const handleUpdate = useCallback(async () => {
    if (!editingGroup || !formName.trim()) {
      Alert.alert('Ошибка', 'Введите название группы');
      return;
    }
    setSaving(true);
    try {
      await updateGroup(editingGroup.id, {
        name: formName.trim(),
        schedule: formSchedule,
        sportType: formSportType,
        cost: formCost ? Number(formCost) : null,
      });
      setEditModalVisible(false);
      setEditingGroup(null);
    } catch (e) {
      Alert.alert('Ошибка', e.message || 'Не удалось обновить группу');
    } finally {
      setSaving(false);
    }
  }, [editingGroup, formName, formSchedule, formSportType, formCost, updateGroup]);

  const handleDelete = useCallback((group) => {
    Alert.alert(
      'Удалить группу',
      `Удалить "${group.name}"? Все ученики будут откреплены от группы.`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить', style: 'destructive',
          onPress: async () => {
            try {
              await deleteGroup(group.id);
            } catch (e) {
              Alert.alert('Ошибка', e.message || 'Не удалось удалить');
            }
          },
        },
      ]
    );
  }, [deleteGroup]);

  const navigateToAttendance = useCallback((groupId) => {
    navigation.navigate('Attendance', { groupId });
  }, [navigation]);

  const renderGroupCard = (group) => (
    <GlassCard key={group.id} style={styles.groupCard}>
      <View style={styles.groupHeader}>
        <View style={[styles.groupIcon, { backgroundColor: c.purpleBg }]}>
          <MaterialCommunityIcons name="account-group" size={20} color={c.purple} />
        </View>
        <View style={styles.groupInfo}>
          <Text style={[styles.groupName, { color: c.text }]}>{group.name}</Text>
          <Text style={[styles.groupSport, { color: c.textSecondary }]}>{getSportLabel(group.sportType)}</Text>
        </View>
        <View style={[styles.studentCountBadge, { backgroundColor: c.blueBg }]}>
          <Ionicons name="people" size={14} color={c.blue} />
          <Text style={[styles.studentCountText, { color: c.blue }]}>{group.studentCount}</Text>
        </View>
      </View>

      {/* Schedule */}
      <View style={styles.scheduleRow}>
        <Ionicons name="calendar-outline" size={14} color={c.textSecondary} />
        <Text style={[styles.scheduleText, { color: c.textSecondary }]}>
          {formatSchedule(group.schedule)}
        </Text>
      </View>

      {group.cost && (
        <View style={styles.scheduleRow}>
          <Ionicons name="wallet-outline" size={14} color={c.textSecondary} />
          <Text style={[styles.scheduleText, { color: c.textSecondary }]}>
            {Number(group.cost).toLocaleString('ru-RU')} \u20BD/мес
          </Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.groupActions}>
        <TouchableOpacity
          style={[styles.groupActionButton, { backgroundColor: c.greenBg }]}
          onPress={() => navigateToAttendance(group.id)}
          activeOpacity={0.7}
        >
          <Ionicons name="checkbox-outline" size={16} color={c.green} />
          <Text style={[styles.groupActionText, { color: c.green }]}>Посещаемость</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.groupActionButton, { backgroundColor: c.blueBg }]}
          onPress={() => openEditModal(group)}
          activeOpacity={0.7}
        >
          <Ionicons name="create-outline" size={16} color={c.blue} />
          <Text style={[styles.groupActionText, { color: c.blue }]}>Изменить</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.groupActionButtonSmall, { backgroundColor: c.redBg }]}
          onPress={() => handleDelete(group)}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={16} color={c.red} />
        </TouchableOpacity>
      </View>
    </GlassCard>
  );

  const renderFormContent = (isEdit) => (
    <View>
      <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Название</Text>
      <TextInput
        style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
        value={formName}
        onChangeText={setFormName}
        placeholder="Название группы"
        placeholderTextColor={c.placeholder}
      />

      {/* Sport Type */}
      <Text style={[styles.fieldLabel, { color: c.textSecondary, marginTop: 14 }]}>Вид спорта</Text>
      <TouchableOpacity
        style={[styles.input, styles.pickerButton, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}
        onPress={() => setShowSportPicker(!showSportPicker)}
      >
        <Text style={{ color: c.text }}>
          {SPORT_TYPES.find(s => s.id === formSportType)?.label || 'Выберите'}
        </Text>
        <Ionicons name={showSportPicker ? 'chevron-up' : 'chevron-down'} size={18} color={c.textSecondary} />
      </TouchableOpacity>
      {showSportPicker && (
        <View style={[styles.pickerList, { backgroundColor: c.card, borderColor: c.border }]}>
          {SPORT_TYPES.map(sport => (
            <TouchableOpacity
              key={sport.id}
              style={[styles.pickerItem, formSportType === sport.id && { backgroundColor: c.purpleBg }]}
              onPress={() => { setFormSportType(sport.id); setShowSportPicker(false); }}
            >
              <Text style={{ color: formSportType === sport.id ? c.purple : c.text }}>{sport.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Cost */}
      <Text style={[styles.fieldLabel, { color: c.textSecondary, marginTop: 14 }]}>Стоимость (руб/мес)</Text>
      <TextInput
        style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
        value={formCost}
        onChangeText={setFormCost}
        placeholder="0"
        placeholderTextColor={c.placeholder}
        keyboardType="numeric"
      />

      {/* Schedule Builder */}
      <Text style={[styles.fieldLabel, { color: c.textSecondary, marginTop: 14 }]}>Расписание</Text>

      {/* Existing schedule slots */}
      {formSchedule.length > 0 && (
        <View style={styles.scheduleSlots}>
          {formSchedule.map((slot, i) => (
            <View key={i} style={[styles.scheduleSlot, { backgroundColor: c.purpleBg, borderColor: c.purple }]}>
              <Text style={[styles.scheduleSlotText, { color: c.purple }]}>
                {DAYS.find(d => d.id === slot.day)?.label} {slot.time}
              </Text>
              <TouchableOpacity onPress={() => removeScheduleSlot(i)}>
                <Ionicons name="close-circle" size={16} color={c.purple} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Day selector */}
      <View style={styles.dayRow}>
        {DAYS.map(day => {
          const active = selectedDay === day.id;
          return (
            <TouchableOpacity
              key={day.id}
              style={[
                styles.dayButton,
                { backgroundColor: active ? c.purple : c.glass, borderColor: active ? c.purple : c.glassBorder },
              ]}
              onPress={() => setSelectedDay(active ? null : day.id)}
            >
              <Text style={[styles.dayButtonText, { color: active ? '#fff' : c.textSecondary }]}>
                {day.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Time selector */}
      {selectedDay && (
        <View style={styles.timeSection}>
          <TouchableOpacity
            style={[styles.input, styles.pickerButton, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}
            onPress={() => setShowTimePicker(!showTimePicker)}
          >
            <Text style={{ color: c.text }}>{selectedTime}</Text>
            <Ionicons name={showTimePicker ? 'chevron-up' : 'chevron-down'} size={18} color={c.textSecondary} />
          </TouchableOpacity>
          {showTimePicker && (
            <ScrollView style={[styles.timeList, { backgroundColor: c.card, borderColor: c.border }]} nestedScrollEnabled>
              {HOURS.map(h => (
                <TouchableOpacity
                  key={h}
                  style={[styles.pickerItem, selectedTime === h && { backgroundColor: c.purpleBg }]}
                  onPress={() => { setSelectedTime(h); setShowTimePicker(false); }}
                >
                  <Text style={{ color: selectedTime === h ? c.purple : c.text }}>{h}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          <TouchableOpacity
            style={[styles.addSlotButton, { backgroundColor: c.purpleBg }]}
            onPress={addScheduleSlot}
          >
            <Ionicons name="add" size={18} color={c.purple} />
            <Text style={[styles.addSlotText, { color: c.purple }]}>Добавить</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: c.purple, opacity: saving ? 0.7 : 1 }]}
        onPress={isEdit ? handleUpdate : handleCreate}
        disabled={saving}
      >
        {saving ? <ActivityIndicator color="#fff" /> : (
          <Text style={styles.saveButtonText}>{isEdit ? 'Сохранить' : 'Создать'}</Text>
        )}
      </TouchableOpacity>
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
        {/* Header with create button */}
        <View style={styles.headerRow}>
          <Text style={[styles.headerTitle, { color: c.text }]}>
            Группы ({groupsWithCounts.length})
          </Text>
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: c.purple }]}
            onPress={openCreateModal}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.createButtonText}>Создать</Text>
          </TouchableOpacity>
        </View>

        {groupsWithCounts.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="account-group-outline" size={48} color={c.textTertiary} />
            <Text style={[styles.emptyText, { color: c.textTertiary }]}>Нет групп</Text>
            <Text style={[styles.emptyHint, { color: c.textTertiary }]}>
              Создайте первую группу для начала работы
            </Text>
          </View>
        ) : (
          groupsWithCounts.map(renderGroupCard)
        )}
      </ScrollView>

      {/* Create Modal */}
      <Modal visible={createModalVisible} onClose={() => setCreateModalVisible(false)} title="Новая группа">
        {renderFormContent(false)}
      </Modal>

      {/* Edit Modal */}
      <Modal visible={editModalVisible} onClose={() => setEditModalVisible(false)} title="Редактировать группу">
        {renderFormContent(true)}
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
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 6,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  groupCard: {
    marginBottom: 12,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  groupIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '700',
  },
  groupSport: {
    fontSize: 12,
    marginTop: 2,
  },
  studentCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
  },
  studentCountText: {
    fontSize: 13,
    fontWeight: '700',
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  scheduleText: {
    fontSize: 13,
    flex: 1,
  },
  groupActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  groupActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
    flex: 1,
  },
  groupActionButtonSmall: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: 10,
  },
  groupActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyHint: {
    fontSize: 13,
    textAlign: 'center',
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
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerList: {
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 4,
    overflow: 'hidden',
  },
  pickerItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  scheduleSlots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  scheduleSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  scheduleSlotText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dayRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  dayButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  dayButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeSection: {
    gap: 8,
    marginBottom: 8,
  },
  timeList: {
    maxHeight: 200,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  addSlotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  addSlotText: {
    fontSize: 14,
    fontWeight: '600',
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
