import { useState, useMemo } from 'react'
import { Plus, ArrowDownCircle, ArrowUpCircle, Trash2, Edit3 } from 'lucide-react'
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

const EXPENSE_CATEGORIES = ['Аренда', 'Инвентарь', 'Зарплата', 'Реклама', 'Прочее']

export default function Cash() {
  const { auth } = useAuth()
  const { data, addTransaction, updateTransaction, deleteTransaction, updateStudent } = useData()
  const { dark } = useTheme()
  const [showIncome, setShowIncome] = useState(false)
  const [showExpense, setShowExpense] = useState(false)
  const [editTx, setEditTx] = useState(null)
  const [expForm, setExpForm] = useState({ amount: '', category: EXPENSE_CATEGORIES[0], description: '' })

  const myStudents = data.students.filter(s => s.trainerId === auth.userId)
  const myTx = data.transactions.filter(t => t.trainerId === auth.userId)
  const myGroups = data.groups.filter(g => g.trainerId === auth.userId)

  const stats = useMemo(() => {
    const income = myTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
    const expense = myTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
    return { income, expense, balance: income - expense }
  }, [myTx])

  // sort students: debtors first
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

    // extend subscription
    let baseDate
    if (expired) {
      baseDate = new Date()
    } else {
      baseDate = new Date(student.subscriptionExpiresAt)
    }
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
    setExpForm({ amount: '', category: EXPENSE_CATEGORIES[0], description: '' })
    setShowExpense(false)
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

  const inputCls = `
    w-full px-4 py-3 rounded-[16px] text-base outline-none
    ${dark
      ? 'bg-white/[0.07] border border-white/[0.08] text-white placeholder-white/25 focus:border-purple-500/50 focus:bg-white/[0.1]'
      : 'bg-white/70 border border-white/60 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] shadow-sm'
    }
  `

  return (
    <Layout>
      <PageHeader title="Касса" />
      <div className="px-4 space-y-4 slide-in">
        {/* Balance */}
        <GlassCard>
          <div className={`text-xs uppercase font-semibold ${dark ? 'text-white/40' : 'text-gray-400'}`}>Текущий баланс</div>
          <div className={`text-3xl font-black mt-1 ${stats.balance >= 0 ? 'text-green-500' : 'text-accent'}`}>
            {stats.balance.toLocaleString('ru-RU')} ₽
          </div>
          <div className="flex gap-4 mt-2">
            <span className="text-green-500 text-sm">+{stats.income.toLocaleString('ru-RU')} ₽</span>
            <span className="text-accent text-sm">-{stats.expense.toLocaleString('ru-RU')} ₽</span>
          </div>
        </GlassCard>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowIncome(true)}
            className="flex items-center justify-center gap-2 py-3.5 rounded-[16px] bg-green-600 text-white font-bold press-scale"
          >
            <ArrowDownCircle size={18} />
            Доход
          </button>
          <button
            onClick={() => setShowExpense(true)}
            className="flex items-center justify-center gap-2 py-3.5 rounded-[16px] bg-accent text-white font-bold press-scale"
          >
            <ArrowUpCircle size={18} />
            Расход
          </button>
        </div>

        {/* History */}
        <div>
          <h2 className={`text-sm uppercase font-bold mb-3 ${dark ? 'text-white/50' : 'text-gray-500'}`}>История</h2>
          <div className="space-y-2">
            {[...myTx].reverse().map(tx => (
              <GlassCard key={tx.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    tx.type === 'income' ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}>
                    {tx.type === 'income'
                      ? <ArrowDownCircle size={16} className="text-green-500" />
                      : <ArrowUpCircle size={16} className="text-red-400" />
                    }
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">{tx.description}</div>
                    <div className={`text-xs ${dark ? 'text-white/30' : 'text-gray-400'}`}>
                      {tx.category} — {formatDate(tx.date)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className={`font-bold text-sm ${tx.type === 'income' ? 'text-green-500' : 'text-accent'}`}>
                    {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString('ru-RU')} ₽
                  </span>
                  <button onClick={() => setEditTx({ ...tx })} className="press-scale p-1">
                    <Edit3 size={14} className={dark ? 'text-white/30' : 'text-gray-400'} />
                  </button>
                  <button onClick={() => deleteTransaction(tx.id)} className="press-scale p-1">
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                </div>
              </GlassCard>
            ))}
            {myTx.length === 0 && (
              <p className={`text-center py-6 text-sm ${dark ? 'text-white/30' : 'text-gray-400'}`}>
                Нет транзакций
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Income Modal - Student list */}
      <Modal open={showIncome} onClose={() => setShowIncome(false)} title="Принять оплату">
        <div className="space-y-2">
          {sortedStudents.map(s => {
            const expired = isExpired(s.subscriptionExpiresAt)
            const group = myGroups.find(g => g.id === s.groupId)
            return (
              <GlassCard
                key={s.id}
                onClick={() => handlePayment(s)}
                className="flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-sm">{s.name}</div>
                  <div className={`text-xs ${dark ? 'text-white/40' : 'text-gray-400'}`}>
                    {group?.name || 'Без группы'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {expired && (
                    <span className="bg-red-500/20 text-red-400 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
                      Долг
                    </span>
                  )}
                  <span className="text-sm font-bold">
                    {(group?.subscriptionCost || 5000).toLocaleString('ru-RU')} ₽
                  </span>
                </div>
              </GlassCard>
            )
          })}
          {sortedStudents.length === 0 && (
            <p className={`text-center py-6 text-sm ${dark ? 'text-white/30' : 'text-gray-400'}`}>
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
          <select
            value={expForm.category}
            onChange={e => setExpForm(f => ({ ...f, category: e.target.value }))}
            className={inputCls}
          >
            {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input
            type="text"
            placeholder="Описание (необязательно)"
            value={expForm.description}
            onChange={e => setExpForm(f => ({ ...f, description: e.target.value }))}
            className={inputCls}
          />
          <button type="submit" className="w-full py-3.5 rounded-[16px] bg-accent text-white font-bold press-scale">
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
            <button type="submit" className="w-full py-3.5 rounded-[16px] bg-accent text-white font-bold press-scale">
              Сохранить
            </button>
          </form>
        )}
      </Modal>
    </Layout>
  )
}
