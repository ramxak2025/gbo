import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, UserPlus, Phone, MessageCircle, X, Thermometer, HeartCrack, Zap } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import GlassCard from '../components/GlassCard'
import Avatar from '../components/Avatar'

function isExpired(dateStr) {
  if (!dateStr) return true
  return new Date(dateStr) < new Date()
}

const BELT_COLORS = {
  'Белый': '#e5e5e5', 'Синий': '#3b82f6', 'Фиолетовый': '#8b5cf6', 'Коричневый': '#92400e', 'Черный': '#1a1a1a',
}

const STATUS_CONFIG = {
  sick: { label: 'Болеет', icon: Thermometer, color: 'text-yellow-400', bg: 'bg-yellow-500/15' },
  injury: { label: 'Травма', icon: HeartCrack, color: 'text-red-400', bg: 'bg-red-500/15' },
  skip: { label: 'Сачок', icon: Zap, color: 'text-purple-400', bg: 'bg-purple-500/15' },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status]
  if (!cfg) return null
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${cfg.bg} ${cfg.color}`}>
      <Icon size={10} /> {cfg.label}
    </span>
  )
}

export default function Team() {
  const { auth } = useAuth()
  const { data } = useData()
  const { dark } = useTheme()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('students')

  if (auth.role === 'student') return <StudentTeam auth={auth} data={data} dark={dark} navigate={navigate} search={search} setSearch={setSearch} />

  const isAdmin = auth.role === 'superadmin'
  const trainers = data.users.filter(u => u.role === 'trainer')
  const students = isAdmin ? data.students : data.students.filter(s => s.trainerId === auth.userId)

  const filteredTrainers = trainers.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) || t.clubName?.toLowerCase().includes(search.toLowerCase())
  )
  const filteredStudents = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))

  const inputCls = `w-full pl-10 pr-4 py-2.5 rounded-[16px] text-sm outline-none ${dark ? 'bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-accent' : 'bg-black/[0.03] border border-black/[0.08] text-gray-900 placeholder-gray-400 focus:border-accent'}`

  return (
    <Layout>
      <PageHeader title={isAdmin ? 'Люди' : 'Команда'}>
        {auth.role === 'trainer' && <button onClick={() => navigate('/add-student')} className="press-scale p-2"><UserPlus size={20} /></button>}
        {isAdmin && <button onClick={() => navigate('/add-trainer')} className="press-scale p-2"><Plus size={20} /></button>}
      </PageHeader>
      <div className="px-4 space-y-4 slide-in">
        <div className="relative">
          <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${dark ? 'text-white/30' : 'text-gray-400'}`} />
          <input type="text" placeholder="Поиск по имени..." value={search} onChange={e => setSearch(e.target.value)} className={inputCls} />
        </div>
        {isAdmin && (
          <div className={`flex rounded-[16px] p-1 ${dark ? 'bg-white/5' : 'bg-black/[0.05]'}`}>
            {[{ key: 'students', label: `Спортсмены (${filteredStudents.length})` }, { key: 'trainers', label: `Тренеры (${filteredTrainers.length})` }].map(({ key, label }) => (
              <button key={key} onClick={() => setTab(key)} className={`flex-1 py-2 rounded-[12px] text-xs font-semibold transition-all ${tab === key ? (dark ? 'bg-white/10 text-white' : 'bg-white text-gray-900 shadow-sm') : (dark ? 'text-white/40' : 'text-gray-400')}`}>{label}</button>
            ))}
          </div>
        )}
        <div className="space-y-2">
          {(isAdmin && tab === 'trainers' ? filteredTrainers : filteredStudents).map(person => {
            const isTrainer = tab === 'trainers' && isAdmin
            if (isTrainer) {
              const count = data.students.filter(s => s.trainerId === person.id).length
              return (
                <GlassCard key={person.id} onClick={() => navigate(`/trainer/${person.id}`)} className="flex items-center gap-3">
                  <Avatar name={person.name} src={person.avatar} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-sm truncate">{person.name}</div>
                    <div className={`text-xs ${dark ? 'text-white/40' : 'text-gray-400'}`}>{person.clubName}</div>
                  </div>
                  <span className={`text-xs ${dark ? 'text-white/30' : 'text-gray-400'}`}>{count} чел.</span>
                </GlassCard>
              )
            }
            const expired = isExpired(person.subscriptionExpiresAt)
            const trainerName = isAdmin ? data.users.find(u => u.id === person.trainerId)?.clubName : null
            return (
              <GlassCard key={person.id} onClick={() => navigate(`/student/${person.id}`)} className="flex items-center gap-3">
                <Avatar name={person.name} src={person.avatar} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm truncate">{person.name}</span>
                    {person.status && <StatusBadge status={person.status} />}
                  </div>
                  <div className={`text-xs ${dark ? 'text-white/40' : 'text-gray-400'}`}>
                    {isAdmin ? trainerName : (person.belt || '—')}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {person.belt && <div className="w-4 h-2 rounded-full border border-white/20" style={{ backgroundColor: BELT_COLORS[person.belt] || '#888' }} />}
                  <div className={`w-2.5 h-2.5 rounded-full ${expired ? 'bg-red-500' : 'bg-green-500'}`} />
                </div>
              </GlassCard>
            )
          })}
          {(isAdmin && tab === 'trainers' ? filteredTrainers : filteredStudents).length === 0 && (
            <p className={`text-center py-8 text-sm ${dark ? 'text-white/30' : 'text-gray-400'}`}>{search ? 'Никого не найдено' : 'Список пуст'}</p>
          )}
        </div>
      </div>
    </Layout>
  )
}

