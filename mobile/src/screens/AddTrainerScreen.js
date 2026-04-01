import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { getColors } from '../utils/theme';
import { SPORT_TYPES, getSportLabel } from '../utils/sports';
import PageHeader from '../components/PageHeader';

function formatPhone(raw) {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 0) return '';
  let d = digits;
  if (d.startsWith('7') || d.startsWith('8')) d = d.slice(1);
  if (d.length === 0) return '8 ';
  let result = '8 (' + d.slice(0, 3);
  if (d.length > 3) result += ') ' + d.slice(3, 6);
  if (d.length > 6) result += '-' + d.slice(6, 8);
  if (d.length > 8) result += '-' + d.slice(8, 10);
  return result;
}

function unformatPhone(formatted) {
  const digits = formatted.replace(/\D/g, '');
  if (digits.startsWith('8')) return digits;
  if (digits.startsWith('7')) return '8' + digits.slice(1);
  return '8' + digits;
}

export default function AddTrainerScreen() {
  const { dark } = useTheme();
  const c = getColors(dark);
  const navigation = useNavigation();
  const { addTrainer } = useData();

  const [saving, setSaving] = useState(false);
  const [showSportPicker, setShowSportPicker] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    password: '',
    sportType: 'bjj',
  });

  const handlePhoneChange = useCallback((text) => {
    const digits = text.replace(/\D/g, '');
    if (digits.length <= 11) {
      setForm(f => ({ ...f, phone: formatPhone(text) }));
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!form.name.trim()) {
      Alert.alert('Ошибка', 'Введите имя тренера');
      return;
    }
    if (!form.phone || form.phone.replace(/\D/g, '').length < 11) {
      Alert.alert('Ошибка', 'Введите корректный номер телефона');
      return;
    }
    if (!form.password || form.password.length < 4) {
      Alert.alert('Ошибка', 'Пароль минимум 4 символа');
      return;
    }

    setSaving(true);
    try {
      await addTrainer({
        name: form.name.trim(),
        phone: unformatPhone(form.phone),
        password: form.password,
        sportType: form.sportType,
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Ошибка', e.message || 'Не удалось добавить тренера');
    } finally {
      setSaving(false);
    }
  }, [form, addTrainer, navigation]);

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <PageHeader title="Новый тренер" back onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: c.textSecondary }]}>ФИО *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
            placeholder="Иванов Иван Иванович"
            placeholderTextColor={c.placeholder}
            value={form.name}
            onChangeText={v => setForm(f => ({ ...f, name: v }))}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: c.textSecondary }]}>Телефон *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
            placeholder="8 (900) 123-45-67"
            placeholderTextColor={c.placeholder}
            value={form.phone}
            onChangeText={handlePhoneChange}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: c.textSecondary }]}>Пароль *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
            placeholder="Минимум 4 символа"
            placeholderTextColor={c.placeholder}
            value={form.password}
            onChangeText={v => setForm(f => ({ ...f, password: v }))}
            secureTextEntry
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: c.textSecondary }]}>Вид спорта</Text>
          <TouchableOpacity
            style={[styles.input, styles.pickerButton, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}
            onPress={() => setShowSportPicker(!showSportPicker)}
          >
            <Text style={{ color: c.text }}>{getSportLabel(form.sportType)}</Text>
            <Ionicons name={showSportPicker ? 'chevron-up' : 'chevron-down'} size={18} color={c.textSecondary} />
          </TouchableOpacity>
          {showSportPicker && (
            <View style={[styles.pickerList, { backgroundColor: c.card, borderColor: c.border }]}>
              {SPORT_TYPES.map(sport => (
                <TouchableOpacity
                  key={sport.id}
                  style={[styles.pickerItem, form.sportType === sport.id && { backgroundColor: c.purpleBg }]}
                  onPress={() => { setForm(f => ({ ...f, sportType: sport.id })); setShowSportPicker(false); }}
                >
                  <Text style={{ color: form.sportType === sport.id ? c.purple : c.text }}>{sport.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: c.purple, opacity: saving ? 0.7 : 1 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.saveText}>Добавить тренера</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginLeft: 2 },
  input: { borderWidth: 1, borderRadius: 14, height: 50, paddingHorizontal: 14, fontSize: 15 },
  pickerButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pickerList: { borderWidth: 1, borderRadius: 12, marginTop: 4, overflow: 'hidden' },
  pickerItem: { paddingHorizontal: 14, paddingVertical: 12 },
  saveButton: {
    flexDirection: 'row', height: 52, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
