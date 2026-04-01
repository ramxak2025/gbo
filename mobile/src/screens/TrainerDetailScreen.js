import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, FlatList, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { getColors } from '../utils/theme';
import { getSportLabel, SPORT_TYPES } from '../utils/sports';
import GlassCard from '../components/GlassCard';
import Modal from '../components/Modal';
import Avatar from '../components/Avatar';
import PageHeader from '../components/PageHeader';

export default function TrainerDetailScreen() {
  const { dark } = useTheme();
  const c = getColors(dark);
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params;
  const { data, updateTrainer } = useData();

  const [editModal, setEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});
  const [showSportPicker, setShowSportPicker] = useState(false);

  const trainer = useMemo(() =>
    (data.users || []).find(u => u.id === id),
    [data.users, id]
  );

  const club = useMemo(() => {
    if (!trainer?.clubId) return null;
    return (data.clubs || []).find(c => c.id === trainer.clubId);
  }, [data.clubs, trainer?.clubId]);

  const students = useMemo(() =>
    (data.students || []).filter(s => s.trainerId === id),
    [data.students, id]
  );

  const groups = useMemo(() =>
    (data.groups || []).filter(g => g.trainerId === id),
    [data.groups, id]
  );

  const openEditModal = useCallback(() => {
    if (!trainer) return;
    setForm({
      name: trainer.name || '',
      phone: trainer.phone || '',
      sportType: trainer.sportType || 'bjj',
    });
    setEditModal(true);
  }, [trainer]);

  const handleSave = useCallback(async () => {
    if (!form.name?.trim()) { Alert.alert('Ошибка', 'Введите имя'); return; }
    setSaving(true);
    try {
      await updateTrainer(id, {
        name: form.name.trim(),
        phone: form.phone?.trim() || '',
        sportType: form.sportType,
      });
      setEditModal(false);
    } catch (e) {
      Alert.alert('Ошибка', e.message);
    } finally { setSaving(false); }
  }, [form, id, updateTrainer]);

  if (!trainer) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: c.bg }]}>
        <Text style={{ color: c.textSecondary }}>Тренер не найден</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <PageHeader
        title="Тренер"
        back
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity onPress={openEditModal} style={{ padding: 4 }}>
            <Ionicons name="create-outline" size={22} color={c.purple} />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <GlassCard style={styles.profileCard}>
          <View style={styles.profileTop}>
            <Avatar name={trainer.name} photo={trainer.photo} size={72} />
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={[styles.profileName, { color: c.text }]}>{trainer.name}</Text>
                {trainer.isHeadTrainer && (
                  <View style={[styles.headBadge, { backgroundColor: c.yellowBg }]}>
                    <Ionicons name="star" size={12} color={c.yellow} />
                    <Text style={[styles.headBadgeText, { color: c.yellow }]}>Главный тренер</Text>
                  </View>
                )}
              </View>
              <View style={styles.profileDetail}>
                <Ionicons name="call-outline" size={14} color={c.textSecondary} />
                <Text style={[styles.detailText, { color: c.textSecondary }]}>{trainer.phone || '---'}</Text>
              </View>
              <View style={styles.profileDetail}>
                <MaterialCommunityIcons name="karate" size={14} color={c.textSecondary} />
                <Text style={[styles.detailText, { color: c.textSecondary }]}>{getSportLabel(trainer.sportType)}</Text>
              </View>
              {club && (
                <View style={styles.profileDetail}>
                  <MaterialCommunityIcons name="shield-outline" size={14} color={c.textSecondary} />
                  <Text style={[styles.detailText, { color: c.textSecondary }]}>{club.name}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: c.blueBg }]}>
              <Text style={[styles.statNumber, { color: c.blue }]}>{students.length}</Text>
              <Text style={[styles.statLabel, { color: c.blue }]}>Учеников</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: c.greenBg }]}>
              <Text style={[styles.statNumber, { color: c.green }]}>{groups.length}</Text>
              <Text style={[styles.statLabel, { color: c.green }]}>Групп</Text>
            </View>
          </View>
        </GlassCard>

        {/* Groups */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Группы</Text>
          {groups.length === 0 ? (
            <Text style={[styles.emptyText, { color: c.textTertiary }]}>Нет групп</Text>
          ) : (
            groups.map(group => (
              <GlassCard key={group.id} style={styles.itemCard}>
                <View style={styles.itemRow}>
                  <View style={[styles.itemIcon, { backgroundColor: c.greenBg }]}>
                    <MaterialCommunityIcons name="account-group-outline" size={18} color={c.green} />
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemName, { color: c.text }]}>{group.name}</Text>
                    {group.schedule && (
                      <Text style={[styles.itemSub, { color: c.textSecondary }]}>{group.schedule}</Text>
                    )}
                  </View>
                </View>
              </GlassCard>
            ))
          )}
        </View>

        {/* Students */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Ученики</Text>
          {students.length === 0 ? (
            <Text style={[styles.emptyText, { color: c.textTertiary }]}>Нет учеников</Text>
          ) : (
            students.map(student => (
              <GlassCard key={student.id} style={styles.itemCard}>
                <View style={styles.itemRow}>
                  <Avatar name={student.name} size={36} />
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemName, { color: c.text }]}>{student.name}</Text>
                    {student.rank && (
                      <Text style={[styles.itemSub, { color: c.textSecondary }]}>{student.rank}</Text>
                    )}
                  </View>
                  {student.weight && (
                    <Text style={[styles.weightText, { color: c.textTertiary }]}>{student.weight} кг</Text>
                  )}
                </View>
              </GlassCard>
            ))
          )}
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={editModal} onClose={() => setEditModal(false)} title="Редактировать тренера">
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: c.textSecondary }]}>ФИО</Text>
          <TextInput
            style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
            value={form.name}
            onChangeText={v => setForm(f => ({ ...f, name: v }))}
            placeholder="Имя тренера"
            placeholderTextColor={c.placeholder}
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: c.textSecondary }]}>Телефон</Text>
          <TextInput
            style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
            value={form.phone}
            onChangeText={v => setForm(f => ({ ...f, phone: v }))}
            placeholder="Телефон"
            placeholderTextColor={c.placeholder}
            keyboardType="phone-pad"
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
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Сохранить</Text>}
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  profileCard: { paddingVertical: 20 },
  profileTop: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  profileInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 },
  profileName: { fontSize: 20, fontWeight: '700' },
  headBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  headBadgeText: { fontSize: 12, fontWeight: '600' },
  profileDetail: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  detailText: { fontSize: 14 },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  statBox: {
    flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 14,
  },
  statNumber: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  emptyText: { fontSize: 14, textAlign: 'center', paddingVertical: 20 },
  itemCard: { marginBottom: 8 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemIcon: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '500' },
  itemSub: { fontSize: 13, marginTop: 2 },
  weightText: { fontSize: 13 },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginLeft: 2 },
  input: { borderWidth: 1, borderRadius: 14, height: 50, paddingHorizontal: 14, fontSize: 15 },
  pickerButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pickerList: { borderWidth: 1, borderRadius: 12, marginTop: 4, overflow: 'hidden' },
  pickerItem: { paddingHorizontal: 14, paddingVertical: 12 },
  saveButton: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
