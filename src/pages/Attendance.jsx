import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Check, X, BarChart3, Users, Thermometer, HeartCrack, Zap } from 'lucide-react'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import GlassCard from '../components/GlassCard'
import Avatar from '../components/Avatar'

const STATUS_CONFIG = {
  sick: { label: 'Болеет', icon: Thermometer, color: 'text-yellow-400', bg: 'bg-yellow-500/15' },
  injury: { label: 'Травма', icon: HeartCrack, color: 'text-red-400', bg: 'bg-red-500/15' },
  skip: { label: 'Сачок', icon: Zap, color: 'text-purple-400', bg: 'bg-purple-500/15' },
}

function toDateStr(d) {
  return d.toISOString().split('T')[0]
}

function formatDayShort(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' })
}

function formatMonthYear(d) {
  return d.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
}

export default function Attendance() {
  const { groupId } = useParams()
  const { data, saveAttendanceBulk } = useData()
  const { dark } = useTheme()

  const [selectedDate, setSelectedDate] = useState(toDateStr(new Date()))
  const [tab, setTab] = useState('mark') // 'mark' | 'stats'
  const [saving, setSaving] = useState(false)
  const [localMarks, setLocalMarks] = useState({})
  const [dirty, setDirty] = useState(false)

  const group = data.groups.find(g => g.id === groupId)
  const students = data.students.filter(s => s.groupId === groupId).sort((a, b) => a.name.localeCompare(b.name))

  // Existing attendance for selected date
  const dayAttendance = useMemo(() => {
    const map = {}
    data.attendance
      .filter(a => a.groupId === groupId && a.date === selectedDate)
      .forEach(a => { map[a.studentId] = a.present })
    return map
  }, [data.attendance, groupId, selectedDate])

  // Merge server data with local edits
  const getPresent = (studentId) => {
    if (localMarks[studentId] !== undefined) return localMarks[studentId]
    if (dayAttendance[studentId] !== undefined) return dayAttendance[studentId]
    return null // not marked yet
  }

  const toggle = (studentId) => {
    const current = getPresent(studentId)
    const next = current === true ? false : true
    setLocalMarks(m => ({ ...m, [studentId]: next }))
    setDirty(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const records = students.map(s => ({
        studentId: s.id,
        present: getPresent(s.id) === true,
      }))
      await saveAttendanceBulk(groupId, selectedDate, records)
      setLocalMarks({})
      setDirty(false)
    } catch (e) {
      console.error('Save attendance failed:', e)
    }
    setSaving(false)
  }

  // Navigate dates
  const shiftDate = (days) => {
    const d = new Date(selectedDate + 'T00:00:00')
    d.setDate(d.getDate() + days)
    setSelectedDate(toDateStr(d))
    setLocalMarks({})
    setDirty(false)
  }

  const isToday = selectedDate === toDateStr(new Date())

  // Stats calculation for current month
  const statsDate = new Date(selectedDate + 'T00:00:00')
  const statsYear = statsDate.getFullYear()
  const statsMonth = statsDate.getMonth()

  const monthAttendance = useMemo(() => {
    const monthPrefix = `${statsYear}-${String(statsMonth + 1).padStart(2, '0')}`
    return data.attendance.filter(a => a.groupId === groupId && a.date.startsWith(monthPrefix))
  }, [data.attendance, groupId, statsYear, statsMonth])

  const studentStats = useMemo(() => {
    const map = {}
    students.forEach(s => { map[s.id] = { present: 0, absent: 0 } })
    monthAttendance.forEach(a => {
      if (!map[a.studentId]) return
      if (a.present) map[a.studentId].present++
      else map[a.studentId].absent++
    })
    return map
  }, [monthAttendance, students])

  // Count how many days had at least one record this month
  const totalDaysTracked = useMemo(() => {
    return new Set(monthAttendance.map(a => a.date)).size
  }, [monthAttendance])

  const presentCount = students.filter(s => getPresent(s.id) === true).length
  const absentCount = students.filter(s => getPresent(s.id) === false).length
  const unmarkedCount = students.filter(s => getPresent(s.id) === null).length

  if (!group) {
    return (
      <Layout>
        <PageHeader title="Посещаемость" back />
        <div className="px-4 py-12 text-center">
          <p className={dark ? 'text-white/40' : 'text-gray-500'}>Группа не найдена</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <PageHeader title={group.name} back>
        <div className="flex gap-1">
          <button
            onClick={() => setTab('mark')}
            className={`px-3 py-1 rounded-full text-xs font-bold press-scale transition-all ${
              tab === 'mark' ? 'bg-accent text-white' : dark ? 'bg-white/[0.06] text-white/50 border border-white/[0.06]' : 'bg-white/70 text-gray-400 border border-white/60 shadow-sm'
            }`}
          >
            <Users size={12} className="inline mr-1" />Отметить
          </button>
          <button
            onClick={() => setTab('stats')}
            className={`px-3 py-1 rounded-full text-xs font-bold press-scale transition-all ${
              tab === 'stats' ? 'bg-accent text-white' : dark ? 'bg-white/[0.06] text-white/50 border border-white/[0.06]' : 'bg-white/70 text-gray-400 border border-white/60 shadow-sm'
            }`}
          >
            <BarChart3 size={12} className="inline mr-1" />Статистика
          </button>
        </div>
      </PageHeader>

      <div className="px-4 space-y-3 slide-in">
        {/* Date navigator */}
        <div className="flex items-center justify-between">
          <button onClick={() => shiftDate(-1)} className="press-scale p-2">
            <ChevronLeft size={20} />
          </button>
          <div className="text-center">
            <div className="font-bold text-sm">{formatDayShort(selectedDate)}</div>
            {isToday && <div className="text-[10px] uppercase text-accent font-bold">Сегодня</div>}
          </div>
          <button onClick={() => shiftDate(1)} className="press-scale p-2">
            <ChevronRight size={20} />
          </button>
        </div>

        {tab === 'mark' && (
          <>
            {/* Summary pills */}
            <div className="flex gap-2 justify-center">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-500/15 text-green-400">
                {presentCount} пришли
              </span>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400">
                {absentCount} нет
              </span>
              {unmarkedCount > 0 && (
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${dark ? 'bg-white/[0.06] text-white/40 border border-white/[0.06]' : 'bg-white/70 text-gray-400 border border-white/60 shadow-sm'}`}>
                  {unmarkedCount} не отмечено
                </span>
              )}
            </div>

            {/* Student list */}
            <div className="space-y-1.5">
              {students.map(s => {
                const present = getPresent(s.id)
                return (
                  <button
                    key={s.id}
                    onClick={() => toggle(s.id)}
                    className={`
                      w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[16px] press-scale transition-all text-left
                      ${present === true
                        ? 'bg-green-500/10 border border-green-500/30'
                        : present === false
                          ? `${dark ? 'bg-red-500/5' : 'bg-red-50'} border border-red-500/20`
                          : dark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white/50 border border-white/60'
                      }
                    `}
                  >
                    <Avatar name={s.name} src={s.avatar} size={36} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm truncate">{s.name}</span>
                        {s.status && STATUS_CONFIG[s.status] && (() => {
                          const cfg = STATUS_CONFIG[s.status]
                          const Icon = cfg.icon
                          return (
                            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${cfg.bg} ${cfg.color}`}>
                              <Icon size={9} /> {cfg.label}
                            </span>
                          )
                        })()}
                      </div>
                      <div className={`text-[10px] ${dark ? 'text-white/30' : 'text-gray-500'}`}>
                        {s.belt || ''} {s.weight ? `• ${s.weight} кг` : ''}
                      </div>
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      present === true
                        ? 'bg-green-500 text-white'
                        : present === false
                          ? 'bg-red-500/20 text-red-400'
                          : dark ? 'bg-white/[0.08] text-white/20' : 'bg-white/60 text-gray-400'
                    }`}>
                      {present === true ? <Check size={16} strokeWidth={3} /> : present === false ? <X size={16} strokeWidth={3} /> : <div className="w-2 h-2 rounded-full bg-current" />}
                    </div>
                  </button>
                )
              })}
            </div>

            {students.length === 0 && (
              <p className={`text-center py-8 text-sm ${dark ? 'text-white/30' : 'text-gray-500'}`}>
                В группе пока нет учеников
              </p>
            )}

            {/* Save button */}
            {students.length > 0 && (
              <button
                onClick={handleSave}
                disabled={saving}
                className={`
                  w-full py-3.5 rounded-[16px] font-bold text-base press-scale transition-all
                  ${dirty
                    ? 'bg-accent text-white shadow-lg shadow-accent/25'
                    : 'bg-green-500 text-white'
                  }
                  disabled:opacity-50
                `}
              >
                {saving ? 'Сохранение...' : dirty ? 'Сохранить' : 'Сохранено ✓'}
              </button>
            )}
          </>
        )}

        {tab === 'stats' && (
          <>
            <GlassCard className="text-center">
              <div className={`text-xs uppercase font-semibold ${dark ? 'text-white/40' : 'text-gray-500'}`}>
                {formatMonthYear(statsDate)}
              </div>
              <div className="text-3xl font-black mt-1">{totalDaysTracked}</div>
              <div className={`text-[10px] uppercase ${dark ? 'text-white/30' : 'text-gray-500'}`}>тренировок отмечено</div>
            </GlassCard>

            <div className="space-y-1.5">
              {students.map(s => {
                const st = studentStats[s.id] || { present: 0, absent: 0 }
                const total = st.present + st.absent
                const pct = total > 0 ? Math.round((st.present / total) * 100) : 0
                return (
                  <GlassCard key={s.id} className="flex items-center gap-3">
                    <Avatar name={s.name} src={s.avatar} size={36} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{s.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={`h-1.5 rounded-full flex-1 ${dark ? 'bg-white/[0.08]' : 'bg-black/[0.06]'}`}>
                          <div
                            className={`h-full rounded-full transition-all ${
                              pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-lg font-black ${
                        pct >= 80 ? 'text-green-500' : pct >= 50 ? 'text-yellow-500' : 'text-red-500'
                      }`}>{pct}%</div>
                      <div className={`text-[9px] ${dark ? 'text-white/30' : 'text-gray-500'}`}>
                        {st.present}/{total}
                      </div>
                    </div>
                  </GlassCard>
                )
              })}
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
