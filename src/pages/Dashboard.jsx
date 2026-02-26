import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, TrendingUp, TrendingDown, AlertCircle, Newspaper, Calendar, Flame, Clock, Thermometer, HeartCrack, Zap, Swords, MapPin, Megaphone, Plus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import GlassCard from '../components/GlassCard'
import Avatar from '../components/Avatar'
import Modal from '../components/Modal'
import { getRankLabel } from '../utils/sports'

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
        <div className="text-2xl font-black">{days}</div>
        <div className="text-[10px] uppercase opacity-50">дней</div>
      </div>
      <span className="text-xl font-bold opacity-30">:</span>
      <div className="text-center">
        <div className="text-2xl font-black">{hours}</div>
        <div className="text-[10px] uppercase opacity-50">часов</div>
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

function SuperAdminDash({ data, dark, navigate }) {
  const allTrainers = data.users.filter(u => u.role === 'trainer')
  const [cityFilter, setCityFilter] = useState('')

  // Get unique cities
  const cities = [...new Set(allTrainers.filter(t => t.city).map(t => t.city))].sort()

  // Filter by city
  const trainers = cityFilter
    ? allTrainers.filter(t => t.city === cityFilter)
    : allTrainers
  const trainerIds = new Set(trainers.map(t => t.id))
  const filteredStudents = cityFilter
    ? data.students.filter(s => trainerIds.has(s.trainerId))
    : data.students

  return (
    <Layout>
      <PageHeader title="iBorcuha" logo gradient />
      <div className="px-4 space-y-4 slide-in stagger">
        {/* City filter */}
        {cities.length > 0 && (
          <div className="overflow-x-auto -mx-4 px-4 pb-1">
            <div className="flex gap-2" style={{ minWidth: 'max-content' }}>
              <button
                onClick={() => setCityFilter('')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold press-scale whitespace-nowrap flex items-center gap-1.5 transition-all ${
                  !cityFilter
                    ? 'bg-accent text-white'
                    : dark ? 'bg-white/5 text-white/60' : 'bg-black/5 text-gray-500'
                }`}
              >
                Все города
              </button>
              {cities.map(city => (
                <button
                  key={city}
                  onClick={() => setCityFilter(cityFilter === city ? '' : city)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold press-scale whitespace-nowrap flex items-center gap-1.5 transition-all ${
                    cityFilter === city
                      ? 'bg-accent text-white'
                      : dark ? 'bg-white/5 text-white/60' : 'bg-black/5 text-gray-500'
                  }`}
                >
                  <MapPin size={11} />
                  {city}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <GlassCard>
            <div className={`text-xs uppercase font-semibold ${dark ? 'text-white/40' : 'text-gray-400'}`}>Тренеры</div>
            <div className="text-3xl font-black mt-1">{trainers.length}</div>
          </GlassCard>
          <GlassCard>
            <div className={`text-xs uppercase font-semibold ${dark ? 'text-white/40' : 'text-gray-400'}`}>Спортсмены</div>
            <div className="text-3xl font-black mt-1">{filteredStudents.length}</div>
          </GlassCard>
        </div>
        <div>
          <h2 className={`text-sm uppercase font-bold mb-3 ${dark ? 'text-white/50' : 'text-gray-500'}`}>Клубы</h2>
          <div className="space-y-2">
            {trainers.map(t => {
              const count = data.students.filter(s => s.trainerId === t.id).length
              return (
                <GlassCard key={t.id} onClick={() => navigate(`/trainer/${t.id}`)} className="flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="font-bold truncate">{t.clubName || t.name}</div>
                    <div className={`text-sm ${dark ? 'text-white/40' : 'text-gray-400'} flex items-center gap-1`}>
                      {t.name}
                      {t.city && <><span className="mx-1">•</span><MapPin size={11} />{t.city}</>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm shrink-0 ml-2"><Users size={14} /><span>{count}</span></div>
                </GlassCard>
              )
            })}
          </div>
        </div>
        <div>
          <h2 className={`text-sm uppercase font-bold mb-3 ${dark ? 'text-white/50' : 'text-gray-500'}`}>Ближайшие турниры</h2>
          <div className="space-y-2">
            {data.tournaments.sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 3).map(t => (
              <GlassCard key={t.id} onClick={() => navigate(`/tournaments/${t.id}`)}>
                <div className="font-bold">{t.title}</div>
                <div className={`text-sm mt-1 flex items-center gap-1 ${dark ? 'text-white/40' : 'text-gray-400'}`}>
                  <Calendar size={13} />{formatDate(t.date)} — {t.location}
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}

function TrainerDash({ auth, data, dark, navigate }) {
  const { addNews } = useData()
  const myStudents = data.students.filter(s => s.trainerId === auth.userId)
  const myGroups = data.groups.filter(g => g.trainerId === auth.userId)
  const myTx = data.transactions.filter(t => t.trainerId === auth.userId)
  const myNews = data.news.filter(n => n.trainerId === auth.userId)

  const studentsWithStatus = myStudents.filter(s => s.status)
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
    w-full px-4 py-3 rounded-[16px] text-base outline-none
    ${dark
      ? 'bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-accent'
      : 'bg-black/[0.03] border border-black/[0.08] text-gray-900 placeholder-gray-400 focus:border-accent'
    }
  `

  return (
    <Layout>
      <PageHeader title={auth.user?.clubName || 'Мой клуб'} logo />
      <div className="px-4 space-y-4 slide-in stagger">
        {/* Add news button — prominent */}
        <button
          onClick={() => { setNewsForm({ title: '', content: '', groupId: '__all__' }); setShowNews(true) }}
          className="w-full py-3.5 rounded-[20px] bg-gradient-to-r from-accent to-purple-600 text-white font-bold press-scale flex items-center justify-center gap-2.5 shadow-lg shadow-accent/25"
        >
          <Megaphone size={20} />
          Новая новость
        </button>

        <div className="grid grid-cols-3 gap-2">
          <GlassCard className="text-center">
            <Users size={18} className="mx-auto mb-1 text-accent" />
            <div className="text-2xl font-black">{stats.total}</div>
            <div className={`text-[10px] uppercase ${dark ? 'text-white/40' : 'text-gray-400'}`}>Всего</div>
          </GlassCard>
          <GlassCard className="text-center">
            <TrendingUp size={18} className="mx-auto mb-1 text-green-500" />
            <div className="text-2xl font-black">{stats.active}</div>
            <div className={`text-[10px] uppercase ${dark ? 'text-white/40' : 'text-gray-400'}`}>Активных</div>
          </GlassCard>
          <GlassCard className="text-center">
            <AlertCircle size={18} className="mx-auto mb-1 text-accent" />
            <div className="text-2xl font-black">{stats.debtors}</div>
            <div className={`text-[10px] uppercase ${dark ? 'text-white/40' : 'text-gray-400'}`}>Должников</div>
          </GlassCard>
        </div>

        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-xs uppercase font-semibold ${dark ? 'text-white/40' : 'text-gray-400'}`}>Баланс</div>
              <div className={`text-2xl font-black ${stats.balance >= 0 ? 'text-green-500' : 'text-accent'}`}>
                {stats.balance.toLocaleString('ru-RU')} ₽
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-green-500 text-sm"><TrendingUp size={14} />+{stats.income.toLocaleString('ru-RU')} ₽</div>
              <div className="flex items-center gap-1 text-accent text-sm"><TrendingDown size={14} />-{stats.expense.toLocaleString('ru-RU')} ₽</div>
            </div>
          </div>
        </GlassCard>

        {/* Student statuses */}
        {studentsWithStatus.length > 0 && (
          <div>
            <h2 className={`text-sm uppercase font-bold mb-2 ${dark ? 'text-white/50' : 'text-gray-500'}`}>Статусы учеников</h2>
            <div className="space-y-2">
              {studentsWithStatus.map(s => {
                const cfg = STATUS_CONFIG[s.status]
                if (!cfg) return null
                const Icon = cfg.icon
                return (
                  <GlassCard key={s.id} className={`flex items-center gap-3 border ${cfg.border}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${cfg.bg}`}>
                      <Icon size={16} className={cfg.color} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm truncate">{s.name}</div>
                    </div>
                    <span className={`text-xs font-bold uppercase ${cfg.color}`}>{cfg.label}</span>
                  </GlassCard>
                )
              })}
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className={`text-sm uppercase font-bold ${dark ? 'text-white/50' : 'text-gray-500'}`}>Группы</h2>
            <button onClick={() => navigate('/groups')} className="text-accent text-xs font-semibold press-scale">Управление</button>
          </div>
          <div className="space-y-2">
            {myGroups.map(g => {
              const count = myStudents.filter(s => s.groupId === g.id).length
              return (
                <GlassCard key={g.id} className="flex items-center justify-between">
                  <div>
                    <div className="font-bold">{g.name}</div>
                    <div className={`text-xs ${dark ? 'text-white/40' : 'text-gray-400'}`}>{g.schedule}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${dark ? 'text-white/40' : 'text-gray-400'}`}>{count} чел.</span>
                    <span className="text-xs text-accent font-semibold">{g.subscriptionCost?.toLocaleString('ru-RU')} ₽</span>
                  </div>
                </GlassCard>
              )
            })}
            {myGroups.length === 0 && <p className={`text-center py-4 text-sm ${dark ? 'text-white/30' : 'text-gray-400'}`}>Нет групп. Создайте первую!</p>}
          </div>
        </div>

        {myNews.length > 0 && (
          <div>
            <h2 className={`text-sm uppercase font-bold mb-3 ${dark ? 'text-white/50' : 'text-gray-500'}`}>Последние новости</h2>
            <div className="space-y-2">
              {myNews.slice(-3).reverse().map(n => {
                const g = myGroups.find(g => g.id === n.groupId)
                return (
                  <GlassCard key={n.id}>
                    <div className="flex items-start gap-2">
                      <Newspaper size={16} className="text-accent shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm">{n.title}</div>
                        <div className={`text-xs mt-0.5 ${dark ? 'text-white/40' : 'text-gray-400'}`}>
                          {n.groupId ? g?.name || '—' : 'Все группы'} — {n.content?.slice(0, 50)}{n.content?.length > 50 ? '...' : ''}
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                )
              })}
            </div>
          </div>
        )}
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
          <button type="submit" className="w-full py-3.5 rounded-[16px] bg-accent text-white font-bold press-scale">
            Опубликовать
          </button>
        </form>
      </Modal>
    </Layout>
  )
}

function StudentDash({ auth, data, dark, navigate }) {
  const student = data.students.find(s => s.id === auth.studentId)
  const group = student ? data.groups.find(g => g.id === student.groupId) : null
  const trainer = data.users.find(u => u.id === auth.userId)
  const myNews = data.news.filter(n => n.groupId === student?.groupId || (!n.groupId && n.trainerId === auth.userId))
  const expired = isExpired(student?.subscriptionExpiresAt)
  const { updateStudent } = useData()
  const [showStatus, setShowStatus] = useState(false)

  // Tournaments student registered for
  const myRegs = (data.tournamentRegistrations || []).filter(r => r.studentId === auth.studentId)
  const registeredTournaments = myRegs
    .map(r => data.tournaments.find(t => t.id === r.tournamentId))
    .filter(t => t && new Date(t.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  // Find next opponent in active internal tournaments (supports multi-category)
  const myInternalMatches = useMemo(() => {
    const matches = []
    const internalTournaments = (data.internalTournaments || []).filter(t => t.status === 'active')
    for (const tournament of internalTournaments) {
      const brackets = tournament.brackets || {}
      const cats = brackets.categories || []
      // Multi-category format
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
        // Legacy single bracket
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

  const statusCfg = student?.status ? STATUS_CONFIG[student.status] : null

  const setStatus = (status) => {
    updateStudent(auth.studentId, { status })
    setShowStatus(false)
  }

  return (
    <Layout>
      <PageHeader title="Мой кабинет" logo />
      <div className="px-4 space-y-4 slide-in stagger">
        <GlassCard>
          <div className="text-center">
            <div className="text-lg font-bold">{student?.name}</div>
            <div className={`text-sm ${dark ? 'text-white/40' : 'text-gray-400'}`}>
              {trainer?.clubName} — {group?.name || 'Без группы'}
            </div>
          </div>
        </GlassCard>

        {/* Status badge + setter */}
        <GlassCard onClick={() => setShowStatus(true)} className="cursor-pointer">
          <div className="flex items-center justify-between">
            <span className={`text-xs uppercase font-semibold ${dark ? 'text-white/40' : 'text-gray-400'}`}>Мой статус</span>
            {statusCfg ? (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${statusCfg.bg} border ${statusCfg.border}`}>
                <statusCfg.icon size={14} className={statusCfg.color} />
                <span className={`text-xs font-bold uppercase ${statusCfg.color}`}>{statusCfg.label}</span>
              </div>
            ) : (
              <span className="text-xs text-green-400 font-bold uppercase bg-green-500/15 px-3 py-1.5 rounded-full">
                В строю
              </span>
            )}
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-xs uppercase font-semibold ${dark ? 'text-white/40' : 'text-gray-400'}`}>Абонемент</div>
              <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold uppercase ${
                expired ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
              }`}>
                {expired ? 'Долг' : 'Активен'}
              </span>
            </div>
            <div className="text-right">
              <div className={`text-xs uppercase font-semibold ${dark ? 'text-white/40' : 'text-gray-400'}`}>
                {expired ? 'Истек' : 'До'}
              </div>
              <div className="font-bold mt-1">{formatDate(student?.subscriptionExpiresAt)}</div>
            </div>
          </div>
        </GlassCard>

        {student?.belt && (
          <GlassCard className="flex items-center justify-between">
            <span className={`text-xs uppercase font-semibold ${dark ? 'text-white/40' : 'text-gray-400'}`}>{getRankLabel(trainer?.sportType)}</span>
            <span className="font-bold">{student.belt}</span>
          </GlassCard>
        )}

        {/* Next opponent in internal tournaments */}
        {myInternalMatches.length > 0 && (
          <div>
            <h2 className={`text-sm uppercase font-bold mb-3 flex items-center gap-2 ${dark ? 'text-white/50' : 'text-gray-500'}`}>
              <Swords size={14} className="text-accent" /> Следующий бой
            </h2>
            {myInternalMatches.map((m, i) => (
              <GlassCard
                key={i}
                onClick={() => navigate(`/internal-tournament/${m.tournament.id}`)}
                className="mb-2 border border-accent/30 bg-gradient-to-r from-accent/5 to-purple-500/5"
              >
                <div className="text-[10px] uppercase font-bold text-accent mb-2">
                  {m.tournament.title}{m.weightClass ? ` • ${m.weightClass}` : ''} — Раунд {m.roundIdx + 1}
                </div>
                {m.opponent ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Avatar name={student?.name || '?'} src={student?.avatar} size={36} />
                      <div className="min-w-0">
                        <div className="font-bold text-sm truncate">{student?.name}</div>
                        <div className={`text-[10px] ${dark ? 'text-white/30' : 'text-gray-400'}`}>
                          {student?.weight ? student.weight + ' кг' : ''}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 text-xl font-black text-accent">VS</div>
                    <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                      <div className="min-w-0 text-right">
                        <div className="font-bold text-sm truncate">{m.opponent.name}</div>
                        <div className={`text-[10px] ${dark ? 'text-white/30' : 'text-gray-400'}`}>
                          {m.opponent.weight ? m.opponent.weight + ' кг' : ''}
                        </div>
                      </div>
                      <Avatar name={m.opponent.name} src={m.opponent.avatar} size={36} />
                    </div>
                  </div>
                ) : (
                  <div className={`text-sm text-center py-1 ${dark ? 'text-white/40' : 'text-gray-400'}`}>
                    Ожидание соперника...
                  </div>
                )}
              </GlassCard>
            ))}
          </div>
        )}

        {/* Tournament countdown */}
        {registeredTournaments.length > 0 && (
          <div>
            <h2 className={`text-sm uppercase font-bold mb-3 flex items-center gap-1 ${dark ? 'text-white/50' : 'text-gray-500'}`}>
              <Flame size={14} className="text-orange-400" /> Мои турниры
            </h2>
            {registeredTournaments.map(t => (
              <GlassCard
                key={t.id}
                onClick={() => navigate(`/tournaments/${t.id}`)}
                className="mb-2 border border-orange-500/20 bg-gradient-to-r from-orange-500/5 to-red-500/5"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-sm truncate">{t.title}</div>
                    <div className={`text-xs mt-0.5 flex items-center gap-1 ${dark ? 'text-white/40' : 'text-gray-400'}`}>
                      <Calendar size={11} /> {formatDate(t.date)}
                    </div>
                  </div>
                  <div className="shrink-0 ml-3">
                    <Countdown date={t.date} />
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {myNews.length > 0 && (
          <div>
            <h2 className={`text-sm uppercase font-bold mb-3 ${dark ? 'text-white/50' : 'text-gray-500'}`}>Новости группы</h2>
            {myNews.slice(-3).reverse().map(n => (
              <GlassCard key={n.id} className="mb-2">
                <div className="font-semibold text-sm">{n.title}</div>
                <div className={`text-xs mt-1 ${dark ? 'text-white/40' : 'text-gray-400'}`}>{n.content}</div>
              </GlassCard>
            ))}
          </div>
        )}

        <div>
          <h2 className={`text-sm uppercase font-bold mb-3 ${dark ? 'text-white/50' : 'text-gray-500'}`}>Ближайшие турниры</h2>
          {data.tournaments
            .filter(t => new Date(t.date) >= new Date())
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 3)
            .map(t => (
              <GlassCard key={t.id} onClick={() => navigate(`/tournaments/${t.id}`)} className="mb-2">
                <div className="font-bold">{t.title}</div>
                <div className={`text-sm mt-1 flex items-center gap-1 ${dark ? 'text-white/40' : 'text-gray-400'}`}>
                  <Calendar size={13} /> {formatDate(t.date)} — {t.location}
                </div>
              </GlassCard>
            ))}
        </div>
      </div>

      {/* Status picker modal */}
      <Modal open={showStatus} onClose={() => setShowStatus(false)} title="Установить статус">
        <div className="space-y-2">
          <button onClick={() => setStatus(null)} className={`w-full py-3 rounded-[16px] text-left px-4 press-scale flex items-center gap-3 ${dark ? 'bg-green-500/10' : 'bg-green-50'}`}>
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center"><Zap size={16} className="text-green-400" /></div>
            <span className="font-semibold text-green-400">В строю</span>
          </button>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
            const Icon = cfg.icon
            return (
              <button key={key} onClick={() => setStatus(key)} className={`w-full py-3 rounded-[16px] text-left px-4 press-scale flex items-center gap-3 ${cfg.bg}`}>
                <div className={`w-8 h-8 rounded-full ${cfg.bg} flex items-center justify-center`}><Icon size={16} className={cfg.color} /></div>
                <span className={`font-semibold ${cfg.color}`}>{cfg.label}</span>
              </button>
            )
          })}
        </div>
      </Modal>
    </Layout>
  )
}
