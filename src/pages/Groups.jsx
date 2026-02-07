import { useState } from 'react'
import { Plus, Trash2, Edit3 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import GlassCard from '../components/GlassCard'
import Modal from '../components/Modal'

export default function Groups() {
  const { auth } = useAuth()
  const { data, addGroup, updateGroup, deleteGroup } = useData()
  const { dark } = useTheme()
  const [showAdd, setShowAdd] = useState(false)
  const [editGroup, setEditGroup] = useState(null)
  const [form, setForm] = useState({ name: '', schedule: '', subscriptionCost: '' })

  const myGroups = data.groups.filter(g => g.trainerId === auth.userId)

  const handleAdd = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    addGroup({
      trainerId: auth.userId,
      name: form.name.trim(),
      schedule: form.schedule.trim(),
      subscriptionCost: parseInt(form.subscriptionCost) || 5000,
    })
    setForm({ name: '', schedule: '', subscriptionCost: '' })
    setShowAdd(false)
  }

  const handleEdit = (e) => {
    e.preventDefault()
    if (!editGroup) return
    updateGroup(editGroup.id, {
      name: editGroup.name,
      schedule: editGroup.schedule,
      subscriptionCost: parseInt(editGroup.subscriptionCost) || 5000,
    })
    setEditGroup(null)
  }

  const handleDelete = (id) => {
    const studentCount = data.students.filter(s => s.groupId === id).length
    if (studentCount > 0) {
      if (!confirm(`В группе ${studentCount} учеников. Они будут откреплены. Удалить?`)) return
    }
    deleteGroup(id)
  }

  const inputCls = `
    w-full px-4 py-3 rounded-[16px] text-base outline-none
    ${dark
      ? 'bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-accent'
      : 'bg-black/[0.03] border border-black/[0.08] text-gray-900 placeholder-gray-400 focus:border-accent'
    }
  `

  return (
    <Layout>
      <PageHeader title="Группы" back="/">
        <button onClick={() => setShowAdd(true)} className="press-scale p-2">
          <Plus size={20} />
        </button>
      </PageHeader>

      <div className="px-4 space-y-3 slide-in">
        {myGroups.map(g => {
          const count = data.students.filter(s => s.groupId === g.id).length
          return (
            <GlassCard key={g.id} className="flex items-center justify-between">
              <div className="min-w-0">
                <div className="font-bold">{g.name}</div>
                <div className={`text-xs ${dark ? 'text-white/40' : 'text-gray-400'}`}>{g.schedule}</div>
                <div className={`text-xs mt-0.5 ${dark ? 'text-white/30' : 'text-gray-400'}`}>
                  {count} чел. — {g.subscriptionCost?.toLocaleString('ru-RU')} ₽/мес
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => setEditGroup({ ...g })} className="press-scale p-2">
                  <Edit3 size={16} className={dark ? 'text-white/40' : 'text-gray-400'} />
                </button>
                <button onClick={() => handleDelete(g.id)} className="press-scale p-2">
                  <Trash2 size={16} className="text-red-400" />
                </button>
              </div>
            </GlassCard>
          )
        })}
        {myGroups.length === 0 && (
          <p className={`text-center py-12 text-sm ${dark ? 'text-white/30' : 'text-gray-400'}`}>
            Нет групп. Нажмите + чтобы создать.
          </p>
        )}
      </div>

      {/* Add Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Новая группа">
        <form onSubmit={handleAdd} className="space-y-3">
          <input
            type="text"
            placeholder="Название (напр. Утро 09:00)"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className={inputCls}
            required
          />
          <input
            type="text"
            placeholder="Расписание (напр. Пн, Ср, Пт — 09:00)"
            value={form.schedule}
            onChange={e => setForm(f => ({ ...f, schedule: e.target.value }))}
            className={inputCls}
          />
          <input
            type="number"
            placeholder="Стоимость абонемента (₽)"
            value={form.subscriptionCost}
            onChange={e => setForm(f => ({ ...f, subscriptionCost: e.target.value }))}
            className={inputCls}
            inputMode="numeric"
          />
          <button type="submit" className="w-full py-3.5 rounded-[16px] bg-accent text-white font-bold press-scale">
            Создать группу
          </button>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editGroup} onClose={() => setEditGroup(null)} title="Редактировать">
        {editGroup && (
          <form onSubmit={handleEdit} className="space-y-3">
            <input
              type="text"
              placeholder="Название"
              value={editGroup.name}
              onChange={e => setEditGroup(g => ({ ...g, name: e.target.value }))}
              className={inputCls}
            />
            <input
              type="text"
              placeholder="Расписание"
              value={editGroup.schedule}
              onChange={e => setEditGroup(g => ({ ...g, schedule: e.target.value }))}
              className={inputCls}
            />
            <input
              type="number"
              placeholder="Стоимость"
              value={editGroup.subscriptionCost}
              onChange={e => setEditGroup(g => ({ ...g, subscriptionCost: e.target.value }))}
              className={inputCls}
              inputMode="numeric"
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
