import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Calendar, MapPin, Trophy, Swords, Check, Archive, ChevronDown, ChevronUp, Scale, ScrollText, Medal, Menu, X, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import { getSportLabel } from '../utils/sports'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import GlassCard from '../components/GlassCard'

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatDateShort(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

function TournamentCard({ t, dark, onClick, registrations }) {
  const [openSection, setOpenSection] = useState(null)
  const isPast = new Date(t.date) < new Date()
  const sportLabel = t.sportType ? getSportLabel(t.sportType) : null
  const wc = t.weightCategories || []
  const regCount = registrations?.filter(r => r.tournamentId === t.id).length || 0

  const toggleSection = (section, e) => {
    e.stopPropagation()
    setOpenSection(openSection === section ? null : section)
  }

  return (
    <div className={`rounded-[24px] overflow-hidden backdrop-blur-xl transition-all duration-300 press-scale ${
      dark
        ? 'bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.07]'
        : 'bg-white/80 border border-white/60 shadow-[0_4px_30px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.12)]'
    }`}>
      {/* Cover / Header */}
      <div className="cursor-pointer" onClick={onClick}>
        {t.coverImage ? (
          <div className="relative">
            <img src={t.coverImage} alt={t.title} className="w-full h-48 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <h3 className="font-black text-lg text-white leading-tight drop-shadow-lg">{t.title}</h3>
              <div className="flex items-center gap-3 mt-2 text-white/80 text-xs">
                <span className="flex items-center gap-1.5"><Calendar size={12} />{formatDate(t.date)}</span>
                {t.location && <span className="flex items-center gap-1.5 truncate"><MapPin size={12} />{t.location}</span>}
              </div>
            </div>
            {isPast && (
              <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-white/80 uppercase tracking-wide">
                Прошёл
              </div>
            )}
            {sportLabel && (
              <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-accent/90 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wide shadow-lg">
                {sportLabel}
              </div>
            )}
            {regCount > 0 && (
              <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500/80 backdrop-blur-md text-[10px] font-bold text-white" style={isPast ? {right: 'auto', left: 'auto', top: 'auto', bottom: '60px', right: '12px'} : {}}>
                <Users size={10} />{regCount}
              </div>
            )}
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
                  {isPast && (
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                      dark ? 'bg-white/[0.08] text-white/40' : 'bg-gray-100 text-gray-400'
                    }`}>Прошёл</span>
                  )}
                </div>
                <h3 className={`font-black text-base leading-snug ${dark ? 'text-white' : 'text-gray-900'}`}>{t.title}</h3>
                <div className={`flex items-center gap-3 mt-2 text-xs ${dark ? 'text-white/45' : 'text-gray-500'}`}>
                  <span className="flex items-center gap-1.5"><Calendar size={12} />{formatDate(t.date)}</span>
                  {t.location && <span className="flex items-center gap-1.5 truncate"><MapPin size={12} />{t.location}</span>}
                </div>
              </div>
              {/* Date badge for cards without cover */}
              <div className={`shrink-0 w-14 h-14 rounded-2xl flex flex-col items-center justify-center ${
                isPast
                  ? dark ? 'bg-white/[0.06]' : 'bg-gray-100'
                  : 'bg-gradient-to-br from-accent/20 to-purple-500/20'
              }`}>
                <span className={`text-lg font-black leading-none ${
                  isPast ? dark ? 'text-white/30' : 'text-gray-400' : 'text-accent'
                }`}>{new Date(t.date).getDate()}</span>
                <span className={`text-[9px] uppercase font-bold mt-0.5 ${
                  isPast ? dark ? 'text-white/20' : 'text-gray-300' : dark ? 'text-accent-light/60' : 'text-accent/60'
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
            <button
              onClick={(e) => toggleSection('weights', e)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold press-scale transition-all duration-200 ${
                openSection === 'weights'
                  ? 'bg-accent text-white shadow-lg shadow-accent/25'
                  : dark ? 'bg-white/[0.06] text-white/50 border border-white/[0.06]' : 'bg-white text-gray-600 border border-gray-200 shadow-sm'
              }`}
            >
              <Scale size={12} />
              {wc.length} вес.кат.
              {openSection === 'weights' ? <X size={10} /> : <ChevronDown size={10} />}
            </button>
          )}
          {t.regulations && (
            <button
              onClick={(e) => toggleSection('regulations', e)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold press-scale transition-all duration-200 ${
                openSection === 'regulations'
                  ? 'bg-accent text-white shadow-lg shadow-accent/25'
                  : dark ? 'bg-white/[0.06] text-white/50 border border-white/[0.06]' : 'bg-white text-gray-600 border border-gray-200 shadow-sm'
              }`}
            >
              <ScrollText size={12} />
              Положение
              {openSection === 'regulations' ? <X size={10} /> : <ChevronDown size={10} />}
            </button>
          )}
          {t.rules && (
            <button
              onClick={(e) => toggleSection('rules', e)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold press-scale transition-all duration-200 ${
                openSection === 'rules'
                  ? 'bg-accent text-white shadow-lg shadow-accent/25'
                  : dark ? 'bg-white/[0.06] text-white/50 border border-white/[0.06]' : 'bg-white text-gray-600 border border-gray-200 shadow-sm'
              }`}
            >
              <ScrollText size={12} />
              Правила
              {openSection === 'rules' ? <X size={10} /> : <ChevronDown size={10} />}
            </button>
          )}
          {t.prizes && (
            <button
              onClick={(e) => toggleSection('prizes', e)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold press-scale transition-all duration-200 ${
                openSection === 'prizes'
                  ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25'
                  : dark ? 'bg-white/[0.06] text-white/50 border border-white/[0.06]' : 'bg-white text-gray-600 border border-gray-200 shadow-sm'
              }`}
            >
              <Medal size={12} />
              Призы
              {openSection === 'prizes' ? <X size={10} /> : <ChevronDown size={10} />}
            </button>
          )}
          {t.matsCount > 1 && (
            <span className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold ${
              dark ? 'bg-white/[0.06] text-white/40' : 'bg-white text-gray-500 border border-gray-200'
            }`}>
              {t.matsCount} ковр.
            </span>
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

export default function Tournaments() {
  const { auth } = useAuth()
  const { data } = useData()
  const { dark } = useTheme()
  const navigate = useNavigate()
  const [showArchive, setShowArchive] = useState(false)

  const sorted = [...data.tournaments].sort((a, b) => new Date(a.date) - new Date(b.date))

  // Internal tournaments — trainers see own, students see their trainer's
  const allInternal = (data.internalTournaments || [])
    .filter(t => {
      if (auth.role === 'trainer') return t.trainerId === auth.userId
      if (auth.role === 'student') {
        const student = data.students.find(s => s.id === auth.studentId)
        return student && t.trainerId === student.trainerId
      }
      return true // superadmin sees all
    })
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))

  // Split into active and archived
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const activeInternalTournaments = allInternal.filter(t => t.status !== 'completed')
  const archivedInternalTournaments = allInternal.filter(t => {
    if (t.status !== 'completed') return false
    const tournDate = new Date(t.date || 0)
    return tournDate >= thirtyDaysAgo
  })

  const renderInternalCard = (t) => {
    const cats = t.brackets?.categories || []
    const isLegacy = !cats.length && t.brackets?.rounds
    const totalParticipants = isLegacy
      ? (t.brackets?.participants?.length || 0)
      : cats.reduce((s, c) => s + (c.participants?.length || 0), 0)
    const catCount = isLegacy ? 1 : cats.length
    const sportLabel = t.sportType ? getSportLabel(t.sportType) : null

    return (
      <div
        key={t.id}
        onClick={() => navigate(`/internal-tournament/${t.id}`)}
        className={`rounded-[20px] overflow-hidden cursor-pointer press-scale transition-all duration-300 ${
          dark
            ? `bg-white/[0.05] border ${t.status === 'completed' ? 'border-white/[0.06]' : 'border-accent/20 shadow-[0_0_20px_rgba(139,92,246,0.05)]'} hover:bg-white/[0.07]`
            : `bg-white/80 border ${t.status === 'completed' ? 'border-gray-200' : 'border-accent/20 shadow-[0_4px_20px_rgba(139,92,246,0.08)]'} hover:shadow-lg`
        }`}
      >
        {t.coverImage && (
          <div className="relative">
            <img src={t.coverImage} alt={t.title} className="w-full h-28 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <h3 className="font-bold text-sm text-white truncate">{t.title}</h3>
            </div>
          </div>
        )}
        <div className={`p-4 ${t.coverImage ? 'pt-2' : ''}`}>
          {!t.coverImage && (
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`font-bold text-sm truncate ${dark ? 'text-white' : 'text-gray-900'}`}>{t.title}</h3>
              {t.status === 'completed' && (
                <span className="shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check size={12} className="text-green-400" />
                </span>
              )}
            </div>
          )}
          <div className={`flex items-center gap-3 text-xs ${dark ? 'text-white/40' : 'text-gray-500'}`}>
            <span className="flex items-center gap-1"><Calendar size={11} />{formatDateShort(t.date)}</span>
            {sportLabel && <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${dark ? 'bg-accent/15 text-accent-light' : 'bg-red-50 text-red-600'}`}>{sportLabel}</span>}
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

      <div className="px-4 space-y-5 pb-4 slide-in">
        {/* Active internal tournaments */}
        {activeInternalTournaments.length > 0 && (
          <div>
            <h2 className={`text-xs uppercase font-bold mb-3 flex items-center gap-2 tracking-wider ${dark ? 'text-white/50' : 'text-gray-500'}`}>
              <Swords size={14} className="text-accent" /> Клубные турниры
            </h2>
            <div className="space-y-3">
              {activeInternalTournaments.map(renderInternalCard)}
            </div>
          </div>
        )}

        {/* Archived internal tournaments (last 30 days) */}
        {archivedInternalTournaments.length > 0 && (
          <div>
            <button
              onClick={() => setShowArchive(!showArchive)}
              className={`w-full flex items-center justify-between py-2.5 text-xs uppercase font-bold tracking-wider ${dark ? 'text-white/35' : 'text-gray-400'}`}
            >
              <div className="flex items-center gap-2">
                <Archive size={14} className={dark ? 'text-white/25' : 'text-gray-300'} />
                <span>Архив ({archivedInternalTournaments.length})</span>
              </div>
              {showArchive ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {showArchive && (
              <div className="space-y-3 mt-2">
                {archivedInternalTournaments.map(renderInternalCard)}
              </div>
            )}
          </div>
        )}

        {/* Official tournaments */}
        {sorted.length > 0 && (
          <div>
            {(activeInternalTournaments.length > 0 || archivedInternalTournaments.length > 0) && (
              <h2 className={`text-xs uppercase font-bold mb-3 flex items-center gap-2 tracking-wider ${dark ? 'text-white/50' : 'text-gray-500'}`}>
                <Trophy size={14} className="text-amber-400" /> Официальные турниры
              </h2>
            )}
            <div className="space-y-4">
              {sorted.map(t => (
                <TournamentCard
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

        {sorted.length === 0 && allInternal.length === 0 && (
          <div className="text-center py-16">
            <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
              dark ? 'bg-white/[0.04]' : 'bg-gray-50'
            }`}>
              <Swords size={36} className={dark ? 'text-white/15' : 'text-gray-200'} />
            </div>
            <p className={`text-sm font-medium ${dark ? 'text-white/35' : 'text-gray-400'}`}>
              Нет турниров
            </p>
            <p className={`text-xs mt-1 ${dark ? 'text-white/20' : 'text-gray-300'}`}>
              {auth.role === 'trainer' ? 'Создайте клубный турнир для ваших учеников' : 'Турниры появятся здесь'}
            </p>
            {auth.role === 'trainer' && (
              <button
                onClick={() => navigate('/create-internal-tournament')}
                className="mt-4 px-6 py-2.5 rounded-full bg-accent text-white text-sm font-bold press-scale shadow-lg shadow-accent/25"
              >
                Создать турнир
              </button>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
