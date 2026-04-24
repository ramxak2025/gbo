import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import PageHeader from '../components/PageHeader';
import { LiquidGlassCard, HapticPressable, AmbientBackground, GlowButton } from '../design';
import { colors, radius, typography } from '../design/tokens';

function formatPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';
  let d = digits;
  if (d[0] === '7') d = '8' + d.slice(1);
  if (d[0] !== '8') d = '8' + d;
  let r = d[0] || '';
  if (d.length > 1) r += ' (' + d.slice(1, 4);
  if (d.length >= 4) r += ') ';
  if (d.length > 4) r += d.slice(4, 7);
  if (d.length > 7) r += '-' + d.slice(7, 9);
  if (d.length > 9) r += '-' + d.slice(9, 11);
  return r;
}

export default function AddStudentScreen({ navigation }) {
  const { auth } = useAuth();
  const { data, addStudent } = useData();
  const { t, dark } = useTheme();
  const [form, setForm] = useState({ name: '', phone: '', password: '', groupId: '', weight: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const theme = dark ? colors.dark : colors.light;
  const myGroups = data.groups.filter(g => g.trainerId === auth.userId);

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Введите имя'); return; }
    setSaving(true); setError('');
    try {
      const digits = form.phone.replace(/\D/g, '');
      await addStudent({
        name: form.name.trim(),
        phone: digits || null,
        password: form.password || null,
        groupId: form.groupId || null,
        weight: form.weight ? Number(form.weight) : null,
      });
      navigation.goBack();
    } catch (err) {
      setError(err.message || 'Ошибка');
    } finally { setSaving(false); }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} contentContainerStyle={styles.content}>
      <AmbientBackground />

      <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.headerRow}>
        <HapticPressable haptic="light" onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={theme.text} />
        </HapticPressable>
        <Text style={[styles.title, { color: theme.text }]}>Новый спортсмен</Text>
        <View style={{ width: 24 }} />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).springify()}>
        <TextInput
          style={[styles.input, { backgroundColor: theme.bgCard, borderColor: theme.border, color: theme.text }]}
          placeholder="ФИО *"
          placeholderTextColor={theme.textTertiary}
          value={form.name}
          onChangeText={v => setForm(f => ({ ...f, name: v }))}
        />
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(150).springify()}>
        <TextInput
          style={[styles.input, { backgroundColor: theme.bgCard, borderColor: theme.border, color: theme.text }]}
          placeholder="Телефон"
          placeholderTextColor={theme.textTertiary}
          keyboardType="phone-pad"
          value={form.phone}
          onChangeText={v => setForm(f => ({ ...f, phone: formatPhone(v) }))}
          maxLength={18}
        />
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(200).springify()}>
        <TextInput
          style={[styles.input, { backgroundColor: theme.bgCard, borderColor: theme.border, color: theme.text }]}
          placeholder="Пароль для входа"
          placeholderTextColor={theme.textTertiary}
          value={form.password}
          onChangeText={v => setForm(f => ({ ...f, password: v }))}
        />
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(250).springify()}>
        <TextInput
          style={[styles.input, { backgroundColor: theme.bgCard, borderColor: theme.border, color: theme.text }]}
          placeholder="Вес (кг)"
          placeholderTextColor={theme.textTertiary}
          keyboardType="numeric"
          value={form.weight}
          onChangeText={v => setForm(f => ({ ...f, weight: v }))}
        />
      </Animated.View>

      {/* Group selection */}
      {myGroups.length > 0 && (
        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.groupSection}>
          <Text style={[styles.groupLabel, { color: theme.textSecondary }]}>Группа</Text>
          <View style={styles.groupList}>
            <HapticPressable
              haptic="light"
              onPress={() => setForm(f => ({ ...f, groupId: '' }))}
              style={[styles.groupBtn, !form.groupId && { backgroundColor: colors.semantic.purpleBg, borderColor: colors.semantic.purple }]}
            >
              <Text style={{ color: !form.groupId ? colors.semantic.purple : theme.textTertiary, fontWeight: '600', fontSize: 13 }}>Без группы</Text>
            </HapticPressable>
            {myGroups.map(g => (
              <HapticPressable
                key={g.id}
                haptic="light"
                onPress={() => setForm(f => ({ ...f, groupId: g.id }))}
                style={[styles.groupBtn, form.groupId === g.id && { backgroundColor: colors.semantic.purpleBg, borderColor: colors.semantic.purple }]}
              >
                <Text style={{ color: form.groupId === g.id ? colors.semantic.purple : theme.textTertiary, fontWeight: '600', fontSize: 13 }}>{g.name}</Text>
              </HapticPressable>
            ))}
          </View>
        </Animated.View>
      )}

      {!!error && <Text style={styles.error}>{error}</Text>}

      <Animated.View entering={FadeInDown.delay(350).springify()}>
        <HapticPressable
          haptic="light"
          style={[styles.saveBtn, { opacity: saving ? 0.6 : 1 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <LinearGradient
            colors={colors.gradients.trainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.saveBtnGradient}
          >
            <Text style={styles.saveBtnText}>Добавить спортсмена</Text>
          </LinearGradient>
        </HapticPressable>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 140 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title: { ...typography.title3 },
  input: { borderRadius: radius.md, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15 },
  groupSection: { gap: 8 },
  groupLabel: { ...typography.caption },
  groupList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  groupBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.sm, borderWidth: 1, borderColor: 'transparent' },
  error: { color: colors.semantic.danger, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  saveBtn: { marginTop: 8, borderRadius: radius.md, overflow: 'hidden' },
  saveBtnGradient: { borderRadius: radius.md, paddingVertical: 16, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
