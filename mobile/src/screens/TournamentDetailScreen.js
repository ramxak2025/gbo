import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  StyleSheet,
} from 'react-native';
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
import { getColors } from '../utils/theme';
import { getFullUrl } from '../utils/api';
import Avatar from '../components/Avatar';
import GlassCard from '../components/GlassCard';
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
  const c = getColors(dark);
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
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <PageHeader title="Турнир" back onBack={() => navigation.goBack()} />
        <View style={styles.centered}>
          <Text style={[styles.emptyText, { color: c.textSecondary }]}>
            Турнир не найден
          </Text>
        </View>
      </View>
    );
  }

  const coverUrl = getFullUrl(tournament.cover || tournament.image);
  const title = tournament.title || tournament.name || 'Турнир';

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <PageHeader title="Турнир" back onBack={() => navigation.goBack()}>
        {isAdmin && (
          <>
            <TouchableOpacity onPress={openEdit} style={styles.headerBtn}>
              <Edit3 size={20} color={c.purple} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} style={styles.headerBtn}>
              <Trash2 size={20} color={c.red} />
            </TouchableOpacity>
          </>
        )}
      </PageHeader>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Cover image */}
        {coverUrl ? (
          <Image source={{ uri: coverUrl }} style={styles.coverImage} />
        ) : (
          <View style={[styles.coverPlaceholder, { backgroundColor: c.purpleBg }]}>
            <Trophy size={48} color={c.purple} />
          </View>
        )}

        {/* Title */}
        <Text style={[styles.title, { color: c.text }]}>{title}</Text>

        {/* Info cards */}
        <View style={styles.infoRow}>
          <GlassCard style={styles.infoCard}>
            <View style={[styles.infoIconWrap, { backgroundColor: c.blueBg }]}>
              <Calendar size={18} color={c.blue} />
            </View>
            <Text style={[styles.infoLabel, { color: c.textSecondary }]}>Дата</Text>
            <Text style={[styles.infoValue, { color: c.text }]}>
              {formatDate(tournament.date)}
            </Text>
          </GlassCard>

          <GlassCard style={styles.infoCard}>
            <View style={[styles.infoIconWrap, { backgroundColor: c.greenBg }]}>
              <MapPin size={18} color={c.green} />
            </View>
            <Text style={[styles.infoLabel, { color: c.textSecondary }]}>Место</Text>
            <Text style={[styles.infoValue, { color: c.text }]} numberOfLines={2}>
              {tournament.location || '—'}
            </Text>
          </GlassCard>
        </View>

        {/* Description */}
        {tournament.description ? (
          <GlassCard style={styles.descriptionCard}>
            <Text style={[styles.descriptionTitle, { color: c.text }]}>
              Описание
            </Text>
            <Text style={[styles.descriptionText, { color: c.textSecondary }]}>
              {tournament.description}
            </Text>
          </GlassCard>
        ) : null}

        {/* Students registration (trainer only) */}
        {isTrainer && students.length > 0 && (
          <View style={styles.registrationSection}>
            <Text style={[styles.sectionTitle, { color: c.text }]}>
              Регистрация учеников
            </Text>
            <Text style={[styles.sectionSubtitle, { color: c.textSecondary }]}>
              Зарегистрировано: {registrations.length} из {students.length}
            </Text>

            {students.map((student) => {
              const isRegistered = registrations.some(
                (r) => r.studentId === student.id,
              );
              return (
                <GlassCard key={student.id} style={styles.studentCard}>
                  <TouchableOpacity
                    style={styles.studentRow}
                    onPress={() => toggleRegistration(student.id)}
                    activeOpacity={0.7}
                  >
                    <Avatar
                      src={student.avatar}
                      name={student.name}
                      size={40}
                    />
                    <View style={styles.studentInfo}>
                      <Text style={[styles.studentName, { color: c.text }]}>
                        {student.name}
                      </Text>
                      {student.weight ? (
                        <Text style={[styles.studentMeta, { color: c.textSecondary }]}>
                          {student.weight} кг
                        </Text>
                      ) : null}
                    </View>
                    <View
                      style={[
                        styles.toggleBtn,
                        isRegistered
                          ? { backgroundColor: c.greenBg }
                          : { backgroundColor: c.inputBg, borderWidth: 1, borderColor: c.inputBorder },
                      ]}
                    >
                      {isRegistered ? (
                        <Check size={18} color={c.green} />
                      ) : (
                        <X size={18} color={c.textTertiary} />
                      )}
                    </View>
                  </TouchableOpacity>
                </GlassCard>
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
        <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Название</Text>
        <TextInput
          style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
          value={form.title}
          onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
          placeholderTextColor={c.textTertiary}
          placeholder="Название турнира"
        />

        <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Дата</Text>
        <TextInput
          style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
          value={form.date}
          onChangeText={(v) => setForm((f) => ({ ...f, date: v }))}
          placeholderTextColor={c.textTertiary}
          placeholder="YYYY-MM-DD"
        />

        <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Место проведения</Text>
        <TextInput
          style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
          value={form.location}
          onChangeText={(v) => setForm((f) => ({ ...f, location: v }))}
          placeholderTextColor={c.textTertiary}
          placeholder="Город, адрес"
        />

        <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Описание</Text>
        <TextInput
          style={[styles.input, styles.inputMulti, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
          value={form.description}
          onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
          placeholderTextColor={c.textTertiary}
          placeholder="Описание турнира"
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Сохранить</Text>
        </TouchableOpacity>
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
    paddingBottom: 40,
  },
  coverImage: {
    width: '100%',
    height: 200,
    borderRadius: 20,
    resizeMode: 'cover',
    marginBottom: 16,
  },
  coverPlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
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
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 12,
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
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  registrationSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
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
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
  inputMulti: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  saveBtn: {
    marginTop: 24,
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
