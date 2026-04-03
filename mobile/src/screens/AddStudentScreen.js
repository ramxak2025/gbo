import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import PageHeader from '../components/PageHeader';
import PhoneInput from '../components/PhoneInput';
import { SPORTS, getRankOptions, getRankLabel } from '../utils/sports';

export default function AddStudentScreen({ navigation }) {
  const { colors } = useTheme();
  const { addStudent, groups } = useData();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', phone: '+7', sportType: SPORTS[0], rank: '',
    weight: '', birthDate: '', groupId: groups[0]?.id || '',
  });

  const handleSave = async () => {
    if (!form.name.trim()) { Alert.alert('Ошибка', 'Введите имя'); return; }
    setLoading(true);
    try {
      await addStudent(form);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Ошибка', e.message);
    } finally { setLoading(false); }
  };

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <PageHeader title="Новый ученик" back />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Имя *</Text>
        <TextInput value={form.name} onChangeText={v => set('name', v)} placeholder="ФИО" placeholderTextColor={colors.textSecondary} style={[styles.input, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]} />

        <PhoneInput value={form.phone} onChangeText={v => set('phone', v)} label="Телефон" />

        <Text style={[styles.label, { color: colors.textSecondary }]}>Вид спорта</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
          {SPORTS.map(s => (
            <TouchableOpacity key={s} onPress={() => set('sportType', s)} style={[styles.chip, form.sportType === s && { backgroundColor: colors.accentLight }]}>
              <Text style={{ color: form.sportType === s ? colors.accent : colors.textSecondary, fontSize: 13 }}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={[styles.label, { color: colors.textSecondary }]}>{getRankLabel(form.sportType)}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
          {getRankOptions(form.sportType).map(r => (
            <TouchableOpacity key={r} onPress={() => set('rank', r)} style={[styles.chip, form.rank === r && { backgroundColor: colors.accentLight }]}>
              <Text style={{ color: form.rank === r ? colors.accent : colors.textSecondary, fontSize: 13 }}>{r}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Вес (кг)</Text>
        <TextInput value={form.weight} onChangeText={v => set('weight', v)} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.textSecondary} style={[styles.input, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]} />

        {groups.length > 0 && (
          <>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Группа</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
              {groups.map(g => (
                <TouchableOpacity key={g.id} onPress={() => set('groupId', g.id)} style={[styles.chip, form.groupId === g.id && { backgroundColor: colors.accentLight }]}>
                  <Text style={{ color: form.groupId === g.id ? colors.accent : colors.textSecondary, fontSize: 13 }}>{g.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        <TouchableOpacity onPress={handleSave} disabled={loading} style={[styles.saveBtn, { backgroundColor: colors.accent, opacity: loading ? 0.7 : 1 }]}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Добавить ученика</Text>}
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },
  label: { fontSize: 13, marginBottom: 6, marginTop: 8, fontWeight: '500' },
  input: { height: 48, borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, fontSize: 16, marginBottom: 4 },
  chips: { marginBottom: 4, maxHeight: 40 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, marginRight: 8 },
  saveBtn: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
