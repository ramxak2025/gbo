import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, Modal, StyleSheet } from 'react-native';
import { LiquidGlassCard, HapticPressable, AmbientBackground, GlowButton } from '../design';
import { colors, radius, spacing, typography } from '../design/tokens';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Dumbbell, Users, Trash2, PlusCircle, X, Clock, Wallet } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';

export default function GroupsScreen() {
  const { auth } = useAuth();
  const { data, addGroup, updateGroup, deleteGroup } = useData();
  const { t, dark } = useTheme();
  const theme = dark ? colors.dark : colors.light;

  const [showAdd, setShowAdd] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', schedule: '', subscriptionCost: '' });
  const [saving, setSaving] = useState(false);

  const myGroups = data.groups.filter(g => g.trainerId === auth.userId);

  const handleAdd = async () => {
    if (!newGroup.name.trim()) return;
    setSaving(true);
    try {
      await addGroup({
        name: newGroup.name.trim(),
        schedule: newGroup.schedule.trim(),
        subscriptionCost: newGroup.subscriptionCost ? Number(newGroup.subscriptionCost) : 0,
      });
      setShowAdd(false);
      setNewGroup({ name: '', schedule: '', subscriptionCost: '' });
    } catch {}
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try { await deleteGroup(id); } catch {}
  };

  return (
    <View style={[styles.root, { backgroundColor: dark ? colors.dark.bg : colors.light.bg }]}>
      <AmbientBackground dark={dark} variant="warm" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <View style={styles.headerLeft}>
            <LinearGradient
              colors={colors.gradients.brand}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerIcon}
            >
              <Dumbbell size={22} color="#fff" strokeWidth={2.5} />
            </LinearGradient>
            <Text style={[typography.title1, { color: theme.text }]}>Группы</Text>
          </View>
          <HapticPressable onPress={() => setShowAdd(true)} haptic="medium">
            <PlusCircle size={28} color={colors.accent[500]} />
          </HapticPressable>
        </Animated.View>

        {/* Group cards */}
        {myGroups.map((g, index) => {
          const students = data.students.filter(s => s.groupId === g.id);
          return (
            <Animated.View
              key={g.id}
              entering={FadeInDown.delay(index * 80).springify()}
            >
              <LiquidGlassCard
                dark={dark}
                intensity="regular"
                radius={radius.xl}
                padding={spacing.lg}
                style={styles.groupCard}
              >
                <View style={styles.groupRow}>
                  <LinearGradient
                    colors={colors.gradients.brand}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.groupIcon}
                  >
                    <Dumbbell size={18} color="#fff" strokeWidth={2.5} />
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.bodyBold, { color: theme.text }]}>{g.name}</Text>
                    <View style={styles.groupMeta}>
                      <Clock size={12} color={theme.textTertiary} />
                      <Text style={[typography.caption, { color: theme.textSecondary }]}>
                        {g.schedule || 'Без расписания'}
                      </Text>
                    </View>
                    {g.subscriptionCost > 0 && (
                      <View style={[styles.groupMeta, { marginTop: spacing.xs }]}>
                        <Wallet size={12} color={colors.accent[500]} />
                        <Text style={[typography.caption, { color: colors.accent[500] }]}>
                          {Number(g.subscriptionCost).toLocaleString('ru-RU')} р./мес
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.groupRight}>
                    <View style={styles.countBadge}>
                      <Users size={14} color={theme.textSecondary} />
                      <Text style={[typography.callout, { color: theme.textSecondary }]}>
                        {students.length}
                      </Text>
                    </View>
                    <HapticPressable
                      onPress={() => handleDelete(g.id)}
                      haptic="medium"
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Trash2 size={16} color={theme.textTertiary} />
                    </HapticPressable>
                  </View>
                </View>
              </LiquidGlassCard>
            </Animated.View>
          );
        })}

        {myGroups.length === 0 && (
          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.emptyWrap}>
            <LinearGradient
              colors={colors.gradients.brand}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyIcon}
            >
              <Dumbbell size={28} color="#fff" strokeWidth={2} />
            </LinearGradient>
            <Text style={[typography.body, { color: theme.textTertiary, marginTop: spacing.md }]}>
              Нет групп. Создайте первую!
            </Text>
          </Animated.View>
        )}

        <View style={{ height: 140 }} />
      </ScrollView>

      {/* Add group modal */}
      <Modal visible={showAdd} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: dark ? colors.dark.bgElevated : colors.light.bgElevated }]}>
            {/* Modal header */}
            <View style={styles.modalHeader}>
              <Text style={[typography.title3, { color: theme.text, flex: 1, textAlign: 'center' }]}>
                Новая группа
              </Text>
              <HapticPressable
                onPress={() => setShowAdd(false)}
                haptic="light"
                style={styles.modalClose}
              >
                <X size={20} color={theme.textSecondary} />
              </HapticPressable>
            </View>

            {/* Input fields */}
            <View style={[styles.modalInput, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
              <TextInput
                style={[styles.inputText, { color: theme.text }]}
                placeholder="Название группы *"
                placeholderTextColor={theme.textTertiary}
                value={newGroup.name}
                onChangeText={v => setNewGroup(g => ({ ...g, name: v }))}
              />
            </View>
            <View style={[styles.modalInput, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
              <TextInput
                style={[styles.inputText, { color: theme.text }]}
                placeholder="Расписание (Пн, Ср, Пт 18:00)"
                placeholderTextColor={theme.textTertiary}
                value={newGroup.schedule}
                onChangeText={v => setNewGroup(g => ({ ...g, schedule: v }))}
              />
            </View>
            <View style={[styles.modalInput, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
              <TextInput
                style={[styles.inputText, { color: theme.text }]}
                placeholder="Стоимость абонемента (руб)"
                placeholderTextColor={theme.textTertiary}
                keyboardType="numeric"
                value={newGroup.subscriptionCost}
                onChangeText={v => setNewGroup(g => ({ ...g, subscriptionCost: v }))}
              />
            </View>

            {/* Action buttons */}
            <View style={styles.modalBtns}>
              <GlowButton
                title="Отмена"
                onPress={() => setShowAdd(false)}
                variant="secondary"
                dark={dark}
                size="md"
                style={{ flex: 1 }}
              />
              <GlowButton
                title="Создать"
                onPress={handleAdd}
                disabled={saving}
                gradient={colors.gradients.brand}
                dark={dark}
                size="md"
                haptic="success"
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1 },
  content: { paddingHorizontal: spacing.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupCard: { marginBottom: spacing.sm },
  groupRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  groupIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 2 },
  groupRight: { alignItems: 'center', gap: spacing.sm },
  countBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.huge },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing.xxl,
    gap: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  modalClose: {
    position: 'absolute',
    right: 0,
    padding: spacing.xs,
  },
  modalInput: {
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  inputText: { fontSize: 15, fontWeight: '500', padding: 0 },
  modalBtns: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
});
