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
import { PlusIcon, TrashIcon, EditIcon, MapPinIcon } from '../icons';

export default function ClubBranchesScreen() {
  const { colors } = useTheme();
  const { branches, addBranch, updateBranch, deleteBranch, reload } = useData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', address: '' });
  const [refreshing, setRefreshing] = useState(false);

  const handleSave = async () => {
    if (!form.name.trim()) { Alert.alert('Ошибка', 'Введите название'); return; }
    try {
      if (editId) { await updateBranch(editId, form); }
      else { await addBranch(form); }
      setModalOpen(false);
      setForm({ name: '', address: '' });
      setEditId(null);
    } catch (e) { Alert.alert('Ошибка', e.message); }
  };

  const handleEdit = (b) => {
    setEditId(b.id);
    setForm({ name: b.name, address: b.address || '' });
    setModalOpen(true);
  };

  const handleDelete = (b) => {
    Alert.alert('Удалить филиал?', b.name, [
      { text: 'Отмена' },
      { text: 'Удалить', style: 'destructive', onPress: () => deleteBranch(b.id) },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <PageHeader title="Филиалы">
        <TouchableOpacity onPress={() => { setEditId(null); setForm({ name: '', address: '' }); setModalOpen(true); }} style={[styles.addBtn, { backgroundColor: colors.accent }]}>
          <PlusIcon size={20} color="#fff" />
        </TouchableOpacity>
      </PageHeader>

      <ScrollView
        style={styles.scroll} contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await reload(); setRefreshing(false); }} tintColor={colors.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {branches.map(b => (
          <GlassCard key={b.id}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: colors.text }]}>{b.name}</Text>
                {b.address && (
                  <View style={[styles.row, { marginTop: 4 }]}>
                    <MapPinIcon size={14} color={colors.textSecondary} />
                    <Text style={[styles.sub, { color: colors.textSecondary, marginLeft: 4 }]}>{b.address}</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={() => handleEdit(b)} style={styles.iconBtn}>
                <EditIcon size={18} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(b)} style={styles.iconBtn}>
                <TrashIcon size={18} color={colors.danger} />
              </TouchableOpacity>
            </View>
          </GlassCard>
        ))}
        {branches.length === 0 && (
          <Text style={[styles.empty, { color: colors.textSecondary }]}>Нет филиалов</Text>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal visible={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Редактировать' : 'Новый филиал'}>
        <TextInput value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))} placeholder="Название" placeholderTextColor={colors.textSecondary} style={[styles.input, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]} />
        <TextInput value={form.address} onChangeText={v => setForm(f => ({ ...f, address: v }))} placeholder="Адрес" placeholderTextColor={colors.textSecondary} style={[styles.input, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]} />
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
  sub: { fontSize: 13 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 14 },
  addBtn: { padding: 8, borderRadius: 10 },
  iconBtn: { padding: 4 },
  input: { height: 48, borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, fontSize: 16, marginBottom: 12 },
  saveBtn: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
