import { useState, useMemo, useEffect, useRef } from 'react'
import { Plus, ArrowDownCircle, ArrowUpCircle, Trash2, Edit3, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, BarChart3, Wallet, PieChart, CheckCircle2, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import GlassCard from '../components/GlassCard'
import Modal from '../components/Modal'

function isExpired(dateStr) {
  if (!dateStr) return true
  return new Date(dateStr) < new Date()
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}

const MONTHS_RU = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
const MONTHS_SHORT = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']

const EXPENSE_CATEGORIES = ['Аренда', 'Инвентарь', 'Зарплата', 'Реклама', 'Прочее']
const CATEGORY_COLORS = {
  'Аренда': { bg: 'bg-blue-500', text: 'text-blue-500', light: 'bg-blue-500/15' },
  'Инвентарь': { bg: 'bg-purple-500', text: 'text-purple-500', light: 'bg-purple-500/15' },
  'Зарплата': { bg: 'bg-amber-500', text: 'text-amber-500', light: 'bg-amber-500/15' },
  'Реклама': { bg: 'bg-pink-500', text: 'text-pink-500', light: 'bg-pink-500/15' },
  'Прочее': { bg: 'bg-gray-500', text: 'text-gray-500', light: 'bg-gray-500/15' },
  'Абонемент': { bg: 'bg-green-500', text: 'text-green-500', light: 'bg-green-500/15' },
}

function SuccessOverlay({ type, amount, onDone }) {
  const [phase, setPhase] = useState('enter')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('show'), 50)
    const t2 = setTimeout(() => setPhase('exit'), 1800)
    const t3 = setTimeout(onDone, 2200)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onDone])

  const isIncome = type === 'income'

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-300 ${
      phase === 'exit' ? 'opacity-0' : phase === 'show' ? 'opacity-100' : 'opacity-0'
    }`} style={{ pointerEvents: 'none' }}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className={`relative flex flex-col items-center transition-all duration-500 ${
        phase === 'show' ? 'scale-100 opacity-100' : phase === 'enter' ? 'scale-50 opacity-0' : 'scale-110 opacity-0'
      }`}>
        {/* Animated rings */}
        <div className="relative">
          <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${isIncome ? 'bg-green-400' : 'bg-red-400'}`}
               style={{ animationDuration: '1s', width: 120, height: 120, margin: -20 }} />
          <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
            isIncome ? 'bg-gradient-to-br from-green-400 to-emerald-600' : 'bg-gradient-to-br from-red-400 to-rose-600'
          } shadow-2xl ${isIncome ? 'shadow-green-500/40' : 'shadow-red-500/40'}`}>
            {isIncome ? <ArrowDownCircle size={36} className="text-white" /> : <ArrowUpCircle size={36} className="text-white" />}
          </div>
        </div>
        <div className={`mt-4 text-3xl font-black text-white cash-success-amount`}>
          {isIncome ? '+' : '-'}{amount?.toLocaleString('ru-RU')} ₽
        </div>
        <div className="mt-1 text-white/60 text-sm font-medium">
          {isIncome ? 'Доход записан' : 'Расход записан'}
        </div>
        {/* Floating particles */}
        {[...Array(8)].map((_, i) => (
          <div key={i} className="absolute cash-particle" style={{
            left: '50%',
            top: '50%',
            '--angle': `${i * 45}deg`,
            '--delay': `${i * 0.05}s`,
            animationDelay: `${i * 0.05}s`,
          }}>
            <Sparkles size={12} className={isIncome ? 'text-green-300' : 'text-red-300'} />
          </div>
        ))}
      </div>
    </div>
  )
}

function MiniBarChart({ data, maxVal, dark }) {
  return (
    <div className="flex items-end gap-[3px] h-16">
      {data.map((val, i) => {
        const height = maxVal > 0 ? Math.max((val / maxVal) * 100, 4) : 4
        const isCurrentMonth = i === new Date().getMonth()
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
            <div
              className={`w-full rounded-t-[4px] transition-all duration-500 ${
                isCurrentMonth
                  ? 'bg-gradient-to-t from-accent to-rose-400'
                  : val > 0
                    ? dark ? 'bg-white/15' : 'bg-gray-300/60'
                    : dark ? 'bg-white/5' : 'bg-gray-100'
              }`}
              style={{ height: `${height}%`, minHeight: 2, animationDelay: `${i * 40}ms` }}
            />
            <span className={`text-[7px] font-medium ${
              isCurrentMonth ? 'text-accent font-bold' : dark ? 'text-white/20' : 'text-gray-300'
            }`}>{MONTHS_SHORT[i]}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function Cash() {
  const { auth } = useAuth()
  const { data, addTransaction, updateTransaction, deleteTransaction, updateStudent } = useData()
  const { dark } = useTheme()
  const [showIncome, setShowIncome] = useState(false)
  const [showExpense, setShowExpense] = useState(false)
  const [editTx, setEditTx] = useState(null)
  const [expForm, setExpForm] = useState({ amount: '', category: EXPENSE_CATEGORIES[0], description: '' })
  const [successAnim, setSuccessAnim] = useState(null)
  const [activeTab, setActiveTab] = useState('all') // 'all', 'income', 'expense'

  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth())
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())

  const myStudents = data.students.filter(s => s.trainerId === auth.userId)
  const myTx = data.transactions.filter(t => t.trainerId === auth.userId)
  const myGroups = data.groups.filter(g => g.trainerId === auth.userId)

  // Monthly data for chart
  const monthlyData = useMemo(() => {
    const incomeByMonth = new Array(12).fill(0)
    const expenseByMonth = new Array(12).fill(0)
    myTx.forEach(t => {
      const d = new Date(t.date)
      if (d.getFullYear() === selectedYear) {
        const m = d.getMonth()
        if (t.type === 'income') incomeByMonth[m] += t.amount
        else expenseByMonth[m] += t.amount
      }
    })
    return { income: incomeByMonth, expense: expenseByMonth }
  }, [myTx, selectedYear])

  // Stats for selected month
  const monthStats = useMemo(() => {
    const monthTx = myTx.filter(t => {
      const d = new Date(t.date)
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear
    })
    const income = monthTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
    const expense = monthTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
    return { income, expense, balance: income - expense, transactions: monthTx }
  }, [myTx, selectedMonth, selectedYear])

  // Category breakdown for selected month
  const categoryBreakdown = useMemo(() => {
    const cats = {}
    monthStats.transactions.filter(t => t.type === 'expense').forEach(t => {
      cats[t.category] = (cats[t.category] || 0) + t.amount
    })
    return Object.entries(cats).sort((a, b) => b[1] - a[1])
  }, [monthStats])

  // Total stats (all time)
  const totalStats = useMemo(() => {
    const income = myTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
    const expense = myTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
    return { income, expense, balance: income - expense }
  }, [myTx])

  // Filtered transactions for list
  const filteredTx = useMemo(() => {
    let txs = monthStats.transactions
    if (activeTab === 'income') txs = txs.filter(t => t.type === 'income')
    if (activeTab === 'expense') txs = txs.filter(t => t.type === 'expense')
    return [...txs].reverse()
  }, [monthStats, activeTab])

  const sortedStudents = useMemo(() =>
    [...myStudents].sort((a, b) => {
      const aDebt = isExpired(a.subscriptionExpiresAt) ? 0 : 1
      const bDebt = isExpired(b.subscriptionExpiresAt) ? 0 : 1
      return aDebt - bDebt
    }),
  [myStudents])

  const handlePayment = (student) => {
    const group = myGroups.find(g => g.id === student.groupId)
    const amount = group?.subscriptionCost || 5000
    const expired = isExpired(student.subscriptionExpiresAt)
    let baseDate = expired ? new Date() : new Date(student.subscriptionExpiresAt)
    baseDate.setMonth(baseDate.getMonth() + 1)
    updateStudent(student.id, { subscriptionExpiresAt: baseDate.toISOString() })
    addTransaction({
      trainerId: auth.userId,
      type: 'income',
      amount,
      category: 'Абонемент',
      description: `Оплата — ${student.name}`,
      studentId: student.id,
    })
    setShowIncome(false)
    setSuccessAnim({ type: 'income', amount })
  }

  const handleExpense = (e) => {
    e.preventDefault()
    const amount = parseInt(expForm.amount)
    if (!amount || amount <= 0) return
    addTransaction({
      trainerId: auth.userId,
      type: 'expense',
      amount,
      category: expForm.category,
      description: expForm.description || expForm.category,
      studentId: null,
    })
    setShowExpense(false)
    setSuccessAnim({ type: 'expense', amount })
    setExpForm({ amount: '', category: EXPENSE_CATEGORIES[0], description: '' })
  }

  const handleEditSave = (e) => {
    e.preventDefault()
    const amount = parseInt(editTx.amount)
    if (!amount || amount <= 0) return
    updateTransaction(editTx.id, {
      amount,
      category: editTx.category,
      description: editTx.description,
    })
    setEditTx(null)
  }

  const prevMonth = () => {
    if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1) }
    else setSelectedMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1) }
    else setSelectedMonth(m => m + 1)
  }
  const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear()

  const maxChartVal = Math.max(...monthlyData.income, ...monthlyData.expense, 1)

  const inputCls = `
    w-full px-4 py-3 rounded-[16px] text-base outline-none transition-all duration-200
    ${dark
      ? 'bg-white/[0.07] border border-white/[0.08] text-white placeholder-white/25 focus:border-purple-500/50 focus:bg-white/[0.1]'
      : 'bg-white/70 border border-white/60 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] shadow-sm'
    }
  `

  return (
    <Layout>
      <PageHeader title="Касса" />
      <div className="px-4 space-y-4 slide-in">

        {/* === BALANCE HERO CARD === */}
        <div className={`rounded-[24px] relative overflow-hidden ${
          dark
            ? 'bg-gradient-to-br from-indigo-600/20 via-white/[0.03] to-purple-500/15 border border-white/[0.08]'
            : 'bg-gradient-to-br from-indigo-50 via-white/90 to-purple-50 border border-white/70 shadow-[0_8px_40px_rgba(0,0,0,0.06)]'
        }`}>
          <div className={`absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl ${dark ? 'bg-indigo-500/10' : 'bg-indigo-200/30'}`} />
          <div className={`absolute -bottom-10 -left-10 w-28 h-28 rounded-full blur-2xl ${dark ? 'bg-purple-500/8' : 'bg-purple-100/40'}`} />

          <div className="relative p-5">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600`}>
                  <Wallet size={17} className="text-white" />
                </div>
                <span className={`text-[10px] uppercase font-bold tracking-widest ${dark ? 'text-white/35' : 'text-gray-400'}`}>
                  Общий баланс
                </span>
              </div>
            </div>
            <div className={`text-3xl font-black mt-2 ${totalStats.balance >= 0 ? 'text-green-500' : 'text-accent'}`}>
              {totalStats.balance.toLocaleString('ru-RU')} ₽
            </div>
            <div className="flex gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-lg bg-green-500/15 flex items-center justify-center">
                  <TrendingUp size={11} className="text-green-500" />
                </div>
                <span className="text-green-500 text-sm font-semibold">+{totalStats.income.toLocaleString('ru-RU')} ₽</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-lg bg-red-500/15 flex items-center justify-center">
                  <TrendingDown size={11} className="text-red-400" />
                </div>
                <span className="text-red-400 text-sm font-semibold">-{totalStats.expense.toLocaleString('ru-RU')} ₽</span>
              </div>
            </div>
          </div>
        </div>

        {/* === ACTION BUTTONS === */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowIncome(true)}
            className={`flex items-center justify-center gap-2 py-3.5 rounded-[18px] font-bold press-scale transition-all text-white ${
              'bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg shadow-green-500/20'
            }`}
          >
            <ArrowDownCircle size={18} />
            Доход
          </button>
          <button
            onClick={() => setShowExpense(true)}
            className={`flex items-center justify-center gap-2 py-3.5 rounded-[18px] font-bold press-scale transition-all text-white ${
              'bg-gradient-to-r from-red-500 to-rose-600 shadow-lg shadow-red-500/20'
            }`}
          >
            <ArrowUpCircle size={18} />
            Расход
          </button>
        </div>

        {/* === MONTH SELECTOR === */}
        <div className={`rounded-[20px] p-4 ${
          dark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-white/70 border border-white/60 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <button onClick={prevMonth} className="press-scale p-1.5 rounded-xl hover:bg-white/10">
              <ChevronLeft size={18} className={dark ? 'text-white/40' : 'text-gray-400'} />
            </button>
            <div className="text-center">
              <div className="font-black text-base">{MONTHS_RU[selectedMonth]}</div>
              <div className={`text-[10px] font-semibold ${dark ? 'text-white/25' : 'text-gray-400'}`}>{selectedYear}</div>
            </div>
            <button onClick={nextMonth} className="press-scale p-1.5 rounded-xl hover:bg-white/10">
              <ChevronRight size={18} className={dark ? 'text-white/40' : 'text-gray-400'} />
            </button>
          </div>

          {/* Month stats */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className={`rounded-[14px] p-2.5 text-center ${dark ? 'bg-green-500/10' : 'bg-green-50'}`}>
              <div className="text-green-500 text-sm font-black">+{monthStats.income.toLocaleString('ru-RU')}</div>
              <div className={`text-[8px] uppercase font-bold ${dark ? 'text-white/20' : 'text-gray-400'}`}>Доход</div>
            </div>
            <div className={`rounded-[14px] p-2.5 text-center ${dark ? 'bg-red-500/10' : 'bg-red-50'}`}>
              <div className="text-red-400 text-sm font-black">-{monthStats.expense.toLocaleString('ru-RU')}</div>
              <div className={`text-[8px] uppercase font-bold ${dark ? 'text-white/20' : 'text-gray-400'}`}>Расход</div>
            </div>
            <div className={`rounded-[14px] p-2.5 text-center ${dark ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}>
              <div className={`text-sm font-black ${monthStats.balance >= 0 ? 'text-indigo-400' : 'text-red-400'}`}>
                {monthStats.balance >= 0 ? '+' : ''}{monthStats.balance.toLocaleString('ru-RU')}
              </div>
              <div className={`text-[8px] uppercase font-bold ${dark ? 'text-white/20' : 'text-gray-400'}`}>Итого</div>
            </div>
          </div>

          {/* Mini chart */}
          <MiniBarChart data={monthlyData.income} maxVal={maxChartVal} dark={dark} />
        </div>

        {/* === CATEGORY BREAKDOWN === */}
        {categoryBreakdown.length > 0 && (
          <div className={`rounded-[20px] p-4 ${
            dark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-white/70 border border-white/60 shadow-sm'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <PieChart size={14} className={dark ? 'text-white/30' : 'text-gray-400'} />
              <span className={`text-[11px] uppercase font-bold tracking-wider ${dark ? 'text-white/30' : 'text-gray-400'}`}>
                Расходы по категориям
              </span>
            </div>
            {/* Progress bar */}
            <div className="flex rounded-full overflow-hidden h-2 mb-3">
              {categoryBreakdown.map(([cat, amount], i) => {
                const colors = CATEGORY_COLORS[cat] || CATEGORY_COLORS['Прочее']
                const pct = monthStats.expense > 0 ? (amount / monthStats.expense) * 100 : 0
                return (
                  <div key={cat} className={`${colors.bg} transition-all duration-500`}
                       style={{ width: `${pct}%`, animationDelay: `${i * 100}ms` }} />
                )
              })}
            </div>
            <div className="space-y-2">
              {categoryBreakdown.map(([cat, amount]) => {
                const colors = CATEGORY_COLORS[cat] || CATEGORY_COLORS['Прочее']
                const pct = monthStats.expense > 0 ? Math.round((amount / monthStats.expense) * 100) : 0
                return (
                  <div key={cat} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${colors.bg}`} />
                      <span className={`text-sm ${dark ? 'text-white/60' : 'text-gray-600'}`}>{cat}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${dark ? 'text-white/30' : 'text-gray-400'}`}>{pct}%</span>
                      <span className="text-sm font-bold">{amount.toLocaleString('ru-RU')} ₽</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* === TRANSACTION HISTORY === */}
        <div>
          {/* Tabs */}
          <div className="flex items-center gap-1 mb-3">
            {[
              { id: 'all', label: 'Все' },
              { id: 'income', label: 'Доходы' },
              { id: 'expense', label: 'Расходы' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold press-scale transition-all ${
                  activeTab === tab.id
                    ? dark ? 'bg-white/15 text-white' : 'bg-gray-900 text-white'
                    : dark ? 'text-white/30 hover:text-white/50' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
            <span className={`ml-auto text-xs font-medium ${dark ? 'text-white/20' : 'text-gray-300'}`}>
              {filteredTx.length} записей
            </span>
          </div>

          <div className="space-y-2">
            {filteredTx.map((tx, idx) => {
              const colors = CATEGORY_COLORS[tx.category] || CATEGORY_COLORS['Прочее']
              return (
                <div key={tx.id} className={`rounded-[16px] p-3.5 backdrop-blur-xl transition-all ${
                  dark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-white/70 border border-white/60 shadow-sm'
                }`} style={{ animationDelay: `${idx * 30}ms` }}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0 ${
                      tx.type === 'income'
                        ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20'
                        : colors.light
                    }`}>
                      {tx.type === 'income'
                        ? <ArrowDownCircle size={18} className="text-green-500" />
                        : <ArrowUpCircle size={18} className={colors.text} />
                      }
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm truncate">{tx.description}</div>
                      <div className={`flex items-center gap-1.5 mt-0.5 text-[11px] ${dark ? 'text-white/25' : 'text-gray-400'}`}>
                        <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase ${colors.light} ${colors.text}`}>
                          {tx.category}
                        </span>
                        <span>{formatDate(tx.date)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`font-black text-sm ${tx.type === 'income' ? 'text-green-500' : 'text-red-400'}`}>
                        {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString('ru-RU')} ₽
                      </span>
                      <button onClick={() => setEditTx({ ...tx })} className={`press-scale p-1.5 rounded-lg ${dark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
                        <Edit3 size={13} className={dark ? 'text-white/25' : 'text-gray-400'} />
                      </button>
                      <button onClick={() => deleteTransaction(tx.id)} className={`press-scale p-1.5 rounded-lg ${dark ? 'hover:bg-red-500/15' : 'hover:bg-red-50'}`}>
                        <Trash2 size={13} className="text-red-400/60" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
            {filteredTx.length === 0 && (
              <div className={`text-center py-10 ${dark ? 'text-white/20' : 'text-gray-300'}`}>
                <BarChart3 size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">Нет транзакций</p>
                <p className="text-xs mt-0.5">за {MONTHS_RU[selectedMonth].toLowerCase()} {selectedYear}</p>
              </div>
            )}
          </div>
        </div>

        <div className="h-4" />
      </div>

      {/* Income Modal */}
      <Modal open={showIncome} onClose={() => setShowIncome(false)} title="Принять оплату">
        <div className="space-y-2">
          {sortedStudents.map(s => {
            const expired = isExpired(s.subscriptionExpiresAt)
            const group = myGroups.find(g => g.id === s.groupId)
            return (
              <div
                key={s.id}
                onClick={() => handlePayment(s)}
                className={`rounded-[16px] p-3.5 flex items-center justify-between press-scale cursor-pointer transition-all ${
                  dark
                    ? 'bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08]'
                    : 'bg-white/60 border border-white/50 shadow-sm hover:bg-white/80'
                }`}
              >
                <div>
                  <div className="font-semibold text-sm">{s.name}</div>
                  <div className={`text-xs ${dark ? 'text-white/30' : 'text-gray-400'}`}>
                    {group?.name || 'Без группы'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {expired && (
                    <span className="bg-red-500/15 text-red-400 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full">
                      Долг
                    </span>
                  )}
                  <span className="text-sm font-black text-green-500">
                    {(group?.subscriptionCost || 5000).toLocaleString('ru-RU')} ₽
                  </span>
                </div>
              </div>
            )
          })}
          {sortedStudents.length === 0 && (
            <p className={`text-center py-6 text-sm ${dark ? 'text-white/30' : 'text-gray-500'}`}>
              Нет учеников
            </p>
          )}
        </div>
      </Modal>

      {/* Expense Modal */}
      <Modal open={showExpense} onClose={() => setShowExpense(false)} title="Добавить расход">
        <form onSubmit={handleExpense} className="space-y-3">
          <input
            type="number"
            placeholder="Сумма (₽)"
            value={expForm.amount}
            onChange={e => setExpForm(f => ({ ...f, amount: e.target.value }))}
            className={inputCls}
            inputMode="numeric"
          />
          <div className="grid grid-cols-3 gap-1.5">
            {EXPENSE_CATEGORIES.map(c => {
              const colors = CATEGORY_COLORS[c]
              const active = expForm.category === c
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setExpForm(f => ({ ...f, category: c }))}
                  className={`py-2 px-2 rounded-[12px] text-xs font-bold press-scale transition-all ${
                    active
                      ? `${colors.bg} text-white shadow-lg`
                      : dark ? 'bg-white/[0.06] text-white/50 border border-white/[0.06]' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {c}
                </button>
              )
            })}
          </div>
          <input
            type="text"
            placeholder="Описание (необязательно)"
            value={expForm.description}
            onChange={e => setExpForm(f => ({ ...f, description: e.target.value }))}
            className={inputCls}
          />
          <button type="submit" className="w-full py-3.5 rounded-[16px] bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold press-scale shadow-lg shadow-red-500/20">
            Сохранить
          </button>
        </form>
      </Modal>

      {/* Edit Transaction Modal */}
      <Modal open={!!editTx} onClose={() => setEditTx(null)} title="Редактировать">
        {editTx && (
          <form onSubmit={handleEditSave} className="space-y-3">
            <input
              type="number"
              placeholder="Сумма"
              value={editTx.amount}
              onChange={e => setEditTx(t => ({ ...t, amount: e.target.value }))}
              className={inputCls}
              inputMode="numeric"
            />
            <input
              type="text"
              placeholder="Описание"
              value={editTx.description}
              onChange={e => setEditTx(t => ({ ...t, description: e.target.value }))}
              className={inputCls}
            />
            <button type="submit" className="w-full py-3.5 rounded-[16px] bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold press-scale shadow-lg shadow-indigo-500/20">
              Сохранить
            </button>
          </form>
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
    </Layout>
  )
}
