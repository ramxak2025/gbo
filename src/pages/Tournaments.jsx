import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Calendar, MapPin, Trophy, Swords, Check, ChevronDown, ChevronUp, Scale, ScrollText, Medal, Users, Clock, Flame, Archive, Filter, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import { getSportLabel } from '../utils/sports'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatDateShort(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

function getDaysUntil(iso) {
  if (!iso) return null
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const target = new Date(iso)
  target.setHours(0, 0, 0, 0)
  const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24))
  return diff
}

function getDaysLabel(days) {
  if (days === 0) return 'Сегодня'
  if (days === 1) return 'Завтра'
  if (days < 0) return null
  const abs = Math.abs(days)
  if (abs % 10 === 1 && abs % 100 !== 11) return `${abs} день`
  if ([2, 3, 4].includes(abs % 10) && ![12, 13, 14].includes(abs % 100)) return `${abs} дня`
  return `${abs} дней`
}

/* ───── Tab Pill ───── */
function TabPill({ active, label, count, icon: Icon, dark, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold transition-all duration-200 press-scale whitespace-nowrap ${
        active
          ? 'bg-accent text-white shadow-lg shadow-accent/25'
          : dark
            ? 'bg-white/[0.06] text-white/50 border border-white/[0.06]'
            : 'bg-white/70 text-gray-500 border border-gray-200/60 shadow-sm'
      }`}
    >
      {Icon && <Icon size={14} />}
      {label}
      {count > 0 && (
        <span className={`ml-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-black ${
          active ? 'bg-white/25 text-white' : dark ? 'bg-white/[0.08] text-white/40' : 'bg-gray-200/80 text-gray-500'
        }`}>{count}</span>
      )}
    </button>
  )
}

/* ───── Sport Filter Chips ───── */
function SportChip({ label, active, dark, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all press-scale whitespace-nowrap ${
        active
          ? dark ? 'bg-purple-500/25 text-purple-300 border border-purple-500/30' : 'bg-purple-100 text-purple-700 border border-purple-200'
          : dark ? 'bg-white/[0.04] text-white/35 border border-white/[0.05]' : 'bg-white/50 text-gray-400 border border-gray-200/40'
      }`}
    >
      {label}
    </button>
  )
}

