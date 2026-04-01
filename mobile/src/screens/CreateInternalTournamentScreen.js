import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { getColors } from '../utils/theme';
import { SPORT_TYPES, WEIGHT_CLASSES, generateBracket } from '../utils/sports';
import GlassCard from '../components/GlassCard';
import PageHeader from '../components/PageHeader';

export default function CreateInternalTournamentScreen() {
  const { dark } = useTheme();
  const { data, addInternalTournament } = useData();
  const navigation = useNavigation();
  const c = getColors(dark);

  const [sportType, setSportType] = useState('bjj');
  const [weightClass, setWeightClass] = useState('');
  const [date, setDate] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSportPicker, setShowSportPicker] = useState(false);
  const [showWeightPicker, setShowWeightPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const students = useMemo(() => {
    return (data.students || []).filter(s => {
      if (searchQuery) {
        return s.name?.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    });
  }, [data.students, searchQuery]);

  const toggleStudent = useCallback((studentId) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      }
      return [...prev, studentId];
    });
  }, []);

  const selectAll = useCallback(() => {
    const allIds = students.map(s => s.id);
    setSelectedStudents(allIds);
  }, [students]);

  const deselectAll = useCallback(() => {
    setSelectedStudents([]);
  }, []);

  const handleCreate = useCallback(async () => {
    if (selectedStudents.length < 2) {
      Alert.alert('Ошибка', 'Выберите минимум 2 участников');
      return;
    }

    setSaving(true);
    try {
      const brackets = generateBracket(selectedStudents);

      await addInternalTournament({
        sportType,
        weightClass: weightClass || null,
        date: date || new Date().toISOString().split('T')[0],
        participants: selectedStudents,
        brackets,
        status: 'active',
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Ошибка', e.message || 'Не удалось создать турнир');
    } finally {
      setSaving(false);
    }
  }, [selectedStudents, sportType, weightClass, date, addInternalTournament, navigation]);

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <PageHeader title="Клубный турнир" back onBack={() => navigation.goBack()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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

        {/* Weight Class */}
        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: c.textSecondary }]}>Весовая категория</Text>
          <TouchableOpacity
            style={[styles.formInput, styles.pickerButton, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}
            onPress={() => setShowWeightPicker(!showWeightPicker)}
          >
            <Text style={{ color: weightClass ? c.text : c.placeholder, fontSize: 15 }}>
              {weightClass || 'Выберите (необязательно)'}
            </Text>
            <Ionicons name={showWeightPicker ? 'chevron-up' : 'chevron-down'} size={18} color={c.textSecondary} />
          </TouchableOpacity>
          {showWeightPicker && (
            <View style={[styles.pickerList, { backgroundColor: c.card, borderColor: c.border }]}>
              <TouchableOpacity
                style={[styles.pickerItem, !weightClass && { backgroundColor: c.purpleBg }]}
                onPress={() => { setWeightClass(''); setShowWeightPicker(false); }}
              >
                <Text style={{ color: !weightClass ? c.purple : c.textSecondary }}>Без категории</Text>
              </TouchableOpacity>
              {WEIGHT_CLASSES.map(wc => (
                <TouchableOpacity
                  key={wc}
                  style={[styles.pickerItem, weightClass === wc && { backgroundColor: c.purpleBg }]}
                  onPress={() => { setWeightClass(wc); setShowWeightPicker(false); }}
                >
                  <Text style={{ color: weightClass === wc ? c.purple : c.text }}>{wc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Date */}
        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: c.textSecondary }]}>Дата</Text>
          <TextInput
            style={[styles.formInput, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
            value={date}
            onChangeText={setDate}
            placeholder="2026-04-15"
            placeholderTextColor={c.placeholder}
          />
        </View>

        {/* Participant Selection */}
        <View style={styles.formGroup}>
          <View style={styles.participantsHeaderRow}>
            <Text style={[styles.formLabel, { color: c.textSecondary, marginBottom: 0 }]}>
              Участники ({selectedStudents.length})
            </Text>
            <View style={styles.selectActions}>
              <TouchableOpacity onPress={selectAll}>
                <Text style={[styles.linkText, { color: c.purple }]}>Все</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={deselectAll}>
                <Text style={[styles.linkText, { color: c.textTertiary }]}>Сбросить</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Search */}
          <View style={[styles.searchRow, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}>
            <Ionicons name="search-outline" size={18} color={c.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: c.text }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Поиск ученика..."
              placeholderTextColor={c.placeholder}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={c.textTertiary} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Student List */}
          <GlassCard style={styles.studentListCard}>
            {students.length === 0 ? (
              <Text style={[styles.emptyText, { color: c.textSecondary }]}>
                {searchQuery ? 'Ничего не найдено' : 'Нет учеников'}
              </Text>
            ) : (
              students.map((student) => {
                const isSelected = selectedStudents.includes(student.id);
                return (
                  <TouchableOpacity
                    key={student.id}
                    style={[
                      styles.studentRow,
                      { borderBottomColor: c.border },
                      isSelected && { backgroundColor: c.purpleBg },
                    ]}
                    onPress={() => toggleStudent(student.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.checkbox,
                      {
                        borderColor: isSelected ? c.purple : c.textTertiary,
                        backgroundColor: isSelected ? c.purple : 'transparent',
                      },
                    ]}>
                      {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </View>
                    <View style={styles.studentInfo}>
                      <Text style={[styles.studentName, { color: c.text }]}>{student.name}</Text>
                      {student.sportType && (
                        <Text style={[styles.studentMeta, { color: c.textSecondary }]}>
                          {SPORT_TYPES.find(s => s.id === student.sportType)?.label || ''}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </GlassCard>
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          style={[
            styles.createButton,
            { backgroundColor: c.purple, opacity: (selectedStudents.length < 2 || saving) ? 0.5 : 1 },
          ]}
          onPress={handleCreate}
          disabled={selectedStudents.length < 2 || saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="tournament" size={20} color="#fff" />
              <Text style={styles.createButtonText}>
                Сгенерировать сетку ({selectedStudents.length})
              </Text>
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
  formGroup: { marginBottom: 16 },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginLeft: 2,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 14,
    height: 50,
    paddingHorizontal: 14,
    fontSize: 15,
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
  participantsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectActions: {
    flexDirection: 'row',
    gap: 16,
  },
  linkText: { fontSize: 13, fontWeight: '600' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    height: 44,
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  studentListCard: {
    padding: 0,
    maxHeight: 400,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 14, fontWeight: '600' },
  studentMeta: { fontSize: 12, marginTop: 2 },
  emptyText: { fontSize: 14, padding: 20, textAlign: 'center' },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 14,
    marginTop: 8,
    gap: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
