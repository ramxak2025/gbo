import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Calendar, MapPin, Trophy, Swords, Check, ChevronRight, Scale, ScrollText, Medal, Users, Flame, Archive, Clock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import { getSportLabel } from '../utils/sports'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'

const MONTH_NAMES = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

function getDaysUntil(iso) {
  if (!iso) return null
  const now = new Date(); now.setHours(0,0,0,0)
  const target = new Date(iso); target.setHours(0,0,0,0)
  return Math.ceil((target - now) / 86400000)
}

function getDaysLabel(days) {
  if (days === 0) return 'Сегодня'
  if (days === 1) return 'Завтра'
  if (days < 0) return null
  if (days % 10 === 1 && days % 100 !== 11) return `${days} день`
  if ([2,3,4].includes(days % 10) && ![12,13,14].includes(days % 100)) return `${days} дня`
  return `${days} дней`
}

function getMonthKey(iso) {
  if (!iso) return '0000-00'
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`
}

function getMonthLabel(key) {
  const [year, month] = key.split('-').map(Number)
  const now = new Date()
  const currentYear = now.getFullYear()
  const monthName = MONTH_NAMES[month] || ''
  return year === currentYear ? monthName : `${monthName} ${year}`
}

/* ═══ Main Component ═══ */
export default function Tournaments() {
  const { auth } = useAuth()
  const { data } = useData()
  const { dark } = useTheme()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('upcoming')
  const [clubSub, setClubSub] = useState('active')

  const now = new Date()

  // Official
  const allOfficial = useMemo(() => [...data.tournaments].sort((a, b) => new Date(a.date) - new Date(b.date)), [data.tournaments])
  const upcoming = allOfficial.filter(t => new Date(t.date) >= now)
  const pastOfficial = allOfficial.filter(t => new Date(t.date) < now)

  // Internal
  const allInternal = useMemo(() =>
    (data.internalTournaments || []).filter(t => {
      if (auth.role === 'trainer') return t.trainerId === auth.userId
      if (auth.role === 'student') { const s = data.students.find(s => s.id === auth.studentId); return s && t.trainerId === s.trainerId }
      return true
    }).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)),
    [data.internalTournaments, auth, data.students]
  )
  const clubActive = allInternal.filter(t => t.status !== 'completed')
  const clubDone = allInternal.filter(t => t.status === 'completed')

  // Archive
  const archive = useMemo(() => [
    ...pastOfficial.map(t => ({ ...t, _kind: 'official' })),
    ...clubDone.map(t => ({ ...t, _kind: 'internal' })),
  ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)), [pastOfficial, clubDone])

  // Group upcoming by month
  const upcomingByMonth = useMemo(() => {
    const groups = {}
    upcoming.forEach(t => {
      const key = getMonthKey(t.date)
      if (!groups[key]) groups[key] = []
      groups[key].push(t)
    })
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }, [upcoming])

  // Group archive by month
  const archiveByMonth = useMemo(() => {
    const groups = {}
    archive.forEach(t => {
      const key = getMonthKey(t.date)
      if (!groups[key]) groups[key] = []
      groups[key].push(t)
    })
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
  }, [archive])

  const canAdd = auth.role === 'superadmin' || auth.role === 'organizer'

  const tabs = [
    { id: 'upcoming', label: 'Ближайшие', count: upcoming.length },
    { id: 'club', label: 'Клубные', count: allInternal.length },
    { id: 'archive', label: 'Архив', count: archive.length },
  ]

  return (
    <Layout>
      <PageHeader title="Турниры">
        <div className="flex items-center gap-1">
          {auth.role === 'trainer' && (
            <button onClick={() => navigate('/create-internal-tournament')} className="press-scale p-2" title="Клубный турнир">
              <Swords size={20} />
            </button>
          )}
          {canAdd && (
            <button onClick={() => navigate('/add-tournament')} className="press-scale p-2">
              <Plus size={20} />
            </button>
          )}
        </div>
      </PageHeader>

      <div className="px-4 pb-4 slide-in">
        {/* ── Tabs ── */}
        <div className={`flex rounded-2xl p-1 mb-5 ${dark ? 'bg-white/[0.06]' : 'bg-black/[0.04]'}`}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-all press-scale ${
                activeTab === tab.id
                  ? dark ? 'bg-white/[0.12] text-white shadow-sm' : 'bg-white text-gray-900 shadow-sm'
                  : dark ? 'text-white/35' : 'text-gray-400'
              }`}
            >
              {tab.label}
              {tab.count > 0 && <span className={`ml-1 text-[10px] ${activeTab === tab.id ? 'opacity-60' : 'opacity-40'}`}>{tab.count}</span>}
            </button>
          ))}
        </div>

        {/* Club sub-tabs */}
        {activeTab === 'club' && allInternal.length > 0 && (
          <div className="flex gap-2 mb-4">
            {[{ k: 'active', l: 'Активные', n: clubActive.length }, { k: 'completed', l: 'Прошедшие', n: clubDone.length }].map(({ k, l, n }) => (
              <button key={k} onClick={() => setClubSub(k)}
                className={`px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all press-scale ${
                  clubSub === k
                    ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20'
                    : dark ? 'text-white/30' : 'text-gray-400'
                }`}>{l} ({n})</button>
            ))}
          </div>
        )}

        {/* ═══ UPCOMING — Vertical cards grouped by month ═══ */}
        {activeTab === 'upcoming' && (
          <div className="space-y-6">
            {upcomingByMonth.length > 0 ? upcomingByMonth.map(([monthKey, tournaments]) => (
              <div key={monthKey}>
                {/* Month header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`px-3 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider ${
                    dark ? 'bg-accent/12 text-accent-light' : 'bg-red-50 text-red-600'
                  }`}>
                    {getMonthLabel(monthKey)}
                  </div>
                  <div className={`flex-1 h-px ${dark ? 'bg-white/[0.06]' : 'bg-gray-200/60'}`} />
                </div>
                {/* Two-column grid */}
                <div className="grid grid-cols-2 gap-3">
                  {tournaments.map(t => (
                    <TournamentCard
                      key={t.id}
                      t={t}
                      dark={dark}
                      onClick={() => navigate(`/tournaments/${t.id}`)}
                      regCount={data.tournamentRegistrations?.filter(r => r.tournamentId === t.id).length || 0}
                    />
                  ))}
                </div>
              </div>
            )) : (
              <Empty dark={dark} icon={Trophy} text="Нет предстоящих турниров"
                sub={canAdd ? 'Создайте новый' : 'Следите за обновлениями'}
                action={canAdd ? { label: 'Создать', onClick: () => navigate('/add-tournament') } : null} />
            )}
          </div>
        )}

        {/* ═══ CLUB ═══ */}
        {activeTab === 'club' && (
          <div className="grid grid-cols-2 gap-3">
            {(clubSub === 'active' ? clubActive : clubDone).length > 0 ? (
              (clubSub === 'active' ? clubActive : clubDone).map(t => (
                <ClubCard key={t.id} t={t} dark={dark}
                  onClick={() => navigate(`/internal-tournament/${t.id}`)} />
              ))
            ) : (
              <div className="col-span-2">
                <Empty dark={dark} icon={Swords}
                  text={clubSub === 'active' ? 'Нет активных турниров' : 'Нет прошедших турниров'}
                  sub={auth.role === 'trainer' && clubSub === 'active' ? 'Создайте клубный турнир' : null}
                  action={auth.role === 'trainer' && clubSub === 'active' ? { label: 'Создать', onClick: () => navigate('/create-internal-tournament') } : null} />
              </div>
            )}
          </div>
        )}

        {/* ═══ ARCHIVE — grouped by month ═══ */}
        {activeTab === 'archive' && (
          <div className="space-y-5">
            {archiveByMonth.length > 0 ? archiveByMonth.map(([monthKey, tournaments]) => (
              <div key={monthKey}>
                <div className="flex items-center gap-3 mb-2.5">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${dark ? 'text-white/25' : 'text-gray-400'}`}>
                    {getMonthLabel(monthKey)}
                  </span>
                  <div className={`flex-1 h-px ${dark ? 'bg-white/[0.04]' : 'bg-gray-100'}`} />
                </div>
                <div className="space-y-1.5">
                  {tournaments.map(t => (
                    <ArchiveRow key={t.id} t={t} dark={dark}
                      onClick={() => navigate(t._kind === 'internal' ? `/internal-tournament/${t.id}` : `/tournaments/${t.id}`)} />
                  ))}
                </div>
              </div>
            )) : (
              <Empty dark={dark} icon={Archive} text="Архив пуст" sub="Завершённые турниры появятся здесь" />
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}

/* ═══ Vertical Tournament Card ═══ */
function TournamentCard({ t, dark, onClick, regCount }) {
  const sportLabel = t.sportType ? getSportLabel(t.sportType) : null
  const days = getDaysUntil(t.date)
  const dLabel = days !== null ? getDaysLabel(days) : null
  const urgent = days !== null && days >= 0 && days <= 3
  const d = t.date ? new Date(t.date) : null
  const city = t.city || extractCity(t.location)

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl overflow-hidden cursor-pointer press-scale transition-all flex flex-col ${
        dark
          ? 'bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.07]'
          : 'bg-white border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)]'
      }`}
    >
      {/* Cover or Date header */}
      {t.coverImage ? (
        <div className="relative h-28">
          <img src={t.coverImage} alt={t.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
          {/* Date badge on cover */}
          {d && (
            <div className="absolute top-2 left-2">
              <div className={`w-11 h-12 rounded-xl flex flex-col items-center justify-center backdrop-blur-md ${
                urgent ? 'bg-orange-500/90' : 'bg-black/40'
              }`}>
                <span className="text-lg font-black text-white leading-none">{d.getDate()}</span>
                <span className="text-[8px] uppercase font-bold text-white/70 mt-0.5">
                  {d.toLocaleDateString('ru-RU', { month: 'short' }).replace('.', '')}
                </span>
              </div>
            </div>
          )}
          {/* Sport badge */}
          {sportLabel && (
            <div className="absolute top-2 right-2">
              <span className="px-1.5 py-0.5 rounded-lg bg-white/20 backdrop-blur-md text-[8px] font-bold text-white uppercase">{sportLabel}</span>
            </div>
          )}
          {/* Days badge */}
          {dLabel && (
            <div className="absolute bottom-2 right-2">
              <span className={`px-1.5 py-0.5 rounded-lg backdrop-blur-md text-[8px] font-bold text-white ${urgent ? 'bg-orange-500/80' : 'bg-black/30'}`}>
                {urgent && <Flame size={8} className="inline mr-0.5 -mt-px" />}{dLabel}
              </span>
            </div>
          )}
        </div>
      ) : (
        /* No cover — colored date header */
        <div className={`p-3 flex items-center gap-2.5 ${
          urgent
            ? 'bg-gradient-to-r from-orange-500/15 to-red-500/10'
            : dark ? 'bg-white/[0.03]' : 'bg-gray-50/80'
        }`}>
          <div className={`shrink-0 w-11 h-12 rounded-xl flex flex-col items-center justify-center ${
            urgent
              ? 'bg-gradient-to-b from-orange-500/20 to-red-500/15'
              : dark ? 'bg-white/[0.06]' : 'bg-white'
          }`}>
            <span className={`text-lg font-black leading-none ${urgent ? 'text-orange-400' : 'text-accent'}`}>
              {d?.getDate() || '—'}
            </span>
            <span className={`text-[8px] uppercase font-bold mt-0.5 ${dark ? 'text-white/30' : 'text-gray-400'}`}>
              {d?.toLocaleDateString('ru-RU', { month: 'short' }).replace('.', '')}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            {dLabel && (
              <span className={`text-[9px] font-bold ${urgent ? 'text-orange-400' : dark ? 'text-white/30' : 'text-gray-500'}`}>
                {urgent && <Flame size={8} className="inline mr-0.5 -mt-px" />}{dLabel}
              </span>
            )}
            {sportLabel && (
              <span className={`ml-1.5 px-1.5 py-px rounded text-[7px] font-bold uppercase ${dark ? 'bg-accent/12 text-accent-light' : 'bg-red-50 text-red-600'}`}>{sportLabel}</span>
            )}
          </div>
        </div>
      )}

      {/* Info section */}
      <div className="p-3 flex-1 flex flex-col">
        <h3 className={`font-bold text-[13px] leading-snug line-clamp-2 mb-2 ${dark ? 'text-white' : 'text-gray-900'}`}>
          {t.title}
        </h3>

        <div className="mt-auto space-y-1.5">
          {/* City */}
          {city && (
            <div className={`flex items-center gap-1.5 text-[11px] ${dark ? 'text-white/45' : 'text-gray-500'}`}>
              <MapPin size={11} className="shrink-0" />
              <span className="font-semibold truncate">{city}</span>
            </div>
          )}

          {/* Date + participants */}
          <div className="flex items-center justify-between">
            <span className={`flex items-center gap-1 text-[10px] ${dark ? 'text-white/30' : 'text-gray-400'}`}>
              <Calendar size={10} />{formatDate(t.date)}
            </span>
            {regCount > 0 && (
              <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${dark ? 'text-white/25' : 'text-gray-400'}`}>
                <Users size={9} />{regCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══ Club Card — Vertical ═══ */
function ClubCard({ t, dark, onClick }) {
  const cats = t.brackets?.categories || []
  const legacy = !cats.length && t.brackets?.rounds
  const pCount = legacy ? (t.brackets?.participants?.length || 0) : cats.reduce((s, c) => s + (c.participants?.length || 0), 0)
  const catCount = legacy ? 1 : cats.length
  const sportLabel = t.sportType ? getSportLabel(t.sportType) : null
  const isActive = t.status !== 'completed'
  const d = t.date ? new Date(t.date) : null
  const days = getDaysUntil(t.date)
  const dLabel = days !== null && days >= 0 ? getDaysLabel(days) : null

  return (
    <div onClick={onClick} className={`rounded-2xl overflow-hidden cursor-pointer press-scale transition-all flex flex-col ${
      dark
        ? `bg-white/[0.05] border ${isActive ? 'border-purple-500/15' : 'border-white/[0.06]'}`
        : `bg-white border ${isActive ? 'border-purple-200/60' : 'border-gray-100'} shadow-[0_2px_12px_rgba(0,0,0,0.05)]`
    }`}>
      {t.coverImage ? (
        <div className="relative h-28">
          <img src={t.coverImage} alt={t.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          {isActive && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-400 shadow-lg shadow-green-400/50 animate-pulse" />}
          <div className="absolute bottom-0 left-0 right-0 p-2.5">
            <h3 className="font-bold text-[12px] text-white line-clamp-2">{t.title}</h3>
          </div>
        </div>
      ) : (
        <div className={`p-3 ${
          isActive
            ? 'bg-gradient-to-r from-purple-500/8 to-indigo-500/8'
            : dark ? 'bg-white/[0.02]' : 'bg-gray-50/50'
        }`}>
          <div className="flex items-center gap-2">
            {/* Date block */}
            <div className={`shrink-0 w-10 h-11 rounded-lg flex flex-col items-center justify-center ${
              isActive
                ? 'bg-gradient-to-b from-purple-500/15 to-indigo-500/15'
                : dark ? 'bg-white/[0.04]' : 'bg-gray-50'
            }`}>
              <span className={`text-base font-black leading-none ${isActive ? 'text-purple-400' : dark ? 'text-white/25' : 'text-gray-400'}`}>{d?.getDate() || '—'}</span>
              <span className={`text-[7px] uppercase font-bold mt-0.5 ${dark ? 'text-white/25' : 'text-gray-400'}`}>{d?.toLocaleDateString('ru-RU',{month:'short'}).replace('.','')}</span>
            </div>
            {isActive && <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />}
          </div>
        </div>
      )}

      <div className="p-3 flex-1 flex flex-col">
        {!t.coverImage && (
          <h3 className={`font-bold text-[12px] leading-snug line-clamp-2 mb-1.5 ${dark ? 'text-white' : 'text-gray-900'}`}>{t.title}</h3>
        )}
        <div className="mt-auto space-y-1">
          {sportLabel && <span className={`inline-block px-1.5 py-px rounded text-[8px] font-bold uppercase ${dark?'bg-accent/12 text-accent-light':'bg-red-50 text-red-600'}`}>{sportLabel}</span>}
          <div className="flex items-center justify-between">
            {dLabel && <span className={`text-[9px] font-semibold ${dark ? 'text-purple-300/50' : 'text-purple-500/70'}`}>{dLabel}</span>}
            <span className={`text-[9px] ${dark ? 'text-white/25' : 'text-gray-400'}`}>
              <Users size={8} className="inline mr-0.5" />{pCount} · <Scale size={8} className="inline mr-0.5" />{catCount}
            </span>
          </div>
          {!isActive && (
            <div className="flex items-center gap-1">
              <Check size={10} className="text-green-500/60" />
              <span className={`text-[9px] font-medium ${dark ? 'text-green-400/40' : 'text-green-600/60'}`}>Завершён</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ═══ Archive Row ═══ */
function ArchiveRow({ t, dark, onClick }) {
  const d = t.date ? new Date(t.date) : null
  const isClub = t._kind === 'internal'
  const city = t.city || extractCity(t.location)
  return (
    <div onClick={onClick} className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl cursor-pointer press-scale transition-all ${
      dark ? 'hover:bg-white/[0.04]' : 'hover:bg-white/60'
    }`}>
      <div className={`shrink-0 w-9 h-9 rounded-xl flex flex-col items-center justify-center ${dark ? 'bg-white/[0.04]' : 'bg-gray-50'}`}>
        <span className={`text-xs font-black leading-none ${dark ? 'text-white/20' : 'text-gray-400'}`}>{d?.getDate() || '—'}</span>
        <span className={`text-[7px] uppercase font-bold ${dark ? 'text-white/10' : 'text-gray-300'}`}>{d?.toLocaleDateString('ru-RU',{month:'short'}).replace('.','')}</span>
      </div>
      <div className="min-w-0 flex-1">
        <h4 className={`font-semibold text-[13px] truncate ${dark ? 'text-white/40' : 'text-gray-500'}`}>{t.title}</h4>
        <div className="flex items-center gap-2 mt-0.5">
          {city && <span className={`text-[9px] ${dark ? 'text-white/20' : 'text-gray-400'}`}>{city}</span>}
          {isClub && <span className={`text-[9px] font-bold ${dark ? 'text-white/15' : 'text-gray-300'}`}>Клубный</span>}
        </div>
      </div>
      <Check size={12} className={dark ? 'text-green-500/30' : 'text-green-500/40'} />
    </div>
  )
}

/* ── Extract city from location string (fallback) ── */
function extractCity(location) {
  if (!location) return null
  const parts = location.split(',').map(s => s.trim())
  return parts[0]
}

/* ── Helpers ── */
function Empty({ dark, icon: Icon, text, sub, action }) {
  return (
    <div className="text-center py-14">
      <div className={`w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center ${dark ? 'bg-white/[0.04]' : 'bg-gray-50'}`}>
        <Icon size={26} className={dark ? 'text-white/10' : 'text-gray-200'} />
      </div>
      <p className={`text-[13px] font-medium ${dark ? 'text-white/25' : 'text-gray-400'}`}>{text}</p>
      {sub && <p className={`text-[11px] mt-0.5 ${dark ? 'text-white/15' : 'text-gray-300'}`}>{sub}</p>}
      {action && <button onClick={action.onClick} className="mt-3 px-5 py-2 rounded-2xl bg-accent text-white text-[13px] font-bold press-scale">{action.label}</button>}
    </div>
  )
}
