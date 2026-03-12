import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, TrendingUp, TrendingDown, AlertCircle, Newspaper, Calendar, Flame, Clock, Thermometer, HeartCrack, Zap, Swords, MapPin, Megaphone, Plus, ClipboardList, Award, ChevronRight, Dumbbell, CreditCard, Shield, UserPlus, Check, X, Instagram, Globe, MessageCircle, Code, Play, Film, Trash2, Trophy, Target, Sparkles, BarChart3, Activity, Wallet, Star } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import { api } from '../utils/api'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import GlassCard from '../components/GlassCard'
import Avatar from '../components/Avatar'
import Modal from '../components/Modal'
import { getRankLabel, getSportLabel, SPORT_TYPES } from '../utils/sports'

const STATUS_CONFIG = {
  sick: { label: 'Болеет', icon: Thermometer, color: 'text-yellow-400', bg: 'bg-yellow-500/15', border: 'border-yellow-500/30' },
  injury: { label: 'Травма', icon: HeartCrack, color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/30' },
  skip: { label: 'Сачок', icon: Zap, color: 'text-purple-400', bg: 'bg-purple-500/15', border: 'border-purple-500/30' },
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

function isExpired(dateStr) {
  if (!dateStr) return true
  return new Date(dateStr) < new Date()
}

function daysUntil(dateStr) {
  if (!dateStr) return 0
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / 86400000))
}

function Countdown({ date }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(t)
  }, [])
  const diff = new Date(date).getTime() - now
  if (diff <= 0) return <span className="text-sm font-bold text-accent">Сегодня!</span>
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  return (
    <div className="flex items-center gap-3">
      <div className="text-center">
        <div className="text-2xl font-black number-pop">{days}</div>
        <div className="text-[10px] uppercase opacity-50">дней</div>
      </div>
      <span className="text-xl font-bold opacity-30">:</span>
      <div className="text-center">
        <div className="text-2xl font-black number-pop" style={{ animationDelay: '0.1s' }}>{hours}</div>
        <div className="text-[10px] uppercase opacity-50">часов</div>
      </div>
    </div>
  )
}

function CircleProgress({ value, max, size = 52, strokeWidth = 4, color = '#dc2626', children, dark }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(value / max, 1)
  const offset = circumference * (1 - progress)
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'} strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="ring-progress"
          style={{ '--ring-circumference': circumference }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  )
}

function SectionTitle({ dark, children, action, onAction }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className={`text-xs uppercase font-bold tracking-wider ${dark ? 'text-white/40' : 'text-gray-500'}`}>{children}</h2>
      {action && (
        <button onClick={onAction} className="text-accent text-xs font-semibold press-scale flex items-center gap-0.5">
          {action} <ChevronRight size={12} />
        </button>
      )}
    </div>
  )
}