/* ───── Upcoming Tournament Card (Featured) ───── */
function UpcomingCard({ t, dark, onClick, registrations }) {
  const [openSection, setOpenSection] = useState(null)
  const sportLabel = t.sportType ? getSportLabel(t.sportType) : null
  const wc = t.weightCategories || []
  const regCount = registrations?.filter(r => r.tournamentId === t.id).length || 0
  const daysUntil = getDaysUntil(t.date)
  const daysLabel = daysUntil !== null ? getDaysLabel(daysUntil) : null
  const isUrgent = daysUntil !== null && daysUntil >= 0 && daysUntil <= 3

  const toggleSection = (section, e) => {
    e.stopPropagation()
    setOpenSection(openSection === section ? null : section)
  }

  return (
    <div className={`rounded-[24px] overflow-hidden backdrop-blur-xl transition-all duration-300 ${
      dark
        ? 'bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.07]'
        : 'bg-white/80 border border-white/60 shadow-[0_4px_30px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.12)]'
    }`}>
      {/* Cover / Header */}
      <div className="cursor-pointer" onClick={onClick}>
        {t.coverImage ? (
          <div className="relative">
            <img src={t.coverImage} alt={t.title} className="w-full h-52 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <h3 className="font-black text-lg text-white leading-tight drop-shadow-lg">{t.title}</h3>
              <div className="flex items-center gap-3 mt-2">
                <span className="flex items-center gap-1.5 text-white/80 text-xs">
                  <Calendar size={12} />{formatDate(t.date)}
                </span>
                {t.location && (
                  <span className="flex items-center gap-1.5 text-white/70 text-xs truncate">
                    <MapPin size={12} />{t.location}
                  </span>
                )}
              </div>
            </div>
            {/* Badges */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              {sportLabel && (
                <span className="px-3 py-1 rounded-full bg-accent/90 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wide shadow-lg">
                  {sportLabel}
                </span>
              )}
            </div>
            <div className="absolute top-3 right-3 flex items-center gap-2">
              {daysLabel && (
                <span className={`px-3 py-1 rounded-full backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wide ${
                  isUrgent ? 'bg-orange-500/90 shadow-lg shadow-orange-500/30' : 'bg-black/50'
                }`}>
                  {isUrgent && <Flame size={10} className="inline mr-1" />}
                  {daysLabel}
                </span>
              )}
              {regCount > 0 && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500/80 backdrop-blur-md text-[10px] font-bold text-white">
                  <Users size={10} />{regCount}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {sportLabel && (
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                      dark ? 'bg-accent/20 text-accent-light' : 'bg-red-50 text-red-600'
                    }`}>{sportLabel}</span>
                  )}
                  {daysLabel && (
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                      isUrgent
                        ? 'bg-orange-500/15 text-orange-400'
                        : dark ? 'bg-white/[0.08] text-white/50' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {isUrgent && <Flame size={9} className="inline mr-0.5" />}
                      {daysLabel}
                    </span>
                  )}
                </div>
                <h3 className={`font-black text-base leading-snug ${dark ? 'text-white' : 'text-gray-900'}`}>{t.title}</h3>
                <div className={`flex items-center gap-3 mt-2 text-xs ${dark ? 'text-white/45' : 'text-gray-500'}`}>
                  <span className="flex items-center gap-1.5"><Calendar size={12} />{formatDate(t.date)}</span>
                  {t.location && <span className="flex items-center gap-1.5 truncate"><MapPin size={12} />{t.location}</span>}
                </div>
              </div>
              {/* Date badge */}
              <div className={`shrink-0 w-14 h-14 rounded-2xl flex flex-col items-center justify-center ${
                isUrgent
                  ? 'bg-gradient-to-br from-orange-500/20 to-red-500/20'
                  : 'bg-gradient-to-br from-accent/20 to-purple-500/20'
              }`}>
                <span className={`text-lg font-black leading-none ${isUrgent ? 'text-orange-400' : 'text-accent'}`}>
                  {new Date(t.date).getDate()}
                </span>
                <span className={`text-[9px] uppercase font-bold mt-0.5 ${
                  dark ? 'text-white/40' : 'text-gray-500'
                }`}>{new Date(t.date).toLocaleDateString('ru-RU', { month: 'short' })}</span>
              </div>
            </div>
            {regCount > 0 && (
              <div className={`flex items-center gap-1.5 mt-2 text-[11px] font-semibold ${dark ? 'text-green-400/70' : 'text-green-600'}`}>
                <Users size={11} />{regCount} {regCount === 1 ? 'участник' : regCount < 5 ? 'участника' : 'участников'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick info pills */}
      {(wc.length > 0 || t.regulations || t.rules || t.prizes || t.matsCount > 1) && (
        <div className="px-4 pb-4 flex flex-wrap gap-2">
          {wc.length > 0 && (
            <button onClick={(e) => toggleSection('weights', e)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold press-scale transition-all duration-200 ${
                openSection === 'weights'
                  ? 'bg-accent text-white shadow-lg shadow-accent/25'
                  : dark ? 'bg-white/[0.06] text-white/50 border border-white/[0.06]' : 'bg-white text-gray-600 border border-gray-200 shadow-sm'
              }`}
            >
              <Scale size={12} />{wc.length} вес.кат.
              {openSection === 'weights' ? <X size={10} /> : <ChevronDown size={10} />}
            </button>
          )}
          {t.regulations && (
            <button onClick={(e) => toggleSection('regulations', e)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold press-scale transition-all duration-200 ${
                openSection === 'regulations'
                  ? 'bg-accent text-white shadow-lg shadow-accent/25'
                  : dark ? 'bg-white/[0.06] text-white/50 border border-white/[0.06]' : 'bg-white text-gray-600 border border-gray-200 shadow-sm'
              }`}
            >
              <ScrollText size={12} />Положение
              {openSection === 'regulations' ? <X size={10} /> : <ChevronDown size={10} />}
            </button>
          )}
          {t.rules && (
            <button onClick={(e) => toggleSection('rules', e)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold press-scale transition-all duration-200 ${
                openSection === 'rules'
                  ? 'bg-accent text-white shadow-lg shadow-accent/25'
                  : dark ? 'bg-white/[0.06] text-white/50 border border-white/[0.06]' : 'bg-white text-gray-600 border border-gray-200 shadow-sm'
              }`}
            >
              <ScrollText size={12} />Правила
              {openSection === 'rules' ? <X size={10} /> : <ChevronDown size={10} />}
            </button>
          )}
          {t.prizes && (
            <button onClick={(e) => toggleSection('prizes', e)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold press-scale transition-all duration-200 ${
                openSection === 'prizes'
                  ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25'
                  : dark ? 'bg-white/[0.06] text-white/50 border border-white/[0.06]' : 'bg-white text-gray-600 border border-gray-200 shadow-sm'
              }`}
            >
              <Medal size={12} />Призы
              {openSection === 'prizes' ? <X size={10} /> : <ChevronDown size={10} />}
            </button>
          )}
          {t.matsCount > 1 && (
            <span className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold ${
              dark ? 'bg-white/[0.06] text-white/40' : 'bg-white text-gray-500 border border-gray-200'
            }`}>{t.matsCount} ковр.</span>
          )}
        </div>
      )}

      {/* Expandable sections */}
      {openSection === 'weights' && wc.length > 0 && (
        <div className={`mx-4 mb-4 p-4 rounded-[18px] animate-in ${dark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-gray-50/80 border border-gray-100'}`}>
          <div className={`text-[10px] uppercase font-bold tracking-wider mb-2.5 ${dark ? 'text-white/40' : 'text-gray-400'}`}>Весовые категории</div>
          <div className="flex flex-wrap gap-2">
            {wc.map((w, i) => (
              <span key={i} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                dark ? 'bg-purple-500/15 text-purple-300 border border-purple-500/10' : 'bg-purple-50 text-purple-700 border border-purple-100'
              }`}>{w}</span>
            ))}
          </div>
        </div>
      )}
      {openSection === 'regulations' && t.regulations && (
        <div className={`mx-4 mb-4 p-4 rounded-[18px] animate-in ${dark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-gray-50/80 border border-gray-100'}`}>
          <div className={`text-[10px] uppercase font-bold tracking-wider mb-2.5 ${dark ? 'text-white/40' : 'text-gray-400'}`}>Положение</div>
          <p className={`text-[13px] leading-relaxed whitespace-pre-line ${dark ? 'text-white/60' : 'text-gray-600'}`}>{t.regulations}</p>
        </div>
      )}
      {openSection === 'rules' && t.rules && (
        <div className={`mx-4 mb-4 p-4 rounded-[18px] animate-in ${dark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-gray-50/80 border border-gray-100'}`}>
          <div className={`text-[10px] uppercase font-bold tracking-wider mb-2.5 ${dark ? 'text-white/40' : 'text-gray-400'}`}>Правила</div>
          <p className={`text-[13px] leading-relaxed whitespace-pre-line ${dark ? 'text-white/60' : 'text-gray-600'}`}>{t.rules}</p>
        </div>
      )}
      {openSection === 'prizes' && t.prizes && (
        <div className={`mx-4 mb-4 p-4 rounded-[18px] animate-in ${dark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-gray-50/80 border border-gray-100'}`}>
          <div className={`text-[10px] uppercase font-bold tracking-wider mb-2.5 ${dark ? 'text-amber-400/60' : 'text-amber-600'}`}>Призы</div>
          <p className={`text-[13px] leading-relaxed whitespace-pre-line ${dark ? 'text-white/60' : 'text-gray-600'}`}>{t.prizes}</p>
        </div>
      )}
    </div>
  )
}

/* ───── Archive Card (Compact) ───── */
function ArchiveCard({ t, dark, onClick, registrations, isInternal }) {
  const sportLabel = t.sportType ? getSportLabel(t.sportType) : null
  const regCount = isInternal
    ? (t.brackets?.categories || []).reduce((s, c) => s + (c.participants?.length || 0), 0)
    : registrations?.filter(r => r.tournamentId === t.id).length || 0

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-3.5 rounded-[18px] cursor-pointer press-scale transition-all duration-200 ${
        dark
          ? 'bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.05]'
          : 'bg-white/50 border border-gray-200/40 hover:bg-white/70'
      }`}
    >
      {/* Date mini block */}
      <div className={`shrink-0 w-11 h-11 rounded-xl flex flex-col items-center justify-center ${
        dark ? 'bg-white/[0.05]' : 'bg-gray-100/80'
      }`}>
        <span className={`text-sm font-black leading-none ${dark ? 'text-white/30' : 'text-gray-400'}`}>
          {t.date ? new Date(t.date).getDate() : '—'}
        </span>
        <span className={`text-[8px] uppercase font-bold mt-0.5 ${dark ? 'text-white/15' : 'text-gray-300'}`}>
          {t.date ? new Date(t.date).toLocaleDateString('ru-RU', { month: 'short' }) : ''}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h4 className={`font-bold text-sm truncate ${dark ? 'text-white/50' : 'text-gray-600'}`}>{t.title}</h4>
          <Check size={14} className="shrink-0 text-green-500/60" />
        </div>
        <div className={`flex items-center gap-2 mt-0.5 text-[11px] ${dark ? 'text-white/25' : 'text-gray-400'}`}>
          {sportLabel && <span>{sportLabel}</span>}
          {sportLabel && regCount > 0 && <span>·</span>}
          {regCount > 0 && <span>{regCount} уч.</span>}
          {isInternal && <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${dark ? 'bg-white/[0.05] text-white/20' : 'bg-gray-100 text-gray-400'}`}>Клубный</span>}
        </div>
      </div>
    </div>
  )
}

