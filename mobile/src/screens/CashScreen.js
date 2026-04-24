import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, ScrollView, Pressable, Alert,
  Animated, StyleSheet, Dimensions,
} from 'react-native';
import {
  ArrowDownCircle, ArrowUpCircle, Trash2, Edit3,
  TrendingUp, TrendingDown, ChevronLeft, ChevronRight,
  BarChart3, Wallet, PieChart, Sparkles,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import PageHeader from '../components/PageHeader';
import GlassCard from '../components/GlassCard';
import Modal from '../components/Modal';

const MONTHS_RU = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const MONTHS_SHORT = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];

const EXPENSE_CATEGORIES = ['Аренда', 'Инвентарь', 'Зарплата', 'Реклама', 'Прочее'];

const CATEGORY_COLORS = {
  'Аренда': { bg: '#3b82f6', light: 'rgba(59,130,246,0.15)', text: '#3b82f6' },
  'Инвентарь': { bg: '#8b5cf6', light: 'rgba(139,92,246,0.15)', text: '#8b5cf6' },
  'Зарплата': { bg: '#f59e0b', light: 'rgba(245,158,11,0.15)', text: '#f59e0b' },
  'Реклама': { bg: '#ec4899', light: 'rgba(236,72,153,0.15)', text: '#ec4899' },
  'Прочее': { bg: '#6b7280', light: 'rgba(107,114,128,0.15)', text: '#6b7280' },
  'Абонемент': { bg: '#22c55e', light: 'rgba(34,197,94,0.15)', text: '#22c55e' },
};

