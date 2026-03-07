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
  Plus,
  ArrowDownCircle,
  ArrowUpCircle,
  Trash2,
  Edit3,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Wallet,
  PieChart,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { getColors } from '../utils/theme';
import GlassCard from '../components/GlassCard';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';

const MONTHS_RU = [
  'Январь','Февраль','Март','Апрель','Май','Июнь',
  'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь',
];
const MONTHS_SHORT = [
  'Янв','Фев','Мар','Апр','Май','Июн',
  'Июл','Авг','Сен','Окт','Ноя','Дек',
];

const EXPENSE_CATEGORIES = ['Аренда', 'Инвентарь', 'Зарплата', 'Реклама', 'Прочее'];

const CATEGORY_COLORS = {
  'Аренда':     { color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  'Инвентарь':  { color: '#a855f7', bg: 'rgba(168,85,247,0.15)' },
  'Зарплата':   { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  'Реклама':    { color: '#ec4899', bg: 'rgba(236,72,153,0.15)' },
  'Прочее':     { color: '#6b7280', bg: 'rgba(107,114,128,0.15)' },
  'Абонемент':  { color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
};

function isExpired(dateStr) {
  if (!dateStr) return true;
  return new Date(dateStr) < new Date();
}

function formatDate(iso) {
  if (!iso) return '\u2014';
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getCatColor(category) {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS['Прочее'];
}

/* ── Mini bar chart ── */
function MiniBarChart({ data, maxVal, dark, c }) {
  return (
    <View style={chartStyles.container}>
      {data.map((val, i) => {
        const heightPct = maxVal > 0 ? Math.max((val / maxVal) * 100, 4) : 4;
        const isCurrentMonth = i === new Date().getMonth();
        return (
          <View key={i} style={chartStyles.barCol}>
            <View style={chartStyles.barTrack}>
              <View
                style={[
                  chartStyles.bar,
                  {
                    height: `${heightPct}%`,
                    backgroundColor: isCurrentMonth
                      ? '#ef4444'
                      : val > 0
                        ? dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'
                        : dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                  },
                ]}
              />
            </View>
            <Text
              style={[
                chartStyles.label,
                {
                  color: isCurrentMonth
                    ? '#ef4444'
                    : dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.25)',
                  fontWeight: isCurrentMonth ? '700' : '500',
                },
              ]}
            >
              {MONTHS_SHORT[i]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 64,
    gap: 3,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  barTrack: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minHeight: 2,
  },
  label: {
    fontSize: 7,
  },
});

/* ════════════════════════════════════════ */
/*               MAIN SCREEN              */
/* ════════════════════════════════════════ */

export default function CashScreen({ navigation }) {
  const { dark } = useTheme();
  const c = getColors(dark);
  const { auth } = useAuth();
  const {
    data,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    updateStudent,
  } = useData();

  const [showIncome, setShowIncome] = useState(false);
  const [showExpense, setShowExpense] = useState(false);
  const [editTx, setEditTx] = useState(null);
  const [expForm, setExpForm] = useState({
    amount: '',
    category: EXPENSE_CATEGORIES[0],
    description: '',
  });
  const [activeTab, setActiveTab] = useState('all');

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  /* ── derived data ── */
  const myStudents = data.students.filter(s => s.trainerId === auth.userId);
  const myTx = data.transactions.filter(t => t.trainerId === auth.userId);
  const myGroups = data.groups.filter(g => g.trainerId === auth.userId);

  const monthlyData = useMemo(() => {
    const income = new Array(12).fill(0);
    const expense = new Array(12).fill(0);
    myTx.forEach(t => {
      const d = new Date(t.date);
      if (d.getFullYear() === selectedYear) {
        const m = d.getMonth();
        if (t.type === 'income') income[m] += t.amount;
        else expense[m] += t.amount;
      }
    });
    return { income, expense };
  }, [myTx, selectedYear]);

  const monthStats = useMemo(() => {
    const txs = myTx.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
    const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expense, balance: income - expense, transactions: txs };
  }, [myTx, selectedMonth, selectedYear]);

  const categoryBreakdown = useMemo(() => {
    const cats = {};
    monthStats.transactions
      .filter(t => t.type === 'expense')
      .forEach(t => { cats[t.category] = (cats[t.category] || 0) + t.amount; });
    return Object.entries(cats).sort((a, b) => b[1] - a[1]);
  }, [monthStats]);

  const totalStats = useMemo(() => {
    const income = myTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = myTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [myTx]);

  const filteredTx = useMemo(() => {
    let txs = monthStats.transactions;
    if (activeTab === 'income') txs = txs.filter(t => t.type === 'income');
    if (activeTab === 'expense') txs = txs.filter(t => t.type === 'expense');
    return [...txs].reverse();
  }, [monthStats, activeTab]);

  const sortedStudents = useMemo(
    () =>
      [...myStudents].sort((a, b) => {
        const aD = isExpired(a.subscriptionExpiresAt) ? 0 : 1;
        const bD = isExpired(b.subscriptionExpiresAt) ? 0 : 1;
        return aD - bD;
      }),
    [myStudents],
  );

  const maxChartVal = Math.max(...monthlyData.income, ...monthlyData.expense, 1);

  /* ── actions ── */
  const prevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(y => y - 1);
    } else {
      setSelectedMonth(m => m - 1);
    }
  };
  const nextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(y => y + 1);
    } else {
      setSelectedMonth(m => m + 1);
    }
  };

  const handlePayment = async (student) => {
    try {
      const group = myGroups.find(g => g.id === student.groupId);
      const amount = group?.subscriptionCost || 5000;
      const expired = isExpired(student.subscriptionExpiresAt);
      let baseDate = expired ? new Date() : new Date(student.subscriptionExpiresAt);
      baseDate.setMonth(baseDate.getMonth() + 1);
      await updateStudent(student.id, {
        subscriptionExpiresAt: baseDate.toISOString(),
      });
      await addTransaction({
        trainerId: auth.userId,
        type: 'income',
        amount,
        category: 'Абонемент',
        description: `Оплата \u2014 ${student.name}`,
        studentId: student.id,
      });
      setShowIncome(false);
    } catch (e) {
      Alert.alert('Ошибка', e.message);
    }
  };

  const handleExpense = async () => {
    const amount = parseInt(expForm.amount, 10);
    if (!amount || amount <= 0) return;
    try {
      await addTransaction({
        trainerId: auth.userId,
        type: 'expense',
        amount,
        category: expForm.category,
        description: expForm.description || expForm.category,
        studentId: null,
      });
      setShowExpense(false);
      setExpForm({ amount: '', category: EXPENSE_CATEGORIES[0], description: '' });
    } catch (e) {
      Alert.alert('Ошибка', e.message);
    }
  };

  const handleEditSave = async () => {
    const amount = parseInt(editTx.amount, 10);
    if (!amount || amount <= 0) return;
    try {
      await updateTransaction(editTx.id, {
        amount,
        description: editTx.description,
      });
      setEditTx(null);
    } catch (e) {
      Alert.alert('Ошибка', e.message);
    }
  };

  const handleDelete = (txId) => {
    Alert.alert('Удалить транзакцию?', 'Это действие нельзя отменить', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: () => deleteTransaction(txId),
      },
    ]);
  };

  const fmt = (n) => n.toLocaleString('ru-RU');

  /* ════════════════ RENDER ════════════════ */
  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <PageHeader title="Касса" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ═══ BALANCE HERO ═══ */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: dark
                ? 'rgba(79,70,229,0.12)'
                : 'rgba(238,242,255,0.9)',
              borderColor: dark
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(255,255,255,0.7)',
            },
          ]}
        >
          <View style={styles.heroHeader}>
            <View
              style={styles.heroIconWrap}
            >
              <Wallet size={17} color="#fff" />
            </View>
            <Text style={[styles.heroLabel, { color: dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)' }]}>
              ОБЩИЙ БАЛАНС
            </Text>
          </View>
          <Text
            style={[
              styles.heroBalance,
              { color: totalStats.balance >= 0 ? '#22c55e' : '#ef4444' },
            ]}
          >
            {fmt(totalStats.balance)} \u20BD
          </Text>
          <View style={styles.heroSummary}>
            <View style={styles.heroSummaryItem}>
              <View style={[styles.miniIcon, { backgroundColor: 'rgba(34,197,94,0.15)' }]}>
                <TrendingUp size={11} color="#22c55e" />
              </View>
              <Text style={styles.heroIncomeText}>+{fmt(totalStats.income)} \u20BD</Text>
            </View>
            <View style={styles.heroSummaryItem}>
              <View style={[styles.miniIcon, { backgroundColor: 'rgba(239,68,68,0.15)' }]}>
                <TrendingDown size={11} color="#f87171" />
              </View>
              <Text style={styles.heroExpenseText}>-{fmt(totalStats.expense)} \u20BD</Text>
            </View>
          </View>
        </View>

        {/* ═══ ACTION BUTTONS ═══ */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowIncome(true)}
            style={[styles.actionBtn, styles.incomeBtn]}
          >
            <ArrowDownCircle size={18} color="#fff" />
            <Text style={styles.actionBtnText}>Доход</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowExpense(true)}
            style={[styles.actionBtn, styles.expenseBtn]}
          >
            <ArrowUpCircle size={18} color="#fff" />
            <Text style={styles.actionBtnText}>Расход</Text>
          </TouchableOpacity>
        </View>

        {/* ═══ MONTH SELECTOR ═══ */}
        <GlassCard style={styles.monthCard}>
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={prevMonth} style={styles.monthArrow}>
              <ChevronLeft size={18} color={dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)'} />
            </TouchableOpacity>
            <View style={styles.monthCenter}>
              <Text style={[styles.monthName, { color: c.text }]}>
                {MONTHS_RU[selectedMonth]}
              </Text>
              <Text style={[styles.monthYear, { color: dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)' }]}>
                {selectedYear}
              </Text>
            </View>
            <TouchableOpacity onPress={nextMonth} style={styles.monthArrow}>
              <ChevronRight size={18} color={dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)'} />
            </TouchableOpacity>
          </View>

          {/* Month stats columns */}
          <View style={styles.monthStats}>
            <View style={[styles.statBox, { backgroundColor: dark ? 'rgba(34,197,94,0.1)' : 'rgba(34,197,94,0.08)' }]}>
              <Text style={styles.statIncome}>+{fmt(monthStats.income)}</Text>
              <Text style={[styles.statLabel, { color: dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.3)' }]}>ДОХОД</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: dark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.08)' }]}>
              <Text style={styles.statExpense}>-{fmt(monthStats.expense)}</Text>
              <Text style={[styles.statLabel, { color: dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.3)' }]}>РАСХОД</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: dark ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.08)' }]}>
              <Text style={[styles.statBalance, { color: monthStats.balance >= 0 ? '#818cf8' : '#f87171' }]}>
                {monthStats.balance >= 0 ? '+' : ''}{fmt(monthStats.balance)}
              </Text>
              <Text style={[styles.statLabel, { color: dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.3)' }]}>ИТОГО</Text>
            </View>
          </View>

          {/* Mini chart */}
          <MiniBarChart data={monthlyData.income} maxVal={maxChartVal} dark={dark} c={c} />
        </GlassCard>

        {/* ═══ CATEGORY BREAKDOWN ═══ */}
        {categoryBreakdown.length > 0 && (
          <GlassCard style={styles.catCard}>
            <View style={styles.catHeader}>
              <PieChart size={14} color={dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'} />
              <Text style={[styles.catTitle, { color: dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }]}>
                РАСХОДЫ ПО КАТЕГОРИЯМ
              </Text>
            </View>

            {/* Stacked bar */}
            <View style={styles.stackedBar}>
              {categoryBreakdown.map(([cat, amount]) => {
                const pct = monthStats.expense > 0 ? (amount / monthStats.expense) * 100 : 0;
                const cc = getCatColor(cat);
                return (
                  <View
                    key={cat}
                    style={{ width: `${pct}%`, backgroundColor: cc.color, height: '100%' }}
                  />
                );
              })}
            </View>

            {/* Category rows */}
            {categoryBreakdown.map(([cat, amount]) => {
              const pct = monthStats.expense > 0 ? Math.round((amount / monthStats.expense) * 100) : 0;
              const cc = getCatColor(cat);
              return (
                <View key={cat} style={styles.catRow}>
                  <View style={styles.catRowLeft}>
                    <View style={[styles.catDot, { backgroundColor: cc.color }]} />
                    <Text style={[styles.catName, { color: dark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)' }]}>
                      {cat}
                    </Text>
                  </View>
                  <View style={styles.catRowRight}>
                    <Text style={[styles.catPct, { color: dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }]}>
                      {pct}%
                    </Text>
                    <Text style={[styles.catAmount, { color: c.text }]}>
                      {fmt(amount)} \u20BD
                    </Text>
                  </View>
                </View>
              );
            })}
          </GlassCard>
        )}

        {/* ═══ TRANSACTION HISTORY ═══ */}
        <View style={styles.txSection}>
          {/* Tabs */}
          <View style={styles.tabRow}>
            {[
              { id: 'all', label: 'Все' },
              { id: 'income', label: 'Доходы' },
              { id: 'expense', label: 'Расходы' },
            ].map(tab => (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={[
                  styles.tab,
                  activeTab === tab.id && {
                    backgroundColor: dark ? 'rgba(255,255,255,0.15)' : '#111827',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color:
                        activeTab === tab.id
                          ? '#fff'
                          : dark
                            ? 'rgba(255,255,255,0.3)'
                            : 'rgba(0,0,0,0.35)',
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
            <Text style={[styles.txCount, { color: dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.25)' }]}>
              {filteredTx.length} записей
            </Text>
          </View>

          {/* Transaction list */}
          {filteredTx.map(tx => {
            const cc = getCatColor(tx.category);
            return (
              <GlassCard key={tx.id} style={styles.txCard}>
                <View style={styles.txRow}>
                  {/* Icon */}
                  <View
                    style={[
                      styles.txIcon,
                      {
                        backgroundColor:
                          tx.type === 'income'
                            ? 'rgba(34,197,94,0.15)'
                            : cc.bg,
                      },
                    ]}
                  >
                    {tx.type === 'income' ? (
                      <ArrowDownCircle size={18} color="#22c55e" />
                    ) : (
                      <ArrowUpCircle size={18} color={cc.color} />
                    )}
                  </View>

                  {/* Description + meta */}
                  <View style={styles.txContent}>
                    <Text style={[styles.txDesc, { color: c.text }]} numberOfLines={1}>
                      {tx.description}
                    </Text>
                    <View style={styles.txMeta}>
                      <View style={[styles.txBadge, { backgroundColor: cc.bg }]}>
                        <Text style={[styles.txBadgeText, { color: cc.color }]}>
                          {tx.category}
                        </Text>
                      </View>
                      <Text style={[styles.txDate, { color: dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)' }]}>
                        {formatDate(tx.date)}
                      </Text>
                    </View>
                  </View>

                  {/* Amount + actions */}
                  <View style={styles.txRight}>
                    <Text
                      style={[
                        styles.txAmount,
                        { color: tx.type === 'income' ? '#22c55e' : '#f87171' },
                      ]}
                    >
                      {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)} \u20BD
                    </Text>
                    <View style={styles.txActions}>
                      <TouchableOpacity
                        onPress={() => setEditTx({ ...tx, amount: String(tx.amount) })}
                        style={styles.txActionBtn}
                      >
                        <Edit3 size={13} color={dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)'} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDelete(tx.id)}
                        style={styles.txActionBtn}
                      >
                        <Trash2 size={13} color="rgba(239,68,68,0.6)" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </GlassCard>
            );
          })}

          {filteredTx.length === 0 && (
            <View style={styles.emptyState}>
              <Wallet size={32} color={dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} />
              <Text style={[styles.emptyTitle, { color: dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.25)' }]}>
                Нет транзакций
              </Text>
              <Text style={[styles.emptySub, { color: dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.2)' }]}>
                за {MONTHS_RU[selectedMonth].toLowerCase()} {selectedYear}
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ═══ INCOME MODAL ═══ */}
      <Modal
        visible={showIncome}
        onClose={() => setShowIncome(false)}
        title="Принять оплату"
      >
        {sortedStudents.map(s => {
          const expired = isExpired(s.subscriptionExpiresAt);
          const group = myGroups.find(g => g.id === s.groupId);
          return (
            <TouchableOpacity
              key={s.id}
              activeOpacity={0.7}
              onPress={() => handlePayment(s)}
              style={[
                styles.studentRow,
                {
                  backgroundColor: dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.6)',
                  borderColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.5)',
                },
              ]}
            >
              <View>
                <Text style={[styles.studentName, { color: c.text }]}>{s.name}</Text>
                <Text style={[styles.studentGroup, { color: dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)' }]}>
                  {group?.name || 'Без группы'}
                </Text>
              </View>
              <View style={styles.studentRight}>
                {expired && (
                  <View style={styles.debtBadge}>
                    <Text style={styles.debtBadgeText}>ДОЛГ</Text>
                  </View>
                )}
                <Text style={styles.studentCost}>
                  {fmt(group?.subscriptionCost || 5000)} \u20BD
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
        {sortedStudents.length === 0 && (
          <Text style={[styles.modalEmpty, { color: dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)' }]}>
            Нет учеников
          </Text>
        )}
      </Modal>

      {/* ═══ EXPENSE MODAL ═══ */}
      <Modal
        visible={showExpense}
        onClose={() => setShowExpense(false)}
        title="Добавить расход"
      >
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: c.inputBg,
              borderColor: c.inputBorder,
              color: c.text,
            },
          ]}
          placeholder="Сумма (\u20BD)"
          placeholderTextColor={c.textTertiary}
          keyboardType="numeric"
          value={expForm.amount}
          onChangeText={v => setExpForm(f => ({ ...f, amount: v }))}
        />

        <View style={styles.catSelector}>
          {EXPENSE_CATEGORIES.map(cat => {
            const active = expForm.category === cat;
            const cc = getCatColor(cat);
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setExpForm(f => ({ ...f, category: cat }))}
                style={[
                  styles.catChip,
                  active
                    ? { backgroundColor: cc.color }
                    : {
                        backgroundColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                        borderWidth: 1,
                        borderColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
                      },
                ]}
              >
                <Text
                  style={[
                    styles.catChipText,
                    { color: active ? '#fff' : dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)' },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: c.inputBg,
              borderColor: c.inputBorder,
              color: c.text,
            },
          ]}
          placeholder="Описание (необязательно)"
          placeholderTextColor={c.textTertiary}
          value={expForm.description}
          onChangeText={v => setExpForm(f => ({ ...f, description: v }))}
        />

        <TouchableOpacity
          style={styles.expSaveBtn}
          onPress={handleExpense}
          activeOpacity={0.8}
        >
          <Text style={styles.expSaveBtnText}>Сохранить</Text>
        </TouchableOpacity>
      </Modal>

      {/* ═══ EDIT TRANSACTION MODAL ═══ */}
      <Modal
        visible={!!editTx}
        onClose={() => setEditTx(null)}
        title="Редактировать"
      >
        {editTx && (
          <>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: c.inputBg,
                  borderColor: c.inputBorder,
                  color: c.text,
                },
              ]}
              placeholder="Сумма"
              placeholderTextColor={c.textTertiary}
              keyboardType="numeric"
              value={String(editTx.amount)}
              onChangeText={v => setEditTx(t => ({ ...t, amount: v }))}
            />
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: c.inputBg,
                  borderColor: c.inputBorder,
                  color: c.text,
                  marginTop: 12,
                },
              ]}
              placeholder="Описание"
              placeholderTextColor={c.textTertiary}
              value={editTx.description}
              onChangeText={v => setEditTx(t => ({ ...t, description: v }))}
            />
            <TouchableOpacity
              style={styles.editSaveBtn}
              onPress={handleEditSave}
              activeOpacity={0.8}
            >
              <Text style={styles.editSaveBtnText}>Сохранить</Text>
            </TouchableOpacity>
          </>
        )}
      </Modal>
    </View>
  );
}

/* ════════════════════════════════════════ */
/*               STYLES                    */
/* ════════════════════════════════════════ */

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  /* Hero card */
  heroCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  heroIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  heroBalance: {
    fontSize: 30,
    fontWeight: '900',
    marginBottom: 8,
  },
  heroSummary: {
    flexDirection: 'row',
    gap: 16,
  },
  heroSummaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniIcon: {
    width: 20,
    height: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIncomeText: {
    color: '#22c55e',
    fontSize: 13,
    fontWeight: '600',
  },
  heroExpenseText: {
    color: '#f87171',
    fontSize: 13,
    fontWeight: '600',
  },

  /* Action buttons */
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 18,
  },
  incomeBtn: {
    backgroundColor: '#16a34a',
  },
  expenseBtn: {
    backgroundColor: '#dc2626',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  /* Month card */
  monthCard: {
    marginBottom: 12,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  monthArrow: {
    padding: 6,
    borderRadius: 12,
  },
  monthCenter: {
    alignItems: 'center',
  },
  monthName: {
    fontSize: 16,
    fontWeight: '900',
  },
  monthYear: {
    fontSize: 10,
    fontWeight: '600',
  },
  monthStats: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
  },
  statIncome: {
    color: '#22c55e',
    fontSize: 13,
    fontWeight: '900',
  },
  statExpense: {
    color: '#f87171',
    fontSize: 13,
    fontWeight: '900',
  },
  statBalance: {
    fontSize: 13,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 8,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.5,
  },

  /* Category breakdown */
  catCard: {
    marginBottom: 12,
  },
  catHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  catTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  stackedBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  catRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  catName: {
    fontSize: 14,
  },
  catRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catPct: {
    fontSize: 12,
    fontWeight: '500',
  },
  catAmount: {
    fontSize: 14,
    fontWeight: '700',
  },

  /* Transactions */
  txSection: {
    marginTop: 4,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  txCount: {
    marginLeft: 'auto',
    fontSize: 12,
    fontWeight: '500',
  },
  txCard: {
    marginBottom: 8,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txContent: {
    flex: 1,
    minWidth: 0,
  },
  txDesc: {
    fontSize: 14,
    fontWeight: '600',
  },
  txMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  txBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  txBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  txDate: {
    fontSize: 11,
  },
  txRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '900',
  },
  txActions: {
    flexDirection: 'row',
    gap: 4,
  },
  txActionBtn: {
    padding: 6,
    borderRadius: 8,
  },

  /* Empty state */
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  emptySub: {
    fontSize: 12,
    marginTop: 2,
  },

  /* Income modal - students */
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '600',
  },
  studentGroup: {
    fontSize: 12,
    marginTop: 2,
  },
  studentRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  debtBadge: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  debtBadgeText: {
    color: '#f87171',
    fontSize: 9,
    fontWeight: '700',
  },
  studentCost: {
    color: '#22c55e',
    fontSize: 14,
    fontWeight: '900',
  },
  modalEmpty: {
    textAlign: 'center',
    paddingVertical: 24,
    fontSize: 14,
  },

  /* Expense modal */
  input: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  catSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 12,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  expSaveBtn: {
    marginTop: 16,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#dc2626',
  },
  expSaveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  /* Edit modal */
  editSaveBtn: {
    marginTop: 20,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#6366f1',
  },
  editSaveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
