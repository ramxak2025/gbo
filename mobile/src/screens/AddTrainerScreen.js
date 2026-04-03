import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import PageHeader from '../components/PageHeader';
import PhoneInput from '../components/PhoneInput';
import { SPORTS } from '../utils/sports';

export default function AddTrainerScreen({ navigation }) {
  const { colors } = useTheme();
  const { addTrainer } = useData();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '+7', sportType: SPORTS[0], password: '' });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form.name.trim() || !form.phone || form.phone.length < 12) {
      Alert.alert('Ошибка', 'Заполните имя и телефон');
      return;
    }
    setLoading(true);
    try {
      await addTrainer(form);
      navigation.goBack();
    } catch (e) { Alert.alert('Ошибка', e.message); }
    finally { setLoading(false); }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <PageHeader title="Новый тренер" back />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Имя *</Text>
        <TextInput value={form.name} onChangeText={v => set('name', v)} placeholder="ФИО" placeholderTextColor={colors.textSecondary} style={[styles.input, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]} />

        <PhoneInput value={form.phone} onChangeText={v => set('phone', v)} label="Телефон *" />

        <Text style={[styles.label, { color: colors.textSecondary }]}>Пароль</Text>
        <TextInput value={form.password} onChangeText={v => set('password', v)} placeholder="Пароль для входа" placeholderTextColor={colors.textSecondary} secureTextEntry style={[styles.input, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]} />

        <Text style={[styles.label, { color: colors.textSecondary }]}>Вид спорта</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
          {SPORTS.map(s => (
            <TouchableOpacity key={s} onPress={() => set('sportType', s)} style={[styles.chip, form.sportType === s && { backgroundColor: colors.accentLight }]}>
              <Text style={{ color: form.sportType === s ? colors.accent : colors.textSecondary, fontSize: 13 }}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity onPress={handleSave} disabled={loading} style={[styles.saveBtn, { backgroundColor: colors.accent, opacity: loading ? 0.7 : 1 }]}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Добавить тренера</Text>}
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
