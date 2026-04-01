import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  RefreshControl, Animated, Dimensions, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { getColors } from '../utils/theme';
import GlassCard from '../components/GlassCard';
import Modal from '../components/Modal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'subscription', label: 'Абонемент', icon: 'card-outline', type: 'income' },
  { id: 'single', label: 'Разовое', icon: 'receipt-outline', type: 'income' },
  { id: 'uniform', label: 'Форма', icon: 'shirt-outline', type: 'income' },
  { id: 'equipment', label: 'Экипировка', icon: 'shield-outline', type: 'income' },
  { id: 'rent', label: 'Аренда', icon: 'home-outline', type: 'expense' },
  { id: 'salary', label: 'Зарплата', icon: 'people-outline', type: 'expense' },
  { id: 'other', label: 'Прочее', icon: 'ellipsis-horizontal-outline', type: 'both' },
];

const FILTER_TABS = [
  { id: 'all', label: 'Все' },
  { id: 'income', label: 'Доходы' },
  { id: 'expense', label: 'Расходы' },
];

const MONTHS_RU = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

function formatMoney(amount) {
  const num = Math.abs(Number(amount) || 0);
  return num.toLocaleString('ru-RU') + ' \u20BD';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function getCategoryLabel(categoryId) {
  return CATEGORIES.find(c => c.id === categoryId)?.label || categoryId || 'Прочее';
}

function getCategoryIcon(categoryId) {
  return CATEGORIES.find(c => c.id === categoryId)?.icon || 'ellipsis-horizontal-outline';
}

export default function CashScreen() {
  const { dark } = useTheme();
  const { auth } = useAuth();
  const { data, loading, reload, addTransaction } = useData();
  const c = getColors(dark);

  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [incomeModalVisible, setIncomeModalVisible] = useState(false);
  const [expenseModalVisible, setExpenseModalVisible] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  // Income form
  const [incStudentId, setIncStudentId] = useState(null);
  const [incAmount, setIncAmount] = useState('');
  const [incCategory, setIncCategory] = useState('subscription');
  const [incNote, setIncNote] = useState('');
  const [studentSearch, setStudentSearch] = useState('');

  // Expense form
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState('rent');
  const [expNote, setExpNote] = useState('');

  const successAnim = useRef(new Animated.Value(0)).current;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const transactions = useMemo(() => {
    return (data.transactions || []).sort((a, b) =>
      new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
    );
  }, [data.transactions]);

  const monthlyTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date || t.createdAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  }, [transactions, currentMonth, currentYear]);

  const totalIncome = useMemo(() =>
    monthlyTransactions.filter(t => t.type === 'income').reduce((s, t) => s + (Number(t.amount) || 0), 0),
    [monthlyTransactions]
  );

  const totalExpense = useMemo(() =>
    monthlyTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + (Number(t.amount) || 0), 0),
    [monthlyTransactions]
  );

  const balance = totalIncome - totalExpense;

  const categoryBreakdown = useMemo(() => {
    const map = {};
    monthlyTransactions.forEach(t => {
      const cat = t.category || 'other';
      if (!map[cat]) map[cat] = { income: 0, expense: 0 };
      if (t.type === 'income') map[cat].income += Number(t.amount) || 0;
      else map[cat].expense += Number(t.amount) || 0;
    });
    return Object.entries(map).map(([cat, vals]) => ({ category: cat, ...vals }))
      .sort((a, b) => (b.income + b.expense) - (a.income + a.expense));
  }, [monthlyTransactions]);

  // Mini bar chart data: last 6 months
  const barData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const m = new Date(currentYear, currentMonth - i, 1);
      const month = m.getMonth();
      const year = m.getFullYear();
      const txs = transactions.filter(t => {
        const d = new Date(t.date || t.createdAt);
        return d.getMonth() === month && d.getFullYear() === year;
      });
      const inc = txs.filter(t => t.type === 'income').reduce((s, t) => s + (Number(t.amount) || 0), 0);
      const exp = txs.filter(t => t.type === 'expense').reduce((s, t) => s + (Number(t.amount) || 0), 0);
      months.push({ label: MONTHS_RU[month].slice(0, 3), income: inc, expense: exp });
    }
    return months;
  }, [transactions, currentMonth, currentYear]);

  const maxBarValue = useMemo(() => {
    return Math.max(...barData.map(b => Math.max(b.income, b.expense)), 1);
  }, [barData]);

  const filteredTransactions = useMemo(() => {
    if (filter === 'all') return transactions;
    return transactions.filter(t => t.type === filter);
  }, [transactions, filter]);

  const students = useMemo(() => {
    const list = data.students || [];
    if (!studentSearch.trim()) return list;
    const q = studentSearch.toLowerCase();
    return list.filter(s => (s.name || '').toLowerCase().includes(q));
  }, [data.students, studentSearch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }, [reload]);

  const showSuccessOverlay = useCallback(() => {
    setShowSuccess(true);
    successAnim.setValue(0);
    Animated.sequence([
      Animated.spring(successAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 7 }),
      Animated.delay(1200),
      Animated.timing(successAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setShowSuccess(false));
  }, [successAnim]);

  const resetIncomeForm = useCallback(() => {
    setIncStudentId(null);
    setIncAmount('');
    setIncCategory('subscription');
    setIncNote('');
    setStudentSearch('');
  }, []);

  const resetExpenseForm = useCallback(() => {
    setExpAmount('');
    setExpCategory('rent');
    setExpNote('');
  }, []);

  const handleAddIncome = useCallback(async () => {
    if (!incAmount || Number(incAmount) <= 0) {
      Alert.alert('Ошибка', 'Введите сумму');
      return;
    }
    setSaving(true);
    try {
      await addTransaction({
        type: 'income',
        amount: Number(incAmount),
        category: incCategory,
        studentId: incStudentId,
        note: incNote.trim() || undefined,
        date: new Date().toISOString(),
      });
      setIncomeModalVisible(false);
      resetIncomeForm();
      showSuccessOverlay();
    } catch (e) {
      Alert.alert('Ошибка', e.message || 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  }, [incAmount, incCategory, incStudentId, incNote, addTransaction, resetIncomeForm, showSuccessOverlay]);

  const handleAddExpense = useCallback(async () => {
    if (!expAmount || Number(expAmount) <= 0) {
      Alert.alert('Ошибка', 'Введите сумму');
      return;
    }
    setSaving(true);
    try {
      await addTransaction({
        type: 'expense',
        amount: Number(expAmount),
        category: expCategory,
        note: expNote.trim() || undefined,
        date: new Date().toISOString(),
      });
      setExpenseModalVisible(false);
      resetExpenseForm();
      showSuccessOverlay();
    } catch (e) {
      Alert.alert('Ошибка', e.message || 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  }, [expAmount, expCategory, expNote, addTransaction, resetExpenseForm, showSuccessOverlay]);

  const getStudentName = useCallback((studentId) => {
    if (!studentId) return null;
    const s = (data.students || []).find(st => st.id === studentId);
    return s?.name || null;
  }, [data.students]);

  const renderBalanceCard = () => (
    <GlassCard style={styles.balanceCard}>
      <Text style={[styles.balanceLabel, { color: c.textSecondary }]}>
        Баланс за {MONTHS_RU[currentMonth].toLowerCase()}
      </Text>
      <Text style={[styles.balanceAmount, { color: balance >= 0 ? c.green : c.red }]}>
        {balance >= 0 ? '+' : '-'}{formatMoney(balance)}
      </Text>
      <View style={styles.balanceRow}>
        <View style={styles.balanceStat}>
          <View style={[styles.balanceDot, { backgroundColor: c.green }]} />
          <Text style={[styles.balanceStatLabel, { color: c.textSecondary }]}>Доходы</Text>
          <Text style={[styles.balanceStatValue, { color: c.green }]}>+{formatMoney(totalIncome)}</Text>
        </View>
        <View style={styles.balanceStat}>
          <View style={[styles.balanceDot, { backgroundColor: c.red }]} />
          <Text style={[styles.balanceStatLabel, { color: c.textSecondary }]}>Расходы</Text>
          <Text style={[styles.balanceStatValue, { color: c.red }]}>-{formatMoney(totalExpense)}</Text>
        </View>
      </View>
    </GlassCard>
  );

  const renderBarChart = () => (
    <GlassCard style={styles.chartCard}>
      <Text style={[styles.sectionTitle, { color: c.text }]}>Динамика за 6 месяцев</Text>
      <View style={styles.chartContainer}>
        {barData.map((bar, i) => (
          <View key={i} style={styles.barGroup}>
            <View style={styles.barPair}>
              <View
                style={[
                  styles.bar,
                  styles.barIncome,
                  {
                    height: Math.max((bar.income / maxBarValue) * 80, 2),
                    backgroundColor: c.green,
                  },
                ]}
              />
              <View
                style={[
                  styles.bar,
                  styles.barExpense,
                  {
                    height: Math.max((bar.expense / maxBarValue) * 80, 2),
                    backgroundColor: c.red,
                  },
                ]}
              />
            </View>
            <Text style={[styles.barLabel, { color: c.textTertiary }]}>{bar.label}</Text>
          </View>
        ))}
      </View>
    </GlassCard>
  );

  const renderCategoryBreakdown = () => {
    if (categoryBreakdown.length === 0) return null;
    return (
      <GlassCard style={styles.breakdownCard}>
        <Text style={[styles.sectionTitle, { color: c.text }]}>По категориям</Text>
        {categoryBreakdown.map((item, i) => (
          <View key={i} style={[styles.breakdownRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }]}>
            <View style={styles.breakdownLeft}>
              <View style={[styles.catIcon, { backgroundColor: c.purpleBg }]}>
                <Ionicons name={getCategoryIcon(item.category)} size={16} color={c.purple} />
              </View>
              <Text style={[styles.breakdownLabel, { color: c.text }]}>{getCategoryLabel(item.category)}</Text>
            </View>
            <View style={styles.breakdownRight}>
              {item.income > 0 && (
                <Text style={[styles.breakdownIncome, { color: c.green }]}>+{formatMoney(item.income)}</Text>
              )}
              {item.expense > 0 && (
                <Text style={[styles.breakdownExpense, { color: c.red }]}>-{formatMoney(item.expense)}</Text>
              )}
            </View>
          </View>
        ))}
      </GlassCard>
    );
  };

  const renderFilterTabs = () => (
    <View style={styles.filterRow}>
      {FILTER_TABS.map(tab => {
        const active = filter === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.filterTab,
              { backgroundColor: active ? c.purple : c.glass, borderColor: active ? c.purple : c.glassBorder },
            ]}
            onPress={() => setFilter(tab.id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterTabText, { color: active ? '#fff' : c.textSecondary }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderTransactionItem = (tx) => {
    const isIncome = tx.type === 'income';
    const studentName = getStudentName(tx.studentId);
    return (
      <View key={tx.id} style={[styles.txItem, { borderBottomColor: c.border }]}>
        <View style={[styles.txIcon, { backgroundColor: isIncome ? c.greenBg : c.redBg }]}>
          <Ionicons
            name={isIncome ? 'arrow-down-outline' : 'arrow-up-outline'}
            size={18}
            color={isIncome ? c.green : c.red}
          />
        </View>
        <View style={styles.txInfo}>
          <Text style={[styles.txCategory, { color: c.text }]}>{getCategoryLabel(tx.category)}</Text>
          {studentName && (
            <Text style={[styles.txStudent, { color: c.textSecondary }]}>{studentName}</Text>
          )}
          {tx.note ? (
            <Text style={[styles.txNote, { color: c.textTertiary }]} numberOfLines={1}>{tx.note}</Text>
          ) : null}
        </View>
        <View style={styles.txRight}>
          <Text style={[styles.txAmount, { color: isIncome ? c.green : c.red }]}>
            {isIncome ? '+' : '-'}{formatMoney(tx.amount)}
          </Text>
          <Text style={[styles.txDate, { color: c.textTertiary }]}>{formatDate(tx.date || tx.createdAt)}</Text>
        </View>
      </View>
    );
  };

  const renderIncomeModal = () => {
    const incomeCategories = CATEGORIES.filter(c => c.type === 'income' || c.type === 'both');
    return (
      <Modal visible={incomeModalVisible} onClose={() => setIncomeModalVisible(false)} title="Новый доход">
        {/* Student selection */}
        <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Ученик (необязательно)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
          placeholder="Поиск ученика..."
          placeholderTextColor={c.placeholder}
          value={studentSearch}
          onChangeText={setStudentSearch}
        />
        {incStudentId && (
          <View style={[styles.selectedStudent, { backgroundColor: c.purpleBg }]}>
            <Text style={[styles.selectedStudentText, { color: c.purple }]}>
              {getStudentName(incStudentId)}
            </Text>
            <TouchableOpacity onPress={() => setIncStudentId(null)}>
              <Ionicons name="close-circle" size={18} color={c.purple} />
            </TouchableOpacity>
          </View>
        )}
        {!incStudentId && studentSearch.trim() !== '' && (
          <ScrollView style={styles.studentList} nestedScrollEnabled>
            {students.slice(0, 10).map(s => (
              <TouchableOpacity
                key={s.id}
                style={[styles.studentItem, { borderBottomColor: c.border }]}
                onPress={() => { setIncStudentId(s.id); setStudentSearch(''); }}
              >
                <Text style={[styles.studentItemText, { color: c.text }]}>{s.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Amount */}
        <Text style={[styles.fieldLabel, { color: c.textSecondary, marginTop: 16 }]}>Сумма</Text>
        <TextInput
          style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
          placeholder="0"
          placeholderTextColor={c.placeholder}
          value={incAmount}
          onChangeText={setIncAmount}
          keyboardType="numeric"
        />

        {/* Category */}
        <Text style={[styles.fieldLabel, { color: c.textSecondary, marginTop: 16 }]}>Категория</Text>
        <View style={styles.categoryGrid}>
          {incomeCategories.map(cat => {
            const active = incCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  { backgroundColor: active ? c.purpleBg : c.glass, borderColor: active ? c.purple : c.glassBorder },
                ]}
                onPress={() => setIncCategory(cat.id)}
              >
                <Ionicons name={cat.icon} size={14} color={active ? c.purple : c.textSecondary} />
                <Text style={[styles.categoryChipText, { color: active ? c.purple : c.textSecondary }]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Note */}
        <Text style={[styles.fieldLabel, { color: c.textSecondary, marginTop: 16 }]}>Заметка</Text>
        <TextInput
          style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
          placeholder="Необязательно"
          placeholderTextColor={c.placeholder}
          value={incNote}
          onChangeText={setIncNote}
        />

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: c.green, opacity: saving ? 0.7 : 1 }]}
          onPress={handleAddIncome}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#fff" /> : (
            <Text style={styles.saveButtonText}>Сохранить</Text>
          )}
        </TouchableOpacity>
      </Modal>
    );
  };

  const renderExpenseModal = () => {
    const expenseCategories = CATEGORIES.filter(c => c.type === 'expense' || c.type === 'both');
    return (
      <Modal visible={expenseModalVisible} onClose={() => setExpenseModalVisible(false)} title="Новый расход">
        {/* Amount */}
        <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Сумма</Text>
        <TextInput
          style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
          placeholder="0"
          placeholderTextColor={c.placeholder}
          value={expAmount}
          onChangeText={setExpAmount}
          keyboardType="numeric"
        />

        {/* Category */}
        <Text style={[styles.fieldLabel, { color: c.textSecondary, marginTop: 16 }]}>Категория</Text>
        <View style={styles.categoryGrid}>
          {expenseCategories.map(cat => {
            const active = expCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  { backgroundColor: active ? c.purpleBg : c.glass, borderColor: active ? c.purple : c.glassBorder },
                ]}
                onPress={() => setExpCategory(cat.id)}
              >
                <Ionicons name={cat.icon} size={14} color={active ? c.purple : c.textSecondary} />
                <Text style={[styles.categoryChipText, { color: active ? c.purple : c.textSecondary }]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Note */}
        <Text style={[styles.fieldLabel, { color: c.textSecondary, marginTop: 16 }]}>Заметка</Text>
        <TextInput
          style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.text }]}
          placeholder="Описание расхода"
          placeholderTextColor={c.placeholder}
          value={expNote}
          onChangeText={setExpNote}
        />

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: c.red, opacity: saving ? 0.7 : 1 }]}
          onPress={handleAddExpense}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#fff" /> : (
            <Text style={styles.saveButtonText}>Сохранить</Text>
          )}
        </TouchableOpacity>
      </Modal>
    );
  };

  const renderSuccessOverlay = () => {
    if (!showSuccess) return null;
    return (
      <View style={styles.successOverlay} pointerEvents="none">
        <Animated.View
          style={[
            styles.successCircle,
            {
              backgroundColor: c.greenBg,
              transform: [{ scale: successAnim }],
              opacity: successAnim,
            },
          ]}
        >
          <Ionicons name="checkmark-circle" size={64} color={c.green} />
          <Text style={[styles.successText, { color: c.green }]}>Сохранено!</Text>
        </Animated.View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: c.bg }]}>
        <ActivityIndicator size="large" color={c.purple} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.purple} />
        }
      >
        {renderBalanceCard()}

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: c.greenBg, borderColor: c.green }]}
            onPress={() => { resetIncomeForm(); setIncomeModalVisible(true); }}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle-outline" size={20} color={c.green} />
            <Text style={[styles.actionButtonText, { color: c.green }]}>Доход</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: c.redBg, borderColor: c.red }]}
            onPress={() => { resetExpenseForm(); setExpenseModalVisible(true); }}
            activeOpacity={0.7}
          >
            <Ionicons name="remove-circle-outline" size={20} color={c.red} />
            <Text style={[styles.actionButtonText, { color: c.red }]}>Расход</Text>
          </TouchableOpacity>
        </View>

        {renderBarChart()}
        {renderCategoryBreakdown()}

        {/* Transactions */}
        <View style={styles.txSection}>
          <Text style={[styles.sectionTitle, { color: c.text, marginBottom: 12 }]}>Транзакции</Text>
          {renderFilterTabs()}
          {filteredTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="wallet-outline" size={40} color={c.textTertiary} />
              <Text style={[styles.emptyText, { color: c.textTertiary }]}>Нет транзакций</Text>
            </View>
          ) : (
            <GlassCard style={styles.txList}>
              {filteredTransactions.slice(0, 50).map(renderTransactionItem)}
            </GlassCard>
          )}
        </View>
      </ScrollView>

      {renderIncomeModal()}
      {renderExpenseModal()}
      {renderSuccessOverlay()}
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
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  balanceCard: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  balanceLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 16,
  },
  balanceRow: {
    flexDirection: 'row',
    gap: 24,
  },
  balanceStat: {
    alignItems: 'center',
    gap: 4,
  },
  balanceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  balanceStatLabel: {
    fontSize: 12,
  },
  balanceStatValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  chartCard: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 100,
    paddingTop: 10,
  },
  barGroup: {
    flex: 1,
    alignItems: 'center',
  },
  barPair: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    marginBottom: 6,
  },
  bar: {
    width: 12,
    borderRadius: 4,
    minHeight: 2,
  },
  barIncome: {},
  barExpense: {},
  barLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  breakdownCard: {
    marginTop: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  catIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breakdownLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  breakdownRight: {
    alignItems: 'flex-end',
  },
  breakdownIncome: {
    fontSize: 13,
    fontWeight: '600',
  },
  breakdownExpense: {
    fontSize: 13,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  txSection: {
    marginTop: 16,
  },
  txList: {
    padding: 0,
    overflow: 'hidden',
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  txIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: {
    flex: 1,
  },
  txCategory: {
    fontSize: 14,
    fontWeight: '600',
  },
  txStudent: {
    fontSize: 12,
    marginTop: 2,
  },
  txNote: {
    fontSize: 11,
    marginTop: 2,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  txDate: {
    fontSize: 11,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginLeft: 2,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    height: 50,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  selectedStudent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 8,
  },
  selectedStudentText: {
    fontSize: 14,
    fontWeight: '600',
  },
  studentList: {
    maxHeight: 160,
    marginTop: 4,
  },
  studentItem: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  studentItemText: {
    fontSize: 14,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  saveButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 14,
    marginTop: 24,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 999,
  },
  successCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successText: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
});