/* ───── Internal Tournament Card ───── */
function InternalCard({ t, dark, onClick }) {
  const cats = t.brackets?.categories || []
  const isLegacy = !cats.length && t.brackets?.rounds
  const totalParticipants = isLegacy
    ? (t.brackets?.participants?.length || 0)
    : cats.reduce((s, c) => s + (c.participants?.length || 0), 0)
  const catCount = isLegacy ? 1 : cats.length
  const sportLabel = t.sportType ? getSportLabel(t.sportType) : null
  const isActive = t.status !== 'completed'

  return (
    <div
      onClick={onClick}
      className={`rounded-[20px] overflow-hidden cursor-pointer press-scale transition-all duration-300 ${
        dark
          ? `bg-white/[0.05] border ${isActive ? 'border-purple-500/20 shadow-[0_0_20px_rgba(139,92,246,0.06)]' : 'border-white/[0.06]'} hover:bg-white/[0.07]`
          : `bg-white/80 border ${isActive ? 'border-purple-200 shadow-[0_4px_20px_rgba(139,92,246,0.08)]' : 'border-gray-200/60'} hover:shadow-lg`
      }`}
    >
      {t.coverImage && (
        <div className="relative">
          <img src={t.coverImage} alt={t.title} className="w-full h-28 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="font-bold text-sm text-white truncate">{t.title}</h3>
          </div>
          {isActive && (
            <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-green-400 shadow-lg shadow-green-400/50 animate-pulse" />
          )}
        </div>
      )}
      <div className={`p-4 ${t.coverImage ? 'pt-2' : ''}`}>
        {!t.coverImage && (
          <div className="flex items-center gap-2 mb-1">
            {isActive && (
              <div className="w-2 h-2 rounded-full bg-green-400 shadow-sm shadow-green-400/50 animate-pulse shrink-0" />
            )}
            <h3 className={`font-bold text-sm truncate ${dark ? 'text-white' : 'text-gray-900'}`}>{t.title}</h3>
            {!isActive && (
              <span className="shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check size={12} className="text-green-400" />
              </span>
            )}
          </div>
        )}
        <div className={`flex items-center gap-3 text-xs ${dark ? 'text-white/40' : 'text-gray-500'}`}>
          <span className="flex items-center gap-1"><Calendar size={11} />{formatDateShort(t.date)}</span>
          {sportLabel && (
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
              dark ? 'bg-accent/15 text-accent-light' : 'bg-red-50 text-red-600'
            }`}>{sportLabel}</span>
          )}
          <span className={`ml-auto flex items-center gap-1 ${dark ? 'text-white/30' : 'text-gray-400'}`}>
            <Users size={10} />{totalParticipants}
            <span className="mx-0.5">·</span>
            <Scale size={10} />{catCount}
          </span>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════ */
export default function Tournaments() {
  const { auth } = useAuth()
  const { data } = useData()
  const { dark } = useTheme()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('upcoming')
  const [sportFilter, setSportFilter] = useState(null)

  // ── Data preparation ──
  const now = new Date()

  const allOfficial = useMemo(() =>
    [...data.tournaments].sort((a, b) => new Date(a.date) - new Date(b.date)),
    [data.tournaments]
  )

  const allInternal = useMemo(() =>
    (data.internalTournaments || [])
      .filter(t => {
        if (auth.role === 'trainer') return t.trainerId === auth.userId
        if (auth.role === 'student') {
          const student = data.students.find(s => s.id === auth.studentId)
          return student && t.trainerId === student.trainerId
        }
        return true
      })
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)),
    [data.internalTournaments, auth.role, auth.userId, auth.studentId, data.students]
  )

  // Split
  const upcomingOfficial = allOfficial.filter(t => new Date(t.date) >= now)
  const pastOfficial = allOfficial.filter(t => new Date(t.date) < now)
  const activeInternal = allInternal.filter(t => t.status !== 'completed')
  const archivedInternal = allInternal.filter(t => t.status === 'completed')

  // All archive combined
  const allArchive = useMemo(() => {
    const items = [
      ...pastOfficial.map(t => ({ ...t, _type: 'official' })),
      ...archivedInternal.map(t => ({ ...t, _type: 'internal' })),
    ]
    return items.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
  }, [pastOfficial, archivedInternal])

  // Collect sport types for filter
  const allSportTypes = useMemo(() => {
    const set = new Set()
    const source = activeTab === 'upcoming' ? upcomingOfficial
      : activeTab === 'club' ? activeInternal
      : allArchive
    source.forEach(t => { if (t.sportType) set.add(t.sportType) })
    return [...set]
  }, [activeTab, upcomingOfficial, activeInternal, allArchive])

  // Apply sport filter
  const filterBySport = (list) => sportFilter ? list.filter(t => t.sportType === sportFilter) : list

  const filteredUpcoming = filterBySport(upcomingOfficial)
  const filteredClub = filterBySport(activeInternal)
  const filteredArchive = filterBySport(allArchive)

  const canAdd = auth.role === 'superadmin' || auth.role === 'organizer'

  // Counts
  const upcomingCount = upcomingOfficial.length
  const clubCount = activeInternal.length
  const archiveCount = allArchive.length

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
        {/* ── Tab Navigation ── */}
        <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide">
          <TabPill
            active={activeTab === 'upcoming'}
            label="Предстоящие"
            count={upcomingCount}
            icon={Trophy}
            dark={dark}
            onClick={() => { setActiveTab('upcoming'); setSportFilter(null) }}
          />
          <TabPill
            active={activeTab === 'club'}
            label="Клубные"
            count={clubCount}
            icon={Swords}
            dark={dark}
            onClick={() => { setActiveTab('club'); setSportFilter(null) }}
          />
          <TabPill
            active={activeTab === 'archive'}
            label="Архив"
            count={archiveCount}
            icon={Archive}
            dark={dark}
            onClick={() => { setActiveTab('archive'); setSportFilter(null) }}
          />
        </div>

        {/* ── Sport Filter ── */}
        {allSportTypes.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide">
            <SportChip
              label="Все"
              active={!sportFilter}
              dark={dark}
              onClick={() => setSportFilter(null)}
            />
            {allSportTypes.map(st => (
              <SportChip
                key={st}
                label={getSportLabel(st)}
                active={sportFilter === st}
                dark={dark}
                onClick={() => setSportFilter(sportFilter === st ? null : st)}
              />
            ))}
          </div>
        )}

        {/* ═══ UPCOMING TAB ═══ */}
        {activeTab === 'upcoming' && (
          <div className="space-y-4">
            {/* Featured: next tournament */}
            {filteredUpcoming.length > 0 && (
              <>
                {/* Hero card for nearest */}
                <UpcomingCard
                  t={filteredUpcoming[0]}
                  dark={dark}
                  onClick={() => navigate(`/tournaments/${filteredUpcoming[0].id}`)}
                  registrations={data.tournamentRegistrations}
                />

                {/* Rest of upcoming */}
                {filteredUpcoming.length > 1 && (
                  <div>
                    <h3 className={`text-[11px] uppercase font-bold tracking-wider mb-3 ${dark ? 'text-white/35' : 'text-gray-400'}`}>
                      Ещё предстоящие
                    </h3>
                    <div className="space-y-3">
                      {filteredUpcoming.slice(1).map(t => (
                        <UpcomingCard
                          key={t.id}
                          t={t}
                          dark={dark}
                          onClick={() => navigate(`/tournaments/${t.id}`)}
                          registrations={data.tournamentRegistrations}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {filteredUpcoming.length === 0 && (
              <EmptyState
                dark={dark}
                icon={Trophy}
                title="Нет предстоящих турниров"
                subtitle={canAdd ? 'Создайте новый турнир' : 'Следите за обновлениями'}
                action={canAdd ? { label: 'Создать турнир', onClick: () => navigate('/add-tournament') } : null}
              />
            )}
          </div>
        )}

        {/* ═══ CLUB TAB ═══ */}
        {activeTab === 'club' && (
          <div className="space-y-3">
            {filteredClub.length > 0 ? (
              filteredClub.map(t => (
                <InternalCard
                  key={t.id}
                  t={t}
                  dark={dark}
                  onClick={() => navigate(`/internal-tournament/${t.id}`)}
                />
              ))
            ) : (
              <EmptyState
                dark={dark}
                icon={Swords}
                title="Нет клубных турниров"
                subtitle={auth.role === 'trainer' ? 'Создайте клубный турнир для ваших учеников' : 'Турниры появятся здесь'}
                action={auth.role === 'trainer' ? { label: 'Создать турнир', onClick: () => navigate('/create-internal-tournament') } : null}
              />
            )}
          </div>
        )}

        {/* ═══ ARCHIVE TAB ═══ */}
        {activeTab === 'archive' && (
          <div className="space-y-2">
            {filteredArchive.length > 0 ? (
              filteredArchive.map(t => (
                <ArchiveCard
                  key={t.id}
                  t={t}
                  dark={dark}
                  onClick={() => navigate(t._type === 'internal' ? `/internal-tournament/${t.id}` : `/tournaments/${t.id}`)}
                  registrations={data.tournamentRegistrations}
                  isInternal={t._type === 'internal'}
                />
              ))
            ) : (
              <EmptyState
                dark={dark}
                icon={Archive}
                title="Архив пуст"
                subtitle="Завершённые турниры будут здесь"
              />
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}

/* ───── Empty State ───── */
function EmptyState({ dark, icon: Icon, title, subtitle, action }) {
  return (
    <div className="text-center py-16">
      <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
        dark ? 'bg-white/[0.04]' : 'bg-gray-50'
      }`}>
        <Icon size={36} className={dark ? 'text-white/15' : 'text-gray-200'} />
      </div>
      <p className={`text-sm font-medium ${dark ? 'text-white/35' : 'text-gray-400'}`}>{title}</p>
      {subtitle && (
        <p className={`text-xs mt-1 ${dark ? 'text-white/20' : 'text-gray-300'}`}>{subtitle}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-6 py-2.5 rounded-full bg-accent text-white text-sm font-bold press-scale shadow-lg shadow-accent/25"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
