import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, RefreshControl,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import PageHeader from '../components/PageHeader';
import GlassCard from '../components/GlassCard';
import Modal from '../components/Modal';
import { PlusIcon, TrashIcon, FilterIcon } from '../icons';

export default function CashScreen() {
  const { dark, colors } = useTheme();
  const { transactions, students, addTransaction, deleteTransaction, loading, reload } = useData();
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ studentId: '', amount: '', type: 'income', description: '' });
  const [refreshing, setRefreshing] = useState(false);

  const filtered = useMemo(() => {
    let list = [...transactions].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
    if (filter === 'income') list = list.filter(t => t.type === 'income');
    if (filter === 'expense') list = list.filter(t => t.type === 'expense');
    return list;
  }, [transactions, filter]);

  const totals = useMemo(() => {
    const now = new Date();
    const month = transactions.filter(t => {
      const d = new Date(t.date || t.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const income = month.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
    const expense = month.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const handleAdd = async () => {
    if (!form.amount) { Alert.alert('Ошибка', 'Введите сумму'); return; }
    try {
      await addTransaction({
        ...form,
        amount: Number(form.amount),
        date: new Date().toISOString().split('T')[0],
      });
      setModalOpen(false);
      setForm({ studentId: '', amount: '', type: 'income', description: '' });
    } catch (e) { Alert.alert('Ошибка', e.message); }
  };

  const handleDelete = (id) => {
    Alert.alert('Удалить?', 'Удалить транзакцию?', [
      { text: 'Отмена' },
      { text: 'Удалить', style: 'destructive', onPress: () => deleteTransaction(id) },
    ]);
  };

  const getStudentName = (id) => students.find(s => s.id === id)?.name || '';

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <PageHeader title="Касса">
        <TouchableOpacity onPress={() => setModalOpen(true)} style={[styles.addBtn, { backgroundColor: colors.accent }]}>
          <PlusIcon size={20} color="#fff" />
        </TouchableOpacity>
      </PageHeader>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await reload(); setRefreshing(false); }} tintColor={colors.accent} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsRow}>
          <GlassCard style={[styles.statCard, { flex: 1 }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Доход</Text>
            <Text style={[styles.statNum, { color: colors.success }]}>{totals.income.toLocaleString()}р</Text>
          </GlassCard>
          <GlassCard style={[styles.statCard, { flex: 1 }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Расход</Text>
            <Text style={[styles.statNum, { color: colors.danger }]}>{totals.expense.toLocaleString()}р</Text>
          </GlassCard>
          <GlassCard style={[styles.statCard, { flex: 1 }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Баланс</Text>
            <Text style={[styles.statNum, { color: colors.text }]}>{totals.balance.toLocaleString()}р</Text>
          </GlassCard>
        </View>

        <View style={styles.filterRow}>
          {['all', 'income', 'expense'].map(f => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.filterBtn, filter === f && { backgroundColor: colors.accentLight }]}
            >
              <Text style={{ color: filter === f ? colors.accent : colors.textSecondary, fontSize: 13, fontWeight: '500' }}>
                {f === 'all' ? 'Все' : f === 'income' ? 'Доходы' : 'Расходы'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {filtered.map(tx => (
          <GlassCard key={tx.id}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.txAmount, { color: tx.type === 'income' ? colors.success : colors.danger }]}>
                  {tx.type === 'income' ? '+' : '-'}{tx.amount?.toLocaleString()}р
                </Text>
                {tx.description && <Text style={[styles.txDesc, { color: colors.textSecondary }]}>{tx.description}</Text>}
                {tx.studentId && <Text style={[styles.txDesc, { color: colors.textSecondary }]}>{getStudentName(tx.studentId)}</Text>}
                <Text style={[styles.txDate, { color: colors.textSecondary }]}>
                  {new Date(tx.date || tx.createdAt).toLocaleDateString('ru-RU')}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(tx.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <TrashIcon size={18} color={colors.danger} />
              </TouchableOpacity>
            </View>
          </GlassCard>
        ))}

        {filtered.length === 0 && (
          <Text style={[styles.empty, { color: colors.textSecondary }]}>Нет транзакций</Text>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal visible={modalOpen} onClose={() => setModalOpen(false)} title="Новая транзакция">
        <View style={styles.typeRow}>
          <TouchableOpacity
            onPress={() => setForm(f => ({ ...f, type: 'income' }))}
            style={[styles.typeBtn, form.type === 'income' && { backgroundColor: colors.accentLight }]}
          >
            <Text style={{ color: form.type === 'income' ? colors.accent : colors.textSecondary }}>Доход</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setForm(f => ({ ...f, type: 'expense' }))}
            style={[styles.typeBtn, form.type === 'expense' && { backgroundColor: colors.accentLight }]}
          >
            <Text style={{ color: form.type === 'expense' ? colors.accent : colors.textSecondary }}>Расход</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          value={form.amount}
          onChangeText={v => setForm(f => ({ ...f, amount: v }))}
          keyboardType="numeric"
          placeholder="Сумма"
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
        />
        <TextInput
          value={form.description}
          onChangeText={v => setForm(f => ({ ...f, description: v }))}
          placeholder="Описание"
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
        />
        <TouchableOpacity onPress={handleAdd} style={[styles.submitBtn, { backgroundColor: colors.accent }]}>
          <Text style={styles.submitText}>Добавить</Text>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  statCard: { alignItems: 'center', padding: 12 },
  statNum: { fontSize: 18, fontWeight: '800', marginTop: 2 },
  statLabel: { fontSize: 11 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10 },
  row: { flexDirection: 'row', alignItems: 'center' },
  txAmount: { fontSize: 17, fontWeight: '700' },
  txDesc: { fontSize: 13, marginTop: 2 },
  txDate: { fontSize: 12, marginTop: 4 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 14 },
  addBtn: { padding: 8, borderRadius: 10 },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  typeBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12 },
  input: { height: 48, borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, fontSize: 16, marginBottom: 12 },
  submitBtn: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
