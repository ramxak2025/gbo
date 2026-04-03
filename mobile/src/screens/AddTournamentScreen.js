import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import PageHeader from '../components/PageHeader';
import { SPORTS } from '../utils/sports';

export default function AddTournamentScreen({ navigation }) {
  const { colors } = useTheme();
  const { addTournament } = useData();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', date: new Date().toISOString().split('T')[0],
    location: '', sportType: SPORTS[0], description: '',
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form.name.trim()) { Alert.alert('Ошибка', 'Введите название'); return; }
    setLoading(true);
    try {
      await addTournament(form);
      navigation.goBack();
    } catch (e) { Alert.alert('Ошибка', e.message); }
    finally { setLoading(false); }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <PageHeader title="Новый турнир" back />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Название *</Text>
        <TextInput value={form.name} onChangeText={v => set('name', v)} placeholder="Название турнира" placeholderTextColor={colors.textSecondary} style={[styles.input, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]} />

        <Text style={[styles.label, { color: colors.textSecondary }]}>Дата</Text>
        <TextInput value={form.date} onChangeText={v => set('date', v)} placeholder="ГГГГ-ММ-ДД" placeholderTextColor={colors.textSecondary} style={[styles.input, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]} />

        <Text style={[styles.label, { color: colors.textSecondary }]}>Место проведения</Text>
        <TextInput value={form.location} onChangeText={v => set('location', v)} placeholder="Адрес" placeholderTextColor={colors.textSecondary} style={[styles.input, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]} />

        <Text style={[styles.label, { color: colors.textSecondary }]}>Вид спорта</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
          {SPORTS.map(s => (
            <TouchableOpacity key={s} onPress={() => set('sportType', s)} style={[styles.chip, form.sportType === s && { backgroundColor: colors.accentLight }]}>
              <Text style={{ color: form.sportType === s ? colors.accent : colors.textSecondary, fontSize: 13 }}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Описание</Text>
        <TextInput value={form.description} onChangeText={v => set('description', v)} placeholder="Описание..." placeholderTextColor={colors.textSecondary} multiline style={[styles.input, styles.textArea, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]} />

        <TouchableOpacity onPress={handleSave} disabled={loading} style={[styles.saveBtn, { backgroundColor: colors.accent, opacity: loading ? 0.7 : 1 }]}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Создать турнир</Text>}
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
  textArea: { height: 100, paddingTop: 12, textAlignVertical: 'top' },
  chips: { marginBottom: 4, maxHeight: 40 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, marginRight: 8 },
  saveBtn: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
