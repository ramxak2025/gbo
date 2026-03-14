import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Calendar, MapPin, Trophy, Swords, Check, Archive, ChevronDown, ChevronUp, Scale, ScrollText, Medal, Menu, X } from 'lucide-react'
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

function TournamentCard({ t, dark, onClick }) {
  const [openSection, setOpenSection] = useState(null)
  const isPast = new Date(t.date) < new Date()
  const sportLabel = t.sportType ? getSportLabel(t.sportType) : null
  const wc = t.weightCategories || []

  const toggleSection = (section, e) => {
    e.stopPropagation()
    setOpenSection(openSection === section ? null : section)
  }

  return (
    <div className={`rounded-[24px] overflow-hidden backdrop-blur-xl transition-all ${
      dark
        ? 'bg-white/[0.04] border border-white/[0.07]'
        : 'bg-white/70 border border-white/60 shadow-[0_4px_24px_rgba(0,0,0,0.06)]'
    }`}>
      {/* Cover / Header */}
      <div className="cursor-pointer press-scale" onClick={onClick}>
        {t.coverImage ? (
          <div className="relative">
            <img src={t.coverImage} alt={t.title} className="w-full h-44 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="font-black text-lg text-white leading-tight">{t.title}</h3>
              <div className="flex items-center gap-3 mt-1.5 text-white/70 text-xs">
                <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(t.date)}</span>
                {t.location && <span className="flex items-center gap-1"><MapPin size={11} />{t.location}</span>}
              </div>
            </div>
            {isPast && (
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur text-[10px] font-bold text-white/70 uppercase">
                Прошёл
              </div>
            )}
            {sportLabel && (
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-accent/90 backdrop-blur text-[10px] font-bold text-white uppercase">
                {sportLabel}
              </div>
            )}
          </div>
        ) : (
          <div className="p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {sportLabel && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      dark ? 'bg-accent/20 text-accent-light' : 'bg-red-50 text-red-600'
                    }`}>{sportLabel}</span>
                  )}
                  {isPast && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      dark ? 'bg-white/[0.08] text-white/40' : 'bg-gray-100 text-gray-400'
                    }`}>Прошёл</span>
                  )}
                </div>
                <h3 className="font-black text-base mt-1.5">{t.title}</h3>
                <div className={`flex items-center gap-3 mt-1.5 text-xs ${dark ? 'text-white/40' : 'text-gray-500'}`}>
                  <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(t.date)}</span>
                  {t.location && <span className="flex items-center gap-1"><MapPin size={11} />{t.location}</span>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick info pills */}
      <div className="px-4 pb-3 flex flex-wrap gap-2">
        {wc.length > 0 && (
          <button
            onClick={(e) => toggleSection('weights', e)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold press-scale transition-all ${
              openSection === 'weights'
                ? 'bg-accent text-white'
                : dark ? 'bg-white/[0.06] text-white/50 border border-white/[0.06]' : 'bg-white/80 text-gray-600 border border-white/70 shadow-sm'
            }`}
          >
            <Scale size={12} />
            Весовые ({wc.length})
            {openSection === 'weights' ? <X size={10} /> : <Menu size={10} />}
          </button>
        )}
        {t.regulations && (
          <button
            onClick={(e) => toggleSection('regulations', e)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold press-scale transition-all ${
              openSection === 'regulations'
                ? 'bg-accent text-white'
                : dark ? 'bg-white/[0.06] text-white/50 border border-white/[0.06]' : 'bg-white/80 text-gray-600 border border-white/70 shadow-sm'
            }`}
          >
            <ScrollText size={12} />
            Положение
            {openSection === 'regulations' ? <X size={10} /> : <Menu size={10} />}
          </button>
        )}
        {t.rules && (
          <button
            onClick={(e) => toggleSection('rules', e)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold press-scale transition-all ${
              openSection === 'rules'
                ? 'bg-accent text-white'
                : dark ? 'bg-white/[0.06] text-white/50 border border-white/[0.06]' : 'bg-white/80 text-gray-600 border border-white/70 shadow-sm'
            }`}
          >
            <ScrollText size={12} />
            Правила
            {openSection === 'rules' ? <X size={10} /> : <Menu size={10} />}
          </button>
        )}
        {t.prizes && (
          <button
            onClick={(e) => toggleSection('prizes', e)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold press-scale transition-all ${
              openSection === 'prizes'
                ? 'bg-accent text-white'
                : dark ? 'bg-white/[0.06] text-white/50 border border-white/[0.06]' : 'bg-white/80 text-gray-600 border border-white/70 shadow-sm'
            }`}
          >
            <Medal size={12} />
            Призы
            {openSection === 'prizes' ? <X size={10} /> : <Menu size={10} />}
          </button>
        )}
        {t.matsCount > 1 && (
          <span className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold ${
            dark ? 'bg-white/[0.06] text-white/40' : 'bg-white/80 text-gray-500 border border-white/70'
          }`}>
            {t.matsCount} ковр.
          </span>
        )}
      </div>

      {/* Expandable sections */}
      {openSection === 'weights' && wc.length > 0 && (
        <div className={`mx-4 mb-4 p-3 rounded-[16px] ${dark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-white/50 border border-white/50'}`}>
          <div className={`text-[10px] uppercase font-bold mb-2 ${dark ? 'text-white/40' : 'text-gray-500'}`}>Весовые категории</div>
          <div className="flex flex-wrap gap-1.5">
            {wc.map((w, i) => (
              <span key={i} className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                dark ? 'bg-purple-500/15 text-purple-300' : 'bg-purple-100 text-purple-600'
              }`}>{w}</span>
            ))}
          </div>
        </div>
      )}
      {openSection === 'regulations' && t.regulations && (
        <div className={`mx-4 mb-4 p-3 rounded-[16px] ${dark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-white/50 border border-white/50'}`}>
          <div className={`text-[10px] uppercase font-bold mb-2 ${dark ? 'text-white/40' : 'text-gray-500'}`}>Положение</div>
          <p className={`text-xs leading-relaxed whitespace-pre-line ${dark ? 'text-white/60' : 'text-gray-600'}`}>{t.regulations}</p>
        </div>
      )}
      {openSection === 'rules' && t.rules && (
        <div className={`mx-4 mb-4 p-3 rounded-[16px] ${dark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-white/50 border border-white/50'}`}>
          <div className={`text-[10px] uppercase font-bold mb-2 ${dark ? 'text-white/40' : 'text-gray-500'}`}>Правила</div>
          <p className={`text-xs leading-relaxed whitespace-pre-line ${dark ? 'text-white/60' : 'text-gray-600'}`}>{t.rules}</p>
        </div>
      )}
      {openSection === 'prizes' && t.prizes && (
        <div className={`mx-4 mb-4 p-3 rounded-[16px] ${dark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-white/50 border border-white/50'}`}>
          <div className={`text-[10px] uppercase font-bold mb-2 ${dark ? 'text-white/40' : 'text-gray-500'}`}>Призы</div>
          <p className={`text-xs leading-relaxed whitespace-pre-line ${dark ? 'text-white/60' : 'text-gray-600'}`}>{t.prizes}</p>
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
    return (
      <GlassCard
        key={t.id}
        onClick={() => navigate(`/internal-tournament/${t.id}`)}
        className={`border ${t.status === 'completed' ? 'border-white/[0.06]' : 'border-accent/20'}`}
      >
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm truncate">{t.title}</h3>
              {t.status === 'completed' && (
                <span className="shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check size={12} className="text-green-400" />
                </span>
              )}
            </div>
            <div className={`flex items-center gap-2 mt-1 text-xs ${dark ? 'text-white/40' : 'text-gray-500'}`}>
              <Calendar size={11} />
              <span>{formatDate(t.date)}</span>
              <span>•</span>
              <span>{catCount} {catCount === 1 ? 'весовая' : 'весовых'}</span>
              <span>•</span>
              <span>{totalParticipants} чел.</span>
            </div>
          </div>
        </div>
      </GlassCard>
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

      <div className="px-4 space-y-4 slide-in">
        {/* Active internal tournaments */}
        {activeInternalTournaments.length > 0 && (
          <div>
            <h2 className={`text-sm uppercase font-bold mb-3 flex items-center gap-2 ${dark ? 'text-white/50' : 'text-gray-500'}`}>
              <Swords size={14} className="text-accent" /> Клубные турниры
            </h2>
            <div className="space-y-2">
              {activeInternalTournaments.map(renderInternalCard)}
            </div>
          </div>
        )}

        {/* Archived internal tournaments (last 30 days) */}
        {archivedInternalTournaments.length > 0 && (
          <div>
            <button
              onClick={() => setShowArchive(!showArchive)}
              className={`w-full flex items-center justify-between py-2 text-sm uppercase font-bold ${dark ? 'text-white/40' : 'text-gray-400'}`}
            >
              <div className="flex items-center gap-2">
                <Archive size={14} className={dark ? 'text-white/30' : 'text-gray-400'} />
                <span>Архив ({archivedInternalTournaments.length})</span>
              </div>
              {showArchive ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {showArchive && (
              <div className="space-y-2 mt-2">
                {archivedInternalTournaments.map(renderInternalCard)}
              </div>
            )}
          </div>
        )}

        {/* Official tournaments */}
        {sorted.length > 0 && (
          <div>
            {(activeInternalTournaments.length > 0 || archivedInternalTournaments.length > 0) && (
              <h2 className={`text-sm uppercase font-bold mb-3 flex items-center gap-2 ${dark ? 'text-white/50' : 'text-gray-500'}`}>
                <Trophy size={14} className="text-orange-400" /> Официальные турниры
              </h2>
            )}
            <div className="space-y-4">
              {sorted.map(t => (
                <TournamentCard
                  key={t.id}
                  t={t}
                  dark={dark}
                  onClick={() => navigate(`/tournaments/${t.id}`)}
                />
              ))}
            </div>
          </div>
        )}

        {sorted.length === 0 && allInternal.length === 0 && (
          <div className="text-center py-12">
            <Swords size={48} className={`mx-auto mb-3 ${dark ? 'text-white/10' : 'text-gray-200'}`} />
            <p className={`text-sm ${dark ? 'text-white/30' : 'text-gray-500'}`}>
              Нет турниров
            </p>
            {auth.role === 'trainer' && (
              <button
                onClick={() => navigate('/create-internal-tournament')}
                className="mt-3 px-5 py-2 rounded-full bg-accent text-white text-sm font-bold press-scale"
              >
                Создать клубный турнир
              </button>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
