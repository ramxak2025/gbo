/**
 * CashScreen — iOS 26 Liquid Glass redesign
 *
 * - AmbientBackground + balance hero card
 * - Wallet icon in LinearGradient circle
 * - Gradient action buttons (income green, expense red)
 * - Month navigation with animated chevrons
 * - Stats pills + transaction cards with LiquidGlassCard
 * - Staggered entrance animations
 */
import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TextInput, Modal, StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Wallet, TrendingUp, TrendingDown, ChevronLeft, ChevronRight,
  PlusCircle, ArrowDownCircle, ArrowUpCircle, Trash2, X,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { LiquidGlassCard, HapticPressable, AmbientBackground, GlowButton } from '../design';
import { colors, radius, spacing, typography } from '../design/tokens';

const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

export default function CashScreen() {
  const { auth } = useAuth();
  const { data, addTransaction, deleteTransaction } = useData();
  const { t, dark } = useTheme();

  const theme = dark ? colors.dark : colors.light;

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showAdd, setShowAdd] = useState(false);
  const [newTx, setNewTx] = useState({ type: 'income', amount: '', category: '', description: '' });
  const [saving, setSaving] = useState(false);

  const myTx = useMemo(() => {
    return data.transactions
      .filter(tx => {
        const d = new Date(tx.date);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [data.transactions, selectedMonth, selectedYear]);

  const income = myTx.filter(tx => tx.type === 'income').reduce((s, tx) => s + Number(tx.amount), 0);
  const expense = myTx.filter(tx => tx.type === 'expense').reduce((s, tx) => s + Number(tx.amount), 0);
  const balance = income - expense;

  const handleAdd = async () => {
    if (!newTx.amount) return;
    setSaving(true);
    try {
      await addTransaction({
        type: newTx.type,
        amount: Number(newTx.amount),
        category: newTx.category || (newTx.type === 'income' ? 'Абонемент' : 'Прочее'),
        description: newTx.description,
        date: new Date().toISOString().slice(0, 10),
      });
      setShowAdd(false);
      setNewTx({ type: 'income', amount: '', category: '', description: '' });
    } catch {}
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try { await deleteTransaction(id); } catch {}
  };

  const prevMonth = () => {
    if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1); }
    else setSelectedMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1); }
    else setSelectedMonth(m => m + 1);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <AmbientBackground dark={dark} variant="warm" />

      <ScrollView
        contentContainerStyle={{ paddingTop: 60, paddingBottom: 140, paddingHorizontal: spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.duration(400)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl }}>
          <Text style={{ ...typography.hero, color: theme.text }}>Касса</Text>
          <HapticPressable onPress={() => setShowAdd(true)} haptic="medium">
            <LinearGradient
              colors={colors.gradients.brand}
              style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
            >
              <PlusCircle size={22} color="#fff" />
            </LinearGradient>
          </HapticPressable>
        </Animated.View>

        {/* Balance Hero Card */}
        <Animated.View entering={FadeInDown.springify().damping(15).mass(0.8)}>
          <LiquidGlassCard dark={dark} radius={radius.xxl} padding={spacing.xl} intensity="strong">
            <View style={{ alignItems: 'center' }}>
              <LinearGradient
                colors={['#6366f1', '#8b5cf6', '#a855f7']}
                style={{ width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md }}
              >
                <Wallet size={28} color="#fff" strokeWidth={2.5} />
              </LinearGradient>
              <Text style={{ ...typography.micro, color: theme.textTertiary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.xs }}>
                Баланс за месяц
              </Text>
              <Text style={{
                ...typography.hero,
                color: balance >= 0 ? '#22c55e' : '#ef4444',
              }}>
                {balance.toLocaleString('ru-RU')} ₽
              </Text>
            </View>
          </LiquidGlassCard>
        </Animated.View>

        {/* Month navigation */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={{ marginTop: spacing.lg }}>
          <LiquidGlassCard dark={dark} radius={radius.lg} padding={spacing.md} intensity="subtle">
            <View style={styles.monthRow}>
              <HapticPressable onPress={prevMonth} haptic="light" style={styles.chevronBtn}>
                <ChevronLeft size={22} color={theme.textSecondary} />
              </HapticPressable>
              <Text style={{ ...typography.bodyBold, color: theme.text }}>
                {MONTHS[selectedMonth]} {selectedYear}
              </Text>
              <HapticPressable onPress={nextMonth} haptic="light" style={styles.chevronBtn}>
                <ChevronRight size={22} color={theme.textSecondary} />
              </HapticPressable>
            </View>
          </LiquidGlassCard>
        </Animated.View>

        {/* Stats pills */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={{ marginTop: spacing.md, flexDirection: 'row', gap: spacing.sm }}>
          {/* Income pill */}
          <View style={{ flex: 1 }}>
            <LiquidGlassCard dark={dark} radius={radius.lg} padding={spacing.md}>
              <View style={{ alignItems: 'center', gap: spacing.xs }}>
                <LinearGradient
                  colors={['#22c55e', '#10b981']}
                  style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}
                >
                  <TrendingUp size={18} color="#fff" />
                </LinearGradient>
                <Text style={{ fontSize: 17, fontWeight: '800', color: '#22c55e' }}>
                  +{income.toLocaleString('ru-RU')}
                </Text>
                <Text style={{ ...typography.micro, color: theme.textTertiary }}>Доход</Text>
              </View>
            </LiquidGlassCard>
          </View>

          {/* Expense pill */}
          <View style={{ flex: 1 }}>
            <LiquidGlassCard dark={dark} radius={radius.lg} padding={spacing.md}>
              <View style={{ alignItems: 'center', gap: spacing.xs }}>
                <LinearGradient
                  colors={['#ef4444', '#dc2626']}
                  style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}
                >
                  <TrendingDown size={18} color="#fff" />
                </LinearGradient>
                <Text style={{ fontSize: 17, fontWeight: '800', color: '#ef4444' }}>
                  -{expense.toLocaleString('ru-RU')}
                </Text>
                <Text style={{ ...typography.micro, color: theme.textTertiary }}>Расход</Text>
              </View>
            </LiquidGlassCard>
          </View>
        </Animated.View>

        {/* Action buttons */}
        <Animated.View entering={FadeInDown.delay(250).springify()} style={{ marginTop: spacing.md, flexDirection: 'row', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <HapticPressable
              onPress={() => { setNewTx(v => ({ ...v, type: 'income' })); setShowAdd(true); }}
              haptic="medium"
            >
              <LinearGradient
                colors={['#22c55e', '#10b981']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionBtn}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0)']}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 0.7 }}
                  style={StyleSheet.absoluteFill}
                  pointerEvents="none"
                />
                <ArrowDownCircle size={20} color="#fff" />
                <Text style={styles.actionBtnText}>Доход</Text>
              </LinearGradient>
            </HapticPressable>
          </View>
          <View style={{ flex: 1 }}>
            <HapticPressable
              onPress={() => { setNewTx(v => ({ ...v, type: 'expense' })); setShowAdd(true); }}
              haptic="medium"
            >
              <LinearGradient
                colors={['#ef4444', '#dc2626']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionBtn}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0)']}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 0.7 }}
                  style={StyleSheet.absoluteFill}
                  pointerEvents="none"
                />
                <ArrowUpCircle size={20} color="#fff" />
                <Text style={styles.actionBtnText}>Расход</Text>
              </LinearGradient>
            </HapticPressable>
          </View>
        </Animated.View>

        {/* Transactions */}
        <Animated.View entering={FadeIn.delay(300)} style={{ marginTop: spacing.xl }}>
          <Text style={{ ...typography.micro, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.md, paddingHorizontal: spacing.xs }}>
            Операции
          </Text>
        </Animated.View>

        <View style={{ gap: spacing.sm }}>
          {myTx.map((tx, i) => (
            <Animated.View key={tx.id} entering={FadeInDown.delay(350 + i * 50).springify()}>
              <LiquidGlassCard dark={dark} radius={radius.lg} padding={spacing.lg}>
                <View style={styles.txRow}>
                  <LinearGradient
                    colors={tx.type === 'income' ? ['#22c55e', '#10b981'] : ['#ef4444', '#dc2626']}
                    style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
                  >
                    {tx.type === 'income'
                      ? <ArrowDownCircle size={20} color="#fff" />
                      : <ArrowUpCircle size={20} color="#fff" />
                    }
                  </LinearGradient>
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={{ ...typography.callout, color: theme.text }}>{tx.category || '—'}</Text>
                    {tx.description ? (
                      <Text style={{ ...typography.caption, color: theme.textTertiary, marginTop: 2 }}>{tx.description}</Text>
                    ) : null}
                  </View>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '800',
                    color: tx.type === 'income' ? '#22c55e' : '#ef4444',
                    marginRight: spacing.sm,
                  }}>
                    {tx.type === 'income' ? '+' : '-'}{Number(tx.amount).toLocaleString('ru-RU')}
                  </Text>
                  <HapticPressable
                    onPress={() => handleDelete(tx.id)}
                    haptic="light"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Trash2 size={16} color={theme.textTertiary} />
                  </HapticPressable>
                </View>
              </LiquidGlassCard>
            </Animated.View>
          ))}
        </View>

        {myTx.length === 0 && (
          <Animated.View entering={FadeIn.delay(300)}>
            <Text style={{ textAlign: 'center', paddingVertical: spacing.xxxl, ...typography.body, color: theme.textTertiary }}>
              Нет операций за этот месяц
            </Text>
          </Animated.View>
        )}

        {/* Add modal */}
        <Modal visible={showAdd} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: dark ? colors.dark.bgElevated : colors.light.bgElevated }]}>
              {/* Modal header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg }}>
                <Text style={{ ...typography.title3, color: theme.text }}>Новая операция</Text>
                <HapticPressable onPress={() => setShowAdd(false)} haptic="light">
                  <View style={{
                    width: 32, height: 32, borderRadius: 16,
                    backgroundColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <X size={16} color={theme.textSecondary} />
                  </View>
                </HapticPressable>
              </View>

              {/* Type selector */}
              <View style={[styles.typeRow, {
                backgroundColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                borderRadius: radius.md,
                padding: spacing.xs,
              }]}>
                {[
                  { key: 'income', label: 'Доход', gradient: ['#22c55e', '#10b981'] },
                  { key: 'expense', label: 'Расход', gradient: ['#ef4444', '#dc2626'] },
                ].map(({ key, label, gradient }) => (
                  <HapticPressable
                    key={key}
                    onPress={() => setNewTx(v => ({ ...v, type: key }))}
                    haptic="selection"
                    style={{ flex: 1 }}
                  >
                    {newTx.type === key ? (
                      <LinearGradient
                        colors={gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ paddingVertical: 10, borderRadius: radius.sm, alignItems: 'center' }}
                      >
                        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>{label}</Text>
                      </LinearGradient>
                    ) : (
                      <View style={{ paddingVertical: 10, borderRadius: radius.sm, alignItems: 'center' }}>
                        <Text style={{ color: theme.textTertiary, fontWeight: '600', fontSize: 14 }}>{label}</Text>
                      </View>
                    )}
                  </HapticPressable>
                ))}
              </View>

              {/* Inputs */}
              <TextInput
                style={[styles.modalInput, {
                  backgroundColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  borderColor: theme.border,
                  color: theme.text,
                }]}
                placeholder="Сумма"
                placeholderTextColor={theme.textTertiary}
                keyboardType="numeric"
                value={newTx.amount}
                onChangeText={v => setNewTx(n => ({ ...n, amount: v }))}
              />
              <TextInput
                style={[styles.modalInput, {
                  backgroundColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  borderColor: theme.border,
                  color: theme.text,
                }]}
                placeholder="Категория"
                placeholderTextColor={theme.textTertiary}
                value={newTx.category}
                onChangeText={v => setNewTx(n => ({ ...n, category: v }))}
              />
              <TextInput
                style={[styles.modalInput, {
                  backgroundColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  borderColor: theme.border,
                  color: theme.text,
                }]}
                placeholder="Описание"
                placeholderTextColor={theme.textTertiary}
                value={newTx.description}
                onChangeText={v => setNewTx(n => ({ ...n, description: v }))}
              />

              {/* Modal buttons */}
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
                <View style={{ flex: 1 }}>
                  <GlowButton
                    title="Отмена"
                    onPress={() => setShowAdd(false)}
                    variant="secondary"
                    dark={dark}
                    haptic="light"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <GlowButton
                    title="Добавить"
                    onPress={handleAdd}
                    disabled={saving}
                    loading={saving}
                    gradient={newTx.type === 'income' ? ['#22c55e', '#10b981', '#059669'] : ['#ef4444', '#dc2626', '#b91c1c']}
                    haptic="success"
                  />
                </View>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chevronBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  txRow: { flexDirection: 'row', alignItems: 'center' },
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
  typeRow: { flexDirection: 'row', gap: spacing.xs },
  modalInput: {
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 15,
    fontWeight: '500',
  },
});
