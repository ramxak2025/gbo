import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Edit3, ClipboardList } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import GlassCard from '../components/GlassCard'
import Modal from '../components/Modal'
import { SPORT_TYPES, getSportLabel } from '../utils/sports'

const DAY_OPTIONS = [
  { id: 1, short: 'Пн', label: 'Понедельник' },
  { id: 2, short: 'Вт', label: 'Вторник' },
  { id: 3, short: 'Ср', label: 'Среда' },
  { id: 4, short: 'Чт', label: 'Четверг' },
  { id: 5, short: 'Пт', label: 'Пятница' },
  { id: 6, short: 'Сб', label: 'Суббота' },
  { id: 0, short: 'Вс', label: 'Воскресенье' },
]

function buildScheduleString(days, timeFrom, timeTo) {
  if (!days || days.length === 0) return ''
  const dayLabels = DAY_OPTIONS.filter(d => days.includes(d.id)).map(d => d.short)
  let result = dayLabels.join(', ')
  if (timeFrom) {
    result += ' — ' + timeFrom
    if (timeTo) result += '-' + timeTo
  }
  return result
}

function parseDaysFromSchedule(schedule) {
  if (!schedule) return []
  const dayMap = { 'пн': 1, 'вт': 2, 'ср': 3, 'чт': 4, 'пт': 5, 'сб': 6, 'вс': 0 }
  const days = []
  const lower = schedule.toLowerCase()
  for (const [abbr, num] of Object.entries(dayMap)) {
    if (lower.includes(abbr)) days.push(num)
  }
  return days
}

function parseTimeFromSchedule(schedule) {
  if (!schedule) return { timeFrom: '', timeTo: '' }
  // Match patterns like "09:00-10:30" or just "09:00"
  const rangeMatch = schedule.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/)
  if (rangeMatch) return { timeFrom: rangeMatch[1], timeTo: rangeMatch[2] }
  const timeMatch = schedule.match(/(\d{1,2}:\d{2})/)
  return { timeFrom: timeMatch ? timeMatch[1] : '', timeTo: '' }
}