function StatCard({ icon: Icon, value, label, color, gradient, dark, delay = 0 }) {
  return (
    <div className={`rounded-[20px] p-3.5 relative overflow-hidden backdrop-blur-xl transition-all ${
      dark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-white/60 border border-white/50 shadow-[0_2px_12px_rgba(0,0,0,0.04)]'
    }`} style={{ animationDelay: `${delay}ms` }}>
      <div className={`absolute -top-6 -right-6 w-16 h-16 rounded-full blur-2xl opacity-20 bg-gradient-to-br ${gradient}`} />
      <div className="relative">
        <div className={`w-9 h-9 rounded-[12px] flex items-center justify-center mb-2 bg-gradient-to-br ${gradient}`}>
          <Icon size={16} className="text-white" />
        </div>
        <div className="text-2xl font-black leading-none number-pop" style={{ animationDelay: `${delay + 200}ms` }}>{value}</div>
        <div className={`text-[10px] uppercase font-semibold mt-1 tracking-wide ${dark ? 'text-white/30' : 'text-gray-400'}`}>{label}</div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { auth } = useAuth()
  const { data } = useData()
  const { dark } = useTheme()
  const navigate = useNavigate()

  if (auth.role === 'superadmin') return <SuperAdminDash data={data} dark={dark} navigate={navigate} />
  if (auth.role === 'trainer') return <TrainerDash auth={auth} data={data} dark={dark} navigate={navigate} />
  return <StudentDash auth={auth} data={data} dark={dark} navigate={navigate} />
}

/* ======================== SUPER ADMIN ======================== */
function SuperAdminDash({ data, dark, navigate }) {
  const { reload } = useData()
  const allTrainers = data.users.filter(u => u.role === 'trainer' && !u.isDemo)
  const pendingRegs = data.pendingRegistrations || []
  const [cityFilter, setCityFilter] = useState('')
  const [sportFilter, setSportFilter] = useState('')
  const [processing, setProcessing] = useState(null)

  const handleApprove = async (id) => {
    if (processing) return
    setProcessing(id)
    try {
      await api.approveRegistration(id)
      reload()
    } catch (err) {
      alert(err.message)
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (id) => {
    if (processing) return
    if (!confirm('Отклонить заявку?')) return
    setProcessing(id)
    try {
      await api.rejectRegistration(id)
      reload()
    } catch (err) {
      alert(err.message)
    } finally {
      setProcessing(null)
    }
  }

  const cities = [...new Set(allTrainers.filter(t => t.city).map(t => t.city))].sort()
  const sports = [...new Set(allTrainers.filter(t => t.sportType).map(t => t.sportType))]

  let trainers = allTrainers
  if (cityFilter) trainers = trainers.filter(t => t.city === cityFilter)
  if (sportFilter) trainers = trainers.filter(t => t.sportType === sportFilter)
  const trainerIds = new Set(trainers.map(t => t.id))
  const filteredStudents = data.students.filter(s => !s.isDemo && trainerIds.has(s.trainerId))
  const activeStudents = filteredStudents.filter(s => !isExpired(s.subscriptionExpiresAt))
  const clubs = data.clubs || []

  return (
    <Layout>
      <PageHeader title="iBorcuha" logo gradient />
      <div className="px-4 space-y-4 slide-in stagger">

        {/* Stats Overview — Gradient hero cards */}
        <div className="grid grid-cols-2 gap-2.5">
          <StatCard icon={Shield} value={trainers.length} label="Тренеры" gradient="from-blue-500 to-cyan-500" dark={dark} delay={0} />
          <StatCard icon={Users} value={filteredStudents.length} label="Спортсмены" gradient="from-accent to-rose-500" dark={dark} delay={60} />
          <StatCard icon={Activity} value={activeStudents.length} label="Активных" gradient="from-green-500 to-emerald-500" dark={dark} delay={120} />
          <StatCard icon={Trophy} value={clubs.length} label="Клубы" gradient="from-purple-500 to-violet-500" dark={dark} delay={180} />
        </div>

        {/* Filters */}
        {(cities.length > 0 || sports.length > 0) && (
          <div className="space-y-2">
            <div className="overflow-x-auto -mx-4 px-4 pb-1">
              <div className="flex gap-2" style={{ minWidth: 'max-content' }}>
                <button
                  onClick={() => setCityFilter('')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold press-scale whitespace-nowrap flex items-center gap-1.5 transition-all ${
                    !cityFilter ? 'bg-accent text-white shadow-lg shadow-accent/25' : dark ? 'bg-white/[0.06] text-white/60 border border-white/[0.06]' : 'bg-white/70 text-gray-500 border border-white/60 shadow-sm'
                  }`}
                >Все города</button>
                {cities.map(city => (
                  <button
                    key={city}
                    onClick={() => setCityFilter(cityFilter === city ? '' : city)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold press-scale whitespace-nowrap flex items-center gap-1.5 transition-all ${
                      cityFilter === city ? 'bg-accent text-white shadow-lg shadow-accent/25' : dark ? 'bg-white/[0.06] text-white/60 border border-white/[0.06]' : 'bg-white/70 text-gray-500 border border-white/60 shadow-sm'
                    }`}
                  ><MapPin size={11} />{city}</button>
                ))}
              </div>
            </div>
            {sports.length > 0 && (
              <div className="overflow-x-auto -mx-4 px-4 pb-1">
                <div className="flex gap-2" style={{ minWidth: 'max-content' }}>
                  <button
                    onClick={() => setSportFilter('')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold press-scale whitespace-nowrap transition-all ${
                      !sportFilter ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25' : dark ? 'bg-white/[0.06] text-white/60 border border-white/[0.06]' : 'bg-white/70 text-gray-500 border border-white/60 shadow-sm'
                    }`}
                  >Все виды</button>
                  {sports.map(s => (
                    <button
                      key={s}
                      onClick={() => setSportFilter(sportFilter === s ? '' : s)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold press-scale whitespace-nowrap transition-all ${
                        sportFilter === s ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25' : dark ? 'bg-white/[0.06] text-white/60 border border-white/[0.06]' : 'bg-white/70 text-gray-500 border border-white/60 shadow-sm'
                      }`}
                    >{getSportLabel(s)}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pending registrations */}
        {pendingRegs.length > 0 && (
          <div>
            <SectionTitle dark={dark}>
              <span className="flex items-center gap-1.5">
                <UserPlus size={12} className="text-orange-400" />
                Заявки на регистрацию
                <span className="ml-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-bold shadow-lg shadow-orange-500/25 bounce-in">{pendingRegs.length}</span>
              </span>
            </SectionTitle>
            <div className="space-y-2">
              {pendingRegs.map(r => (
                <div key={r.id} className={`rounded-[20px] p-4 backdrop-blur-xl relative overflow-hidden ${
                  dark ? 'bg-gradient-to-r from-orange-500/[0.06] to-amber-500/[0.04] border border-orange-500/20' : 'bg-gradient-to-r from-orange-50/80 to-amber-50/60 border border-orange-200/60 shadow-sm'
                }`}>
                  <div className={`absolute -top-8 -right-8 w-20 h-20 rounded-full blur-2xl ${dark ? 'bg-orange-500/10' : 'bg-orange-200/40'}`} />
                  <div className="relative flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold truncate">{r.name}</div>
                      <div className={`text-xs ${dark ? 'text-white/50' : 'text-gray-600'}`}>
                        {r.clubName || 'Без названия'}
                      </div>
                      <div className={`text-xs mt-1 flex flex-wrap gap-x-2 gap-y-0.5 ${dark ? 'text-white/35' : 'text-gray-500'}`}>
                        <span>{r.phone}</span>
                        {r.sportType && <span>{getSportLabel(r.sportType)}</span>}
                        {r.city && <span className="flex items-center gap-0.5"><MapPin size={9} />{r.city}</span>}
                      </div>
                      {r.plainPassword && (
                        <div className={`text-[10px] mt-1 ${dark ? 'text-white/25' : 'text-gray-400'}`}>
                          Пароль: {r.plainPassword}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleApprove(r.id)}
                        disabled={processing === r.id}
                        className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center press-scale shadow-lg shadow-green-500/25"
                      >
                        <Check size={18} className="text-white" />
                      </button>
                      <button
                        onClick={() => handleReject(r.id)}
                        disabled={processing === r.id}
                        className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center press-scale shadow-lg shadow-red-500/25"
                      >
                        <X size={18} className="text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Clubs */}
        {clubs.length > 0 && (
          <div>
            <SectionTitle dark={dark} action="Все" onAction={() => navigate('/clubs')}>Клубы</SectionTitle>
            <div className="space-y-2">
              {clubs.slice(0, 3).map(club => {
                const clubTrainers = data.users.filter(u => u.role === 'trainer' && u.clubId === club.id)
                const headT = clubTrainers.find(t => t.isHeadTrainer)
                const clubStudents = data.students.filter(s => clubTrainers.some(t => t.id === s.trainerId))
                return (
                  <div key={club.id} onClick={() => navigate(`/club/${club.id}`)} className={`rounded-[20px] p-4 backdrop-blur-xl press-scale cursor-pointer relative overflow-hidden transition-all ${
                    dark ? 'bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.07]' : 'bg-white/60 border border-white/50 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)]'
                  }`}>
                    <div className={`absolute -top-8 -right-8 w-20 h-20 rounded-full blur-2xl ${dark ? 'bg-blue-500/8' : 'bg-blue-100/40'}`} />
                    <div className="relative flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center shrink-0 bg-gradient-to-br ${
                        dark ? 'from-blue-500/20 to-cyan-500/20' : 'from-blue-100 to-cyan-50'
                      }`}>
                        <Shield size={20} className={dark ? 'text-blue-400' : 'text-blue-600'} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold truncate">{club.name}</div>
                        <div className={`text-xs ${dark ? 'text-white/40' : 'text-gray-500'} flex items-center gap-1 flex-wrap`}>
                          {headT && <span>{headT.name}</span>}
                          {club.city && <><span>•</span><MapPin size={10} />{club.city}</>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-center">
                          <div className="text-sm font-black">{clubTrainers.length}</div>
                          <div className={`text-[8px] uppercase ${dark ? 'text-white/25' : 'text-gray-400'}`}>трен.</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-black">{clubStudents.length}</div>
                          <div className={`text-[8px] uppercase ${dark ? 'text-white/25' : 'text-gray-400'}`}>учен.</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Trainers */}
        <div>
          <SectionTitle dark={dark}>Тренеры</SectionTitle>
          <div className="space-y-2">
            {trainers.map(t => {
              const count = data.students.filter(s => s.trainerId === t.id && !s.isDemo).length
              const active = data.students.filter(s => s.trainerId === t.id && !s.isDemo && !isExpired(s.subscriptionExpiresAt)).length
              return (
                <div key={t.id} onClick={() => navigate(`/trainer/${t.id}`)} className={`rounded-[20px] p-4 backdrop-blur-xl press-scale cursor-pointer transition-all ${
                  dark ? 'bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.07]' : 'bg-white/60 border border-white/50 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)]'
                }`}>
                  <div className="flex items-center gap-3">
                    <Avatar name={t.name} src={t.avatar} size={44} />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold truncate">{t.clubName || t.name}</div>
                      <div className={`text-xs ${dark ? 'text-white/40' : 'text-gray-500'} flex items-center gap-1 flex-wrap`}>
                        {t.name}
                        {t.city && <><span>•</span><MapPin size={10} />{t.city}</>}
                        {t.sportType && <><span>•</span>{getSportLabel(t.sportType)}</>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        dark ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-50 text-blue-600'
                      }`}>
                        <Users size={11} className="inline mr-1" />{count}
                      </div>
                      {active > 0 && (
                        <div className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                          dark ? 'bg-green-500/15 text-green-400' : 'bg-green-50 text-green-600'
                        }`}>
                          {active} акт.
                        </div>
                      )}
                    </div>
                  </div>
                  {t.plainPassword && (
                    <div className={`mt-2 pt-2 text-[10px] flex items-center gap-2 ${dark ? 'border-t border-white/[0.06] text-white/25' : 'border-t border-black/[0.05] text-gray-300'}`}>
                      <span>Тел: {t.phone}</span>
                      <span>•</span>
                      <span>Пароль: {t.plainPassword}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Upcoming Tournaments */}
        <div>
          <SectionTitle dark={dark}>Ближайшие турниры</SectionTitle>
          <div className="space-y-2">
            {data.tournaments.sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 3).map(t => (
              <GlassCard key={t.id} onClick={() => navigate(`/tournaments/${t.id}`)}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0 bg-gradient-to-br ${
                    dark ? 'from-accent/20 to-orange-500/20' : 'from-red-50 to-orange-50'
                  }`}>
                    <Trophy size={18} className="text-accent" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold truncate">{t.title}</div>
                    <div className={`text-xs mt-0.5 flex items-center gap-1 ${dark ? 'text-white/40' : 'text-gray-500'}`}>
                      <Calendar size={11} />{formatDate(t.date)} — {t.location}
                    </div>
                  </div>
                  <ChevronRight size={16} className={dark ? 'text-white/15' : 'text-gray-300'} />
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}

/* ======================== TRAINER ======================== */
function TrainerDash({ auth, data, dark, navigate }) {
  const { addNews, deleteNews } = useData()
  const trainer = auth.user
  const myStudents = data.students.filter(s => s.trainerId === auth.userId)
  const myGroups = data.groups.filter(g => g.trainerId === auth.userId)
  const myTx = data.transactions.filter(t => t.trainerId === auth.userId)
  const myNews = data.news.filter(n => n.trainerId === auth.userId)

  const [showNews, setShowNews] = useState(false)
  const [newsForm, setNewsForm] = useState({ title: '', content: '', groupId: '__all__' })

  const stats = useMemo(() => {
    const active = myStudents.filter(s => !isExpired(s.subscriptionExpiresAt)).length
    const debtors = myStudents.filter(s => isExpired(s.subscriptionExpiresAt)).length
    const income = myTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
    const expense = myTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
    return { total: myStudents.length, active, debtors, income, expense, balance: income - expense }
  }, [myStudents, myTx])

  const handleAddNews = (e) => {
    e.preventDefault()
    if (!newsForm.title.trim()) return
    addNews({
      trainerId: auth.userId,
      groupId: newsForm.groupId === '__all__' ? null : newsForm.groupId,
      title: newsForm.title.trim(),
      content: newsForm.content.trim(),
    })
    setNewsForm({ title: '', content: '', groupId: '__all__' })
    setShowNews(false)
  }

  const inputCls = `
    w-full px-4 py-3 rounded-[16px] text-base outline-none transition-all
    ${dark
      ? 'bg-white/[0.07] border border-white/[0.08] text-white placeholder-white/25 focus:border-purple-500/50 focus:bg-white/[0.1]'
      : 'bg-white/70 border border-white/60 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] shadow-sm'
    }
  `

  const sportLabel = getSportLabel(trainer?.sportType)
  const activePercent = stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0

  return (
    <Layout>
      <PageHeader title={trainer?.clubName || 'Мой клуб'} logo />
      <div className="px-4 space-y-4 slide-in stagger">

        {/* Hero — Club identity with gradient ring */}
        <div
          onClick={() => navigate('/profile')}
          className={`rounded-[28px] p-5 relative overflow-hidden backdrop-blur-xl press-scale cursor-pointer ${
          dark
            ? 'bg-gradient-to-br from-purple-500/12 via-white/[0.04] to-accent/12 border border-white/[0.08]'
            : 'bg-gradient-to-br from-purple-50/90 via-white/80 to-red-50/90 border border-white/70 shadow-[0_8px_40px_rgba(0,0,0,0.06)]'
        }`}>
          <div className={`absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl ${dark ? 'bg-purple-500/10' : 'bg-purple-200/40'}`} />
          <div className={`absolute -bottom-12 -left-12 w-32 h-32 rounded-full blur-2xl ${dark ? 'bg-accent/8' : 'bg-red-100/30'}`} />
          <div className="relative flex items-center gap-4">
            <div className={`p-[3px] rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500`}>
              <div className={`rounded-full p-[2px] ${dark ? 'bg-[#0a0a12]' : 'bg-white'}`}>
                <Avatar name={trainer?.name || 'T'} src={trainer?.avatar} size={60} />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-black truncate">{trainer?.clubName || 'Мой клуб'}</h2>
              <p className={`text-sm truncate ${dark ? 'text-white/50' : 'text-gray-600'}`}>{trainer?.name}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {trainer?.sportType && (
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    dark ? 'bg-accent/20 text-accent-light' : 'bg-red-100 text-red-600'
                  }`}>{sportLabel}</span>
                )}
                {trainer?.city && (
                  <span className={`text-[10px] font-medium flex items-center gap-0.5 ${dark ? 'text-white/35' : 'text-gray-500'}`}>
                    <MapPin size={9} />{trainer.city}
                  </span>
                )}
              </div>
            </div>
            <ChevronRight size={20} className={dark ? 'text-white/20' : 'text-gray-300'} />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => { setNewsForm({ title: '', content: '', groupId: '__all__' }); setShowNews(true) }}
            className={`py-3.5 rounded-[20px] font-bold text-sm press-scale flex items-center justify-center gap-2 shadow-lg transition-all ${
              dark
                ? 'bg-gradient-to-r from-accent to-purple-600 text-white shadow-accent/25'
                : 'bg-gradient-to-r from-accent to-purple-600 text-white shadow-accent/30'
            }`}
          >
            <Megaphone size={18} />
            Новость
          </button>
          <button
            onClick={() => navigate('/add-student')}
            className={`py-3.5 rounded-[20px] font-bold text-sm press-scale flex items-center justify-center gap-2 transition-all ${
              dark
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25'
                : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30'
            }`}
          >
            <UserPlus size={18} />
            Ученик
          </button>
        </div>

        {/* Stats grid — enhanced with circle progress */}
        <div className="grid grid-cols-3 gap-2">
          <StatCard icon={Users} value={stats.total} label="Всего" gradient="from-blue-500 to-cyan-500" dark={dark} delay={0} />
          <div className={`rounded-[20px] p-3.5 relative overflow-hidden backdrop-blur-xl ${
            dark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-white/60 border border-white/50 shadow-[0_2px_12px_rgba(0,0,0,0.04)]'
          }`}>
            <div className={`absolute -top-6 -right-6 w-16 h-16 rounded-full blur-2xl opacity-20 bg-gradient-to-br from-green-500 to-emerald-500`} />
            <div className="relative flex flex-col items-center">
              <CircleProgress value={stats.active} max={Math.max(stats.total, 1)} size={48} strokeWidth={4} color="#22c55e" dark={dark}>
                <span className="text-lg font-black number-pop">{stats.active}</span>
              </CircleProgress>
              <div className={`text-[10px] uppercase font-semibold mt-1.5 tracking-wide ${dark ? 'text-white/30' : 'text-gray-400'}`}>Активных</div>
            </div>
          </div>
          <StatCard icon={AlertCircle} value={stats.debtors} label="Должников" gradient="from-accent to-rose-500" dark={dark} delay={120} />
        </div>

        {/* Balance — Premium card */}
        <div className={`rounded-[24px] p-5 relative overflow-hidden ${
          dark
            ? 'bg-gradient-to-br from-emerald-500/10 via-white/[0.03] to-green-600/10 border border-green-500/15'
            : 'bg-gradient-to-br from-emerald-50 via-green-50/50 to-teal-50 border border-green-200/40 shadow-[0_6px_28px_rgba(34,197,94,0.08)]'
        }`}>
          <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl ${dark ? 'bg-green-500/8' : 'bg-green-200/30'}`} />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-9 h-9 rounded-[12px] flex items-center justify-center bg-gradient-to-br from-green-500 to-emerald-600`}>
                <Wallet size={16} className="text-white" />
              </div>
              <span className={`text-[10px] uppercase font-bold tracking-widest ${dark ? 'text-white/35' : 'text-gray-400'}`}>Баланс</span>
            </div>
            <div className="flex items-end justify-between">
              <div className={`text-3xl font-black ${stats.balance >= 0 ? 'text-green-500' : 'text-accent'}`}>
                {stats.balance.toLocaleString('ru-RU')} <span className="text-lg">₽</span>
              </div>
              <div className="text-right space-y-0.5">
                <div className="flex items-center gap-1 text-green-500 text-xs font-semibold">
                  <TrendingUp size={12} />+{stats.income.toLocaleString('ru-RU')} ₽
                </div>
                <div className="flex items-center gap-1 text-accent text-xs font-semibold">
                  <TrendingDown size={12} />-{stats.expense.toLocaleString('ru-RU')} ₽
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Groups */}
        <div>
          <SectionTitle dark={dark} action="Все" onAction={() => navigate('/groups')}>Группы</SectionTitle>
          <div className="space-y-2">
            {myGroups.map((g, idx) => {
              const count = myStudents.filter(s => s.groupId === g.id).length
              const groupActive = myStudents.filter(s => s.groupId === g.id && !isExpired(s.subscriptionExpiresAt)).length
              return (
                <div key={g.id} className={`rounded-[20px] p-4 backdrop-blur-xl transition-all ${
                  dark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-white/60 border border-white/50 shadow-[0_2px_12px_rgba(0,0,0,0.04)]'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br ${
                          ['from-purple-500 to-violet-600', 'from-blue-500 to-cyan-600', 'from-green-500 to-emerald-600', 'from-orange-500 to-amber-600'][idx % 4]
                        }`}>
                          <Dumbbell size={14} className="text-white" />
                        </div>
                        <div>
                          <div className="font-bold text-sm">{g.name}</div>
                          <div className={`text-[11px] ${dark ? 'text-white/35' : 'text-gray-400'}`}>{g.schedule}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {g.attendanceEnabled && (
                        <button onClick={() => navigate(`/attendance/${g.id}`)} className="press-scale p-2 rounded-xl bg-green-500/15 transition-colors hover:bg-green-500/25">
                          <ClipboardList size={15} className="text-green-400" />
                        </button>
                      )}
                      <div className="text-right">
                        <div className={`text-xs font-bold ${dark ? 'text-white/60' : 'text-gray-600'}`}>{count} чел.</div>
                        <div className="text-[10px] text-accent font-bold">{g.subscriptionCost?.toLocaleString('ru-RU')} ₽</div>
                      </div>
                    </div>
                  </div>
                  {count > 0 && (
                    <div className="mt-2.5">
                      <div className={`h-1.5 rounded-full overflow-hidden ${dark ? 'bg-white/[0.06]' : 'bg-black/[0.05]'}`}>
                        <div className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400 progress-fill"
                          style={{ width: `${count > 0 ? (groupActive / count) * 100 : 0}%` }} />
                      </div>
                      <div className={`flex justify-between mt-1 text-[9px] ${dark ? 'text-white/25' : 'text-gray-400'}`}>
                        <span>{groupActive} активных</span>
                        <span>{count - groupActive} неоплач.</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            {myGroups.length === 0 && (
              <div className={`text-center py-6 rounded-[20px] ${dark ? 'bg-white/[0.03] border border-dashed border-white/[0.08]' : 'bg-white/40 border border-dashed border-gray-200'}`}>
                <Dumbbell size={24} className={`mx-auto mb-2 ${dark ? 'text-white/20' : 'text-gray-300'}`} />
                <p className={`text-sm font-medium ${dark ? 'text-white/30' : 'text-gray-400'}`}>Нет групп. Создайте первую!</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent news */}
        {myNews.length > 0 && (
          <div>
            <SectionTitle dark={dark}>Последние новости</SectionTitle>
            <div className="space-y-2">
              {myNews.slice(-3).reverse().map(n => {
                const g = myGroups.find(g => g.id === n.groupId)
                return (
                  <GlassCard key={n.id}>
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        dark ? 'bg-accent/15' : 'bg-red-50'
                      }`}>
                        <Newspaper size={14} className="text-accent" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm">{n.title}</div>
                        <div className={`text-xs mt-0.5 ${dark ? 'text-white/40' : 'text-gray-500'}`}>
                          {n.groupId ? g?.name || '—' : 'Все группы'} — {n.content?.slice(0, 50)}{n.content?.length > 50 ? '...' : ''}
                        </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); if (confirm('Удалить новость?')) deleteNews(n.id) }} className="press-scale p-1.5 shrink-0 rounded-full hover:bg-red-500/10 transition-colors">
                        <Trash2 size={14} className="text-red-400" />
                      </button>
                    </div>
                  </GlassCard>
                )
              })}
            </div>
          </div>
        )}

        {/* Author / About project */}
        <AuthorBlock data={data} dark={dark} navigate={navigate} />
      </div>

      {/* News creation modal */}
      <Modal open={showNews} onClose={() => setShowNews(false)} title="Новая новость">
        <form onSubmit={handleAddNews} className="space-y-3">
          <select
            value={newsForm.groupId}
            onChange={e => setNewsForm(f => ({ ...f, groupId: e.target.value }))}
            className={inputCls}
          >
            <option value="__all__">Все группы</option>
            {myGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <input
            type="text"
            placeholder="Заголовок"
            value={newsForm.title}
            onChange={e => setNewsForm(f => ({ ...f, title: e.target.value }))}
            className={inputCls}
          />
          <textarea
            placeholder="Текст новости"
            value={newsForm.content}
            onChange={e => setNewsForm(f => ({ ...f, content: e.target.value }))}
            className={`${inputCls} min-h-[100px] resize-none`}
            rows={3}
          />
          <button type="submit" className="w-full py-3.5 rounded-[16px] bg-gradient-to-r from-accent to-purple-600 text-white font-bold press-scale shadow-lg shadow-accent/25">
            Опубликовать
          </button>
        </form>
      </Modal>
    </Layout>
  )
}

/* ======================== AUTHOR BLOCK (for trainer dash) ======================== */
function AuthorBlock({ data, dark, navigate }) {
  const info = data.authorInfo || {}
  if (!info.name) return null

  const cleanPhone = (phone) => phone?.replace(/[^\d]/g, '') || ''

  return (
    <div className="pt-2">
      <div className={`rounded-[24px] p-5 text-center relative overflow-hidden ${
        dark
          ? 'bg-gradient-to-br from-purple-500/5 via-white/[0.02] to-indigo-500/5 border border-white/[0.06]'
          : 'bg-gradient-to-br from-purple-50/50 via-white/60 to-indigo-50/50 border border-white/60 shadow-sm'
      }`}>
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold mb-3 ${
          dark ? 'bg-accent/15 text-accent' : 'bg-accent/10 text-accent'
        }`}>
          <Code size={10} />
          Проект разработал
        </div>
        <div className="flex items-center justify-center gap-3 mb-2">
          <h3 className="text-base font-black italic">{info.name}</h3>
        </div>
        {info.description && (
          <p className={`text-xs mb-3 ${dark ? 'text-white/40' : 'text-gray-500'}`}>{info.description}</p>
        )}
        <div className="flex items-center justify-center gap-3">
          {info.instagram && (
            <a href={`https://instagram.com/${info.instagram}`} target="_blank" rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center press-scale shadow-lg shadow-purple-500/25">
              <Instagram size={16} className="text-white" />
            </a>
          )}
          {info.website && (
            <a href={`https://${info.website}`} target="_blank" rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center press-scale shadow-lg shadow-blue-500/25">
              <Globe size={16} className="text-white" />
            </a>
          )}
          {info.phone && (
            <a href={`https://wa.me/${cleanPhone(info.phone)}`} target="_blank" rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center press-scale shadow-lg shadow-green-500/25">
              <MessageCircle size={16} className="text-white" />
            </a>
          )}
        </div>
        <div className={`mt-3 text-[10px] ${dark ? 'text-white/15' : 'text-gray-300'}`}>
          <span>i</span><span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">Borcuha</span>
        </div>
      </div>
    </div>
  )
}

/* ======================== STUDENT ======================== */
function StudentDash({ auth, data, dark, navigate }) {
  const student = data.students.find(s => s.id === auth.studentId)
  const group = student ? data.groups.find(g => g.id === student.groupId) : null
  const trainer = data.users.find(u => u.id === auth.userId)
  const myNews = data.news.filter(n => n.groupId === student?.groupId || (!n.groupId && n.trainerId === auth.userId))
  const expired = isExpired(student?.subscriptionExpiresAt)
  const { updateStudent } = useData()
  const [showStatus, setShowStatus] = useState(false)

  const myRegs = (data.tournamentRegistrations || []).filter(r => r.studentId === auth.studentId)
  const registeredTournaments = myRegs
    .map(r => data.tournaments.find(t => t.id === r.tournamentId))
    .filter(t => t && new Date(t.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  const myInternalMatches = useMemo(() => {
    const matches = []
    const internalTournaments = (data.internalTournaments || []).filter(t => t.status === 'active')
    for (const tournament of internalTournaments) {
      const brackets = tournament.brackets || {}
      const cats = brackets.categories || []
      if (cats.length > 0) {
        for (const cat of cats) {
          if (!cat.participants?.includes(auth.studentId)) continue
          const rounds = cat.rounds || []
          for (let ri = 0; ri < rounds.length; ri++) {
            for (const match of rounds[ri]) {
              if (!match.winner && (match.s1 === auth.studentId || match.s2 === auth.studentId)) {
                const opponentId = match.s1 === auth.studentId ? match.s2 : match.s1
                const opponent = opponentId ? data.students.find(s => s.id === opponentId) : null
                matches.push({ tournament, roundIdx: ri, opponent, weightClass: cat.weightClass })
              }
            }
          }
        }
      } else if (brackets.rounds && brackets.participants?.includes(auth.studentId)) {
        const rounds = brackets.rounds || []
        for (let ri = 0; ri < rounds.length; ri++) {
          for (const match of rounds[ri]) {
            if (!match.winner && (match.s1 === auth.studentId || match.s2 === auth.studentId)) {
              const opponentId = match.s1 === auth.studentId ? match.s2 : match.s1
              const opponent = opponentId ? data.students.find(s => s.id === opponentId) : null
              matches.push({ tournament, roundIdx: ri, opponent, weightClass: brackets.weightClass })
            }
          }
        }
      }
    }
    return matches
  }, [data.internalTournaments, data.students, auth.studentId])

  const championTournaments = useMemo(() => {
    const results = []
    const tournaments = (data.internalTournaments || []).filter(t => t.status === 'active' || t.status === 'completed')
    for (const tournament of tournaments) {
      const brackets = tournament.brackets || {}
      const cats = brackets.categories || []
      if (cats.length > 0) {
        for (const cat of cats) {
          if (!cat.rounds?.length) continue
          const lastRound = cat.rounds[cat.rounds.length - 1]
          if (lastRound?.[0]?.winner === auth.studentId) {
            results.push({ tournament, weightClass: cat.weightClass })
          }
        }
      } else if (brackets.rounds?.length) {
        const lastRound = brackets.rounds[brackets.rounds.length - 1]
        if (lastRound?.[0]?.winner === auth.studentId) {
          results.push({ tournament, weightClass: brackets.weightClass })
        }
      }
    }
    return results
  }, [data.internalTournaments, auth.studentId])

  const isChampion = championTournaments.length > 0

  const pinnedMaterial = useMemo(() => {
    if (!group?.pinnedMaterialId) return null
    return (data.materials || []).find(m => m.id === group.pinnedMaterialId) || null
  }, [group, data.materials])

  const statusCfg = student?.status ? STATUS_CONFIG[student.status] : null
  const sportLabel = getSportLabel(trainer?.sportType)
  const rankLabel = getRankLabel(trainer?.sportType)
  const subDaysLeft = daysUntil(student?.subscriptionExpiresAt)

  const setStatus = (status) => {
    updateStudent(auth.studentId, { status })
    setShowStatus(false)
  }

  return (
    <Layout>
      <PageHeader title="Мой кабинет" logo />
      <div className="px-4 space-y-4 slide-in stagger">

        {/* Champion banner — premium design */}
        {isChampion && (
          <div className={`rounded-[28px] p-5 relative overflow-hidden ${
            dark
              ? 'bg-gradient-to-br from-yellow-500/20 via-amber-500/10 to-orange-500/20 border border-yellow-500/30'
              : 'bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 border border-yellow-300/50 shadow-[0_8px_32px_rgba(234,179,8,0.15)]'
          }`}>
            <div className={`absolute -top-10 -right-10 w-28 h-28 rounded-full blur-3xl ${dark ? 'bg-yellow-500/15' : 'bg-yellow-200/50'}`} />
            <div className={`absolute -bottom-8 -left-8 w-24 h-24 rounded-full blur-2xl ${dark ? 'bg-orange-500/10' : 'bg-orange-200/30'}`} />
            <div className="relative flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/30 float">
                <Trophy size={24} className="text-white" fill="white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-[10px] uppercase font-black tracking-[0.2em] ${dark ? 'text-yellow-400' : 'text-yellow-600'}`}>Чемпион</div>
                <div className="text-sm font-bold mt-0.5 truncate">
                  {championTournaments.map(ct => ct.tournament.title).join(', ')}
                </div>
              </div>
              <Sparkles size={20} className={`${dark ? 'text-yellow-400/60' : 'text-yellow-500/60'} breathe`} />
            </div>
          </div>
        )}

        {/* Hero — Student identity + Club info */}
        <div
          onClick={() => navigate('/profile')}
          className={`rounded-[28px] p-5 relative overflow-hidden backdrop-blur-xl press-scale cursor-pointer ${
          isChampion
            ? dark
              ? 'bg-gradient-to-br from-yellow-500/10 via-amber-500/5 to-orange-500/10 border border-yellow-500/20'
              : 'bg-gradient-to-br from-yellow-50/80 via-amber-50/60 to-orange-50/80 border border-yellow-200/60 shadow-[0_4px_24px_rgba(234,179,8,0.1)]'
            : dark
              ? 'bg-gradient-to-br from-purple-500/12 via-white/[0.04] to-accent/12 border border-white/[0.08]'
              : 'bg-gradient-to-br from-purple-50/90 via-white/80 to-red-50/90 border border-white/70 shadow-[0_8px_40px_rgba(0,0,0,0.06)]'
        }`}>
          <div className={`absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl ${dark ? 'bg-purple-500/10' : 'bg-purple-200/30'}`} />
          <div className={`absolute -bottom-12 -left-12 w-32 h-32 rounded-full blur-2xl ${dark ? 'bg-accent/8' : 'bg-red-100/20'}`} />
          <div className="relative flex items-center gap-4">
            <div className="relative">
              <div className={`p-[3px] rounded-full ${
                isChampion
                  ? 'bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500'
                  : 'bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500'
              }`}>
                <div className={`rounded-full p-[2px] ${dark ? 'bg-[#0a0a12]' : 'bg-white'}`}>
                  <Avatar name={student?.name || '?'} src={student?.avatar} size={64} />
                </div>
              </div>
              {isChampion && (
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-md bounce-in">
                  <Trophy size={12} className="text-white" fill="white" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-black truncate">{student?.name}</h2>
              <p className={`text-sm truncate ${dark ? 'text-white/50' : 'text-gray-600'}`}>
                {trainer?.clubName} — {group?.name || 'Без группы'}
              </p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {trainer?.sportType && (
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    dark ? 'bg-accent/20 text-accent-light' : 'bg-red-100 text-red-600'
                  }`}>{sportLabel}</span>
                )}
                {student?.belt && (
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    dark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-600'
                  }`}>{student.belt}</span>
                )}
                {trainer?.city && (
                  <span className={`text-[10px] font-medium flex items-center gap-0.5 ${dark ? 'text-white/35' : 'text-gray-500'}`}>
                    <MapPin size={9} />{trainer.city}
                  </span>
                )}
              </div>
            </div>
            <ChevronRight size={20} className={dark ? 'text-white/20' : 'text-gray-300'} />
          </div>
          {trainer && (
            <div className={`mt-3 pt-3 flex items-center gap-2 ${dark ? 'border-t border-white/[0.06]' : 'border-t border-black/[0.05]'}`}>
              <Avatar name={trainer.name || 'T'} src={trainer.avatar} size={24} />
              <span className={`text-xs ${dark ? 'text-white/40' : 'text-gray-500'}`}>
                Тренер: <span className="font-semibold">{trainer.name}</span>
              </span>
            </div>
          )}
        </div>

        {/* Status + Subscription row — enhanced */}
        <div className="grid grid-cols-2 gap-2.5">
          <div onClick={() => setShowStatus(true)} className={`rounded-[22px] p-4 backdrop-blur-xl press-scale cursor-pointer relative overflow-hidden transition-all ${
            dark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-white/60 border border-white/50 shadow-[0_2px_12px_rgba(0,0,0,0.04)]'
          }`}>
            <div className={`text-[10px] uppercase font-bold tracking-wider mb-2.5 ${dark ? 'text-white/35' : 'text-gray-400'}`}>Статус</div>
            {statusCfg ? (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${statusCfg.bg} border ${statusCfg.border} w-fit`}>
                <statusCfg.icon size={14} className={statusCfg.color} />
                <span className={`text-xs font-bold ${statusCfg.color}`}>{statusCfg.label}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/15 border border-green-500/25 w-fit">
                <Zap size={14} className="text-green-400" />
                <span className="text-xs font-bold text-green-400">В строю</span>
              </div>
            )}
          </div>

          <div className={`rounded-[22px] p-4 backdrop-blur-xl relative overflow-hidden ${
            dark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-white/60 border border-white/50 shadow-[0_2px_12px_rgba(0,0,0,0.04)]'
          } ${expired ? 'pulse-glow' : ''}`}>
            <div className={`absolute -top-8 -right-8 w-20 h-20 rounded-full blur-2xl ${
              expired ? dark ? 'bg-red-500/10' : 'bg-red-100/40' : dark ? 'bg-green-500/8' : 'bg-green-100/30'
            }`} />
            <div className="relative">
              <div className={`text-[10px] uppercase font-bold tracking-wider mb-2 ${dark ? 'text-white/35' : 'text-gray-400'}`}>
                Абонемент
              </div>
              <div className="flex items-center gap-2">
                <CircleProgress
                  value={expired ? 0 : subDaysLeft}
                  max={30}
                  size={40}
                  strokeWidth={3.5}
                  color={expired ? '#ef4444' : '#22c55e'}
                  dark={dark}
                >
                  <CreditCard size={14} className={expired ? 'text-red-400' : 'text-green-400'} />
                </CircleProgress>
                <div>
                  <div className={`text-xs font-bold ${expired ? 'text-red-400' : 'text-green-400'}`}>
                    {expired ? 'Истёк' : `${subDaysLeft} дн.`}
                  </div>
                  <div className={`text-[10px] ${dark ? 'text-white/30' : 'text-gray-400'}`}>
                    {expired ? 'Нужна оплата' : formatDate(student?.subscriptionExpiresAt)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Today's workout — pinned video */}
        {pinnedMaterial && (() => {
          const ytMatch = pinnedMaterial.videoUrl?.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
          const thumb = pinnedMaterial.customThumb || (ytMatch ? `https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg` : null)
          return (
            <div>
              <SectionTitle dark={dark}>
                <span className="flex items-center gap-1.5"><Dumbbell size={12} className="text-green-400" /> Отработка дня</span>
              </SectionTitle>
              <div onClick={() => navigate('/materials')} className={`rounded-[22px] overflow-hidden backdrop-blur-xl press-scale cursor-pointer transition-all ${
                dark ? 'bg-gradient-to-r from-green-500/[0.06] to-emerald-500/[0.04] border border-green-500/20' : 'bg-gradient-to-r from-green-50/80 to-emerald-50/60 border border-green-200/60 shadow-sm'
              }`}>
                {thumb && (
                  <div className={`relative aspect-video overflow-hidden ${dark ? 'bg-white/[0.03]' : 'bg-black/[0.02]'}`}>
                    <img src={thumb} alt={pinnedMaterial.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                      <div className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center shadow-2xl">
                        <Play size={26} className="text-white ml-0.5" fill="white" />
                      </div>
                    </div>
                    <span className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-green-500 text-white shadow-lg shadow-green-500/30">
                      <Dumbbell size={10} /> Отработка
                    </span>
                  </div>
                )}
                <div className="p-4 flex items-center gap-3">
                  {!thumb && (
                    <div className={`w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0 bg-gradient-to-br from-green-500 to-emerald-600`}>
                      <Film size={18} className="text-white" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-sm truncate">{pinnedMaterial.title}</div>
                    {pinnedMaterial.description && (
                      <div className={`text-xs mt-0.5 truncate ${dark ? 'text-white/40' : 'text-gray-500'}`}>{pinnedMaterial.description}</div>
                    )}
                  </div>
                  <ChevronRight size={16} className={dark ? 'text-white/20' : 'text-gray-300'} />
                </div>
              </div>
            </div>
          )
        })()}

        {/* Next opponent in internal tournaments */}
        {myInternalMatches.length > 0 && (
          <div>
            <SectionTitle dark={dark}>
              <span className="flex items-center gap-1.5"><Swords size={12} className="text-accent" /> Следующий бой</span>
            </SectionTitle>
            {myInternalMatches.map((m, i) => (
              <div
                key={i}
                onClick={() => navigate(`/internal-tournament/${m.tournament.id}`)}
                className={`rounded-[22px] p-4 mb-2 backdrop-blur-xl press-scale cursor-pointer relative overflow-hidden ${
                  dark ? 'bg-gradient-to-r from-accent/[0.08] to-purple-500/[0.06] border border-accent/25' : 'bg-gradient-to-r from-red-50/80 to-purple-50/60 border border-red-200/60 shadow-sm'
                }`}
              >
                <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl ${dark ? 'bg-accent/10' : 'bg-red-100/40'}`} />
                <div className="relative">
                  <div className="text-[10px] uppercase font-bold text-accent mb-3 flex items-center gap-1.5">
                    <Swords size={10} />
                    {m.tournament.title}{m.weightClass ? ` • ${m.weightClass}` : ''} — Раунд {m.roundIdx + 1}
                  </div>
                  {m.opponent ? (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="p-[2px] rounded-full bg-gradient-to-br from-green-400 to-emerald-500">
                          <Avatar name={student?.name || '?'} src={student?.avatar} size={40} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-sm truncate">{student?.name}</div>
                          <div className={`text-[10px] ${dark ? 'text-white/30' : 'text-gray-500'}`}>
                            {student?.weight ? student.weight + ' кг' : ''}
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0 text-xl font-black bg-gradient-to-b from-accent to-purple-500 bg-clip-text text-transparent">VS</div>
                      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                        <div className="min-w-0 text-right">
                          <div className="font-bold text-sm truncate">{m.opponent.name}</div>
                          <div className={`text-[10px] ${dark ? 'text-white/30' : 'text-gray-500'}`}>
                            {m.opponent.weight ? m.opponent.weight + ' кг' : ''}
                          </div>
                        </div>
                        <div className="p-[2px] rounded-full bg-gradient-to-br from-accent to-rose-500">
                          <Avatar name={m.opponent.name} src={m.opponent.avatar} size={40} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={`text-sm text-center py-2 ${dark ? 'text-white/40' : 'text-gray-500'}`}>
                      Ожидание соперника...
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tournament countdown */}
        {registeredTournaments.length > 0 && (
          <div>
            <SectionTitle dark={dark}>
              <span className="flex items-center gap-1.5"><Flame size={12} className="text-orange-400" /> Мои турниры</span>
            </SectionTitle>
            {registeredTournaments.map(t => (
              <div
                key={t.id}
                onClick={() => navigate(`/tournaments/${t.id}`)}
                className={`rounded-[22px] p-4 mb-2 backdrop-blur-xl press-scale cursor-pointer relative overflow-hidden ${
                  dark ? 'bg-gradient-to-r from-orange-500/[0.06] to-red-500/[0.04] border border-orange-500/20' : 'bg-gradient-to-r from-orange-50/80 to-red-50/60 border border-orange-200/60 shadow-sm'
                }`}
              >
                <div className={`absolute -top-8 -right-8 w-20 h-20 rounded-full blur-2xl ${dark ? 'bg-orange-500/10' : 'bg-orange-100/40'}`} />
                <div className="relative flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-sm truncate">{t.title}</div>
                    <div className={`text-xs mt-0.5 flex items-center gap-1 ${dark ? 'text-white/40' : 'text-gray-500'}`}>
                      <Calendar size={11} /> {formatDate(t.date)}
                    </div>
                  </div>
                  <div className="shrink-0 ml-3">
                    <Countdown date={t.date} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* News */}
        {myNews.length > 0 && (
          <div>
            <SectionTitle dark={dark}>Новости</SectionTitle>
            {myNews.slice(-3).reverse().map(n => (
              <GlassCard key={n.id} className="mb-2">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    dark ? 'bg-accent/15' : 'bg-red-50'
                  }`}>
                    <Newspaper size={14} className="text-accent" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm">{n.title}</div>
                    <div className={`text-xs mt-1 ${dark ? 'text-white/40' : 'text-gray-500'}`}>{n.content}</div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {/* Upcoming public tournaments */}
        <div>
          <SectionTitle dark={dark}>Ближайшие турниры</SectionTitle>
          {data.tournaments
            .filter(t => new Date(t.date) >= new Date())
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 3)
            .map(t => (
              <GlassCard key={t.id} onClick={() => navigate(`/tournaments/${t.id}`)} className="mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0 ${
                    dark ? 'bg-purple-500/15' : 'bg-purple-50'
                  }`}>
                    <Trophy size={16} className="text-purple-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-sm truncate">{t.title}</div>
                    <div className={`text-xs mt-0.5 flex items-center gap-1 ${dark ? 'text-white/40' : 'text-gray-500'}`}>
                      <Calendar size={11} /> {formatDate(t.date)} — {t.location}
                    </div>
                  </div>
                  <ChevronRight size={16} className={dark ? 'text-white/15' : 'text-gray-300'} />
                </div>
              </GlassCard>
            ))}
        </div>
      </div>

      {/* Status picker modal */}
      <Modal open={showStatus} onClose={() => setShowStatus(false)} title="Установить статус">
        <div className="space-y-2">
          <button onClick={() => setStatus(null)} className={`w-full py-3.5 rounded-[18px] text-left px-4 press-scale flex items-center gap-3 transition-all ${dark ? 'bg-green-500/10 hover:bg-green-500/15' : 'bg-green-50 hover:bg-green-100/80'}`}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md shadow-green-500/25">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-bold text-green-400">В строю</span>
          </button>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
            const Icon = cfg.icon
            return (
              <button key={key} onClick={() => setStatus(key)} className={`w-full py-3.5 rounded-[18px] text-left px-4 press-scale flex items-center gap-3 transition-all ${cfg.bg} hover:opacity-80`}>
                <div className={`w-9 h-9 rounded-full ${cfg.bg} border ${cfg.border} flex items-center justify-center`}>
                  <Icon size={16} className={cfg.color} />
                </div>
                <span className={`font-bold ${cfg.color}`}>{cfg.label}</span>
              </button>
            )
          })}
        </div>
      </Modal>
    </Layout>
  )
}
