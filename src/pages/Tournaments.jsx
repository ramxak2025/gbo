import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Calendar, MapPin, Trophy, Swords, Check, ChevronDown, ChevronRight, Scale, ScrollText, Medal, Users, Flame, Archive, X, Clock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import { getSportLabel } from '../utils/sports'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'

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
        <div className={`flex rounded-2xl p-1 mb-4 ${dark ? 'bg-white/[0.06]' : 'bg-black/[0.04]'}`}>
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

        {/* ═══ UPCOMING ═══ */}
        {activeTab === 'upcoming' && (
          <div className="space-y-3">
            {upcoming.length > 0 ? upcoming.map(t => (
              <HeroCard key={t.id} t={t} dark={dark}
                onClick={() => navigate(`/tournaments/${t.id}`)}
                regCount={data.tournamentRegistrations?.filter(r => r.tournamentId === t.id).length || 0} />
            )) : (
              <Empty dark={dark} icon={Trophy} text="Нет предстоящих турниров"
                sub={canAdd ? 'Создайте новый' : 'Следите за обновлениями'}
                action={canAdd ? { label: 'Создать', onClick: () => navigate('/add-tournament') } : null} />
            )}
          </div>
        )}

        {/* ═══ CLUB ═══ */}
        {activeTab === 'club' && (
          <div className="space-y-3">
            {(clubSub === 'active' ? clubActive : clubDone).length > 0 ? (
              (clubSub === 'active' ? clubActive : clubDone).map(t => (
                <ClubCard key={t.id} t={t} dark={dark}
                  onClick={() => navigate(`/internal-tournament/${t.id}`)} />
              ))
            ) : (
              <Empty dark={dark} icon={Swords}
                text={clubSub === 'active' ? 'Нет активных турниров' : 'Нет прошедших турниров'}
                sub={auth.role === 'trainer' && clubSub === 'active' ? 'Создайте клубный турнир' : null}
                action={auth.role === 'trainer' && clubSub === 'active' ? { label: 'Создать', onClick: () => navigate('/create-internal-tournament') } : null} />
            )}
          </div>
        )}

        {/* ═══ ARCHIVE ═══ */}
        {activeTab === 'archive' && (
          <div className="space-y-2">
            {archive.length > 0 ? archive.map(t => (
              <ArchiveRow key={t.id} t={t} dark={dark}
                onClick={() => navigate(t._kind === 'internal' ? `/internal-tournament/${t.id}` : `/tournaments/${t.id}`)} />
            )) : (
              <Empty dark={dark} icon={Archive} text="Архив пуст" sub="Завершённые турниры появятся здесь" />
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}

/* ── Extract city from location string ── */
function extractCity(location) {
  if (!location) return null
  // Take first part before comma, or the whole string if short
  const parts = location.split(',').map(s => s.trim())
  return parts[0]
}

/* ═══ Hero Card — Official Upcoming Tournament ═══ */
function HeroCard({ t, dark, onClick, regCount }) {
  const [open, setOpen] = useState(null)
  const sportLabel = t.sportType ? getSportLabel(t.sportType) : null
  const wc = t.weightCategories || []
  const days = getDaysUntil(t.date)
  const dLabel = days !== null ? getDaysLabel(days) : null
  const urgent = days !== null && days >= 0 && days <= 3
  const d = t.date ? new Date(t.date) : null
  const city = extractCity(t.location)

  const toggle = (s, e) => { e.stopPropagation(); setOpen(open === s ? null : s) }

  return (
    <div className={`rounded-3xl overflow-hidden transition-all ${
      dark
        ? 'bg-white/[0.05] border border-white/[0.08]'
        : 'bg-white border border-gray-100 shadow-[0_2px_16px_rgba(0,0,0,0.06)]'
    }`}>
      <div className="cursor-pointer" onClick={onClick}>
        {t.coverImage ? (
          <div className="relative">
            <img src={t.coverImage} alt={t.title} className="w-full h-40 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/20" />
            {/* Top badges */}
            <div className="absolute top-3 left-3 right-3 flex justify-between">
              <div className="flex gap-1.5">
                {sportLabel && <span className="px-2 py-0.5 rounded-lg bg-white/20 backdrop-blur-md text-[9px] font-bold text-white uppercase">{sportLabel}</span>}
              </div>
              {dLabel && (
                <span className={`px-2 py-0.5 rounded-lg backdrop-blur-md text-[9px] font-bold text-white ${urgent ? 'bg-orange-500/80' : 'bg-black/30'}`}>
                  {urgent && <Flame size={9} className="inline mr-0.5 -mt-px" />}{dLabel}
                </span>
              )}
            </div>
            {/* Bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="font-black text-[16px] text-white leading-snug">{t.title}</h3>
              <div className="flex items-center gap-3 mt-2 text-[11px]">
                <span className="flex items-center gap-1 text-white/80 whitespace-nowrap">
                  <Calendar size={11} />{formatDate(t.date)}
                </span>
                {city && (
                  <span className="flex items-center gap-1 text-white/60 whitespace-nowrap">
                    <MapPin size={10} />{city}
                  </span>
                )}
                {regCount > 0 && (
                  <span className="flex items-center gap-1 text-white/50 font-semibold">
                    <Users size={10} />{regCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* No cover */
          <div className="p-4 flex items-center gap-3.5">
            {/* Date block — fixed size */}
            <div className={`shrink-0 w-14 h-16 rounded-2xl flex flex-col items-center justify-center ${
              urgent ? 'bg-gradient-to-b from-orange-500/15 to-red-500/10' : dark ? 'bg-white/[0.05]' : 'bg-gray-50'
            }`}>
              <span className={`text-2xl font-black leading-none ${urgent ? 'text-orange-400' : 'text-accent'}`}>{d?.getDate() || '—'}</span>
              <span className={`text-[9px] uppercase font-bold mt-0.5 ${dark ? 'text-white/30' : 'text-gray-400'}`}>
                {d?.toLocaleDateString('ru-RU', { month: 'short' }).replace('.', '')}
              </span>
            </div>
            {/* Info */}
            <div className="min-w-0 flex-1">
              <h3 className={`font-bold text-[15px] leading-snug line-clamp-2 ${dark ? 'text-white' : 'text-gray-900'}`}>{t.title}</h3>
              <div className="flex items-center gap-3 mt-1.5 text-[11px]">
                {city && (
                  <span className={`flex items-center gap-1 whitespace-nowrap ${dark ? 'text-white/40' : 'text-gray-500'}`}>
                    <MapPin size={10} />{city}
                  </span>
                )}
                {sportLabel && <span className={`px-1.5 py-px rounded text-[8px] font-bold uppercase ${dark ? 'bg-accent/12 text-accent-light' : 'bg-red-50 text-red-600'}`}>{sportLabel}</span>}
              </div>
              {(dLabel || regCount > 0) && (
                <div className="flex items-center gap-2 mt-1.5">
                  {dLabel && <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold ${urgent ? 'bg-orange-500/10 text-orange-400' : dark ? 'bg-white/[0.06] text-white/30' : 'bg-gray-100 text-gray-500'}`}>
                    {urgent && <Flame size={8} className="inline mr-0.5 -mt-px" />}{dLabel}
                  </span>}
                  {regCount > 0 && <span className={`text-[10px] font-semibold ${dark ? 'text-white/25' : 'text-gray-400'}`}><Users size={9} className="inline mr-0.5" />{regCount}</span>}
                </div>
              )}
            </div>
            <ChevronRight size={16} className={dark ? 'text-white/12' : 'text-gray-200'} />
          </div>
        )}
      </div>

      {/* Detail pills */}
      {(wc.length > 0 || t.regulations || t.rules || t.prizes) && (
        <div className={`px-4 pb-3 flex flex-wrap gap-1.5 ${t.coverImage ? '' : 'pt-0'}`}>
          {wc.length > 0 && <Pill active={open === 'w'} label={`${wc.length} вес.кат.`} icon={Scale} dark={dark} onClick={e => toggle('w', e)} />}
          {t.regulations && <Pill active={open === 'r'} label="Положение" icon={ScrollText} dark={dark} onClick={e => toggle('r', e)} />}
          {t.rules && <Pill active={open === 'ru'} label="Правила" icon={ScrollText} dark={dark} onClick={e => toggle('ru', e)} />}
          {t.prizes && <Pill active={open === 'p'} label="Призы" icon={Medal} dark={dark} accent onClick={e => toggle('p', e)} />}
        </div>
      )}
      {open === 'w' && wc.length > 0 && <Expand dark={dark}><div className="flex flex-wrap gap-1.5">{wc.map((w,i)=><span key={i} className={`px-2.5 py-1 rounded-xl text-[11px] font-bold ${dark?'bg-purple-500/12 text-purple-300':'bg-purple-50 text-purple-700'}`}>{w}</span>)}</div></Expand>}
      {open === 'r' && t.regulations && <Expand dark={dark}><p className={`text-[12px] leading-relaxed whitespace-pre-line ${dark?'text-white/55':'text-gray-600'}`}>{t.regulations}</p></Expand>}
      {open === 'ru' && t.rules && <Expand dark={dark}><p className={`text-[12px] leading-relaxed whitespace-pre-line ${dark?'text-white/55':'text-gray-600'}`}>{t.rules}</p></Expand>}
      {open === 'p' && t.prizes && <Expand dark={dark}><p className={`text-[12px] leading-relaxed whitespace-pre-line ${dark?'text-white/55':'text-gray-600'}`}>{t.prizes}</p></Expand>}
    </div>
  )
}

/* ═══ Club Card ═══ */
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
    <div onClick={onClick} className={`rounded-3xl overflow-hidden cursor-pointer press-scale transition-all ${
      dark
        ? `bg-white/[0.05] border ${isActive ? 'border-purple-500/15' : 'border-white/[0.06]'}`
        : `bg-white border ${isActive ? 'border-purple-200/60' : 'border-gray-100'} shadow-[0_2px_16px_rgba(0,0,0,0.05)]`
    }`}>
      {t.coverImage ? (
        <div className="relative">
          <img src={t.coverImage} alt={t.title} className="w-full h-40 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="font-bold text-[15px] text-white">{t.title}</h3>
            <div className="flex items-center gap-3 mt-1.5 text-[11px]">
              <span className="flex items-center gap-1 text-white/70 whitespace-nowrap"><Calendar size={10} />{formatDate(t.date)}</span>
              {sportLabel && <span className="px-1.5 py-px rounded text-[8px] font-bold bg-white/15 text-white/80">{sportLabel}</span>}
              <span className="flex items-center gap-1 text-white/50"><Users size={9} />{pCount}</span>
            </div>
          </div>
          {isActive && <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-green-400 shadow-lg shadow-green-400/50 animate-pulse" />}
        </div>
      ) : (
        <div className="p-4 flex items-center gap-3.5">
          {/* Date block — same fixed size as HeroCard */}
          <div className={`shrink-0 w-14 h-16 rounded-2xl flex flex-col items-center justify-center ${
            isActive
              ? 'bg-gradient-to-b from-purple-500/12 to-indigo-500/12'
              : dark ? 'bg-white/[0.04]' : 'bg-gray-50'
          }`}>
            <span className={`text-xl font-black leading-none ${isActive ? 'text-purple-400' : dark ? 'text-white/25' : 'text-gray-400'}`}>{d?.getDate() || '—'}</span>
            <span className={`text-[8px] uppercase font-bold mt-0.5 ${dark ? 'text-white/25' : 'text-gray-400'}`}>{d?.toLocaleDateString('ru-RU',{month:'short'}).replace('.','')}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {isActive && <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />}
              <h3 className={`font-bold text-[14px] truncate ${dark ? 'text-white' : 'text-gray-900'}`}>{t.title}</h3>
              {!isActive && <Check size={14} className="text-green-500/50 shrink-0" />}
            </div>
            <div className="flex items-center gap-2 mt-1">
              {sportLabel && <span className={`px-1.5 py-px rounded text-[8px] font-bold uppercase ${dark?'bg-accent/12 text-accent-light':'bg-red-50 text-red-600'}`}>{sportLabel}</span>}
              {dLabel && <span className={`text-[9px] font-semibold ${dark ? 'text-purple-300/50' : 'text-purple-500/70'}`}>{dLabel}</span>}
              <span className={`ml-auto text-[10px] ${dark ? 'text-white/25' : 'text-gray-400'}`}>
                <Users size={9} className="inline mr-0.5" />{pCount} · <Scale size={9} className="inline mr-0.5" />{catCount}
              </span>
            </div>
          </div>
          <ChevronRight size={14} className={dark ? 'text-white/10' : 'text-gray-200'} />
        </div>
      )}
    </div>
  )
}

/* ═══ Archive Row ═══ */
function ArchiveRow({ t, dark, onClick }) {
  const d = t.date ? new Date(t.date) : null
  const isClub = t._kind === 'internal'
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
        {isClub && <span className={`text-[9px] font-bold ${dark ? 'text-white/15' : 'text-gray-300'}`}>Клубный</span>}
      </div>
      <Check size={12} className={dark ? 'text-green-500/30' : 'text-green-500/40'} />
    </div>
  )
}

/* ── Helpers ── */
function Pill({ active, label, icon: Icon, dark, onClick, accent }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold press-scale transition-all ${
      active
        ? accent ? 'bg-amber-500 text-white' : 'bg-accent text-white'
        : dark ? 'bg-white/[0.05] text-white/35' : 'bg-gray-50 text-gray-500'
    }`}><Icon size={10} />{label}</button>
  )
}

function Expand({ dark, children }) {
  return <div className={`mx-3 mb-3 p-3 rounded-2xl animate-in ${dark ? 'bg-white/[0.03] border border-white/[0.04]' : 'bg-gray-50/60 border border-gray-100'}`}>{children}</div>
}

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