function isExpired(dateStr) {
  if (!dateStr) return true;
  return new Date(dateStr) < new Date();
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function SuccessOverlay({ type, amount, onDone }) {
  const [opacity] = useState(new Animated.Value(0));
  const [scale] = useState(new Animated.Value(0.5));
  const isIncome = type === 'income';

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1.1, duration: 400, useNativeDriver: true }),
      ]).start(() => onDone());
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={{
        ...StyleSheet.absoluteFillObject,
        zIndex: 100,
        justifyContent: 'center',
        alignItems: 'center',
        opacity,
      }}
      pointerEvents="none"
    >
      <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' }} />
      <Animated.View style={{ alignItems: 'center', transform: [{ scale }] }}>
        <View
          style={{
            width: 80, height: 80, borderRadius: 40,
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: isIncome ? '#22c55e' : '#ef4444',
            shadowColor: isIncome ? '#22c55e' : '#ef4444',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.4,
            shadowRadius: 20,
            elevation: 10,
          }}
        >
          {isIncome
            ? <ArrowDownCircle size={36} color="#fff" />
            : <ArrowUpCircle size={36} color="#fff" />
          }
        </View>
        <Text style={{ marginTop: 16, fontSize: 30, fontWeight: '900', color: '#fff' }}>
          {isIncome ? '+' : '-'}{amount?.toLocaleString('ru-RU')} ₽
        </Text>
        <Text style={{ marginTop: 4, fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.6)' }}>
          {isIncome ? 'Доход записан' : 'Расход записан'}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

export default function CashScreen({ navigation }) {
  const { auth } = useAuth();
  const { data, addTransaction, updateTransaction, deleteTransaction, updateStudent } = useData();
  const { dark } = useTheme();

  const [showIncome, setShowIncome] = useState(false);
  const [showExpense, setShowExpense] = useState(false);
  const [editTx, setEditTx] = useState(null);
  const [expForm, setExpForm] = useState({ amount: '', category: EXPENSE_CATEGORIES[0], description: '' });
  const [successAnim, setSuccessAnim] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const myStudents = data.students.filter(s => s.trainerId === auth.userId);
  const myTx = data.transactions.filter(t => t.trainerId === auth.userId);
  const myGroups = data.groups.filter(g => g.trainerId === auth.userId);

  // Monthly data for chart
  const monthlyData = useMemo(() => {
    const incomeByMonth = new Array(12).fill(0);
    const expenseByMonth = new Array(12).fill(0);
    myTx.forEach(t => {
      const d = new Date(t.date);
      if (d.getFullYear() === selectedYear) {
        const m = d.getMonth();
        if (t.type === 'income') incomeByMonth[m] += t.amount;
        else expenseByMonth[m] += t.amount;
      }
    });
    return { income: incomeByMonth, expense: expenseByMonth };
  }, [myTx, selectedYear]);

  // Stats for selected month
  const monthStats = useMemo(() => {
    const monthTx = myTx.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
    const income = monthTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = monthTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, balance: income - expense, transactions: monthTx };
  }, [myTx, selectedMonth, selectedYear]);

  // Category breakdown for selected month
  const categoryBreakdown = useMemo(() => {
    const cats = {};
    monthStats.transactions.filter(t => t.type === 'expense').forEach(t => {
      cats[t.category] = (cats[t.category] || 0) + t.amount;
    });
    return Object.entries(cats).sort((a, b) => b[1] - a[1]);
  }, [monthStats]);

  // Total stats (all time)
  const totalStats = useMemo(() => {
    const income = myTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = myTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [myTx]);

  // Filtered transactions for list
  const filteredTx = useMemo(() => {
    let txs = monthStats.transactions;
    if (activeTab === 'income') txs = txs.filter(t => t.type === 'income');
    if (activeTab === 'expense') txs = txs.filter(t => t.type === 'expense');
    return [...txs].reverse();
  }, [monthStats, activeTab]);

  const sortedStudents = useMemo(() =>
    [...myStudents].sort((a, b) => {
      const aDebt = isExpired(a.subscriptionExpiresAt) ? 0 : 1;
      const bDebt = isExpired(b.subscriptionExpiresAt) ? 0 : 1;
      return aDebt - bDebt;
    }),
  [myStudents]);

  const handlePayment = (student) => {
    const group = myGroups.find(g => g.id === student.groupId);
    const amount = group?.subscriptionCost || 5000;
    const expired = isExpired(student.subscriptionExpiresAt);
    let baseDate = expired ? new Date() : new Date(student.subscriptionExpiresAt);
    baseDate.setMonth(baseDate.getMonth() + 1);
    updateStudent(student.id, { subscriptionExpiresAt: baseDate.toISOString() });
    addTransaction({
      trainerId: auth.userId,
      type: 'income',
      amount,
      category: 'Абонемент',
      description: `Оплата — ${student.name}`,
      studentId: student.id,
    });
    setShowIncome(false);
    setSuccessAnim({ type: 'income', amount });
  };

  const handleExpense = () => {
    const amount = parseInt(expForm.amount);
    if (!amount || amount <= 0) return;
    addTransaction({
      trainerId: auth.userId,
      type: 'expense',
      amount,
      category: expForm.category,
      description: expForm.description || expForm.category,
      studentId: null,
    });
    setShowExpense(false);
    setSuccessAnim({ type: 'expense', amount });
    setExpForm({ amount: '', category: EXPENSE_CATEGORIES[0], description: '' });
  };

  const handleEditSave = () => {
    const amount = parseInt(editTx.amount);
    if (!amount || amount <= 0) return;
    updateTransaction(editTx.id, {
      amount,
      category: editTx.category,
      description: editTx.description,
    });
    setEditTx(null);
  };

  const prevMonth = () => {
    if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1); }
    else setSelectedMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1); }
    else setSelectedMonth(m => m + 1);
  };

  const maxChartVal = Math.max(...monthlyData.income, ...monthlyData.expense, 1);

  const inputStyle = {
    width: '100%', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, fontSize: 16,
    backgroundColor: dark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)',
    color: dark ? '#fff' : '#111',
  };

  return (
    <View style={{ flex: 1, backgroundColor: dark ? '#050505' : '#f5f5f7' }}>
      <PageHeader title="Касса" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 128, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* === BALANCE HERO CARD === */}
        <View
          style={{
            borderRadius: 24, overflow: 'hidden',
            backgroundColor: dark ? 'rgba(99,102,241,0.12)' : 'rgba(238,242,255,1)',
            borderWidth: 1,
            borderColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.7)',
          }}
        >
          <View style={{ padding: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <View
                style={{
                  width: 36, height: 36, borderRadius: 12,
                  alignItems: 'center', justifyContent: 'center',
                  backgroundColor: '#6366f1',
                }}
              >
                <Wallet size={17} color="#fff" />
              </View>
              <Text style={{ fontSize: 10, textTransform: 'uppercase', fontWeight: '700', letterSpacing: 2, color: dark ? 'rgba(255,255,255,0.35)' : '#9ca3af' }}>
                Общий баланс
              </Text>
            </View>
            <Text style={{ fontSize: 30, fontWeight: '900', marginTop: 8, color: totalStats.balance >= 0 ? '#22c55e' : '#dc2626' }}>
              {totalStats.balance.toLocaleString('ru-RU')} ₽
            </Text>
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 20, height: 20, borderRadius: 8, backgroundColor: 'rgba(34,197,94,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={11} color="#22c55e" />
                </View>
                <Text style={{ color: '#22c55e', fontSize: 14, fontWeight: '600' }}>
                  +{totalStats.income.toLocaleString('ru-RU')} ₽
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 20, height: 20, borderRadius: 8, backgroundColor: 'rgba(239,68,68,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingDown size={11} color="#f87171" />
                </View>
                <Text style={{ color: '#f87171', fontSize: 14, fontWeight: '600' }}>
                  -{totalStats.expense.toLocaleString('ru-RU')} ₽
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* === ACTION BUTTONS === */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Pressable
            onPress={() => setShowIncome(true)}
            style={({ pressed }) => ({
              flex: 1, paddingVertical: 14, borderRadius: 18,
              backgroundColor: '#22c55e',
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.96 : 1 }],
              shadowColor: '#22c55e', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
            })}
          >
            <ArrowDownCircle size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Доход</Text>
          </Pressable>
          <Pressable
            onPress={() => setShowExpense(true)}
            style={({ pressed }) => ({
              flex: 1, paddingVertical: 14, borderRadius: 18,
              backgroundColor: '#ef4444',
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.96 : 1 }],
              shadowColor: '#ef4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
            })}
          >
            <ArrowUpCircle size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Расход</Text>
          </Pressable>
        </View>

        {/* === MONTH SELECTOR === */}
        <View
          style={{
            borderRadius: 20, padding: 16,
            backgroundColor: dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)',
            borderWidth: 1,
            borderColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.6)',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Pressable onPress={prevMonth} style={({ pressed }) => ({ padding: 6, borderRadius: 12, opacity: pressed ? 0.6 : 1 })}>
              <ChevronLeft size={18} color={dark ? 'rgba(255,255,255,0.4)' : '#9ca3af'} />
            </Pressable>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontWeight: '900', fontSize: 16, color: dark ? '#fff' : '#111' }}>
                {MONTHS_RU[selectedMonth]}
              </Text>
              <Text style={{ fontSize: 10, fontWeight: '600', color: dark ? 'rgba(255,255,255,0.25)' : '#9ca3af' }}>
                {selectedYear}
              </Text>
            </View>
            <Pressable onPress={nextMonth} style={({ pressed }) => ({ padding: 6, borderRadius: 12, opacity: pressed ? 0.6 : 1 })}>
              <ChevronRight size={18} color={dark ? 'rgba(255,255,255,0.4)' : '#9ca3af'} />
            </Pressable>
          </View>

          {/* Month stats pills */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            <View style={{ flex: 1, borderRadius: 14, padding: 10, alignItems: 'center', backgroundColor: dark ? 'rgba(34,197,94,0.1)' : 'rgba(240,253,244,1)' }}>
              <Text style={{ color: '#22c55e', fontSize: 14, fontWeight: '900' }}>
                +{monthStats.income.toLocaleString('ru-RU')}
              </Text>
              <Text style={{ fontSize: 8, textTransform: 'uppercase', fontWeight: '700', color: dark ? 'rgba(255,255,255,0.2)' : '#9ca3af' }}>
                Доход
              </Text>
            </View>
            <View style={{ flex: 1, borderRadius: 14, padding: 10, alignItems: 'center', backgroundColor: dark ? 'rgba(239,68,68,0.1)' : 'rgba(254,242,242,1)' }}>
              <Text style={{ color: '#f87171', fontSize: 14, fontWeight: '900' }}>
                -{monthStats.expense.toLocaleString('ru-RU')}
              </Text>
              <Text style={{ fontSize: 8, textTransform: 'uppercase', fontWeight: '700', color: dark ? 'rgba(255,255,255,0.2)' : '#9ca3af' }}>
                Расход
              </Text>
            </View>
            <View style={{ flex: 1, borderRadius: 14, padding: 10, alignItems: 'center', backgroundColor: dark ? 'rgba(99,102,241,0.1)' : 'rgba(238,242,255,1)' }}>
              <Text style={{ color: monthStats.balance >= 0 ? '#818cf8' : '#f87171', fontSize: 14, fontWeight: '900' }}>
                {monthStats.balance >= 0 ? '+' : ''}{monthStats.balance.toLocaleString('ru-RU')}
              </Text>
              <Text style={{ fontSize: 8, textTransform: 'uppercase', fontWeight: '700', color: dark ? 'rgba(255,255,255,0.2)' : '#9ca3af' }}>
                Итого
              </Text>
            </View>
          </View>

          {/* Mini bar chart */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 64 }}>
            {monthlyData.income.map((val, i) => {
              const height = maxChartVal > 0 ? Math.max((val / maxChartVal) * 100, 4) : 4;
              const isCurrentMonth = i === new Date().getMonth();
              return (
                <View key={i} style={{ flex: 1, alignItems: 'center', gap: 2 }}>
                  <View
                    style={{
                      width: '100%', borderTopLeftRadius: 4, borderTopRightRadius: 4,
                      height: `${height}%`, minHeight: 2,
                      backgroundColor: isCurrentMonth
                        ? '#dc2626'
                        : val > 0
                          ? (dark ? 'rgba(255,255,255,0.15)' : 'rgba(209,213,219,0.6)')
                          : (dark ? 'rgba(255,255,255,0.05)' : 'rgba(243,244,246,1)'),
                    }}
                  />
                  <Text style={{
                    fontSize: 7, fontWeight: isCurrentMonth ? '700' : '500',
                    color: isCurrentMonth ? '#dc2626' : (dark ? 'rgba(255,255,255,0.2)' : '#d1d5db'),
                  }}>
                    {MONTHS_SHORT[i]}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* === CATEGORY BREAKDOWN === */}
        {categoryBreakdown.length > 0 && (
          <View
            style={{
              borderRadius: 20, padding: 16,
              backgroundColor: dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)',
              borderWidth: 1,
              borderColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.6)',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <PieChart size={14} color={dark ? 'rgba(255,255,255,0.3)' : '#9ca3af'} />
              <Text style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: '700', letterSpacing: 1, color: dark ? 'rgba(255,255,255,0.3)' : '#9ca3af' }}>
                Расходы по категориям
              </Text>
            </View>
            {/* Progress bar */}
            <View style={{ flexDirection: 'row', borderRadius: 999, overflow: 'hidden', height: 8, marginBottom: 12 }}>
              {categoryBreakdown.map(([cat, amount]) => {
                const colors = CATEGORY_COLORS[cat] || CATEGORY_COLORS['Прочее'];
                const pct = monthStats.expense > 0 ? (amount / monthStats.expense) * 100 : 0;
                return (
                  <View
                    key={cat}
                    style={{ width: `${pct}%`, backgroundColor: colors.bg }}
                  />
                );
              })}
            </View>
            <View style={{ gap: 8 }}>
              {categoryBreakdown.map(([cat, amount]) => {
                const colors = CATEGORY_COLORS[cat] || CATEGORY_COLORS['Прочее'];
                const pct = monthStats.expense > 0 ? Math.round((amount / monthStats.expense) * 100) : 0;
                return (
                  <View key={cat} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.bg }} />
                      <Text style={{ fontSize: 14, color: dark ? 'rgba(255,255,255,0.6)' : '#4b5563' }}>
                        {cat}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontSize: 12, fontWeight: '500', color: dark ? 'rgba(255,255,255,0.3)' : '#9ca3af' }}>
                        {pct}%
                      </Text>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: dark ? '#fff' : '#111' }}>
                        {amount.toLocaleString('ru-RU')} ₽
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* === TRANSACTION HISTORY === */}
        <View>
          {/* Tabs */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 }}>
            {[
              { id: 'all', label: 'Все' },
              { id: 'income', label: 'Доходы' },
              { id: 'expense', label: 'Расходы' },
            ].map(t => (
              <Pressable
                key={t.id}
                onPress={() => setActiveTab(t.id)}
                style={({ pressed }) => ({
                  paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999,
                  backgroundColor: activeTab === t.id
                    ? (dark ? 'rgba(255,255,255,0.15)' : '#111')
                    : 'transparent',
                  opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.96 : 1 }],
                })}
              >
                <Text style={{
                  fontSize: 12, fontWeight: '700',
                  color: activeTab === t.id
                    ? '#fff'
                    : (dark ? 'rgba(255,255,255,0.3)' : '#9ca3af'),
                }}>
                  {t.label}
                </Text>
              </Pressable>
            ))}
            <Text style={{ marginLeft: 'auto', fontSize: 12, fontWeight: '500', color: dark ? 'rgba(255,255,255,0.2)' : '#d1d5db' }}>
              {filteredTx.length} записей
            </Text>
          </View>

          <View style={{ gap: 8 }}>
            {filteredTx.map((tx) => {
              const colors = CATEGORY_COLORS[tx.category] || CATEGORY_COLORS['Прочее'];
              return (
                <View
                  key={tx.id}
                  style={{
                    borderRadius: 16, padding: 14,
                    backgroundColor: dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)',
                    borderWidth: 1,
                    borderColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.6)',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View
                      style={{
                        width: 40, height: 40, borderRadius: 14,
                        alignItems: 'center', justifyContent: 'center',
                        backgroundColor: tx.type === 'income'
                          ? 'rgba(34,197,94,0.15)'
                          : colors.light,
                      }}
                    >
                      {tx.type === 'income'
                        ? <ArrowDownCircle size={18} color="#22c55e" />
                        : <ArrowUpCircle size={18} color={colors.text} />
                      }
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text numberOfLines={1} style={{ fontWeight: '600', fontSize: 14, color: dark ? '#fff' : '#111' }}>
                        {tx.description}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: colors.light }}>
                          <Text style={{ fontSize: 9, fontWeight: '700', textTransform: 'uppercase', color: colors.text }}>
                            {tx.category}
                          </Text>
                        </View>
                        <Text style={{ fontSize: 11, color: dark ? 'rgba(255,255,255,0.25)' : '#9ca3af' }}>
                          {formatDate(tx.date)}
                        </Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <Text style={{ fontWeight: '900', fontSize: 14, color: tx.type === 'income' ? '#22c55e' : '#f87171' }}>
                        {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString('ru-RU')} ₽
                      </Text>
                      <Pressable
                        onPress={() => setEditTx({ ...tx })}
                        style={({ pressed }) => ({ padding: 6, borderRadius: 8, opacity: pressed ? 0.6 : 1 })}
                      >
                        <Edit3 size={13} color={dark ? 'rgba(255,255,255,0.25)' : '#9ca3af'} />
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          Alert.alert('Удалить', 'Удалить эту транзакцию?', [
                            { text: 'Отмена', style: 'cancel' },
                            { text: 'Удалить', style: 'destructive', onPress: () => deleteTransaction(tx.id) },
                          ]);
                        }}
                        style={({ pressed }) => ({ padding: 6, borderRadius: 8, opacity: pressed ? 0.6 : 1 })}
                      >
                        <Trash2 size={13} color="rgba(248,113,113,0.6)" />
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })}
            {filteredTx.length === 0 && (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <BarChart3 size={32} color={dark ? 'rgba(255,255,255,0.2)' : '#d1d5db'} style={{ marginBottom: 8, opacity: 0.5 }} />
                <Text style={{ fontSize: 14, fontWeight: '500', color: dark ? 'rgba(255,255,255,0.2)' : '#d1d5db' }}>
                  Нет транзакций
                </Text>
                <Text style={{ fontSize: 12, marginTop: 2, color: dark ? 'rgba(255,255,255,0.15)' : '#e5e7eb' }}>
                  за {MONTHS_RU[selectedMonth].toLowerCase()} {selectedYear}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Income Modal */}
      <Modal open={showIncome} onClose={() => setShowIncome(false)} title="Принять оплату">
        <View style={{ gap: 8 }}>
          {sortedStudents.map(s => {
            const expired = isExpired(s.subscriptionExpiresAt);
            const group = myGroups.find(g => g.id === s.groupId);
            return (
              <Pressable
                key={s.id}
                onPress={() => handlePayment(s)}
                style={({ pressed }) => ({
                  borderRadius: 16, padding: 14,
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  backgroundColor: dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.6)',
                  borderWidth: 1,
                  borderColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.5)',
                  opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.96 : 1 }],
                })}
              >
                <View>
                  <Text style={{ fontWeight: '600', fontSize: 14, color: dark ? '#fff' : '#111' }}>
                    {s.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: dark ? 'rgba(255,255,255,0.3)' : '#9ca3af', marginTop: 2 }}>
                    {group?.name || 'Без группы'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {expired && (
                    <View style={{ backgroundColor: 'rgba(239,68,68,0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 }}>
                      <Text style={{ fontSize: 9, fontWeight: '700', textTransform: 'uppercase', color: '#f87171' }}>
                        Долг
                      </Text>
                    </View>
                  )}
                  <Text style={{ fontSize: 14, fontWeight: '900', color: '#22c55e' }}>
                    {(group?.subscriptionCost || 5000).toLocaleString('ru-RU')} ₽
                  </Text>
                </View>
              </Pressable>
            );
          })}
          {sortedStudents.length === 0 && (
            <Text style={{ textAlign: 'center', paddingVertical: 24, fontSize: 14, color: dark ? 'rgba(255,255,255,0.3)' : '#6b7280' }}>
              Нет учеников
            </Text>
          )}
        </View>
      </Modal>

      {/* Expense Modal */}
      <Modal open={showExpense} onClose={() => setShowExpense(false)} title="Добавить расход">
        <View style={{ gap: 12 }}>
          <TextInput
            placeholder="Сумма (₽)"
            placeholderTextColor={dark ? 'rgba(255,255,255,0.25)' : '#9ca3af'}
            value={expForm.amount}
            onChangeText={v => setExpForm(f => ({ ...f, amount: v }))}
            keyboardType="numeric"
            style={inputStyle}
          />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {EXPENSE_CATEGORIES.map(c => {
              const colors = CATEGORY_COLORS[c];
              const active = expForm.category === c;
              return (
                <Pressable
                  key={c}
                  onPress={() => setExpForm(f => ({ ...f, category: c }))}
                  style={({ pressed }) => ({
                    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12,
                    backgroundColor: active ? colors.bg : (dark ? 'rgba(255,255,255,0.06)' : '#f3f4f6'),
                    borderWidth: active ? 0 : 1,
                    borderColor: dark ? 'rgba(255,255,255,0.06)' : 'transparent',
                    opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.96 : 1 }],
                  })}
                >
                  <Text style={{
                    fontSize: 12, fontWeight: '700',
                    color: active ? '#fff' : (dark ? 'rgba(255,255,255,0.5)' : '#6b7280'),
                  }}>
                    {c}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <TextInput
            placeholder="Описание (необязательно)"
            placeholderTextColor={dark ? 'rgba(255,255,255,0.25)' : '#9ca3af'}
            value={expForm.description}
            onChangeText={v => setExpForm(f => ({ ...f, description: v }))}
            style={inputStyle}
          />
          <Pressable
            onPress={handleExpense}
            style={({ pressed }) => ({
              width: '100%', paddingVertical: 14, borderRadius: 16,
              backgroundColor: '#ef4444', alignItems: 'center',
              opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.96 : 1 }],
              shadowColor: '#ef4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
            })}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Сохранить</Text>
          </Pressable>
        </View>
      </Modal>

      {/* Edit Transaction Modal */}
      <Modal open={!!editTx} onClose={() => setEditTx(null)} title="Редактировать">
        {editTx && (
          <View style={{ gap: 12 }}>
            <TextInput
              placeholder="Сумма"
              placeholderTextColor={dark ? 'rgba(255,255,255,0.25)' : '#9ca3af'}
              value={String(editTx.amount)}
              onChangeText={v => setEditTx(t => ({ ...t, amount: v }))}
              keyboardType="numeric"
              style={inputStyle}
            />
            <TextInput
              placeholder="Описание"
              placeholderTextColor={dark ? 'rgba(255,255,255,0.25)' : '#9ca3af'}
              value={editTx.description}
              onChangeText={v => setEditTx(t => ({ ...t, description: v }))}
              style={inputStyle}
            />
            <Pressable
              onPress={handleEditSave}
              style={({ pressed }) => ({
                width: '100%', paddingVertical: 14, borderRadius: 16,
                backgroundColor: '#6366f1', alignItems: 'center',
                opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.96 : 1 }],
                shadowColor: '#6366f1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
              })}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Сохранить</Text>
            </Pressable>
          </View>
        )}
      </Modal>

      {/* Success Animation Overlay */}
      {successAnim && (
        <SuccessOverlay
          type={successAnim.type}
          amount={successAnim.amount}
          onDone={() => setSuccessAnim(null)}
        />
      )}
    </View>
  );
}
