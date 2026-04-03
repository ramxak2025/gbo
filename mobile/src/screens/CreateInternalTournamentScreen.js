import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import PageHeader from '../components/PageHeader';
import { SPORTS, WEIGHT_CLASSES } from '../utils/sports';
import { CheckIcon } from '../icons';

export default function CreateInternalTournamentScreen({ navigation }) {
  const { colors } = useTheme();
  const { students, addInternalTournament } = useData();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', sportType: SPORTS[0], weightClass: WEIGHT_CLASSES[0],
  });
  const [selectedStudents, setSelectedStudents] = useState([]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const toggleStudent = (id) => {
    setSelectedStudents(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!form.name.trim()) { Alert.alert('Ошибка', 'Введите название'); return; }
    if (selectedStudents.length < 2) { Alert.alert('Ошибка', 'Выберите минимум 2 участника'); return; }
    setLoading(true);
    try {
      await addInternalTournament({
        ...form,
        participantIds: selectedStudents,
        date: new Date().toISOString().split('T')[0],
      });
      navigation.goBack();
    } catch (e) { Alert.alert('Ошибка', e.message); }
    finally { setLoading(false); }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <PageHeader title="Внутренний турнир" back />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Название *</Text>
        <TextInput value={form.name} onChangeText={v => set('name', v)} placeholder="Название" placeholderTextColor={colors.textSecondary} style={[styles.input, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]} />

        <Text style={[styles.label, { color: colors.textSecondary }]}>Вид спорта</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
          {SPORTS.map(s => (
            <TouchableOpacity key={s} onPress={() => set('sportType', s)} style={[styles.chip, form.sportType === s && { backgroundColor: colors.accentLight }]}>
              <Text style={{ color: form.sportType === s ? colors.accent : colors.textSecondary, fontSize: 13 }}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Весовая категория</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
          {WEIGHT_CLASSES.map(w => (
            <TouchableOpacity key={w} onPress={() => set('weightClass', w)} style={[styles.chip, form.weightClass === w && { backgroundColor: colors.accentLight }]}>
              <Text style={{ color: form.weightClass === w ? colors.accent : colors.textSecondary, fontSize: 13 }}>{w}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Участники ({selectedStudents.length})</Text>
        {students.map(s => (
          <TouchableOpacity
            key={s.id}
            onPress={() => toggleStudent(s.id)}
            style={[styles.studentRow, { borderColor: colors.cardBorder }]}
          >
            <View style={[styles.checkbox, selectedStudents.includes(s.id) && { backgroundColor: colors.accent }]}>
              {selectedStudents.includes(s.id) && <CheckIcon size={14} color="#fff" />}
            </View>
            <Text style={[styles.studentName, { color: colors.text }]}>{s.name}</Text>
          </TouchableOpacity>
        ))}

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
  label: { fontSize: 13, marginBottom: 6, marginTop: 12, fontWeight: '500' },
  input: { height: 48, borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, fontSize: 16, marginBottom: 4 },
  chips: { marginBottom: 4, maxHeight: 40 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, marginRight: 8 },
  studentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  studentName: { fontSize: 15, fontWeight: '500' },
  saveBtn: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
