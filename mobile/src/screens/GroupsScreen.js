import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import GlassCard from '../components/GlassCard';
import PageHeader from '../components/PageHeader';

export default function GroupsScreen() {
  const { auth } = useAuth();
  const { data, addGroup, updateGroup, deleteGroup } = useData();
  const { t } = useTheme();
  const [showAdd, setShowAdd] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', schedule: '', subscriptionCost: '' });
  const [saving, setSaving] = useState(false);

  const myGroups = data.groups.filter(g => g.trainerId === auth.userId);

  const handleAdd = async () => {
    if (!newGroup.name.trim()) return;
    setSaving(true);
    try {
      await addGroup({
        name: newGroup.name.trim(),
        schedule: newGroup.schedule.trim(),
        subscriptionCost: newGroup.subscriptionCost ? Number(newGroup.subscriptionCost) : 0,
      });
      setShowAdd(false);
      setNewGroup({ name: '', schedule: '', subscriptionCost: '' });
    } catch {}
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try { await deleteGroup(id); } catch {}
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: t.bg }]} contentContainerStyle={styles.content}>
      <PageHeader title="Группы">
        <TouchableOpacity onPress={() => setShowAdd(true)}>
          <Ionicons name="add-circle" size={26} color={t.accent} />
        </TouchableOpacity>
      </PageHeader>

      {myGroups.map(g => {
        const students = data.students.filter(s => s.groupId === g.id);
        return (
          <GlassCard key={g.id}>
            <View style={styles.groupRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.groupName, { color: t.text }]}>{g.name}</Text>
                <Text style={[styles.groupSchedule, { color: t.textMuted }]}>{g.schedule || 'Без расписания'}</Text>
                {g.subscriptionCost > 0 && (
                  <Text style={[styles.groupCost, { color: t.accent }]}>
                    {Number(g.subscriptionCost).toLocaleString('ru-RU')} р./мес
                  </Text>
                )}
              </View>
              <View style={styles.groupRight}>
                <View style={styles.countBadge}>
                  <Ionicons name="people-outline" size={14} color={t.textSecondary} />
                  <Text style={[styles.countText, { color: t.textSecondary }]}>{students.length}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(g.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="trash-outline" size={16} color={t.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
          </GlassCard>
        );
      })}

      {myGroups.length === 0 && (
        <Text style={[styles.empty, { color: t.textMuted }]}>Нет групп. Создайте первую!</Text>
      )}

      {/* Add group modal */}
      <Modal visible={showAdd} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: t.bg }]}>
            <Text style={[styles.modalTitle, { color: t.text }]}>Новая группа</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: t.input, borderColor: t.inputBorder, color: t.text }]}
              placeholder="Название группы *"
              placeholderTextColor={t.textMuted}
              value={newGroup.name}
              onChangeText={v => setNewGroup(g => ({ ...g, name: v }))}
            />
            <TextInput
              style={[styles.modalInput, { backgroundColor: t.input, borderColor: t.inputBorder, color: t.text }]}
              placeholder="Расписание (Пн, Ср, Пт 18:00)"
              placeholderTextColor={t.textMuted}
              value={newGroup.schedule}
              onChangeText={v => setNewGroup(g => ({ ...g, schedule: v }))}
            />
            <TextInput
              style={[styles.modalInput, { backgroundColor: t.input, borderColor: t.inputBorder, color: t.text }]}
              placeholder="Стоимость абонемента (руб)"
              placeholderTextColor={t.textMuted}
              keyboardType="numeric"
              value={newGroup.subscriptionCost}
              onChangeText={v => setNewGroup(g => ({ ...g, subscriptionCost: v }))}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: t.card }]} onPress={() => setShowAdd(false)}>
                <Text style={{ color: t.text, fontWeight: '600' }}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: t.accent }]} onPress={handleAdd} disabled={saving}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Создать</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16 },
  groupRow: { flexDirection: 'row', alignItems: 'center' },
  groupName: { fontSize: 16, fontWeight: '700' },
  groupSchedule: { fontSize: 12, marginTop: 2 },
  groupCost: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  groupRight: { alignItems: 'center', gap: 8 },
  countBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  countText: { fontSize: 14, fontWeight: '600' },
  empty: { textAlign: 'center', paddingVertical: 40, fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 12 },
  modalTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  modalInput: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalBtn: { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
});
