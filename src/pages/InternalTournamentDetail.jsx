import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Trophy, Trash2, Calendar, RotateCcw, Check, Weight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import GlassCard from '../components/GlassCard'
import Modal from '../components/Modal'
import BracketView from '../components/BracketView'
import Avatar from '../components/Avatar'
import { setMatchWinner, generateBracket, getVictoryTypes, getSportLabel } from '../utils/sports'

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function InternalTournamentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { auth } = useAuth()
  const { data, updateInternalTournament, deleteInternalTournament } = useData()
  const { dark } = useTheme()

  const tournament = (data.internalTournaments || []).find(t => t.id === id)
  const [activeCatIdx, setActiveCatIdx] = useState(0)
  const [pendingWinner, setPendingWinner] = useState(null) // { roundIdx, matchIdx, winnerId }

  if (!tournament) {
    return (
      <Layout>
        <PageHeader title="Турнир" back />
        <div className="px-4 py-12 text-center">
          <p className={dark ? 'text-white/40' : 'text-gray-500'}>Турнир не найден</p>
        </div>
      </Layout>
    )
  }

  const brackets = tournament.brackets || {}
  const categories = brackets.categories || []
  const isTrainer = auth.role === 'trainer' && auth.userId === tournament.trainerId
  const allStudents = data.students

  // Legacy support: single bracket (no categories)
  const isLegacy = !categories.length && brackets.rounds
  const activeCat = isLegacy
    ? { weightClass: brackets.weightClass || 'Абсолютка', rounds: brackets.rounds, participants: brackets.participants }
    : categories[activeCatIdx]

  // Find champion for active category
  const getChampion = (cat) => {
    if (!cat?.rounds?.length) return null
    const lastRound = cat.rounds[cat.rounds.length - 1]
    return lastRound?.[0]?.winner || null
  }

  const sportType = tournament?.sportType || null
  const victoryTypes = getVictoryTypes(sportType)

  const handleSelectWinner = (roundIdx, matchIdx, winnerId) => {
    if (!isTrainer) return
    // If sport has victory types, show picker
    if (sportType && victoryTypes.length > 0) {
      setPendingWinner({ roundIdx, matchIdx, winnerId })
      return
    }
    applyWinner(roundIdx, matchIdx, winnerId, null)
  }

  const applyWinner = (roundIdx, matchIdx, winnerId, victoryType) => {
    const catBracket = { rounds: activeCat.rounds, participants: activeCat.participants }
    const newBracket = setMatchWinner(catBracket, roundIdx, matchIdx, winnerId)

    // Store victory type on the match
    if (victoryType) {
      newBracket.rounds[roundIdx][matchIdx].victoryType = victoryType
    }

    if (isLegacy) {
      updateInternalTournament(tournament.id, {
        brackets: { ...brackets, rounds: newBracket.rounds }
      })
    } else {
      const newCategories = categories.map((c, i) =>
        i === activeCatIdx ? { ...c, rounds: newBracket.rounds } : c
      )
      updateInternalTournament(tournament.id, {
        brackets: { ...brackets, categories: newCategories }
      })
    }
    setPendingWinner(null)
  }

  const handleDelete = () => {
    if (confirm('Удалить турнир?')) {
      deleteInternalTournament(tournament.id)
      navigate(-1)
    }
  }

  const handleReshuffle = () => {
    if (!confirm('Пересоздать сетку? Все результаты будут сброшены.')) return
    if (isLegacy) {
      const participants = brackets.participants || []
      const newBrackets = generateBracket(participants)
      newBrackets.weightClass = brackets.weightClass
      updateInternalTournament(tournament.id, { brackets: newBrackets, status: 'active' })
    } else {
      const newCategories = categories.map(c => {
        const newBracket = generateBracket(c.participants)
        return { weightClass: c.weightClass, ...newBracket }
      })
      updateInternalTournament(tournament.id, {
        brackets: { ...brackets, categories: newCategories },
        status: 'active'
      })
    }
  }

  const handleComplete = () => {
    updateInternalTournament(tournament.id, { status: 'completed' })
  }

  // Check if all categories have champions
  const allCats = isLegacy ? [activeCat] : categories
  const allHaveChampion = allCats.every(c => getChampion(c))
  const totalParticipants = allCats.reduce((s, c) => s + (c.participants?.length || 0), 0)

  const champion = getChampion(activeCat)
  const championStudent = champion ? allStudents.find(s => s.id === champion) : null

  return (
    <Layout>
      <PageHeader title="Турнир" back>
        {isTrainer && (
          <>
            <button onClick={handleReshuffle} className="press-scale p-2" title="Пересоздать сетки">
              <RotateCcw size={18} />
            </button>
            {tournament.status !== 'completed' && allHaveChampion && (
              <button onClick={handleComplete} className="press-scale p-2 text-green-400" title="Завершить">
                <Check size={18} />
              </button>
            )}
            <button onClick={handleDelete} className="press-scale p-2 text-red-400">
              <Trash2 size={18} />
            </button>
          </>
        )}
      </PageHeader>

      <div className="px-4 space-y-4 slide-in">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-xl font-black">{tournament.title}</h1>
          <div className={`text-sm mt-1 flex items-center justify-center gap-2 flex-wrap ${dark ? 'text-white/40' : 'text-gray-500'}`}>
            <Calendar size={14} />
            <span>{formatDate(tournament.date)}</span>
            <span>•</span>
            <span>{totalParticipants} участников</span>
            <span>•</span>
            <span>{allCats.length} {allCats.length === 1 ? 'весовая' : allCats.length < 5 ? 'весовых' : 'весовых'}</span>
          </div>
          {sportType && (
            <div className="mt-2 flex justify-center">
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                dark ? 'bg-accent/15 text-accent-light border border-accent/20' : 'bg-red-50 text-red-600'
              }`}>{getSportLabel(sportType)}</span>
            </div>
          )}
          {tournament.status === 'completed' && (
            <div className="mt-2 inline-block px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold uppercase">
              Завершён
            </div>
          )}
        </div>

        {/* Category tabs */}
        {!isLegacy && categories.length > 1 && (
          <div className="overflow-x-auto -mx-4 px-4 pb-1">
            <div className="flex gap-2" style={{ minWidth: 'max-content' }}>
              {categories.map((cat, idx) => {
                const catChampion = getChampion(cat)
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveCatIdx(idx)}
                    className={`px-4 py-2 rounded-full text-xs font-bold press-scale whitespace-nowrap flex items-center gap-1.5 transition-all ${
                      idx === activeCatIdx
                        ? 'bg-accent text-white'
                        : dark ? 'bg-white/[0.06] text-white/60 border border-white/[0.06]' : 'bg-white/60 text-gray-500 border border-white/60'
                    }`}
                  >
                    {catChampion && <Trophy size={11} className={idx === activeCatIdx ? 'text-yellow-200' : 'text-yellow-400'} />}
                    {cat.weightClass}
                    <span className={`${idx === activeCatIdx ? 'text-white/60' : dark ? 'text-white/30' : 'text-gray-500'}`}>
                      ({cat.participants?.length || 0})
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Single category header (if only one) */}
        {!isLegacy && categories.length === 1 && (
          <div className={`flex items-center justify-center gap-2 text-sm ${dark ? 'text-white/50' : 'text-gray-500'}`}>
            <Weight size={14} className="text-accent" />
            <span className="font-bold">{categories[0].weightClass}</span>
          </div>
        )}

        {/* Champion for active category */}
        {championStudent && (
          <div className={`rounded-[24px] p-5 relative overflow-hidden ${
            dark
              ? 'bg-gradient-to-br from-yellow-500/15 via-amber-500/10 to-orange-500/15 border border-yellow-500/30'
              : 'bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 border border-yellow-300/50 shadow-[0_8px_32px_rgba(234,179,8,0.15)]'
          }`}>
            <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full ${dark ? 'bg-yellow-500/10' : 'bg-yellow-200/40'}`} />
            <div className={`absolute -bottom-6 -left-6 w-20 h-20 rounded-full ${dark ? 'bg-orange-500/10' : 'bg-orange-200/30'}`} />
            <div className="relative flex items-center gap-4">
              <div className="relative">
                <div className={`w-16 h-16 rounded-full p-0.5 ${
                  dark ? 'bg-gradient-to-br from-yellow-400 to-amber-600' : 'bg-gradient-to-br from-yellow-400 to-amber-500'
                }`}>
                  <div className="w-full h-full rounded-full overflow-hidden">
                    <Avatar name={championStudent.name} src={championStudent.avatar} size={60} />
                  </div>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg">
                  <Trophy size={16} className="text-white" fill="white" />
                </div>
              </div>
              <div>
                <div className={`text-[10px] uppercase font-black tracking-wider ${dark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                  Чемпион{!isLegacy && categories.length > 1 ? ` — ${activeCat?.weightClass}` : ''}
                </div>
                <div className="text-lg font-black">{championStudent.name}</div>
                {championStudent.weight && (
                  <div className={`text-xs ${dark ? 'text-white/40' : 'text-gray-500'}`}>{championStudent.weight} кг</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bracket */}
        {activeCat && (
          <div>
            <h2 className={`text-sm uppercase font-bold mb-3 ${dark ? 'text-white/50' : 'text-gray-500'}`}>
              Сетка {!isLegacy && categories.length > 1 ? activeCat.weightClass : 'турнира'}
            </h2>
            <BracketView
              brackets={{ rounds: activeCat.rounds, participants: activeCat.participants }}
              students={allStudents}
              canEdit={isTrainer && tournament.status !== 'completed'}
              onSelectWinner={handleSelectWinner}
              sportType={sportType}
            />
          </div>
        )}

        {/* Participants list for active category */}
        {activeCat && (
          <div>
            <h2 className={`text-sm uppercase font-bold mb-3 ${dark ? 'text-white/50' : 'text-gray-500'}`}>
              Участники ({activeCat.participants?.length || 0})
            </h2>
            <div className="space-y-2">
              {(activeCat.participants || []).map(pid => {
                const s = allStudents.find(st => st.id === pid)
                if (!s) return null
                const isChampion = pid === champion
                return (
                  <GlassCard
                    key={pid}
                    className={`flex items-center gap-3 ${isChampion ? 'border border-yellow-500/30' : ''}`}
                  >
                    <Avatar name={s.name} src={s.avatar} size={32} />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm truncate">{s.name}</div>
                    </div>
                    <span className={`text-xs ${dark ? 'text-white/30' : 'text-gray-500'}`}>
                      {s.weight ? s.weight + ' кг' : '—'}
                    </span>
                    {isChampion && <Trophy size={14} className="text-yellow-400 shrink-0" />}
                  </GlassCard>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Victory type picker modal */}
      <Modal open={!!pendingWinner} onClose={() => setPendingWinner(null)} title="Вид победы">
        <div className="space-y-2">
          {victoryTypes.map(vt => (
            <button
              key={vt.id}
              onClick={() => pendingWinner && applyWinner(pendingWinner.roundIdx, pendingWinner.matchIdx, pendingWinner.winnerId, vt.id)}
              className={`w-full py-3.5 px-4 rounded-[16px] text-left font-semibold press-scale transition-all ${
                dark ? 'bg-white/[0.05] border border-white/[0.07] hover:bg-white/[0.1]' : 'bg-white/60 border border-white/50 hover:bg-white/80 shadow-sm'
              }`}
            >
              {vt.label}
            </button>
          ))}
        </div>
      </Modal>
    </Layout>
  )
}
