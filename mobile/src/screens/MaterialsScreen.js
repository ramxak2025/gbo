import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, Linking, RefreshControl,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import PageHeader from '../components/PageHeader';
import GlassCard from '../components/GlassCard';
import Modal from '../components/Modal';
import { PlusIcon, TrashIcon, LinkIcon, BookIcon } from '../icons';

export default function MaterialsScreen() {
  const { colors } = useTheme();
  const { auth } = useAuth();
  const { materials, addMaterial, deleteMaterial, reload } = useData();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', url: '' });
  const [refreshing, setRefreshing] = useState(false);

  const canAdd = auth?.role === 'trainer';

  const handleAdd = async () => {
    if (!form.title.trim()) { Alert.alert('Ошибка', 'Введите название'); return; }
    try {
      await addMaterial(form);
      setModalOpen(false);
      setForm({ title: '', description: '', url: '' });
    } catch (e) { Alert.alert('Ошибка', e.message); }
  };

  const handleDelete = (id) => {
    Alert.alert('Удалить?', 'Удалить материал?', [
      { text: 'Отмена' },
      { text: 'Удалить', style: 'destructive', onPress: () => deleteMaterial(id) },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <PageHeader title="Материалы">
        {canAdd && (
          <TouchableOpacity onPress={() => setModalOpen(true)} style={[styles.addBtn, { backgroundColor: colors.accent }]}>
            <PlusIcon size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </PageHeader>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await reload(); setRefreshing(false); }} tintColor={colors.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {materials.map(m => (
          <GlassCard key={m.id} onPress={m.url ? () => Linking.openURL(m.url) : undefined}>
            <View style={styles.row}>
              <BookIcon size={20} color={colors.accent} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.title, { color: colors.text }]}>{m.title}</Text>
                {m.description && <Text style={[styles.desc, { color: colors.textSecondary }]} numberOfLines={2}>{m.description}</Text>}
                {m.url && (
                  <View style={[styles.row, { marginTop: 4 }]}>
                    <LinkIcon size={14} color={colors.accent} />
                    <Text style={{ color: colors.accent, fontSize: 13, marginLeft: 4 }} numberOfLines={1}>{m.url}</Text>
                  </View>
                )}
              </View>
              {canAdd && (
                <TouchableOpacity onPress={() => handleDelete(m.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <TrashIcon size={18} color={colors.danger} />
                </TouchableOpacity>
              )}
            </View>
          </GlassCard>
        ))}

        {materials.length === 0 && (
          <Text style={[styles.empty, { color: colors.textSecondary }]}>Нет материалов</Text>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal visible={modalOpen} onClose={() => setModalOpen(false)} title="Новый материал">
        <TextInput value={form.title} onChangeText={v => setForm(f => ({ ...f, title: v }))} placeholder="Название" placeholderTextColor={colors.textSecondary} style={[styles.input, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]} />
        <TextInput value={form.description} onChangeText={v => setForm(f => ({ ...f, description: v }))} placeholder="Описание" placeholderTextColor={colors.textSecondary} multiline style={[styles.input, styles.textArea, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]} />
        <TextInput value={form.url} onChangeText={v => setForm(f => ({ ...f, url: v }))} placeholder="Ссылка (URL)" placeholderTextColor={colors.textSecondary} style={[styles.input, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]} />
        <TouchableOpacity onPress={handleAdd} style={[styles.saveBtn, { backgroundColor: colors.accent }]}>
          <Text style={styles.saveText}>Добавить</Text>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 15, fontWeight: '600' },
  desc: { fontSize: 13, marginTop: 2 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 14 },
  addBtn: { padding: 8, borderRadius: 10 },
  input: { height: 48, borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, fontSize: 16, marginBottom: 12 },
  textArea: { height: 80, paddingTop: 12, textAlignVertical: 'top' },
  saveBtn: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
