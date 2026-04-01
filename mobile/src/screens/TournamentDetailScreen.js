import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Image, Dimensions, Alert, ActivityIndicator, TextInput,
  RefreshControl,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { getColors } from '../utils/theme';
import { getSportLabel, SPORT_TYPES, WEIGHT_CLASSES } from '../utils/sports';
import GlassCard from '../components/GlassCard';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MONTH_NAMES = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

function formatFullDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

export default function TournamentDetailScreen() {
  const { dark } = useTheme();
  const { auth } = useAuth();
  const {
    data, reload, updateTournament, deleteTournament, update,
  } = useData();
  const navigation = useNavigation();
  const route = useRoute();
  const c = getColors(dark);

  const { id } = route.params;
  const tournament = useMemo(
    () => (data.tournaments || []).find(t => t.id === id),
    [data.tournaments, id],
  );

  const [rulesOpen, setRulesOpen] = useState(false);
  const [prizesOpen, setPrizesOpen] = useState(false);
  const [regulationsOpen, setRegulationsOpen] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editSport, setEditSport] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editRules, setEditRules] = useState('');
  const [editPrizes, setEditPrizes] = useState('');

  const isAdmin = auth?.role === 'superadmin' || auth?.role === 'trainer' || auth?.role === 'club_admin';
  const isStudent = auth?.role === 'student';
  const studentId = auth?.studentId;

  const registrations = useMemo(
    () => (data.tournamentRegistrations || []).filter(r => r.tournamentId === id),
    [data.tournamentRegistrations, id],
  );

  const isRegistered = useMemo(
    () => studentId ? registrations.some(r => r.studentId === studentId) : false,
    [registrations, studentId],
  );

  const registeredStudents = useMemo(() => {
    return registrations.map(r => {
      const student = (data.students || []).find(s => s.id === r.studentId);
      return student || { id: r.studentId, name: 'Неизвестный' };
    });
  }, [registrations, data.students]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }, [reload]);

  const openEditModal = useCallback(() => {
    if (!tournament) return;
    setEditName(tournament.name || '');
    setEditSport(tournament.sportType || '');
    setEditDate(tournament.date || '');
    setEditLocation(tournament.location || '');
    setEditDescription(tournament.description || '');
    setEditRules(tournament.rules || '');
    setEditPrizes(tournament.prizes || '');
    setEditModal(true);
  }, [tournament]);

  const handleSaveEdit = useCallback(async () => {
    setSaving(true);
    try {
      await updateTournament(id, {
        name: editName,
        sportType: editSport,
        date: editDate,
        location: editLocation,
        description: editDescription,
        rules: editRules,
        prizes: editPrizes,
      });
      setEditModal(false);
    } catch (e) {
      Alert.alert('Ошибка', e.message || 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  }, [id, editName, editSport, editDate, editLocation, editDescription, editRules, editPrizes, updateTournament]);

  const handleDelete = useCallback(() => {
    Alert.alert('Удалить турнир?', 'Это действие нельзя отменить.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить', style: 'destructive', onPress: async () => {
          try {
            await deleteTournament(id);
            navigation.goBack();
          } catch (e) {
            Alert.alert('Ошибка', e.message);
          }
        },
      },
    ]);
  }, [id, deleteTournament, navigation]);

  const handleRegister = useCallback(async () => {
    if (!studentId) return;
    try {
      await update(prev => ({
        ...prev,
        tournamentRegistrations: [
          ...prev.tournamentRegistrations,
          { tournamentId: id, studentId },
        ],
      }));
    } catch (e) {
      Alert.alert('Ошибка', e.message || 'Не удалось зарегистрироваться');
    }
  }, [id, studentId, update]);

  const handleUnregister = useCallback(async () => {
    if (!studentId) return;
    try {
      await update(prev => ({
        ...prev,
        tournamentRegistrations: prev.tournamentRegistrations.filter(
          r => !(r.tournamentId === id && r.studentId === studentId),
        ),
      }));
    } catch (e) {
      Alert.alert('Ошибка', e.message || 'Не удалось отменить регистрацию');
    }
  }, [id, studentId, update]);

  if (!tournament) {
    return (
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <PageHeader title="Турнир" back onBack={() => navigation.goBack()} />
        <View style={styles.loader}>
          <Text style={[styles.emptyText, { color: c.textSecondary }]}>Турнир не найден</Text>
        </View>
      </View>
    );
  }

  const weightCategories = tournament.weightCategories || tournament.categories || [];
  const isPast = new Date(tournament.date) < new Date();

  const renderCollapsible = (title, content, isOpen, setOpen, icon) => {
    if (!content) return null;
    return (
      <GlassCard style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => setOpen(!isOpen)}
          activeOpacity={0.7}
        >
          <View style={styles.sectionHeaderLeft}>
            <Ionicons name={icon} size={18} color={c.purple} />
            <Text style={[styles.sectionTitle, { color: c.text }]}>{title}</Text>
          </View>
          <Ionicons
            name={isOpen ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={c.textSecondary}
          />
        </TouchableOpacity>
        {isOpen && (
          <Text style={[styles.sectionContent, { color: c.textSecondary }]}>{content}</Text>
        )}
      </GlassCard>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <PageHeader
        title="Турнир"
        back
        onBack={() => navigation.goBack()}
        rightAction={
          isAdmin ? (
            <TouchableOpacity onPress={openEditModal} activeOpacity={0.6}>
              <Ionicons name="create-outline" size={22} color={c.purple} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.purple} />
        }
      >
        {/* Cover Image / Gradient Fallback */}
        {tournament.coverImage ? (
          <Image
            source={{ uri: tournament.coverImage }}
            style={styles.coverImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.coverFallback, { backgroundColor: c.purple }]}>
            <MaterialCommunityIcons name="trophy" size={64} color="rgba(255,255,255,0.3)" />
          </View>
        )}

        <View style={styles.content}>
          {/* Title */}
          <Text style={[styles.title, { color: c.text }]}>{tournament.name}</Text>

          {/* Info Badges */}
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: c.purpleBg }]}>
              <MaterialCommunityIcons name="karate" size={14} color={c.purple} />
              <Text style={[styles.badgeText, { color: c.purple }]}>
                {getSportLabel(tournament.sportType)}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: c.blueBg }]}>
              <Ionicons name="calendar-outline" size={14} color={c.blue} />
              <Text style={[styles.badgeText, { color: c.blue }]}>
                {formatFullDate(tournament.date)}
              </Text>
            </View>
            {tournament.location && (
              <View style={[styles.badge, { backgroundColor: c.greenBg }]}>
                <Ionicons name="location-outline" size={14} color={c.green} />
                <Text style={[styles.badgeText, { color: c.green }]}>{tournament.location}</Text>
              </View>
            )}
            {isPast && (
              <View style={[styles.badge, { backgroundColor: c.redBg }]}>
                <Text style={[styles.badgeText, { color: c.red }]}>Завершён</Text>
              </View>
            )}
          </View>

          {/* Description */}
          {tournament.description && (
            <GlassCard style={styles.section}>
              <Text style={[styles.sectionContent, { color: c.textSecondary }]}>
                {tournament.description}
              </Text>
            </GlassCard>
          )}

          {/* Collapsible Sections */}
          {renderCollapsible('Правила', tournament.rules, rulesOpen, setRulesOpen, 'document-text-outline')}
          {renderCollapsible('Регламент', tournament.regulations, regulationsOpen, setRegulationsOpen, 'list-outline')}
          {renderCollapsible('Призы', tournament.prizes, prizesOpen, setPrizesOpen, 'medal-outline')}

          {/* Weight Categories */}
          {weightCategories.length > 0 && (
            <GlassCard style={styles.section}>
              <View style={styles.sectionHeaderLeft}>
                <MaterialCommunityIcons name="weight" size={18} color={c.purple} />
                <Text style={[styles.sectionTitle, { color: c.text }]}>Весовые категории</Text>
              </View>
              <View style={styles.categoriesWrap}>
                {weightCategories.map((cat, idx) => (
                  <View key={idx} style={[styles.categoryChip, { backgroundColor: c.glass, borderColor: c.glassBorder }]}>
                    <Text style={[styles.categoryChipText, { color: c.text }]}>
                      {typeof cat === 'string' ? cat : cat.name || cat.label || `${cat.min || ''}–${cat.max || ''} кг`}
                    </Text>
                  </View>
                ))}
              </View>
            </GlassCard>
          )}

          {/* Student Registration */}
          {isStudent && !isPast && (
            <View style={styles.registerSection}>
              {isRegistered ? (
                <TouchableOpacity
                  style={[styles.registerButton, { backgroundColor: c.redBg, borderColor: c.red, borderWidth: 1 }]}
                  onPress={handleUnregister}
                >
                  <Ionicons name="close-circle-outline" size={20} color={c.red} />
                  <Text style={[styles.registerButtonText, { color: c.red }]}>
                    Отменить регистрацию
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.registerButton, { backgroundColor: c.purple }]}
                  onPress={handleRegister}
                >
                  <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                  <Text style={[styles.registerButtonText, { color: '#fff' }]}>
                    Зарегистрироваться
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Registered Students (for trainers/admins) */}
          {isAdmin && registeredStudents.length > 0 && (
            <GlassCard style={styles.section}>
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="people-outline" size={18} color={c.purple} />
                <Text style={[styles.sectionTitle, { color: c.text }]}>
                  Участники ({registeredStudents.length})
                </Text>
              </View>
              {registeredStudents.map((student, idx) => (
                <View key={student.id || idx} style={[styles.studentRow, { borderBottomColor: c.border }]}>
                  <View style={[styles.studentAvatar, { backgroundColor: c.purpleBg }]}>
                    <Text style={[styles.studentAvatarText, { color: c.purple }]}>
                      {(student.name || '?')[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.studentInfo}>
                    <Text style={[styles.studentName, { color: c.text }]}>{student.name}</Text>
                    {student.sportType && (
                      <Text style={[styles.studentSport, { color: c.textSecondary }]}>
                        {getSportLabel(student.sportType)}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </GlassCard>
          )}

          {/* Admin Actions */}
          {isAdmin && (
            <TouchableOpacity
              style={[styles.deleteButton, { borderColor: c.red }]}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={18} color={c.red} />
              <Text style={[styles.deleteButtonText, { color: c.red }]}>Удалить турнир</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={editModal} onClose={() => setEditModal(false)} title="Редактировать турнир">
        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: c.textSecondary }]}>Название</Text>
          <TextInput
            style={[styles.formInput, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
            value={editName}
            onChangeText={setEditName}
            placeholder="Название турнира"
            placeholderTextColor={c.placeholder}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: c.textSecondary }]}>Вид спорта</Text>
          <View style={styles.sportPickerRow}>
            {SPORT_TYPES.map(s => (
              <TouchableOpacity
                key={s.id}
                style={[
                  styles.sportChip,
                  { borderColor: editSport === s.id ? c.purple : c.glassBorder },
                  editSport === s.id && { backgroundColor: c.purpleBg },
                ]}
                onPress={() => setEditSport(s.id)}
              >
                <Text style={{ color: editSport === s.id ? c.purple : c.textSecondary, fontSize: 12 }}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: c.textSecondary }]}>Дата (ГГГГ-ММ-ДД)</Text>
          <TextInput
            style={[styles.formInput, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
            value={editDate}
            onChangeText={setEditDate}
            placeholder="2026-01-01"
            placeholderTextColor={c.placeholder}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: c.textSecondary }]}>Место проведения</Text>
          <TextInput
            style={[styles.formInput, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
            value={editLocation}
            onChangeText={setEditLocation}
            placeholder="Адрес / Город"
            placeholderTextColor={c.placeholder}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: c.textSecondary }]}>Описание</Text>
          <TextInput
            style={[styles.formInput, styles.formTextArea, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
            value={editDescription}
            onChangeText={setEditDescription}
            placeholder="Описание турнира"
            placeholderTextColor={c.placeholder}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: c.textSecondary }]}>Правила</Text>
          <TextInput
            style={[styles.formInput, styles.formTextArea, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
            value={editRules}
            onChangeText={setEditRules}
            placeholder="Правила"
            placeholderTextColor={c.placeholder}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: c.textSecondary }]}>Призы</Text>
          <TextInput
            style={[styles.formInput, styles.formTextArea, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
            value={editPrizes}
            onChangeText={setEditPrizes}
            placeholder="Призы"
            placeholderTextColor={c.placeholder}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: c.purple, opacity: saving ? 0.7 : 1 }]}
          onPress={handleSaveEdit}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Сохранить</Text>
          )}
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 15, fontWeight: '500' },
  coverImage: {
    width: SCREEN_WIDTH,
    height: 200,
  },
  coverFallback: {
    width: SCREEN_WIDTH,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 5,
  },
  badgeText: { fontSize: 12, fontWeight: '600' },
  section: { marginBottom: 12 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  sectionContent: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  categoriesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryChipText: { fontSize: 13, fontWeight: '500' },
  registerSection: {
    marginVertical: 16,
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 14,
    gap: 8,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  studentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentAvatarText: { fontSize: 14, fontWeight: '700' },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 14, fontWeight: '600' },
  studentSport: { fontSize: 12, marginTop: 2 },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    marginTop: 16,
  },
  deleteButtonText: { fontSize: 14, fontWeight: '600' },
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
  formTextArea: {
    height: 100,
    paddingTop: 14,
  },
  sportPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sportChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  saveButton: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
