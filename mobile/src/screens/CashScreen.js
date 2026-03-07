import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import GlassCard from '../components/GlassCard';
import PageHeader from '../components/PageHeader';

const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

export default function CashScreen() {
  const { auth } = useAuth();
  const { data, addTransaction, deleteTransaction } = useData();
  const { t } = useTheme();

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

  const income = myTx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const expense = myTx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

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
    <ScrollView style={[styles.container, { backgroundColor: t.bg }]} contentContainerStyle={styles.content}>
      <PageHeader title="Касса">
        <TouchableOpacity onPress={() => setShowAdd(true)}>
          <Ionicons name="add-circle" size={26} color={t.accent} />
        </TouchableOpacity>
      </PageHeader>

      {/* Month selector */}
      <View style={styles.monthRow}>
        <TouchableOpacity onPress={prevMonth}>
          <Ionicons name="chevron-back" size={22} color={t.text} />
        </TouchableOpacity>
        <Text style={[styles.monthText, { color: t.text }]}>{MONTHS[selectedMonth]} {selectedYear}</Text>
        <TouchableOpacity onPress={nextMonth}>
          <Ionicons name="chevron-forward" size={22} color={t.text} />
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <GlassCard style={styles.summaryCard}>
          <Ionicons name="trending-up" size={18} color={t.green} />
          <Text style={[styles.summaryNum, { color: t.green }]}>+{income.toLocaleString('ru-RU')}</Text>
          <Text style={[styles.summaryLabel, { color: t.textMuted }]}>Доход</Text>
        </GlassCard>
        <GlassCard style={styles.summaryCard}>
          <Ionicons name="trending-down" size={18} color={t.red} />
          <Text style={[styles.summaryNum, { color: t.red }]}>-{expense.toLocaleString('ru-RU')}</Text>
          <Text style={[styles.summaryLabel, { color: t.textMuted }]}>Расход</Text>
        </GlassCard>
      </View>

      <GlassCard>
        <Text style={[styles.balanceLabel, { color: t.textMuted }]}>Баланс</Text>
        <Text style={[styles.balanceNum, { color: income - expense >= 0 ? t.green : t.red }]}>
          {(income - expense).toLocaleString('ru-RU')} р.
        </Text>
      </GlassCard>

      {/* Transactions */}
      <Text style={[styles.sectionTitle, { color: t.textSecondary }]}>ОПЕРАЦИИ</Text>
      {myTx.map(tx => (
        <GlassCard key={tx.id}>
          <View style={styles.txRow}>
            <Ionicons
              name={tx.type === 'income' ? 'arrow-down-circle' : 'arrow-up-circle'}
              size={24}
              color={tx.type === 'income' ? t.green : t.red}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.txCategory, { color: t.text }]}>{tx.category || '—'}</Text>
              {tx.description ? <Text style={[styles.txDesc, { color: t.textMuted }]}>{tx.description}</Text> : null}
            </View>
            <Text style={[styles.txAmount, { color: tx.type === 'income' ? t.green : t.red }]}>
              {tx.type === 'income' ? '+' : '-'}{Number(tx.amount).toLocaleString('ru-RU')}
            </Text>
            <TouchableOpacity onPress={() => handleDelete(tx.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="trash-outline" size={16} color={t.textMuted} />
            </TouchableOpacity>
          </View>
        </GlassCard>
      ))}
      {myTx.length === 0 && (
        <Text style={[styles.empty, { color: t.textMuted }]}>Нет операций за этот месяц</Text>
      )}

      {/* Add modal */}
      <Modal visible={showAdd} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: t.bg }]}>
            <Text style={[styles.modalTitle, { color: t.text }]}>Новая операция</Text>

            <View style={styles.typeRow}>
              {[{ key: 'income', label: 'Доход', color: t.green }, { key: 'expense', label: 'Расход', color: t.red }].map(({ key, label, color }) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => setNewTx(v => ({ ...v, type: key }))}
                  style={[styles.typeBtn, newTx.type === key && { backgroundColor: color + '20', borderColor: color }]}
                >
                  <Text style={[styles.typeText, { color: newTx.type === key ? color : t.textMuted }]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={[styles.modalInput, { backgroundColor: t.input, borderColor: t.inputBorder, color: t.text }]}
              placeholder="Сумма"
              placeholderTextColor={t.textMuted}
              keyboardType="numeric"
              value={newTx.amount}
              onChangeText={v => setNewTx(n => ({ ...n, amount: v }))}
            />
            <TextInput
              style={[styles.modalInput, { backgroundColor: t.input, borderColor: t.inputBorder, color: t.text }]}
              placeholder="Категория"
              placeholderTextColor={t.textMuted}
              value={newTx.category}
              onChangeText={v => setNewTx(n => ({ ...n, category: v }))}
            />
            <TextInput
              style={[styles.modalInput, { backgroundColor: t.input, borderColor: t.inputBorder, color: t.text }]}
              placeholder="Описание"
              placeholderTextColor={t.textMuted}
              value={newTx.description}
              onChangeText={v => setNewTx(n => ({ ...n, description: v }))}
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: t.card }]} onPress={() => setShowAdd(false)}>
                <Text style={{ color: t.text, fontWeight: '600' }}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: t.accent }]} onPress={handleAdd} disabled={saving}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Добавить</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16 },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 12 },
  monthText: { fontSize: 16, fontWeight: '700' },
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  summaryCard: { flex: 1, alignItems: 'center', gap: 4 },
  summaryNum: { fontSize: 18, fontWeight: '800' },
  summaryLabel: { fontSize: 11, fontWeight: '500' },
  balanceLabel: { fontSize: 12, fontWeight: '500', textAlign: 'center' },
  balanceNum: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginTop: 16, marginBottom: 8 },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  txCategory: { fontSize: 14, fontWeight: '600' },
  txDesc: { fontSize: 11, marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '700' },
  empty: { textAlign: 'center', paddingVertical: 32, fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 12 },
  modalTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeBtn: { flex: 1, borderRadius: 12, borderWidth: 1, borderColor: 'transparent', paddingVertical: 10, alignItems: 'center' },
  typeText: { fontWeight: '600', fontSize: 14 },
  modalInput: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalBtn: { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
});
