import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Calendar, MapPin, Trophy, Swords, Check, ChevronDown, Scale, ScrollText, Medal, Users, Flame, Archive, X } from 'lucide-react'
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

function getDaysUntil(iso) {
  if (!iso) return null
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const target = new Date(iso)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24))
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

/* ═══ Segment Control ═══ */
function SegmentControl({ tabs, active, onChange, dark }) {
  return (
    <div className={`flex rounded-2xl p-1 ${dark ? 'bg-white/[0.06]' : 'bg-black/[0.04]'}`}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-[13px] font-bold transition-all duration-200 press-scale ${
            active === tab.id
              ? dark
                ? 'bg-white/[0.12] text-white shadow-sm'
                : 'bg-white text-gray-900 shadow-sm'
              : dark ? 'text-white/40' : 'text-gray-400'
          }`}
        >
          {tab.icon && <tab.icon size={14} />}
          {tab.label}
          {tab.count > 0 && (
            <span className={`min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-black ${
              active === tab.id
                ? dark ? 'bg-accent/20 text-accent-light' : 'bg-accent/10 text-accent'
                : dark ? 'bg-white/[0.06] text-white/30' : 'bg-gray-200/60 text-gray-400'
            }`}>{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  )
}

/* ═══ Sport Filter ═══ */
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

/* ═══ Tournament Card — unified for both official & internal ═══ */
function TournamentCard({ t, dark, onClick, registrations, isInternal }) {
  const [openSection, setOpenSection] = useState(null)
  const sportLabel = t.sportType ? getSportLabel(t.sportType) : null
  const wc = t.weightCategories || []
  const daysUntil = getDaysUntil(t.date)
  const daysLabel = daysUntil !== null ? getDaysLabel(daysUntil) : null
  const isUrgent = daysUntil !== null && daysUntil >= 0 && daysUntil <= 3
  const isPast = daysUntil !== null && daysUntil < 0

  // Participants count
  let participantCount = 0
  if (isInternal) {
    const cats = t.brackets?.categories || []
    const isLegacy = !cats.length && t.brackets?.rounds
    participantCount = isLegacy
      ? (t.brackets?.participants?.length || 0)
      : cats.reduce((s, c) => s + (c.participants?.length || 0), 0)
  } else {
    participantCount = registrations?.filter(r => r.tournamentId === t.id).length || 0
  }

  const catCount = isInternal
    ? (t.brackets?.categories?.length || (t.brackets?.rounds ? 1 : 0))
    : wc.length

  const toggleSection = (section, e) => {
    e.stopPropagation()
    setOpenSection(openSection === section ? null : section)
  }

  const dateObj = t.date ? new Date(t.date) : null
  const dayNum = dateObj ? dateObj.getDate() : '—'
  const monthShort = dateObj ? dateObj.toLocaleDateString('ru-RU', { month: 'short' }).replace('.', '') : ''
  const yearStr = dateObj ? dateObj.getFullYear() : ''

  return (
    <div className={`rounded-[22px] overflow-hidden backdrop-blur-xl transition-all duration-300 ${
      dark
        ? 'bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.07]'
        : 'bg-white/80 border border-white/60 shadow-[0_2px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_28px_rgba(0,0,0,0.1)]'
    }`}>
      {/* Main clickable area */}
      <div className="cursor-pointer" onClick={onClick}>
        {t.coverImage ? (
          /* ── With cover image ── */
          <div className="relative">
            <img src={t.coverImage} alt={t.title} className="w-full h-44 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

            {/* Top badges */}
            <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
              <div className="flex items-center gap-1.5 flex-wrap">
                {sportLabel && (
                  <span className="px-2.5 py-1 rounded-xl bg-accent/90 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wide">
                    {sportLabel}
                  </span>
                )}
                {isInternal && (
                  <span className="px-2.5 py-1 rounded-xl bg-purple-500/80 backdrop-blur-md text-[10px] font-bold text-white uppercase">
                    Клубный
                  </span>
                )}
              </div>
              {daysLabel && !isPast && (
                <span className={`px-2.5 py-1 rounded-xl backdrop-blur-md text-[10px] font-bold text-white ${
                  isUrgent ? 'bg-orange-500/90' : 'bg-black/40'
                }`}>
                  {isUrgent && <Flame size={10} className="inline mr-0.5 -mt-0.5" />}
                  {daysLabel}
                </span>
              )}
            </div>

            {/* Bottom content over image */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="font-black text-[15px] text-white leading-snug line-clamp-2">{t.title}</h3>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1.5 text-white/80 text-[11px]">
                  <Calendar size={11} className="shrink-0" />
                  <span className="whitespace-nowrap">{formatDate(t.date)}</span>
                </div>
                {t.location && (
                  <div className="flex items-center gap-1.5 text-white/60 text-[11px] min-w-0">
                    <MapPin size={11} className="shrink-0" />
                    <span className="truncate">{t.location}</span>
                  </div>
                )}
              </div>
              {/* Bottom stats row */}
              <div className="flex items-center gap-3 mt-2.5">
                {participantCount > 0 && (
                  <span className="flex items-center gap-1 text-white/60 text-[10px] font-semibold">
                    <Users size={10} />{participantCount} уч.
                  </span>
                )}
                {catCount > 0 && !isInternal && (
                  <span className="flex items-center gap-1 text-white/60 text-[10px] font-semibold">
                    <Scale size={10} />{catCount} кат.
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ── Without cover image ── */
          <div className="flex gap-3.5 p-4">
            {/* Date block */}
            <div className={`shrink-0 w-[52px] h-[58px] rounded-2xl flex flex-col items-center justify-center ${
              isPast
                ? dark ? 'bg-white/[0.04]' : 'bg-gray-100/80'
                : isUrgent
                  ? 'bg-gradient-to-br from-orange-500/20 to-red-500/15'
                  : isInternal
                    ? 'bg-gradient-to-br from-purple-500/15 to-indigo-500/15'
                    : 'bg-gradient-to-br from-accent/15 to-purple-500/15'
            }`}>
              <span className={`text-xl font-black leading-none ${
                isPast ? dark ? 'text-white/25' : 'text-gray-300'
                  : isUrgent ? 'text-orange-400'
                  : isInternal ? 'text-purple-400' : 'text-accent'
              }`}>{dayNum}</span>
              <span className={`text-[9px] uppercase font-bold mt-0.5 ${
                isPast ? dark ? 'text-white/15' : 'text-gray-300'
                  : dark ? 'text-white/40' : 'text-gray-500'
              }`}>{monthShort}</span>
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              {/* Badges row */}
              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                {sportLabel && (
                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase ${
                    dark ? 'bg-accent/15 text-accent-light' : 'bg-red-50 text-red-600'
                  }`}>{sportLabel}</span>
                )}
                {isInternal && (
                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase ${
                    dark ? 'bg-purple-500/15 text-purple-300' : 'bg-purple-50 text-purple-600'
                  }`}>Клубный</span>
                )}
                {daysLabel && !isPast && (
                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold ${
                    isUrgent ? 'bg-orange-500/12 text-orange-400' : dark ? 'bg-white/[0.06] text-white/40' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {isUrgent && <Flame size={8} className="inline mr-0.5 -mt-0.5" />}
                    {daysLabel}
                  </span>
                )}
                {isPast && (
                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold ${
                    dark ? 'bg-white/[0.05] text-white/25' : 'bg-gray-100 text-gray-400'
                  }`}>Завершён</span>
                )}
              </div>

              {/* Title */}
              <h3 className={`font-bold text-[14px] leading-snug line-clamp-2 ${
                isPast ? dark ? 'text-white/45' : 'text-gray-500' : dark ? 'text-white' : 'text-gray-900'
              }`}>{t.title}</h3>

              {/* Date + Location row */}
              <div className="flex items-center gap-3 mt-1.5">
                <span className={`flex items-center gap-1 text-[11px] whitespace-nowrap ${dark ? 'text-white/35' : 'text-gray-500'}`}>
                  <Calendar size={10} className="shrink-0" />
                  {formatDate(t.date)}
                </span>
                {t.location && (
                  <span className={`flex items-center gap-1 text-[11px] min-w-0 ${dark ? 'text-white/30' : 'text-gray-400'}`}>
                    <MapPin size={10} className="shrink-0" />
                    <span className="truncate">{t.location}</span>
                  </span>
                )}
              </div>

              {/* Participants / categories */}
              {(participantCount > 0 || catCount > 0) && (
                <div className={`flex items-center gap-2.5 mt-1.5 text-[10px] font-semibold ${dark ? 'text-white/25' : 'text-gray-400'}`}>
                  {participantCount > 0 && <span className="flex items-center gap-1"><Users size={10} />{participantCount} уч.</span>}
                  {catCount > 0 && <span className="flex items-center gap-1"><Scale size={10} />{catCount} кат.</span>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Info pills (official tournaments only) */}
      {!isInternal && (wc.length > 0 || t.regulations || t.rules || t.prizes || t.matsCount > 1) && (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          {wc.length > 0 && (
            <button onClick={(e) => toggleSection('weights', e)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold press-scale transition-all ${
                openSection === 'weights'
                  ? 'bg-accent text-white'
                  : dark ? 'bg-white/[0.05] text-white/40' : 'bg-gray-100/80 text-gray-500'
              }`}
            >
              <Scale size={10} />{wc.length} вес.
              {openSection === 'weights' ? <X size={8} /> : <ChevronDown size={8} />}
            </button>
          )}
          {t.regulations && (
            <button onClick={(e) => toggleSection('regulations', e)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold press-scale transition-all ${
                openSection === 'regulations'
                  ? 'bg-accent text-white'
                  : dark ? 'bg-white/[0.05] text-white/40' : 'bg-gray-100/80 text-gray-500'
              }`}
            >
              <ScrollText size={10} />Положение
            </button>
          )}
          {t.rules && (
            <button onClick={(e) => toggleSection('rules', e)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold press-scale transition-all ${
                openSection === 'rules'
                  ? 'bg-accent text-white'
                  : dark ? 'bg-white/[0.05] text-white/40' : 'bg-gray-100/80 text-gray-500'
              }`}
            >
              <ScrollText size={10} />Правила
            </button>
          )}
          {t.prizes && (
            <button onClick={(e) => toggleSection('prizes', e)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold press-scale transition-all ${
                openSection === 'prizes'
                  ? 'bg-amber-500 text-white'
                  : dark ? 'bg-white/[0.05] text-white/40' : 'bg-gray-100/80 text-gray-500'
              }`}
            >
              <Medal size={10} />Призы
            </button>
          )}
          {t.matsCount > 1 && (
            <span className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold ${
              dark ? 'bg-white/[0.05] text-white/30' : 'bg-gray-100/80 text-gray-400'
            }`}>{t.matsCount} ковр.</span>
          )}
        </div>
      )}

      {/* Expandable sections */}
      {openSection === 'weights' && wc.length > 0 && (
        <div className={`mx-3 mb-3 p-3.5 rounded-2xl animate-in ${dark ? 'bg-white/[0.03] border border-white/[0.05]' : 'bg-gray-50/80 border border-gray-100'}`}>
          <div className={`text-[9px] uppercase font-bold tracking-wider mb-2 ${dark ? 'text-white/35' : 'text-gray-400'}`}>Весовые категории</div>
          <div className="flex flex-wrap gap-1.5">
            {wc.map((w, i) => (
              <span key={i} className={`px-2.5 py-1 rounded-xl text-[11px] font-bold ${
                dark ? 'bg-purple-500/12 text-purple-300' : 'bg-purple-50 text-purple-700'
              }`}>{w}</span>
            ))}
          </div>
        </div>
      )}
      {openSection === 'regulations' && t.regulations && (
        <div className={`mx-3 mb-3 p-3.5 rounded-2xl animate-in ${dark ? 'bg-white/[0.03] border border-white/[0.05]' : 'bg-gray-50/80 border border-gray-100'}`}>
          <div className={`text-[9px] uppercase font-bold tracking-wider mb-2 ${dark ? 'text-white/35' : 'text-gray-400'}`}>Положение</div>
          <p className={`text-[12px] leading-relaxed whitespace-pre-line ${dark ? 'text-white/55' : 'text-gray-600'}`}>{t.regulations}</p>
        </div>
      )}
      {openSection === 'rules' && t.rules && (
        <div className={`mx-3 mb-3 p-3.5 rounded-2xl animate-in ${dark ? 'bg-white/[0.03] border border-white/[0.05]' : 'bg-gray-50/80 border border-gray-100'}`}>
          <div className={`text-[9px] uppercase font-bold tracking-wider mb-2 ${dark ? 'text-white/35' : 'text-gray-400'}`}>Правила</div>
          <p className={`text-[12px] leading-relaxed whitespace-pre-line ${dark ? 'text-white/55' : 'text-gray-600'}`}>{t.rules}</p>
        </div>
      )}
      {openSection === 'prizes' && t.prizes && (
        <div className={`mx-3 mb-3 p-3.5 rounded-2xl animate-in ${dark ? 'bg-white/[0.03] border border-white/[0.05]' : 'bg-gray-50/80 border border-gray-100'}`}>
          <div className={`text-[9px] uppercase font-bold tracking-wider mb-2 ${dark ? 'text-amber-400/50' : 'text-amber-600'}`}>Призы</div>
          <p className={`text-[12px] leading-relaxed whitespace-pre-line ${dark ? 'text-white/55' : 'text-gray-600'}`}>{t.prizes}</p>
        </div>
      )}
    </div>
  )
}

/* ═══ Archive Row (compact) ═══ */
function ArchiveRow({ t, dark, onClick, isInternal }) {
  const sportLabel = t.sportType ? getSportLabel(t.sportType) : null
  const dateObj = t.date ? new Date(t.date) : null

  return (
    <div onClick={onClick} className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer press-scale transition-all ${
      dark ? 'bg-white/[0.03] hover:bg-white/[0.05]' : 'bg-white/40 hover:bg-white/60'
    }`}>
      <div className={`shrink-0 w-10 h-10 rounded-xl flex flex-col items-center justify-center ${
        dark ? 'bg-white/[0.04]' : 'bg-gray-100/60'
      }`}>
        <span className={`text-sm font-black leading-none ${dark ? 'text-white/25' : 'text-gray-400'}`}>
          {dateObj ? dateObj.getDate() : '—'}
        </span>
        <span className={`text-[7px] uppercase font-bold mt-px ${dark ? 'text-white/15' : 'text-gray-300'}`}>
          {dateObj ? dateObj.toLocaleDateString('ru-RU', { month: 'short' }).replace('.', '') : ''}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <h4 className={`font-bold text-[13px] truncate ${dark ? 'text-white/45' : 'text-gray-500'}`}>{t.title}</h4>
        <div className={`flex items-center gap-1.5 mt-0.5 text-[10px] ${dark ? 'text-white/20' : 'text-gray-400'}`}>
          {sportLabel && <span>{sportLabel}</span>}
          {isInternal && <span className={`px-1.5 py-px rounded text-[8px] font-bold ${dark ? 'bg-white/[0.04] text-white/20' : 'bg-gray-100 text-gray-400'}`}>Клубный</span>}
        </div>
      </div>
      <Check size={14} className={dark ? 'text-green-500/40' : 'text-green-500/50'} />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════ */
export default function Tournaments() {
  const { auth } = useAuth()
  const { data } = useData()
  const { dark } = useTheme()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('upcoming')
  const [sportFilter, setSportFilter] = useState(null)
  const [clubSubTab, setClubSubTab] = useState('active')

  const now = new Date()

  // ── Official tournaments ──
  const allOfficial = useMemo(() =>
    [...data.tournaments].sort((a, b) => new Date(a.date) - new Date(b.date)),
    [data.tournaments]
  )
  const upcomingOfficial = allOfficial.filter(t => new Date(t.date) >= now)
  const pastOfficial = allOfficial.filter(t => new Date(t.date) < now)

  // ── Internal (club) tournaments ──
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
  const activeInternal = allInternal.filter(t => t.status !== 'completed')
  const completedInternal = allInternal.filter(t => t.status === 'completed')

  // ── Archive (all past) ──
  const allArchive = useMemo(() => [
    ...pastOfficial.map(t => ({ ...t, _type: 'official' })),
    ...completedInternal.map(t => ({ ...t, _type: 'internal' })),
  ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)), [pastOfficial, completedInternal])

  // ── Sport types for filter ──
  const currentList = activeTab === 'upcoming' ? upcomingOfficial
    : activeTab === 'club' ? (clubSubTab === 'active' ? activeInternal : completedInternal)
    : allArchive
  const sportTypes = useMemo(() => {
    const set = new Set()
    currentList.forEach(t => { if (t.sportType) set.add(t.sportType) })
    return [...set]
  }, [currentList])

  const filterBySport = list => sportFilter ? list.filter(t => t.sportType === sportFilter) : list

  const filteredUpcoming = filterBySport(upcomingOfficial)
  const filteredClubActive = filterBySport(activeInternal)
  const filteredClubCompleted = filterBySport(completedInternal)
  const filteredArchive = filterBySport(allArchive)

  const canAdd = auth.role === 'superadmin' || auth.role === 'organizer'

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
        {/* ── Segment Control ── */}
        <SegmentControl
          dark={dark}
          active={activeTab}
          onChange={id => { setActiveTab(id); setSportFilter(null) }}
          tabs={[
            { id: 'upcoming', label: 'Предстоящие', icon: Trophy, count: upcomingOfficial.length },
            { id: 'club', label: 'Клубные', icon: Swords, count: allInternal.length },
            { id: 'archive', label: 'Архив', icon: Archive, count: allArchive.length },
          ]}
        />

        {/* ── Club sub-tabs: Активные / Прошедшие ── */}
        {activeTab === 'club' && allInternal.length > 0 && (
          <div className="flex gap-2 mt-3">
            {['active', 'completed'].map(key => (
              <button
                key={key}
                onClick={() => { setClubSubTab(key); setSportFilter(null) }}
                className={`px-3.5 py-1.5 rounded-xl text-[12px] font-bold transition-all press-scale ${
                  clubSubTab === key
                    ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20'
                    : dark ? 'text-white/30' : 'text-gray-400'
                }`}
              >
                {key === 'active' ? `Активные (${activeInternal.length})` : `Прошедшие (${completedInternal.length})`}
              </button>
            ))}
          </div>
        )}

        {/* ── Sport Filter ── */}
        {sportTypes.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto mt-3 -mx-4 px-4 scrollbar-hide">
            <SportChip label="Все" active={!sportFilter} dark={dark} onClick={() => setSportFilter(null)} />
            {sportTypes.map(st => (
              <SportChip key={st} label={getSportLabel(st)} active={sportFilter === st} dark={dark}
                onClick={() => setSportFilter(sportFilter === st ? null : st)} />
            ))}
          </div>
        )}

        {/* ═══ UPCOMING ═══ */}
        {activeTab === 'upcoming' && (
          <div className="space-y-3 mt-4">
            {filteredUpcoming.length > 0 ? (
              filteredUpcoming.map(t => (
                <TournamentCard
                  key={t.id} t={t} dark={dark}
                  onClick={() => navigate(`/tournaments/${t.id}`)}
                  registrations={data.tournamentRegistrations}
                />
              ))
            ) : (
              <EmptyState dark={dark} icon={Trophy} title="Нет предстоящих турниров"
                subtitle={canAdd ? 'Создайте новый турнир' : 'Следите за обновлениями'}
                action={canAdd ? { label: 'Создать турнир', onClick: () => navigate('/add-tournament') } : null}
              />
            )}
          </div>
        )}

        {/* ═══ CLUB ═══ */}
        {activeTab === 'club' && (
          <div className="space-y-3 mt-4">
            {clubSubTab === 'active' ? (
              filteredClubActive.length > 0 ? (
                filteredClubActive.map(t => (
                  <TournamentCard key={t.id} t={t} dark={dark} isInternal
                    onClick={() => navigate(`/internal-tournament/${t.id}`)} />
                ))
              ) : (
                <EmptyState dark={dark} icon={Swords} title="Нет активных клубных турниров"
                  subtitle={auth.role === 'trainer' ? 'Создайте клубный турнир' : 'Турниры появятся здесь'}
                  action={auth.role === 'trainer' ? { label: 'Создать турнир', onClick: () => navigate('/create-internal-tournament') } : null}
                />
              )
            ) : (
              filteredClubCompleted.length > 0 ? (
                filteredClubCompleted.map(t => (
                  <TournamentCard key={t.id} t={t} dark={dark} isInternal
                    onClick={() => navigate(`/internal-tournament/${t.id}`)} />
                ))
              ) : (
                <EmptyState dark={dark} icon={Archive} title="Нет прошедших клубных турниров"
                  subtitle="Завершённые турниры будут здесь" />
              )
            )}
          </div>
        )}

        {/* ═══ ARCHIVE ═══ */}
        {activeTab === 'archive' && (
          <div className="space-y-1.5 mt-4">
            {filteredArchive.length > 0 ? (
              filteredArchive.map(t => (
                <ArchiveRow key={t.id} t={t} dark={dark} isInternal={t._type === 'internal'}
                  onClick={() => navigate(t._type === 'internal' ? `/internal-tournament/${t.id}` : `/tournaments/${t.id}`)} />
              ))
            ) : (
              <EmptyState dark={dark} icon={Archive} title="Архив пуст" subtitle="Завершённые турниры будут здесь" />
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}

function EmptyState({ dark, icon: Icon, title, subtitle, action }) {
  return (
    <div className="text-center py-14">
      <div className={`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center ${dark ? 'bg-white/[0.04]' : 'bg-gray-50'}`}>
        <Icon size={30} className={dark ? 'text-white/12' : 'text-gray-200'} />
      </div>
      <p className={`text-sm font-medium ${dark ? 'text-white/30' : 'text-gray-400'}`}>{title}</p>
      {subtitle && <p className={`text-xs mt-1 ${dark ? 'text-white/18' : 'text-gray-300'}`}>{subtitle}</p>}
      {action && (
        <button onClick={action.onClick}
          className="mt-4 px-5 py-2.5 rounded-2xl bg-accent text-white text-sm font-bold press-scale shadow-lg shadow-accent/20">
          {action.label}
        </button>
      )}
    </div>
  )
}
