import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
} from 'react-native';
import { UserPlus } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { getColors } from '../utils/theme';
import { getRankLabel, getRankOptions } from '../utils/sports';
import PageHeader from '../components/PageHeader';

function formatPhone(value) {
  const digits = value.replace(/\D/g, '');
  let formatted = '+7';
  if (digits.length > 1) formatted += ' (' + digits.substring(1, 4);
  if (digits.length > 4) formatted += ') ' + digits.substring(4, 7);
  if (digits.length > 7) formatted += '-' + digits.substring(7, 9);
  if (digits.length > 9) formatted += '-' + digits.substring(9, 11);
  return formatted;
}

export default function AddStudentScreen({ navigation }) {
  const { dark } = useTheme();
  const c = getColors(dark);
  const { auth } = useAuth();
  const { data, addStudent } = useData();

  const isTrainer = auth?.role === 'trainer' || auth?.role === 'admin';

  const groups = useMemo(() => data.groups || [], [data.groups]);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    weight: '',
    belt: '',
    birthDate: '',
    trainingStart: '',
    subscriptionDate: '',
    groupId: '',
    password: '',
  });

  const selectedGroup = useMemo(
    () => groups.find((g) => g.id === form.groupId),
    [groups, form.groupId],
  );
  const sportType = selectedGroup?.sportType || 'bjj';
  const rankLabel = getRankLabel(sportType);
  const rankOptions = getRankOptions(sportType);

  const handlePhoneChange = (value) => {
    const formatted = formatPhone(value);
    setForm((f) => ({ ...f, phone: formatted }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Ошибка', 'Введите имя ученика');
      return;
    }
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone,
        weight: form.weight ? parseFloat(form.weight) : null,
        belt: form.belt || null,
        birthDate: form.birthDate || null,
        trainingStart: form.trainingStart || null,
        subscriptionDate: form.subscriptionDate || null,
        groupId: form.groupId || null,
        password: form.password || undefined,
      };
      await addStudent(payload);
      Alert.alert('Готово', 'Ученик добавлен', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Ошибка', e.message);
    }
  };

  if (!isTrainer) {
    return (
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <PageHeader title="Добавить ученика" back onBack={() => navigation.goBack()} />
        <View style={styles.centered}>
          <Text style={[styles.emptyText, { color: c.textSecondary }]}>
            Доступ ограничен
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <PageHeader title="Новый ученик" back onBack={() => navigation.goBack()}>
        <View style={[styles.headerIcon, { backgroundColor: c.purpleBg }]}>
          <UserPlus size={18} color={c.purple} />
        </View>
      </PageHeader>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Имя *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
          value={form.name}
          onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
          placeholderTextColor={c.textTertiary}
          placeholder="Фамилия Имя"
        />

        <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Телефон</Text>
        <TextInput
          style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
          value={form.phone}
          onChangeText={handlePhoneChange}
          placeholderTextColor={c.textTertiary}
          placeholder="+7 (___) ___-__-__"
          keyboardType="phone-pad"
        />

        <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Вес (кг)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
          value={form.weight}
          onChangeText={(v) => setForm((f) => ({ ...f, weight: v }))}
          placeholderTextColor={c.textTertiary}
          placeholder="70"
          keyboardType="numeric"
        />

        <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Группа</Text>
        <View style={styles.chipRow}>
          <TouchableOpacity
            style={[
              styles.chip,
              { borderColor: c.inputBorder, backgroundColor: c.inputBg },
              !form.groupId && { borderColor: c.purple, backgroundColor: c.purpleBg },
            ]}
            onPress={() => setForm((f) => ({ ...f, groupId: '' }))}
          >
            <Text
              style={[
                styles.chipText,
                { color: c.textSecondary },
                !form.groupId && { color: c.purple },
              ]}
            >
              Без группы
            </Text>
          </TouchableOpacity>
          {groups.map((g) => (
            <TouchableOpacity
              key={g.id}
              style={[
                styles.chip,
                { borderColor: c.inputBorder, backgroundColor: c.inputBg },
                form.groupId === g.id && { borderColor: c.purple, backgroundColor: c.purpleBg },
              ]}
              onPress={() => setForm((f) => ({ ...f, groupId: g.id }))}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: c.textSecondary },
                  form.groupId === g.id && { color: c.purple },
                ]}
              >
                {g.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>{rankLabel}</Text>
        <View style={styles.chipRow}>
          {rankOptions.map((b) => (
            <TouchableOpacity
              key={b}
              style={[
                styles.chip,
                { borderColor: c.inputBorder, backgroundColor: c.inputBg },
                form.belt === b && { borderColor: c.purple, backgroundColor: c.purpleBg },
              ]}
              onPress={() => setForm((f) => ({ ...f, belt: b }))}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: c.textSecondary },
                  form.belt === b && { color: c.purple },
                ]}
              >
                {b}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Дата рождения</Text>
        <TextInput
          style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
          value={form.birthDate}
          onChangeText={(v) => setForm((f) => ({ ...f, birthDate: v }))}
          placeholderTextColor={c.textTertiary}
          placeholder="YYYY-MM-DD"
        />

        <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Начало тренировок</Text>
        <TextInput
          style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
          value={form.trainingStart}
          onChangeText={(v) => setForm((f) => ({ ...f, trainingStart: v }))}
          placeholderTextColor={c.textTertiary}
          placeholder="YYYY-MM-DD"
        />

        <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Абонемент до</Text>
        <TextInput
          style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
          value={form.subscriptionDate}
          onChangeText={(v) => setForm((f) => ({ ...f, subscriptionDate: v }))}
          placeholderTextColor={c.textTertiary}
          placeholder="YYYY-MM-DD"
        />

        <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Пароль для входа</Text>
        <TextInput
          style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
          value={form.password}
          onChangeText={(v) => setForm((f) => ({ ...f, password: v }))}
          placeholderTextColor={c.textTertiary}
          placeholder="Пароль"
          secureTextEntry
        />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Добавить ученика</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  saveBtn: {
    marginTop: 28,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#a855f7',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