function StudentTeam({ auth, data, dark, navigate, search, setSearch }) {
  const student = data.students.find(s => s.id === auth.studentId)
  const teammates = data.students.filter(s => s.groupId === student?.groupId && s.id !== auth.studentId)
  const group = data.groups.find(g => g.id === student?.groupId)
  const [selected, setSelected] = useState(null)

  const filtered = teammates.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))

  const inputCls = `w-full pl-10 pr-4 py-2.5 rounded-[16px] text-sm outline-none ${dark ? 'bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-accent' : 'bg-black/[0.03] border border-black/[0.08] text-gray-900 placeholder-gray-400 focus:border-accent'}`

  const cleanPhone = (phone) => phone?.replace(/[^\d+]/g, '') || ''

  return (
    <Layout>
      <PageHeader title="Моя команда" />
      <div className="px-4 space-y-4 slide-in">
        {group && (
          <GlassCard>
            <div className="font-bold">{group.name}</div>
            <div className={`text-xs ${dark ? 'text-white/40' : 'text-gray-400'}`}>{group.schedule}</div>
          </GlassCard>
        )}
        <div className="relative">
          <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${dark ? 'text-white/30' : 'text-gray-400'}`} />
          <input type="text" placeholder="Поиск..." value={search} onChange={e => setSearch(e.target.value)} className={inputCls} />
        </div>
        <div className="space-y-2">
          {filtered.map(s => {
            const cfg = s.status ? STATUS_CONFIG[s.status] : null
            return (
              <GlassCard key={s.id} onClick={() => setSelected(s)} className="flex items-center gap-3">
                <Avatar name={s.name} src={s.avatar} size={48} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm truncate">{s.name}</span>
                  </div>
                  <div className={`text-xs ${dark ? 'text-white/40' : 'text-gray-400'}`}>{s.belt || '—'}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {s.status && <StatusBadge status={s.status} />}
                </div>
              </GlassCard>
            )
          })}
          {filtered.length === 0 && (
            <p className={`text-center py-8 text-sm ${dark ? 'text-white/30' : 'text-gray-400'}`}>Нет одногруппников</p>
          )}
        </div>
      </div>

      {/* Teammate detail modal */}
      {selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            onClick={e => e.stopPropagation()}
            className={`relative w-full max-w-xs rounded-[28px] overflow-hidden slide-in ${dark ? 'bg-dark-800' : 'bg-white'}`}
          >
            {/* Large avatar */}
            <div className="flex justify-center pt-6 pb-4">
              <Avatar name={selected.name} src={selected.avatar} size={120} className="shadow-xl" />
            </div>
            <div className="px-5 pb-5 text-center space-y-3">
              <div>
                <h2 className="text-xl font-bold">{selected.name}</h2>
                <p className={`text-sm ${dark ? 'text-white/40' : 'text-gray-400'}`}>{selected.belt || '—'}</p>
              </div>

              {selected.status && (
                <div className="flex justify-center">
                  <StatusBadge status={selected.status} />
                </div>
              )}

              {selected.phone && (
                <div className={`flex items-center justify-center gap-2 text-sm ${dark ? 'text-white/60' : 'text-gray-500'}`}>
                  <Phone size={14} />
                  <span>{selected.phone}</span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                {selected.phone && (
                  <a
                    href={`https://wa.me/${cleanPhone(selected.phone)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 rounded-[14px] bg-green-600 text-white font-bold text-sm flex items-center justify-center gap-2 press-scale"
                  >
                    <MessageCircle size={16} />
                    WhatsApp
                  </a>
                )}
                <button
                  onClick={() => setSelected(null)}
                  className={`flex-1 py-2.5 rounded-[14px] font-bold text-sm flex items-center justify-center gap-2 press-scale ${dark ? 'bg-white/10' : 'bg-black/[0.05]'}`}
                >
                  <X size={16} />
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
