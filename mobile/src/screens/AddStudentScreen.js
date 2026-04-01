import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, Alert, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { getColors } from '../utils/theme';
import { getRankOptions, getRankLabel, SPORT_TYPES, isBeltSport } from '../utils/sports';
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

export default function AddStudentScreen() {
  const { dark } = useTheme();
  const c = getColors(dark);
  const navigation = useNavigation();
  const { auth } = useAuth();
  const { data, addStudent } = useData();

  const [saving, setSaving] = useState(false);
  const [showSportPicker, setShowSportPicker] = useState(false);
  const [showRankPicker, setShowRankPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    weight: '',
    sportType: auth?.sportType || 'bjj',
    rank: '',
    birthDate: '',
    subscriptionCost: '',
    subscriptionExpiry: '',
    discount: '',
    groupIds: [],
  });

  const groups = useMemo(() =>
    (data.groups || []).filter(g => g.trainerId === auth?.id),
    [data.groups, auth?.id]
  );

  const rankOptions = useMemo(() => getRankOptions(form.sportType), [form.sportType]);
  const rankLabel = useMemo(() => getRankLabel(form.sportType), [form.sportType]);

  const handlePhoneChange = useCallback((text) => {
    const digits = text.replace(/\D/g, '');
    if (digits.length <= 11) {
      setForm(f => ({ ...f, phone: formatPhone(text) }));
    }
  }, []);

  const toggleGroup = useCallback((groupId) => {
    setForm(f => {
      const ids = f.groupIds.includes(groupId)
        ? f.groupIds.filter(id => id !== groupId)
        : [...f.groupIds, groupId];
      return { ...f, groupIds: ids };
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!form.name.trim()) {
      Alert.alert('Ошибка', 'Введите имя ученика');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone ? unformatPhone(form.phone) : '',
        weight: form.weight ? parseFloat(form.weight) : null,
        sportType: form.sportType,
        rank: form.rank || null,
        birthDate: form.birthDate || null,
        subscriptionCost: form.subscriptionCost ? parseFloat(form.subscriptionCost) : null,
        subscriptionExpiry: form.subscriptionExpiry || null,
        discount: form.discount ? parseFloat(form.discount) : null,
        groupIds: form.groupIds,
        trainerId: auth?.id,
      };
      await addStudent(payload);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Ошибка', e.message || 'Не удалось добавить ученика');
    } finally {
      setSaving(false);
    }
  }, [form, auth, addStudent, navigation]);

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <PageHeader title="Новый ученик" back onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Name */}
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

        {/* Phone */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: c.textSecondary }]}>Телефон</Text>
          <TextInput
            style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
            placeholder="8 (900) 123-45-67"
            placeholderTextColor={c.placeholder}
            value={form.phone}
            onChangeText={handlePhoneChange}
            keyboardType="phone-pad"
          />
        </View>

        {/* Weight */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: c.textSecondary }]}>Вес (кг)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
            placeholder="70"
            placeholderTextColor={c.placeholder}
            value={form.weight}
            onChangeText={v => setForm(f => ({ ...f, weight: v.replace(/[^0-9.]/g, '') }))}
            keyboardType="numeric"
          />
        </View>

        {/* Birth Date */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: c.textSecondary }]}>Дата рождения</Text>
          <TextInput
            style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
            placeholder="2000-01-15"
            placeholderTextColor={c.placeholder}
            value={form.birthDate}
            onChangeText={v => setForm(f => ({ ...f, birthDate: v }))}
          />
        </View>

        {/* Sport type based Rank */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: c.textSecondary }]}>{rankLabel}</Text>
          <TouchableOpacity
            style={[styles.input, styles.pickerButton, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}
            onPress={() => setShowRankPicker(!showRankPicker)}
          >
            <Text style={{ color: form.rank ? c.text : c.placeholder }}>
              {form.rank || `Выберите ${rankLabel.toLowerCase()}`}
            </Text>
            <Ionicons name={showRankPicker ? 'chevron-up' : 'chevron-down'} size={18} color={c.textSecondary} />
          </TouchableOpacity>
          {showRankPicker && (
            <View style={[styles.pickerList, { backgroundColor: c.card, borderColor: c.border }]}>
              {rankOptions.map(rank => (
                <TouchableOpacity
                  key={rank}
                  style={[styles.pickerItem, form.rank === rank && { backgroundColor: c.purpleBg }]}
                  onPress={() => { setForm(f => ({ ...f, rank })); setShowRankPicker(false); }}
                >
                  <Text style={{ color: form.rank === rank ? c.purple : c.text }}>{rank}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Groups */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: c.textSecondary }]}>Группы</Text>
          {groups.length === 0 ? (
            <Text style={[styles.hint, { color: c.textTertiary }]}>Нет групп</Text>
          ) : (
            <View style={styles.groupList}>
              {groups.map(group => {
                const selected = form.groupIds.includes(group.id);
                return (
                  <TouchableOpacity
                    key={group.id}
                    style={[
                      styles.groupItem,
                      { borderColor: selected ? c.purple : c.border, backgroundColor: selected ? c.purpleBg : 'transparent' },
                    ]}
                    onPress={() => toggleGroup(group.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.checkbox,
                      { borderColor: selected ? c.purple : c.inputBorder, backgroundColor: selected ? c.purple : 'transparent' },
                    ]}>
                      {selected && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </View>
                    <Text style={[styles.groupName, { color: selected ? c.purple : c.text }]}>
                      {group.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Subscription Cost */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: c.textSecondary }]}>Стоимость абонемента</Text>
          <TextInput
            style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
            placeholder="5000"
            placeholderTextColor={c.placeholder}
            value={form.subscriptionCost}
            onChangeText={v => setForm(f => ({ ...f, subscriptionCost: v.replace(/[^0-9]/g, '') }))}
            keyboardType="numeric"
          />
        </View>

        {/* Subscription Expiry */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: c.textSecondary }]}>Дата окончания абонемента</Text>
          <TextInput
            style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
            placeholder="2026-05-01"
            placeholderTextColor={c.placeholder}
            value={form.subscriptionExpiry}
            onChangeText={v => setForm(f => ({ ...f, subscriptionExpiry: v }))}
          />
        </View>

        {/* Discount */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: c.textSecondary }]}>Скидка (%)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
            placeholder="0"
            placeholderTextColor={c.placeholder}
            value={form.discount}
            onChangeText={v => setForm(f => ({ ...f, discount: v.replace(/[^0-9]/g, '') }))}
            keyboardType="numeric"
          />
        </View>

        {/* Save */}
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
              <Text style={styles.saveText}>Сохранить</Text>
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
  hint: { fontSize: 14, marginLeft: 2 },
  groupList: { gap: 6 },
  groupItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderRadius: 12, borderWidth: 1,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  groupName: { fontSize: 15, fontWeight: '500' },
  saveButton: {
    flexDirection: 'row', height: 52, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
