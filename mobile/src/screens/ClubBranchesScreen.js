import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { getColors } from '../utils/theme';
import GlassCard from '../components/GlassCard';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';

export default function ClubBranchesScreen() {
  const { dark } = useTheme();
  const c = getColors(dark);
  const navigation = useNavigation();
  const route = useRoute();
  const { clubId } = route.params;
  const { data, addBranch, updateBranch, deleteBranch } = useData();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', phone: '' });

  const club = useMemo(() => (data.clubs || []).find(c => c.id === clubId), [data.clubs, clubId]);
  const branches = useMemo(() =>
    (data.branches || []).filter(b => b.clubId === clubId),
    [data.branches, clubId]
  );

  const openAdd = useCallback(() => {
    setEditingBranch(null);
    setForm({ name: '', address: '', phone: '' });
    setModalVisible(true);
  }, []);

  const openEdit = useCallback((branch) => {
    setEditingBranch(branch);
    setForm({ name: branch.name || '', address: branch.address || '', phone: branch.phone || '' });
    setModalVisible(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!form.name.trim() && !form.address.trim()) {
      Alert.alert('Ошибка', 'Введите название или адрес филиала');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        address: form.address.trim(),
        phone: form.phone.trim(),
        clubId,
      };
      if (editingBranch) {
        await updateBranch(editingBranch.id, payload);
      } else {
        await addBranch(payload);
      }
      setModalVisible(false);
      setEditingBranch(null);
    } catch (e) {
      Alert.alert('Ошибка', e.message || 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  }, [form, editingBranch, clubId, addBranch, updateBranch]);

  const handleDelete = useCallback((branch) => {
    Alert.alert('Удалить филиал?', `Удалить "${branch.name || branch.address}"?`, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить', style: 'destructive',
        onPress: async () => {
          try { await deleteBranch(branch.id); }
          catch (e) { Alert.alert('Ошибка', e.message); }
        },
      },
    ]);
  }, [deleteBranch]);

  const renderBranch = useCallback(({ item }) => (
    <GlassCard style={styles.branchCard}>
      <View style={styles.branchRow}>
        <View style={[styles.branchIcon, { backgroundColor: c.greenBg }]}>
          <Ionicons name="location-outline" size={22} color={c.green} />
        </View>
        <View style={styles.branchInfo}>
          <Text style={[styles.branchName, { color: c.text }]} numberOfLines={1}>
            {item.name || item.address || 'Без названия'}
          </Text>
          {item.address ? (
            <Text style={[styles.branchAddress, { color: c.textSecondary }]} numberOfLines={2}>
              {item.address}
            </Text>
          ) : null}
          {item.phone ? (
            <View style={styles.phoneRow}>
              <Ionicons name="call-outline" size={13} color={c.textTertiary} />
              <Text style={[styles.branchPhone, { color: c.textSecondary }]}>{item.phone}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: c.blueBg }]}
            onPress={() => openEdit(item)}
          >
            <Ionicons name="create-outline" size={16} color={c.blue} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: c.redBg }]}
            onPress={() => handleDelete(item)}
          >
            <Ionicons name="trash-outline" size={16} color={c.red} />
          </TouchableOpacity>
        </View>
      </View>
    </GlassCard>
  ), [c, openEdit, handleDelete]);

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <PageHeader
        title={club ? `Филиалы: ${club.name}` : 'Филиалы'}
        back
        onBack={() => navigation.goBack()}
      />

      <FlatList
        data={branches}
        keyExtractor={item => String(item.id)}
        renderItem={renderBranch}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="business-outline" size={48} color={c.textTertiary} />
            <Text style={[styles.emptyText, { color: c.textSecondary }]}>Нет филиалов</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: c.purple }]}
        onPress={openAdd}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        onClose={() => { setModalVisible(false); setEditingBranch(null); }}
        title={editingBranch ? 'Редактировать филиал' : 'Новый филиал'}
      >
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: c.textSecondary }]}>Название</Text>
          <TextInput
            style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
            placeholder="Название филиала"
            placeholderTextColor={c.placeholder}
            value={form.name}
            onChangeText={v => setForm(f => ({ ...f, name: v }))}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: c.textSecondary }]}>Адрес</Text>
          <TextInput
            style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
            placeholder="Адрес филиала"
            placeholderTextColor={c.placeholder}
            value={form.address}
            onChangeText={v => setForm(f => ({ ...f, address: v }))}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: c.textSecondary }]}>Телефон</Text>
          <TextInput
            style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
            placeholder="Телефон"
            placeholderTextColor={c.placeholder}
            value={form.phone}
            onChangeText={v => setForm(f => ({ ...f, phone: v }))}
            keyboardType="phone-pad"
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: c.purple, opacity: saving ? 0.7 : 1 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveText}>{editingBranch ? 'Сохранить' : 'Добавить'}</Text>
          )}
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 100 },
  branchCard: { marginBottom: 10 },
  branchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  branchIcon: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
  },
  branchInfo: { flex: 1 },
  branchName: { fontSize: 15, fontWeight: '600' },
  branchAddress: { fontSize: 13, marginTop: 2 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  branchPhone: { fontSize: 13 },
  actions: { flexDirection: 'row', gap: 6 },
  actionBtn: {
    width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
  },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15 },
  fab: {
    position: 'absolute', bottom: 30, right: 20,
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8,
  },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginLeft: 2 },
  input: { borderWidth: 1, borderRadius: 14, height: 50, paddingHorizontal: 14, fontSize: 15 },
  saveButton: {
    height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
