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

export default function ClubDetailScreen() {
  const { dark } = useTheme();
  const c = getColors(dark);
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params;
  const {
    data, updateClub, deleteClub,
    assignTrainerToClub, removeTrainerFromClub,
  } = useData();

  const [editModal, setEditModal] = useState(false);
  const [assignModal, setAssignModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});
  const [showSportPicker, setShowSportPicker] = useState(false);

  const club = useMemo(() => (data.clubs || []).find(c => c.id === id), [data.clubs, id]);
  const clubTrainers = useMemo(() =>
    (data.users || []).filter(u => u.role === 'trainer' && u.clubId === id),
    [data.users, id]
  );
  const clubBranches = useMemo(() =>
    (data.branches || []).filter(b => b.clubId === id),
    [data.branches, id]
  );
  const availableTrainers = useMemo(() =>
    (data.users || []).filter(u => u.role === 'trainer' && !u.clubId),
    [data.users]
  );

  const openEditModal = useCallback(() => {
    if (!club) return;
    setForm({ name: club.name || '', sportType: club.sportType || 'bjj', city: club.city || '' });
    setEditModal(true);
  }, [club]);

  const handleSave = useCallback(async () => {
    if (!form.name?.trim()) { Alert.alert('Ошибка', 'Введите название'); return; }
    setSaving(true);
    try {
      await updateClub(id, {
        name: form.name.trim(),
        sportType: form.sportType,
        city: form.city?.trim() || '',
      });
      setEditModal(false);
    } catch (e) {
      Alert.alert('Ошибка', e.message);
    } finally { setSaving(false); }
  }, [form, id, updateClub]);

  const handleDelete = useCallback(() => {
    Alert.alert('Удалить клуб?', 'Это действие нельзя отменить', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить', style: 'destructive',
        onPress: async () => {
          try { await deleteClub(id); navigation.goBack(); }
          catch (e) { Alert.alert('Ошибка', e.message); }
        },
      },
    ]);
  }, [id, deleteClub, navigation]);

  const handleAssign = useCallback(async (trainerId) => {
    try {
      await assignTrainerToClub(id, trainerId);
      setAssignModal(false);
    } catch (e) { Alert.alert('Ошибка', e.message); }
  }, [id, assignTrainerToClub]);

  const handleRemove = useCallback((trainerId, name) => {
    Alert.alert('Убрать тренера?', `Убрать ${name} из клуба?`, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Убрать', style: 'destructive',
        onPress: () => removeTrainerFromClub(id, trainerId).catch(e => Alert.alert('Ошибка', e.message)),
      },
    ]);
  }, [id, removeTrainerFromClub]);

  const handleSetHead = useCallback(async (trainerId) => {
    try {
      await updateClub(id, { headTrainerId: trainerId });
    } catch (e) { Alert.alert('Ошибка', e.message); }
  }, [id, updateClub]);

  if (!club) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: c.bg }]}>
        <Text style={{ color: c.textSecondary }}>Клуб не найден</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <PageHeader
        title={club.name}
        back
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity onPress={openEditModal} style={{ padding: 4 }}>
            <Ionicons name="create-outline" size={22} color={c.purple} />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Club Info */}
        <GlassCard style={styles.infoCard}>
          <View style={[styles.iconWrap, { backgroundColor: c.purpleBg }]}>
            <MaterialCommunityIcons name="shield-outline" size={32} color={c.purple} />
          </View>
          <Text style={[styles.clubName, { color: c.text }]}>{club.name}</Text>
          {club.city ? <Text style={[styles.clubCity, { color: c.textSecondary }]}>{club.city}</Text> : null}
          <View style={styles.tags}>
            <View style={[styles.tag, { backgroundColor: c.purpleBg }]}>
              <Text style={[styles.tagText, { color: c.purple }]}>{getSportLabel(club.sportType)}</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: c.blueBg }]}>
              <Text style={[styles.tagText, { color: c.blue }]}>{clubTrainers.length} тренеров</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: c.greenBg }]}>
              <Text style={[styles.tagText, { color: c.green }]}>{clubBranches.length} филиалов</Text>
            </View>
          </View>
        </GlassCard>

        {/* Trainers */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: c.text }]}>Тренеры</Text>
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: c.purpleBg }]}
              onPress={() => setAssignModal(true)}
            >
              <Ionicons name="person-add-outline" size={16} color={c.purple} />
              <Text style={[styles.addBtnText, { color: c.purple }]}>Добавить</Text>
            </TouchableOpacity>
          </View>

          {clubTrainers.length === 0 ? (
            <Text style={[styles.emptyText, { color: c.textTertiary }]}>Нет тренеров</Text>
          ) : (
            clubTrainers.map(trainer => (
              <GlassCard key={trainer.id} style={styles.trainerCard}>
                <View style={styles.trainerRow}>
                  <Avatar name={trainer.name} photo={trainer.photo} size={40} />
                  <View style={styles.trainerInfo}>
                    <View style={styles.trainerNameRow}>
                      <Text style={[styles.trainerName, { color: c.text }]}>{trainer.name}</Text>
                      {trainer.isHeadTrainer && (
                        <View style={[styles.headBadge, { backgroundColor: c.yellowBg }]}>
                          <Text style={[styles.headBadgeText, { color: c.yellow }]}>Главный</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.trainerPhone, { color: c.textSecondary }]}>{trainer.phone}</Text>
                  </View>
                  <View style={styles.trainerActions}>
                    {!trainer.isHeadTrainer && (
                      <TouchableOpacity
                        onPress={() => handleSetHead(trainer.id)}
                        style={[styles.actionBtn, { backgroundColor: c.yellowBg }]}
                      >
                        <Ionicons name="star-outline" size={16} color={c.yellow} />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={() => handleRemove(trainer.id, trainer.name)}
                      style={[styles.actionBtn, { backgroundColor: c.redBg }]}
                    >
                      <Ionicons name="close" size={16} color={c.red} />
                    </TouchableOpacity>
                  </View>
                </View>
              </GlassCard>
            ))
          )}
        </View>

        {/* Branches */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: c.text }]}>Филиалы</Text>
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: c.greenBg }]}
              onPress={() => navigation.navigate('ClubBranches', { clubId: id })}
            >
              <Ionicons name="business-outline" size={16} color={c.green} />
              <Text style={[styles.addBtnText, { color: c.green }]}>Управление</Text>
            </TouchableOpacity>
          </View>

          {clubBranches.length === 0 ? (
            <Text style={[styles.emptyText, { color: c.textTertiary }]}>Нет филиалов</Text>
          ) : (
            clubBranches.map(branch => (
              <GlassCard key={branch.id} style={styles.branchCard}>
                <View style={styles.branchRow}>
                  <Ionicons name="location-outline" size={20} color={c.green} />
                  <View style={styles.branchInfo}>
                    <Text style={[styles.branchName, { color: c.text }]}>{branch.name || branch.address}</Text>
                    {branch.address ? (
                      <Text style={[styles.branchAddress, { color: c.textSecondary }]}>{branch.address}</Text>
                    ) : null}
                  </View>
                </View>
              </GlassCard>
            ))
          )}
        </View>

        <TouchableOpacity
          style={[styles.deleteButton, { borderColor: c.red }]}
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={18} color={c.red} />
          <Text style={[styles.deleteButtonText, { color: c.red }]}>Удалить клуб</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={editModal} onClose={() => setEditModal(false)} title="Редактировать клуб">
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: c.textSecondary }]}>Название</Text>
          <TextInput
            style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
            value={form.name}
            onChangeText={v => setForm(f => ({ ...f, name: v }))}
            placeholder="Название клуба"
            placeholderTextColor={c.placeholder}
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
            value={form.city}
            onChangeText={v => setForm(f => ({ ...f, city: v }))}
            placeholder="Город"
            placeholderTextColor={c.placeholder}
          />
        </View>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: c.purple, opacity: saving ? 0.7 : 1 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Сохранить</Text>}
        </TouchableOpacity>
      </Modal>

      {/* Assign Trainer Modal */}
      <Modal visible={assignModal} onClose={() => setAssignModal(false)} title="Назначить тренера">
        {availableTrainers.length === 0 ? (
          <Text style={[styles.emptyText, { color: c.textSecondary }]}>Нет свободных тренеров</Text>
        ) : (
          availableTrainers.map(trainer => (
            <TouchableOpacity
              key={trainer.id}
              style={[styles.assignItem, { borderColor: c.border }]}
              onPress={() => handleAssign(trainer.id)}
            >
              <Avatar name={trainer.name} photo={trainer.photo} size={36} />
              <View style={styles.assignInfo}>
                <Text style={[styles.assignName, { color: c.text }]}>{trainer.name}</Text>
                <Text style={[styles.assignPhone, { color: c.textSecondary }]}>{trainer.phone}</Text>
              </View>
              <Ionicons name="add-circle-outline" size={22} color={c.purple} />
            </TouchableOpacity>
          ))
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  infoCard: { alignItems: 'center', paddingVertical: 24 },
  iconWrap: {
    width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  clubName: { fontSize: 22, fontWeight: '700' },
  clubCity: { fontSize: 14, marginTop: 4 },
  tags: { flexDirection: 'row', gap: 8, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' },
  tag: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  tagText: { fontSize: 13, fontWeight: '500' },
  section: { marginTop: 24 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12,
  },
  addBtnText: { fontSize: 13, fontWeight: '600' },
  emptyText: { fontSize: 14, textAlign: 'center', paddingVertical: 20 },
  trainerCard: { marginBottom: 8 },
  trainerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  trainerInfo: { flex: 1 },
  trainerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  trainerName: { fontSize: 15, fontWeight: '600' },
  trainerPhone: { fontSize: 13, marginTop: 2 },
  headBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  headBadgeText: { fontSize: 11, fontWeight: '600' },
  trainerActions: { flexDirection: 'row', gap: 6 },
  actionBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  branchCard: { marginBottom: 8 },
  branchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  branchInfo: { flex: 1 },
  branchName: { fontSize: 15, fontWeight: '500' },
  branchAddress: { fontSize: 13, marginTop: 2 },
  deleteButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderRadius: 14, height: 48, marginTop: 32,
  },
  deleteButtonText: { fontSize: 15, fontWeight: '600' },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginLeft: 2 },
  input: { borderWidth: 1, borderRadius: 14, height: 50, paddingHorizontal: 14, fontSize: 15 },
  pickerButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pickerList: { borderWidth: 1, borderRadius: 12, marginTop: 4, overflow: 'hidden' },
  pickerItem: { paddingHorizontal: 14, paddingVertical: 12 },
  saveButton: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  assignItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  assignInfo: { flex: 1 },
  assignName: { fontSize: 15, fontWeight: '500' },
  assignPhone: { fontSize: 13, marginTop: 2 },
});