export default function Groups() {
  const { auth } = useAuth()
  const { data, addGroup, updateGroup, deleteGroup } = useData()
  const { dark } = useTheme()
  const navigate = useNavigate()
  const [showAdd, setShowAdd] = useState(false)
  const [editGroup, setEditGroup] = useState(null)
  const [form, setForm] = useState({ name: '', days: [], timeFrom: '', timeTo: '', subscriptionCost: '', sportType: '' })

  const myGroups = data.groups.filter(g => g.trainerId === auth.userId)
  const trainerUser = data.users.find(u => u.id === auth.userId)
  const trainerSports = trainerUser?.sportTypes?.length > 0
    ? trainerUser.sportTypes
    : trainerUser?.sportType ? [trainerUser.sportType] : []

  const toggleDay = (dayId, setter) => {
    setter(prev => {
      const current = typeof prev === 'function' ? prev : prev
      // For form state
      return typeof prev === 'function' ? prev : prev
    })
  }

  const handleAdd = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    const schedule = buildScheduleString(form.days, form.timeFrom, form.timeTo)
    addGroup({
      trainerId: auth.userId,
      name: form.name.trim(),
      schedule,
      scheduleDays: form.days,
      timeFrom: form.timeFrom,
      timeTo: form.timeTo,
      subscriptionCost: parseInt(form.subscriptionCost) || 5000,
      sportType: form.sportType || trainerSports[0] || null,
    })
    setForm({ name: '', days: [], timeFrom: '', timeTo: '', subscriptionCost: '', sportType: '' })
    setShowAdd(false)
  }

  const startEdit = (g) => {
    // Parse existing schedule into structured data
    const days = g.scheduleDays?.length > 0 ? g.scheduleDays : parseDaysFromSchedule(g.schedule)
    const { timeFrom, timeTo } = g.timeFrom ? { timeFrom: g.timeFrom, timeTo: g.timeTo || '' } : parseTimeFromSchedule(g.schedule)
    setEditGroup({ ...g, days, timeFrom, timeTo })
  }

  const handleEdit = (e) => {
    e.preventDefault()
    if (!editGroup) return
    const schedule = buildScheduleString(editGroup.days, editGroup.timeFrom, editGroup.timeTo)
    updateGroup(editGroup.id, {
      name: editGroup.name,
      schedule,
      scheduleDays: editGroup.days,
      timeFrom: editGroup.timeFrom,
      timeTo: editGroup.timeTo,
      subscriptionCost: parseInt(editGroup.subscriptionCost) || 5000,
      sportType: editGroup.sportType || null,
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
      ? 'bg-white/[0.07] border border-white/[0.08] text-white placeholder-white/25 focus:border-purple-500/50 focus:bg-white/[0.1]'
      : 'bg-white/70 border border-white/60 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] shadow-sm'
    }
  `

  const DayPicker = ({ days, onChange }) => (
    <div>
      <div className={`text-xs uppercase font-semibold mb-2 ${dark ? 'text-white/40' : 'text-gray-500'}`}>Дни тренировок</div>
      <div className="flex flex-wrap gap-1.5">
        {DAY_OPTIONS.map(d => {
          const active = days.includes(d.id)
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => onChange(active ? days.filter(x => x !== d.id) : [...days, d.id])}
              className={`w-10 h-10 rounded-[12px] text-xs font-bold press-scale transition-all flex items-center justify-center ${
                active
                  ? 'bg-accent text-white'
                  : dark ? 'bg-white/[0.06] text-white/50 border border-white/[0.06]' : 'bg-white/70 text-gray-500 border border-white/60'
              }`}
            >
              {d.short}
            </button>
          )
        })}
      </div>
    </div>
  )

  const TimePicker = ({ label, value, onChange }) => (
    <div className="flex-1">
      <div className={`text-xs uppercase font-semibold mb-2 ${dark ? 'text-white/40' : 'text-gray-500'}`}>{label}</div>
      <input
        type="time"
        value={value}
        onChange={e => onChange(e.target.value)}
        className={inputCls}
      />
    </div>
  )

  return (
    <Layout>
      <PageHeader title="Группы" back="/">
        <button onClick={() => setShowAdd(true)} className="press-scale p-2">
          <Plus size={20} />
        </button>
      </PageHeader>

      <div className="px-4 space-y-3 slide-in">
        {myGroups.map(g => {
          const sgStudentIds = new Set(data.studentGroups.filter(sg => sg.groupId === g.id).map(sg => sg.studentId))
          data.students.forEach(s => { if (s.groupId === g.id) sgStudentIds.add(s.id) })
          const count = sgStudentIds.size
          return (
            <GlassCard key={g.id}>
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="font-bold">{g.name}</div>
                  <div className={`text-xs ${dark ? 'text-white/40' : 'text-gray-500'}`}>{g.schedule}</div>
                  <div className={`text-xs mt-0.5 flex items-center gap-2 ${dark ? 'text-white/30' : 'text-gray-500'}`}>
                    <span>{count} чел. — {g.subscriptionCost?.toLocaleString('ru-RU')} ₽/мес</span>
                    {g.sportType && (
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                        dark ? 'bg-accent/15 text-accent-light' : 'bg-red-50 text-red-600'
                      }`}>{getSportLabel(g.sportType)}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {g.attendanceEnabled && (
                    <button onClick={() => navigate(`/attendance/${g.id}`)} className="press-scale p-2">
                      <ClipboardList size={16} className="text-green-400" />
                    </button>
                  )}
                  <button onClick={() => startEdit(g)} className="press-scale p-2">
                    <Edit3 size={16} className={dark ? 'text-white/40' : 'text-gray-500'} />
                  </button>
                  <button onClick={() => handleDelete(g.id)} className="press-scale p-2">
                    <Trash2 size={16} className="text-red-400" />
                  </button>
                </div>
              </div>
              {/* Attendance toggle */}
              <div className={`flex items-center justify-between mt-2 pt-2 ${dark ? 'border-t border-white/[0.06]' : 'border-t border-black/[0.05]'}`}>
                <span className={`text-xs font-medium ${dark ? 'text-white/40' : 'text-gray-500'}`}>Учёт посещаемости</span>
                <button
                  onClick={() => updateGroup(g.id, { attendanceEnabled: !g.attendanceEnabled })}
                  className={`relative w-10 h-5.5 rounded-full transition-colors press-scale ${
                    g.attendanceEnabled ? 'bg-green-500' : dark ? 'bg-white/[0.08]' : 'bg-black/[0.08]'
                  }`}
                >
                  <div className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform ${
                    g.attendanceEnabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </GlassCard>
          )
        })}
        {myGroups.length === 0 && (
          <p className={`text-center py-12 text-sm ${dark ? 'text-white/30' : 'text-gray-500'}`}>
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
          <DayPicker
            days={form.days}
            onChange={days => setForm(f => ({ ...f, days }))}
          />
          <div className="flex gap-3">
            <TimePicker
              label="Начало"
              value={form.timeFrom}
              onChange={v => setForm(f => ({ ...f, timeFrom: v }))}
            />
            <TimePicker
              label="Конец"
              value={form.timeTo}
              onChange={v => setForm(f => ({ ...f, timeTo: v }))}
            />
          </div>
          <input
            type="number"
            placeholder="Стоимость абонемента (₽)"
            value={form.subscriptionCost}
            onChange={e => setForm(f => ({ ...f, subscriptionCost: e.target.value }))}
            className={inputCls}
            inputMode="numeric"
          />
          {trainerSports.length > 1 && (
            <div>
              <div className={`text-xs uppercase font-semibold mb-2 ${dark ? 'text-white/40' : 'text-gray-500'}`}>Вид спорта</div>
              <div className="flex flex-wrap gap-2">
                {trainerSports.map(sId => {
                  const active = form.sportType === sId || (!form.sportType && sId === trainerSports[0])
                  return (
                    <button key={sId} type="button" onClick={() => setForm(f => ({ ...f, sportType: sId }))}
                      className={`px-3.5 py-2 rounded-2xl text-xs font-bold press-scale transition-all ${
                        active ? 'bg-accent text-white' : dark ? 'bg-white/[0.06] text-white/50 border border-white/[0.06]' : 'bg-white/70 text-gray-500 border border-white/60'
                      }`}
                    >
                      {getSportLabel(sId)}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
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
            <DayPicker
              days={editGroup.days || []}
              onChange={days => setEditGroup(g => ({ ...g, days }))}
            />
            <div className="flex gap-3">
              <TimePicker
                label="Начало"
                value={editGroup.timeFrom || ''}
                onChange={v => setEditGroup(g => ({ ...g, timeFrom: v }))}
              />
              <TimePicker
                label="Конец"
                value={editGroup.timeTo || ''}
                onChange={v => setEditGroup(g => ({ ...g, timeTo: v }))}
              />
            </div>
            <input
              type="number"
              placeholder="Стоимость"
              value={editGroup.subscriptionCost}
              onChange={e => setEditGroup(g => ({ ...g, subscriptionCost: e.target.value }))}
              className={inputCls}
              inputMode="numeric"
            />
            {trainerSports.length > 1 && (
              <div>
                <div className={`text-xs uppercase font-semibold mb-2 ${dark ? 'text-white/40' : 'text-gray-500'}`}>Вид спорта</div>
                <div className="flex flex-wrap gap-2">
                  {trainerSports.map(sId => {
                    const active = editGroup.sportType === sId
                    return (
                      <button key={sId} type="button" onClick={() => setEditGroup(g => ({ ...g, sportType: sId }))}
                        className={`px-3.5 py-2 rounded-2xl text-xs font-bold press-scale transition-all ${
                          active ? 'bg-accent text-white' : dark ? 'bg-white/[0.06] text-white/50 border border-white/[0.06]' : 'bg-white/70 text-gray-500 border border-white/60'
                        }`}
                      >
                        {getSportLabel(sId)}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
            <button type="submit" className="w-full py-3.5 rounded-[16px] bg-accent text-white font-bold press-scale">
              Сохранить
            </button>
          </form>
        )}
      </Modal>
    </Layout>
  )
}
