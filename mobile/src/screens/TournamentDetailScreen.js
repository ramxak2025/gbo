import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Image,
  Alert,
  StyleSheet,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Calendar,
  MapPin,
  Trophy,
  Check,
  X,
  Edit3,
  Trash2,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { getFullUrl } from '../utils/api';
import Avatar from '../components/Avatar';
import { LiquidGlassCard, HapticPressable, AmbientBackground, GlowButton } from '../design';
import { colors, radius, typography } from '../design/tokens';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';

function formatDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function TournamentDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { dark } = useTheme();
  const theme = dark ? colors.dark : colors.light;
  const { auth } = useAuth();
  const { data, update, updateTournament, deleteTournament } = useData();

  const isTrainer = auth?.role === 'trainer' || auth?.role === 'admin';
  const isAdmin = auth?.role === 'admin';

  const tournament = useMemo(
    () => (data.tournaments || []).find((t) => t.id === id),
    [data.tournaments, id],
  );

  const registrations = useMemo(
    () => (data.tournamentRegistrations || []).filter((r) => r.tournamentId === id),
    [data.tournamentRegistrations, id],
  );

  const students = useMemo(() => data.students || [], [data.students]);

  const [editVisible, setEditVisible] = useState(false);
  const [form, setForm] = useState({
    title: '',
    date: '',
    location: '',
    description: '',
  });

  const openEdit = () => {
    setForm({
      title: tournament?.title || tournament?.name || '',
      date: tournament?.date || '',
      location: tournament?.location || '',
      description: tournament?.description || '',
    });
    setEditVisible(true);
  };

  const handleSave = async () => {
    try {
      await updateTournament(id, form);
      setEditVisible(false);
    } catch (e) {
      Alert.alert('Ошибка', e.message);
    }
  };

  const handleDelete = () => {
    Alert.alert('Удалить турнир?', 'Это действие нельзя отменить', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTournament(id);
            navigation.goBack();
          } catch (e) {
            Alert.alert('Ошибка', e.message);
          }
        },
      },
    ]);
  };

  const toggleRegistration = async (studentId) => {
    const isRegistered = registrations.some((r) => r.studentId === studentId);
    try {
      const newRegs = isRegistered
        ? data.tournamentRegistrations.filter(
            (r) => !(r.tournamentId === id && r.studentId === studentId),
          )
        : [
            ...data.tournamentRegistrations,
            { tournamentId: id, studentId },
          ];
      await update((d) => ({ ...d, tournamentRegistrations: newRegs }));
    } catch (e) {
      Alert.alert('Ошибка', e.message);
    }
  };

  if (!tournament) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <AmbientBackground />
        <PageHeader title="Турнир" back onBack={() => navigation.goBack()} />
        <View style={styles.centered}>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            Турнир не найден
          </Text>
        </View>
      </View>
    );
  }

  const coverUrl = getFullUrl(tournament.cover || tournament.image);
  const title = tournament.title || tournament.name || 'Турнир';

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <AmbientBackground />
      <PageHeader title="Турнир" back onBack={() => navigation.goBack()}>
        {isAdmin && (
          <>
            <HapticPressable haptic="light" onPress={openEdit} style={styles.headerBtn}>
              <Edit3 size={20} color={colors.semantic.purple} />
            </HapticPressable>
            <HapticPressable haptic="light" onPress={handleDelete} style={styles.headerBtn}>
              <Trash2 size={20} color={colors.semantic.danger} />
            </HapticPressable>
          </>
        )}
      </PageHeader>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Cover image */}
        <Animated.View entering={FadeInDown.delay(0).springify()}>
          {coverUrl ? (
            <Image source={{ uri: coverUrl }} style={styles.coverImage} />
          ) : (
            <View style={[styles.coverPlaceholder, { backgroundColor: colors.semantic.purpleBg }]}>
              <Trophy size={48} color={colors.semantic.purple} />
            </View>
          )}
        </Animated.View>

        {/* Title */}
        <Animated.View entering={FadeInDown.delay(80).springify()}>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        </Animated.View>

        {/* Info cards */}
        <Animated.View entering={FadeInDown.delay(160).springify()} style={styles.infoRow}>
          <LiquidGlassCard dark={dark} radius={20} padding={16} style={styles.infoCard}>
            <View style={[styles.infoIconWrap, { backgroundColor: colors.semantic.infoBg }]}>
              <Calendar size={18} color={colors.semantic.info} />
            </View>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Дата</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>
              {formatDate(tournament.date)}
            </Text>
          </LiquidGlassCard>

          <LiquidGlassCard dark={dark} radius={20} padding={16} style={styles.infoCard}>
            <View style={[styles.infoIconWrap, { backgroundColor: colors.semantic.successBg }]}>
              <MapPin size={18} color={colors.semantic.success} />
            </View>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Место</Text>
            <Text style={[styles.infoValue, { color: theme.text }]} numberOfLines={2}>
              {tournament.location || '—'}
            </Text>
          </LiquidGlassCard>
        </Animated.View>

        {/* Description */}
        {tournament.description ? (
          <Animated.View entering={FadeInDown.delay(240).springify()}>
            <LiquidGlassCard dark={dark} radius={20} padding={16} style={styles.descriptionCard}>
              <Text style={[styles.descriptionTitle, { color: theme.text }]}>
                Описание
              </Text>
              <Text style={[styles.descriptionText, { color: theme.textSecondary }]}>
                {tournament.description}
              </Text>
            </LiquidGlassCard>
          </Animated.View>
        ) : null}

        {/* Students registration (trainer only) */}
        {isTrainer && students.length > 0 && (
          <View style={styles.registrationSection}>
            <Animated.View entering={FadeInDown.delay(320).springify()}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Регистрация учеников
              </Text>
              <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                Зарегистрировано: {registrations.length} из {students.length}
              </Text>
            </Animated.View>

            {students.map((student, index) => {
              const isRegistered = registrations.some(
                (r) => r.studentId === student.id,
              );
              return (
                <Animated.View key={student.id} entering={FadeInDown.delay(400 + index * 60).springify()}>
                  <LiquidGlassCard dark={dark} radius={20} padding={16} style={styles.studentCard}>
                    <HapticPressable
                      haptic="light"
                      style={styles.studentRow}
                      onPress={() => toggleRegistration(student.id)}
                    >
                      <Avatar
                        src={student.avatar}
                        name={student.name}
                        size={40}
                      />
                      <View style={styles.studentInfo}>
                        <Text style={[styles.studentName, { color: theme.text }]}>
                          {student.name}
                        </Text>
                        {student.weight ? (
                          <Text style={[styles.studentMeta, { color: theme.textSecondary }]}>
                            {student.weight} кг
                          </Text>
                        ) : null}
                      </View>
                      <View
                        style={[
                          styles.toggleBtn,
                          isRegistered
                            ? { backgroundColor: colors.semantic.successBg }
                            : { backgroundColor: theme.bgCard, borderWidth: 1, borderColor: theme.border },
                        ]}
                      >
                        {isRegistered ? (
                          <Check size={18} color={colors.semantic.success} />
                        ) : (
                          <X size={18} color={theme.textTertiary} />
                        )}
                      </View>
                    </HapticPressable>
                  </LiquidGlassCard>
                </Animated.View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Edit modal */}
      <Modal
        visible={editVisible}
        onClose={() => setEditVisible(false)}
        title="Редактировать турнир"
      >
        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Название</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.bgCard, borderColor: theme.border, color: theme.text }]}
          value={form.title}
          onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
          placeholderTextColor={theme.textTertiary}
          placeholder="Название турнира"
        />

        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Дата</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.bgCard, borderColor: theme.border, color: theme.text }]}
          value={form.date}
          onChangeText={(v) => setForm((f) => ({ ...f, date: v }))}
          placeholderTextColor={theme.textTertiary}
          placeholder="YYYY-MM-DD"
        />

        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Место проведения</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.bgCard, borderColor: theme.border, color: theme.text }]}
          value={form.location}
          onChangeText={(v) => setForm((f) => ({ ...f, location: v }))}
          placeholderTextColor={theme.textTertiary}
          placeholder="Город, адрес"
        />

        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Описание</Text>
        <TextInput
          style={[styles.input, styles.inputMulti, { backgroundColor: theme.bgCard, borderColor: theme.border, color: theme.text }]}
          value={form.description}
          onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
          placeholderTextColor={theme.textTertiary}
          placeholder="Описание турнира"
          multiline
          numberOfLines={4}
        />

        <HapticPressable haptic="light" style={styles.saveBtn} onPress={handleSave}>
          <LinearGradient
            colors={colors.gradients.trainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.saveBtnGradient}
          >
            <Text style={styles.saveBtnText}>Сохранить</Text>
          </LinearGradient>
        </HapticPressable>
      </Modal>
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
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 140,
  },
  coverImage: {
    width: '100%',
    height: 200,
    borderRadius: radius.lg,
    resizeMode: 'cover',
    marginBottom: 16,
  },
  coverPlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    ...typography.title1,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  infoCard: {
    flex: 1,
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  infoLabel: {
    ...typography.caption,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  descriptionCard: {
    marginBottom: 16,
  },
  descriptionTitle: {
    ...typography.bodyBold,
    marginBottom: 8,
  },
  descriptionText: {
    ...typography.body,
    lineHeight: 20,
  },
  registrationSection: {
    marginTop: 8,
  },
  sectionTitle: {
    ...typography.title3,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: 12,
  },
  studentCard: {
    marginBottom: 8,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '600',
  },
  studentMeta: {
    fontSize: 13,
    marginTop: 1,
  },
  toggleBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldLabel: {
    ...typography.caption,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  inputMulti: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  saveBtn: {
    marginTop: 24,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  saveBtnGradient: {
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
