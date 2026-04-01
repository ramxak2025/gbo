import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet,
  ActivityIndicator, Alert, Platform, StatusBar,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { getColors } from '../utils/theme';
import { getSportLabel, SPORT_TYPES } from '../utils/sports';
import GlassCard from '../components/GlassCard';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';

export default function ClubsScreen() {
  const { dark } = useTheme();
  const c = getColors(dark);
  const navigation = useNavigation();
  const { data, addClub } = useData();

  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', sportType: 'bjj', city: '' });
  const [showSportPicker, setShowSportPicker] = useState(false);

  const clubs = useMemo(() => {
    const q = search.toLowerCase().trim();
    return (data.clubs || []).filter(club =>
      !q || (club.name || '').toLowerCase().includes(q) ||
      (club.city || '').toLowerCase().includes(q)
    );
  }, [data.clubs, search]);

  const getTrainerCount = useCallback((clubId) => {
    return (data.users || []).filter(u => u.role === 'trainer' && u.clubId === clubId).length;
  }, [data.users]);

  const handleSave = useCallback(async () => {
    if (!form.name.trim()) {
      Alert.alert('Ошибка', 'Введите название клуба');
      return;
    }
    setSaving(true);
    try {
      await addClub({
        name: form.name.trim(),
        sportType: form.sportType,
        city: form.city.trim(),
      });
      setModalVisible(false);
      setForm({ name: '', sportType: 'bjj', city: '' });
    } catch (e) {
      Alert.alert('Ошибка', e.message || 'Не удалось создать клуб');
    } finally {
      setSaving(false);
    }
  }, [form, addClub]);

  const renderClub = useCallback(({ item }) => {
    const trainerCount = getTrainerCount(item.id);
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => navigation.navigate('ClubDetail', { id: item.id })}
      >
        <GlassCard style={styles.clubCard}>
          <View style={styles.clubHeader}>
            <View style={[styles.clubIcon, { backgroundColor: c.purpleBg }]}>
              <MaterialCommunityIcons name="shield-outline" size={24} color={c.purple} />
            </View>
            <View style={styles.clubInfo}>
              <Text style={[styles.clubName, { color: c.text }]} numberOfLines={1}>
                {item.name}
              </Text>
              {item.city ? (
                <Text style={[styles.clubCity, { color: c.textSecondary }]}>
                  {item.city}
                </Text>
              ) : null}
            </View>
            <Ionicons name="chevron-forward" size={20} color={c.textTertiary} />
          </View>
          <View style={styles.clubMeta}>
            <View style={[styles.metaTag, { backgroundColor: c.blueBg }]}>
              <Ionicons name="people-outline" size={14} color={c.blue} />
              <Text style={[styles.metaText, { color: c.blue }]}>
                {trainerCount} {trainerCount === 1 ? 'тренер' : 'тренеров'}
              </Text>
            </View>
            <View style={[styles.metaTag, { backgroundColor: c.purpleBg }]}>
              <MaterialCommunityIcons name="karate" size={14} color={c.purple} />
              <Text style={[styles.metaText, { color: c.purple }]}>
                {getSportLabel(item.sportType)}
              </Text>
            </View>
          </View>
        </GlassCard>
      </TouchableOpacity>
    );
  }, [c, navigation, getTrainerCount]);

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <PageHeader title="Клубы" />

      <View style={styles.searchContainer}>
        <View style={[styles.searchBox, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}>
          <Ionicons name="search-outline" size={18} color={c.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: c.text }]}
            placeholder="Поиск клубов..."
            placeholderTextColor={c.placeholder}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={c.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={clubs}
        keyExtractor={item => String(item.id)}
        renderItem={renderClub}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="shield-off-outline" size={48} color={c.textTertiary} />
            <Text style={[styles.emptyText, { color: c.textSecondary }]}>
              {search ? 'Клубы не найдены' : 'Нет клубов'}
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: c.purple }]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} onClose={() => setModalVisible(false)} title="Новый клуб">
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: c.textSecondary }]}>Название</Text>
          <TextInput
            style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
            placeholder="Название клуба"
            placeholderTextColor={c.placeholder}
            value={form.name}
            onChangeText={v => setForm(f => ({ ...f, name: v }))}
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

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: c.textSecondary }]}>Город</Text>
          <TextInput
            style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
            placeholder="Город"
            placeholderTextColor={c.placeholder}
            value={form.city}
            onChangeText={v => setForm(f => ({ ...f, city: v }))}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: c.purple, opacity: saving ? 0.7 : 1 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Создать клуб</Text>
          )}
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchContainer: { paddingHorizontal: 16, paddingVertical: 12 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 14, height: 44, paddingHorizontal: 14, gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, height: '100%' },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  clubCard: { marginBottom: 12 },
  clubHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  clubIcon: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
  },
  clubInfo: { flex: 1 },
  clubName: { fontSize: 16, fontWeight: '600' },
  clubCity: { fontSize: 13, marginTop: 2 },
  clubMeta: { flexDirection: 'row', gap: 8, marginTop: 12 },
  metaTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  metaText: { fontSize: 12, fontWeight: '500' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15 },
  fab: {
    position: 'absolute', bottom: 30, right: 20,
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8,
  },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginLeft: 2 },
  input: {
    borderWidth: 1, borderRadius: 14, height: 50, paddingHorizontal: 14, fontSize: 15,
  },
  pickerButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  pickerList: { borderWidth: 1, borderRadius: 12, marginTop: 4, overflow: 'hidden' },
  pickerItem: { paddingHorizontal: 14, paddingVertical: 12 },
  saveButton: {
    height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
