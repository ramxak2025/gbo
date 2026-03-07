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
import {
  Phone,
  Calendar,
  Scale,
  Award,
  Trash2,
  Edit3,
  Camera,
  Dumbbell,
  CreditCard,
  Key,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { getColors } from '../utils/theme';
import { api } from '../utils/api';
import { getRankLabel, getRankOptions, getSportLabel } from '../utils/sports';
import Avatar from '../components/Avatar';
import GlassCard from '../components/GlassCard';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';

function formatDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleDateString('ru-RU');
}

export default function StudentDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { dark } = useTheme();
  const c = getColors(dark);
  const { auth } = useAuth();
  const { data, updateStudent, deleteStudent } = useData();

  const isTrainer = auth?.role === 'trainer' || auth?.role === 'admin';

  const student = useMemo(
    () => data.students.find((s) => s.id === id),
    [data.students, id],
  );
  const group = useMemo(
    () => data.groups.find((g) => g.id === student?.groupId),
    [data.groups, student?.groupId],
  );

  const [editVisible, setEditVisible] = useState(false);
  const [form, setForm] = useState({});

  const sportType = group?.sportType || 'bjj';
  const rankLabel = getRankLabel(sportType);
  const rankOptions = getRankOptions(sportType);

  const openEdit = () => {
    setForm({
      name: student?.name || '',
      phone: student?.phone || '',
      weight: student?.weight?.toString() || '',
      belt: student?.belt || rankOptions[0],
      birthDate: student?.birthDate || '',
      trainingStart: student?.trainingStart || '',
      subscriptionDate: student?.subscriptionDate || '',
    });
    setEditVisible(true);
  };

  const handleSave = async () => {
    try {
      await updateStudent(id, {
        ...form,
        weight: form.weight ? parseFloat(form.weight) : null,
      });
      setEditVisible(false);
    } catch (e) {
      Alert.alert('Ошибка', e.message);
    }
  };

  const handleDelete = () => {
    Alert.alert('Удалить ученика?', 'Это действие нельзя отменить', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteStudent(id);
            navigation.goBack();
          } catch (e) {
            Alert.alert('Ошибка', e.message);
          }
        },
      },
    ]);
  };

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]) {
      try {
        const url = await api.uploadFile(result.assets[0].uri);
        await updateStudent(id, { avatar: url });
      } catch (e) {
        Alert.alert('Ошибка', e.message);
      }
    }
  };

  if (!student) {
    return (
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <PageHeader title="Досье" back onBack={() => navigation.goBack()} />
        <View style={styles.centered}>
          <Text style={[styles.emptyText, { color: c.textSecondary }]}>
            Ученик не найден
          </Text>
        </View>
      </View>
    );
  }

  const hasDebt = student.status === 'debt';

  const infoItems = [
    { icon: Award, label: rankLabel, value: student.belt || '—' },
    { icon: Scale, label: 'Вес', value: student.weight ? `${student.weight} кг` : '—' },
    { icon: Calendar, label: 'Дата рождения', value: formatDate(student.birthDate) },
    { icon: Phone, label: 'Телефон', value: student.phone || '—' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <PageHeader title="Досье" back onBack={() => navigation.goBack()}>
        {isTrainer && (
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
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <Avatar src={student.avatar} name={student.name} size={100} />
            {isTrainer && (
              <TouchableOpacity
                style={[styles.cameraBtn, { backgroundColor: c.purple }]}
                onPress={pickAvatar}
              >
                <Camera size={16} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
          <Text style={[styles.studentName, { color: c.text }]}>
            {student.name}
          </Text>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>
            {group?.name || 'Без группы'}
            {' \u2022 '}
            {getSportLabel(sportType)}
          </Text>
        </View>

        {/* Status card */}
        <GlassCard style={styles.statusCard}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: hasDebt ? c.redBg : c.greenBg },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: hasDebt ? c.red : c.green },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: hasDebt ? c.red : c.green },
              ]}
            >
              {hasDebt ? 'Задолженность' : 'Активен'}
            </Text>
          </View>
        </GlassCard>

        {/* Info grid */}
        <View style={styles.infoGrid}>
          {infoItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <GlassCard key={idx} style={styles.infoCard}>
                <View style={[styles.infoIconWrap, { backgroundColor: c.purpleBg }]}>
                  <Icon size={18} color={c.purple} />
                </View>
                <Text style={[styles.infoLabel, { color: c.textSecondary }]}>
                  {item.label}
                </Text>
                <Text style={[styles.infoValue, { color: c.text }]} numberOfLines={1}>
                  {item.value}
                </Text>
              </GlassCard>
            );
          })}
        </View>

        {/* Subscription card */}
        <GlassCard style={styles.sectionCard}>
          <View style={styles.sectionRow}>
            <View style={[styles.sectionIconWrap, { backgroundColor: c.blueBg }]}>
              <CreditCard size={18} color={c.blue} />
            </View>
            <View style={styles.sectionContent}>
              <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>
                Абонемент до
              </Text>
              <Text style={[styles.sectionValue, { color: c.text }]}>
                {formatDate(student.subscriptionDate)}
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Training start */}
        <GlassCard style={styles.sectionCard}>
          <View style={styles.sectionRow}>
            <View style={[styles.sectionIconWrap, { backgroundColor: c.greenBg }]}>
              <Dumbbell size={18} color={c.green} />
            </View>
            <View style={styles.sectionContent}>
              <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>
                Начало тренировок
              </Text>
              <Text style={[styles.sectionValue, { color: c.text }]}>
                {formatDate(student.trainingStart)}
              </Text>
            </View>
          </View>
        </GlassCard>
      </ScrollView>

      {/* Edit modal */}
      <Modal visible={editVisible} onClose={() => setEditVisible(false)} title="Редактировать">
        <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Имя</Text>
        <TextInput
          style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
          value={form.name}
          onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
          placeholderTextColor={c.textTertiary}
          placeholder="Имя ученика"
        />

        <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Телефон</Text>
        <TextInput
          style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
          value={form.phone}
          onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))}
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

        <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>{rankLabel}</Text>
        <View style={styles.beltRow}>
          {rankOptions.map((b) => (
            <TouchableOpacity
              key={b}
              style={[
                styles.beltChip,
                { borderColor: c.inputBorder, backgroundColor: c.inputBg },
                form.belt === b && { borderColor: c.purple, backgroundColor: c.purpleBg },
              ]}
              onPress={() => setForm((f) => ({ ...f, belt: b }))}
            >
              <Text
                style={[
                  styles.beltChipText,
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
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: -4,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#050505',
  },
  studentName: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  statusCard: {
    marginBottom: 16,
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  infoCard: {
    width: '47%',
    flexGrow: 1,
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
  sectionCard: {
    marginBottom: 12,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  sectionContent: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  sectionValue: {
    fontSize: 16,
    fontWeight: '700',
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
  beltRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  beltChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  beltChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  saveBtn: {
    marginTop: 24,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: '#a855f7',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
