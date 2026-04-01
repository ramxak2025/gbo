import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  TextInput, Alert, ActivityIndicator, Platform, Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { getColors } from '../utils/theme';
import { SPORT_TYPES, WEIGHT_CLASSES } from '../utils/sports';
import { api } from '../utils/api';
import GlassCard from '../components/GlassCard';
import PageHeader from '../components/PageHeader';

export default function AddTournamentScreen() {
  const { dark } = useTheme();
  const { addTournament } = useData();
  const navigation = useNavigation();
  const c = getColors(dark);

  const [name, setName] = useState('');
  const [sportType, setSportType] = useState('bjj');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('');
  const [prizes, setPrizes] = useState('');
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [coverUri, setCoverUri] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showSportPicker, setShowSportPicker] = useState(false);
  const [showPresetCategories, setShowPresetCategories] = useState(false);

  const addCategory = useCallback(() => {
    const trimmed = newCategory.trim();
    if (trimmed && !categories.includes(trimmed)) {
      setCategories(prev => [...prev, trimmed]);
      setNewCategory('');
    }
  }, [newCategory, categories]);

  const removeCategory = useCallback((cat) => {
    setCategories(prev => prev.filter(c => c !== cat));
  }, []);

  const addPresetCategory = useCallback((cat) => {
    if (!categories.includes(cat)) {
      setCategories(prev => [...prev, cat]);
    }
  }, [categories]);

  const pickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      setCoverUri(result.assets[0].uri);
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!name.trim()) { Alert.alert('Ошибка', 'Введите название турнира'); return; }
    if (!date.trim()) { Alert.alert('Ошибка', 'Введите дату'); return; }

    setSaving(true);
    try {
      let coverImage = null;
      if (coverUri) {
        try {
          coverImage = await api.uploadFile(coverUri);
        } catch {
          // proceed without cover
        }
      }

      await addTournament({
        name: name.trim(),
        sportType,
        date: date.trim(),
        location: location.trim(),
        description: description.trim(),
        rules: rules.trim(),
        prizes: prizes.trim(),
        weightCategories: categories,
        coverImage,
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Ошибка', e.message || 'Не удалось создать турнир');
    } finally {
      setSaving(false);
    }
  }, [name, sportType, date, location, description, rules, prizes, categories, coverUri, addTournament, navigation]);

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <PageHeader title="Новый турнир" back onBack={() => navigation.goBack()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Cover Image */}
        <TouchableOpacity onPress={pickImage} activeOpacity={0.7}>
          {coverUri ? (
            <Image source={{ uri: coverUri }} style={styles.coverPreview} resizeMode="cover" />
          ) : (
            <View style={[styles.coverPlaceholder, { backgroundColor: c.glass, borderColor: c.glassBorder }]}>
              <Ionicons name="image-outline" size={36} color={c.textTertiary} />
              <Text style={[styles.coverPlaceholderText, { color: c.textTertiary }]}>
                Добавить обложку
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Name */}
        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: c.textSecondary }]}>Название *</Text>
          <TextInput
            style={[styles.formInput, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
            value={name}
            onChangeText={setName}
            placeholder="Название турнира"
            placeholderTextColor={c.placeholder}
          />
        </View>

        {/* Sport Type */}
        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: c.textSecondary }]}>Вид спорта</Text>
          <TouchableOpacity
            style={[styles.formInput, styles.pickerButton, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}
            onPress={() => setShowSportPicker(!showSportPicker)}
          >
            <Text style={{ color: c.text, fontSize: 15 }}>
              {SPORT_TYPES.find(s => s.id === sportType)?.label || 'Выберите'}
            </Text>
            <Ionicons name={showSportPicker ? 'chevron-up' : 'chevron-down'} size={18} color={c.textSecondary} />
          </TouchableOpacity>
          {showSportPicker && (
            <View style={[styles.pickerList, { backgroundColor: c.card, borderColor: c.border }]}>
              {SPORT_TYPES.map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.pickerItem, sportType === s.id && { backgroundColor: c.purpleBg }]}
                  onPress={() => { setSportType(s.id); setShowSportPicker(false); }}
                >
                  <Text style={{ color: sportType === s.id ? c.purple : c.text }}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Date */}
        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: c.textSecondary }]}>Дата *</Text>
          <TextInput
            style={[styles.formInput, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
            value={date}
            onChangeText={setDate}
            placeholder="2026-06-15"
            placeholderTextColor={c.placeholder}
          />
        </View>

        {/* Location */}
        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: c.textSecondary }]}>Место проведения</Text>
          <TextInput
            style={[styles.formInput, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
            value={location}
            onChangeText={setLocation}
            placeholder="Город, адрес"
            placeholderTextColor={c.placeholder}
          />
        </View>

        {/* Description */}
        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: c.textSecondary }]}>Описание</Text>
          <TextInput
            style={[styles.formInput, styles.textArea, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Описание турнира"
            placeholderTextColor={c.placeholder}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Rules */}
        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: c.textSecondary }]}>Правила</Text>
          <TextInput
            style={[styles.formInput, styles.textArea, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
            value={rules}
            onChangeText={setRules}
            placeholder="Правила соревнований"
            placeholderTextColor={c.placeholder}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Weight Categories */}
        <View style={styles.formGroup}>
          <View style={styles.formLabelRow}>
            <Text style={[styles.formLabel, { color: c.textSecondary }]}>Весовые категории</Text>
            <TouchableOpacity onPress={() => setShowPresetCategories(!showPresetCategories)}>
              <Text style={[styles.linkText, { color: c.purple }]}>
                {showPresetCategories ? 'Скрыть' : 'Шаблоны'}
              </Text>
            </TouchableOpacity>
          </View>

          {showPresetCategories && (
            <View style={styles.presetRow}>
              {WEIGHT_CLASSES.map(wc => (
                <TouchableOpacity
                  key={wc}
                  style={[
                    styles.presetChip,
                    {
                      borderColor: categories.includes(wc) ? c.purple : c.glassBorder,
                      backgroundColor: categories.includes(wc) ? c.purpleBg : c.glass,
                    },
                  ]}
                  onPress={() => addPresetCategory(wc)}
                  disabled={categories.includes(wc)}
                >
                  <Text style={{ color: categories.includes(wc) ? c.purple : c.textSecondary, fontSize: 12 }}>
                    {wc}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.addCategoryRow}>
            <TextInput
              style={[styles.formInput, { flex: 1, backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
              value={newCategory}
              onChangeText={setNewCategory}
              placeholder="Новая категория"
              placeholderTextColor={c.placeholder}
              onSubmitEditing={addCategory}
            />
            <TouchableOpacity
              style={[styles.addCategoryBtn, { backgroundColor: c.purple }]}
              onPress={addCategory}
            >
              <Ionicons name="add" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          {categories.length > 0 && (
            <View style={styles.categoriesWrap}>
              {categories.map(cat => (
                <View key={cat} style={[styles.categoryTag, { backgroundColor: c.purpleBg }]}>
                  <Text style={[styles.categoryTagText, { color: c.purple }]}>{cat}</Text>
                  <TouchableOpacity onPress={() => removeCategory(cat)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close" size={14} color={c.purple} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Prizes */}
        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: c.textSecondary }]}>Призы</Text>
          <TextInput
            style={[styles.formInput, styles.textArea, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
            value={prizes}
            onChangeText={setPrizes}
            placeholder="1 место: ...\n2 место: ...\n3 место: ..."
            placeholderTextColor={c.placeholder}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: c.purple, opacity: saving ? 0.7 : 1 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Создать турнир</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  coverPreview: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    marginBottom: 16,
  },
  coverPlaceholder: {
    width: '100%',
    height: 140,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  coverPlaceholderText: { fontSize: 14, fontWeight: '500' },
  formGroup: { marginBottom: 16 },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginLeft: 2,
  },
  formLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  linkText: { fontSize: 13, fontWeight: '600' },
  formInput: {
    borderWidth: 1,
    borderRadius: 14,
    height: 50,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerList: {
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 4,
    overflow: 'hidden',
  },
  pickerItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  addCategoryRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  addCategoryBtn: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  categoryTagText: { fontSize: 13, fontWeight: '500' },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 14,
    marginTop: 8,
    gap: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
