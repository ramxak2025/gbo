import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  StyleSheet,
} from 'react-native';
import {
  Plus,
  Trash2,
  Edit3,
  Users,
  Dumbbell,
  Calendar,
  CreditCard,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { getColors } from '../utils/theme';
import { SPORT_TYPES, getSportLabel } from '../utils/sports';
import GlassCard from '../components/GlassCard';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';

export default function GroupsScreen({ navigation }) {
  const { dark } = useTheme();
  const c = getColors(dark);
  const { auth } = useAuth();
  const { data, addGroup, updateGroup, deleteGroup } = useData();

  const isTrainer = auth?.role === 'trainer' || auth?.role === 'admin';

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    schedule: '',
    subscriptionCost: '',
    sportType: 'bjj',
    attendanceEnabled: true,
  });

  const groups = useMemo(() => data.groups || [], [data.groups]);

  const getStudentCount = (groupId) => {
    return (data.students || []).filter((s) => s.groupId === groupId).length;
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({
      name: '',
      schedule: '',
      subscriptionCost: '',
      sportType: 'bjj',
      attendanceEnabled: true,
    });
    setModalVisible(true);
  };

  const openEdit = (group) => {
    setEditingId(group.id);
    setForm({
      name: group.name || '',
      schedule: group.schedule || '',
      subscriptionCost: group.subscriptionCost?.toString() || '',
      sportType: group.sportType || 'bjj',
      attendanceEnabled: group.attendanceEnabled !== false,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Ошибка', 'Введите название группы');
      return;
    }
    try {
      const payload = {
        ...form,
        subscriptionCost: form.subscriptionCost ? parseFloat(form.subscriptionCost) : 0,
      };
      if (editingId) {
        await updateGroup(editingId, payload);
      } else {
        await addGroup(payload);
      }
      setModalVisible(false);
    } catch (e) {
      Alert.alert('Ошибка', e.message);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Удалить группу?', 'Все ученики будут откреплены от группы', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteGroup(id);
          } catch (e) {
            Alert.alert('Ошибка', e.message);
          }
        },
      },
    ]);
  };

  if (!isTrainer) {
    return (
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <PageHeader title="Группы" back onBack={() => navigation.goBack()} />
        <View style={styles.centered}>
          <Text style={[styles.emptyText, { color: c.textSecondary }]}>
            Доступ ограничен
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <PageHeader title="Группы" back onBack={() => navigation.goBack()}>
        <TouchableOpacity onPress={openAdd} style={styles.headerBtn}>
          <Plus size={20} color={c.purple} />
        </TouchableOpacity>
      </PageHeader>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {groups.length === 0 && (
          <View style={styles.centered}>
            <Users size={48} color={c.textTertiary} />
            <Text style={[styles.emptyText, { color: c.textSecondary }]}>
              Нет групп
            </Text>
          </View>
        )}

        {groups.map((group) => {
          const count = getStudentCount(group.id);
          return (
            <GlassCard key={group.id} style={styles.groupCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconWrap, { backgroundColor: c.purpleBg }]}>
                  <Dumbbell size={20} color={c.purple} />
                </View>
                <View style={styles.cardHeaderText}>
                  <Text style={[styles.groupName, { color: c.text }]}>
                    {group.name}
                  </Text>
                  <Text style={[styles.sportLabel, { color: c.textSecondary }]}>
                    {getSportLabel(group.sportType)}
                  </Text>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    onPress={() => openEdit(group)}
                    style={styles.actionBtn}
                  >
                    <Edit3 size={18} color={c.purple} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(group.id)}
                    style={styles.actionBtn}
                  >
                    <Trash2 size={18} color={c.red} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.cardDetails}>
                <View style={styles.detailItem}>
                  <Users size={14} color={c.textTertiary} />
                  <Text style={[styles.detailText, { color: c.textSecondary }]}>
                    {count} {count === 1 ? 'ученик' : 'учеников'}
                  </Text>
                </View>
                {group.schedule ? (
                  <View style={styles.detailItem}>
                    <Calendar size={14} color={c.textTertiary} />
                    <Text style={[styles.detailText, { color: c.textSecondary }]}>
                      {group.schedule}
                    </Text>
                  </View>
                ) : null}
                {group.subscriptionCost ? (
                  <View style={styles.detailItem}>
                    <CreditCard size={14} color={c.textTertiary} />
                    <Text style={[styles.detailText, { color: c.textSecondary }]}>
                      {group.subscriptionCost} ₽/мес
                    </Text>
                  </View>
                ) : null}
              </View>
            </GlassCard>
          );
        })}
      </ScrollView>

      {/* Add/Edit modal */}
      <Modal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={editingId ? 'Редактировать группу' : 'Новая группа'}
      >
        <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Название</Text>
        <TextInput
          style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
          value={form.name}
          onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
          placeholderTextColor={c.textTertiary}
          placeholder="Название группы"
        />

        <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Расписание</Text>
        <TextInput
          style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
          value={form.schedule}
          onChangeText={(v) => setForm((f) => ({ ...f, schedule: v }))}
          placeholderTextColor={c.textTertiary}
          placeholder="Пн, Ср, Пт 18:00-20:00"
        />

        <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Стоимость абонемента (₽)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
          value={form.subscriptionCost}
          onChangeText={(v) => setForm((f) => ({ ...f, subscriptionCost: v }))}
          placeholderTextColor={c.textTertiary}
          placeholder="3000"
          keyboardType="numeric"
        />

        <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Вид спорта</Text>
        <View style={styles.chipRow}>
          {SPORT_TYPES.map((sport) => (
            <TouchableOpacity
              key={sport.id}
              style={[
                styles.chip,
                { borderColor: c.inputBorder, backgroundColor: c.inputBg },
                form.sportType === sport.id && { borderColor: c.purple, backgroundColor: c.purpleBg },
              ]}
              onPress={() => setForm((f) => ({ ...f, sportType: sport.id }))}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: c.textSecondary },
                  form.sportType === sport.id && { color: c.purple },
                ]}
              >
                {sport.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { color: c.text }]}>Отмечать посещаемость</Text>
          <Switch
            value={form.attendanceEnabled}
            onValueChange={(v) => setForm((f) => ({ ...f, attendanceEnabled: v }))}
            trackColor={{ false: c.inputBg, true: c.purpleBg }}
            thumbColor={form.attendanceEnabled ? c.purple : c.textTertiary}
          />
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>
            {editingId ? 'Сохранить' : 'Создать'}
          </Text>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  groupCard: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardHeaderText: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '700',
  },
  sportLabel: {
    fontSize: 13,
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  saveBtn: {
    marginTop: 24,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#a855f7',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
