import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, RefreshControl,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import PageHeader from '../components/PageHeader';
import GlassCard from '../components/GlassCard';
import Modal from '../components/Modal';
import { PlusIcon, TrashIcon, EditIcon, UsersIcon, QRCodeIcon, ChevronRightIcon } from '../icons';

export default function GroupsScreen({ navigation }) {
  const { colors } = useTheme();
  const { groups, students, addGroup, updateGroup, deleteGroup, reload } = useData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Ошибка', 'Введите название'); return; }
    try {
      if (editId) {
        await updateGroup(editId, { name });
      } else {
        await addGroup({ name });
      }
      setModalOpen(false);
      setName('');
      setEditId(null);
    } catch (e) { Alert.alert('Ошибка', e.message); }
  };

  const handleEdit = (g) => {
    setEditId(g.id);
    setName(g.name);
    setModalOpen(true);
  };

  const handleDelete = (g) => {
    Alert.alert('Удалить группу?', g.name, [
      { text: 'Отмена' },
      { text: 'Удалить', style: 'destructive', onPress: () => deleteGroup(g.id).catch(e => Alert.alert('Ошибка', e.message)) },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <PageHeader title="Группы" back>
        <TouchableOpacity onPress={() => { setEditId(null); setName(''); setModalOpen(true); }} style={[styles.addBtn, { backgroundColor: colors.accent }]}>
          <PlusIcon size={20} color="#fff" />
        </TouchableOpacity>
      </PageHeader>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await reload(); setRefreshing(false); }} tintColor={colors.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {groups.map(g => {
          const count = students.filter(s => s.groupId === g.id).length;
          return (
            <GlassCard key={g.id} onPress={() => navigation.navigate('Attendance', { groupId: g.id })}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: colors.text }]}>{g.name}</Text>
                  <Text style={[styles.sub, { color: colors.textSecondary }]}>{count} учеников</Text>
                </View>
                <TouchableOpacity onPress={() => handleEdit(g)} style={styles.iconBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <EditIcon size={18} color={colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(g)} style={styles.iconBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <TrashIcon size={18} color={colors.danger} />
                </TouchableOpacity>
                <ChevronRightIcon size={20} color={colors.textSecondary} />
              </View>
            </GlassCard>
          );
        })}

        {groups.length === 0 && (
          <Text style={[styles.empty, { color: colors.textSecondary }]}>Нет групп</Text>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal visible={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Редактировать группу' : 'Новая группа'}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Название группы"
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
        />
        <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: colors.accent }]}>
          <Text style={styles.saveText}>{editId ? 'Сохранить' : 'Создать'}</Text>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 16, fontWeight: '600' },
  sub: { fontSize: 13, marginTop: 2 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 14 },
  addBtn: { padding: 8, borderRadius: 10 },
  iconBtn: { padding: 4 },
  input: { height: 48, borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, fontSize: 16, marginBottom: 16 },
  saveBtn: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
