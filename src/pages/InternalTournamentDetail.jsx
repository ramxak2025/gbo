import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Trophy, Trash2, Calendar, RotateCcw, Check, Weight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import GlassCard from '../components/GlassCard'
import BracketView from '../components/BracketView'
import Avatar from '../components/Avatar'
import { setMatchWinner, generateBracket } from '../utils/sports'

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

  if (!tournament) {
    return (
      <Layout>
        <PageHeader title="Турнир" back />
        <div className="px-4 py-12 text-center">
          <p className={dark ? 'text-white/40' : 'text-gray-400'}>Турнир не найден</p>
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

  const handleSelectWinner = (roundIdx, matchIdx, winnerId) => {
    if (!isTrainer) return
    const catBracket = { rounds: activeCat.rounds, participants: activeCat.participants }
    const newBracket = setMatchWinner(catBracket, roundIdx, matchIdx, winnerId)

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
          <div className={`text-sm mt-1 flex items-center justify-center gap-2 ${dark ? 'text-white/40' : 'text-gray-400'}`}>
            <Calendar size={14} />
            <span>{formatDate(tournament.date)}</span>
            <span>•</span>
            <span>{totalParticipants} участников</span>
            <span>•</span>
            <span>{allCats.length} {allCats.length === 1 ? 'весовая' : allCats.length < 5 ? 'весовых' : 'весовых'}</span>
          </div>
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
                        : dark ? 'bg-white/5 text-white/60' : 'bg-black/5 text-gray-500'
                    }`}
                  >
                    {catChampion && <Trophy size={11} className={idx === activeCatIdx ? 'text-yellow-200' : 'text-yellow-400'} />}
                    {cat.weightClass}
                    <span className={`${idx === activeCatIdx ? 'text-white/60' : dark ? 'text-white/30' : 'text-gray-400'}`}>
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
          <GlassCard className="border border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 to-orange-500/10">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar name={championStudent.name} src={championStudent.avatar} size={48} />
                <Trophy size={16} className="text-yellow-400 absolute -top-1 -right-1" />
              </div>
              <div>
                <div className={`text-[10px] uppercase font-bold ${dark ? 'text-yellow-400/60' : 'text-yellow-600'}`}>
                  Победитель{!isLegacy && categories.length > 1 ? ` — ${activeCat?.weightClass}` : ''}
                </div>
                <div className="font-bold">{championStudent.name}</div>
              </div>
            </div>
          </GlassCard>
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
                    <span className={`text-xs ${dark ? 'text-white/30' : 'text-gray-400'}`}>
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
    </Layout>
  )
}
