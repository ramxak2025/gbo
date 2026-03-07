import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import PageHeader from '../components/PageHeader';

function formatPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';
  let d = digits;
  if (d[0] === '7') d = '8' + d.slice(1);
  if (d[0] !== '8') d = '8' + d;
  let r = d[0] || '';
  if (d.length > 1) r += ' (' + d.slice(1, 4);
  if (d.length >= 4) r += ') ';
  if (d.length > 4) r += d.slice(4, 7);
  if (d.length > 7) r += '-' + d.slice(7, 9);
  if (d.length > 9) r += '-' + d.slice(9, 11);
  return r;
}

export default function AddStudentScreen({ navigation }) {
  const { auth } = useAuth();
  const { data, addStudent } = useData();
  const { t } = useTheme();
  const [form, setForm] = useState({ name: '', phone: '', password: '', groupId: '', weight: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const myGroups = data.groups.filter(g => g.trainerId === auth.userId);

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Введите имя'); return; }
    setSaving(true); setError('');
    try {
      const digits = form.phone.replace(/\D/g, '');
      await addStudent({
        name: form.name.trim(),
        phone: digits || null,
        password: form.password || null,
        groupId: form.groupId || null,
        weight: form.weight ? Number(form.weight) : null,
      });
      navigation.goBack();
    } catch (err) {
      setError(err.message || 'Ошибка');
    } finally { setSaving(false); }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: t.bg }]} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={t.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: t.text }]}>Новый спортсмен</Text>
        <View style={{ width: 22 }} />
      </View>

      <TextInput
        style={[styles.input, { backgroundColor: t.input, borderColor: t.inputBorder, color: t.text }]}
        placeholder="ФИО *"
        placeholderTextColor={t.textMuted}
        value={form.name}
        onChangeText={v => setForm(f => ({ ...f, name: v }))}
      />
      <TextInput
        style={[styles.input, { backgroundColor: t.input, borderColor: t.inputBorder, color: t.text }]}
        placeholder="Телефон"
        placeholderTextColor={t.textMuted}
        keyboardType="phone-pad"
        value={form.phone}
        onChangeText={v => setForm(f => ({ ...f, phone: formatPhone(v) }))}
        maxLength={18}
      />
      <TextInput
        style={[styles.input, { backgroundColor: t.input, borderColor: t.inputBorder, color: t.text }]}
        placeholder="Пароль для входа"
        placeholderTextColor={t.textMuted}
        value={form.password}
        onChangeText={v => setForm(f => ({ ...f, password: v }))}
      />
      <TextInput
        style={[styles.input, { backgroundColor: t.input, borderColor: t.inputBorder, color: t.text }]}
        placeholder="Вес (кг)"
        placeholderTextColor={t.textMuted}
        keyboardType="numeric"
        value={form.weight}
        onChangeText={v => setForm(f => ({ ...f, weight: v }))}
      />

      {/* Group selection */}
      {myGroups.length > 0 && (
        <View style={styles.groupSection}>
          <Text style={[styles.groupLabel, { color: t.textSecondary }]}>Группа</Text>
          <View style={styles.groupList}>
            <TouchableOpacity
              onPress={() => setForm(f => ({ ...f, groupId: '' }))}
              style={[styles.groupBtn, !form.groupId && { backgroundColor: t.accent + '25', borderColor: t.accent }]}
            >
              <Text style={{ color: !form.groupId ? t.accent : t.textMuted, fontWeight: '600', fontSize: 13 }}>Без группы</Text>
            </TouchableOpacity>
            {myGroups.map(g => (
              <TouchableOpacity
                key={g.id}
                onPress={() => setForm(f => ({ ...f, groupId: g.id }))}
                style={[styles.groupBtn, form.groupId === g.id && { backgroundColor: t.accent + '25', borderColor: t.accent }]}
              >
                <Text style={{ color: form.groupId === g.id ? t.accent : t.textMuted, fontWeight: '600', fontSize: 13 }}>{g.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {!!error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={[styles.saveBtn, { opacity: saving ? 0.6 : 1 }]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveBtnText}>Добавить спортсмена</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title: { fontSize: 18, fontWeight: '800' },
  input: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15 },
  groupSection: { gap: 8 },
  groupLabel: { fontSize: 12, fontWeight: '600' },
  groupList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  groupBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: 'transparent' },
  error: { color: '#ef4444', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  saveBtn: { backgroundColor: '#7c3aed', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
