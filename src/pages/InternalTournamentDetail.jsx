import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Trophy, Trash2, Calendar, RotateCcw, Check } from 'lucide-react'
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
  const isTrainer = auth.role === 'trainer' && auth.userId === tournament.trainerId
  const allStudents = data.students

  // Find the champion
  const lastRound = brackets.rounds?.[brackets.rounds.length - 1]
  const champion = lastRound?.[0]?.winner
  const championStudent = champion ? allStudents.find(s => s.id === champion) : null

  const handleSelectWinner = (roundIdx, matchIdx, winnerId) => {
    if (!isTrainer) return
    const newBrackets = setMatchWinner(brackets, roundIdx, matchIdx, winnerId)
    updateInternalTournament(tournament.id, { brackets: newBrackets })
  }

  const handleDelete = () => {
    if (confirm('Удалить турнир?')) {
      deleteInternalTournament(tournament.id)
      navigate(-1)
    }
  }

  const handleReshuffle = () => {
    if (!confirm('Пересоздать сетку? Все результаты будут сброшены.')) return
    const participants = brackets.participants || []
    const newBrackets = generateBracket(participants)
    newBrackets.weightClass = brackets.weightClass
    updateInternalTournament(tournament.id, { brackets: newBrackets, status: 'active' })
  }

  const handleComplete = () => {
    updateInternalTournament(tournament.id, { status: 'completed' })
  }

  return (
    <Layout>
      <PageHeader title="Сетка" back>
        {isTrainer && (
          <>
            <button onClick={handleReshuffle} className="press-scale p-2" title="Пересоздать сетку">
              <RotateCcw size={18} />
            </button>
            {tournament.status !== 'completed' && champion && (
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
            {brackets.weightClass && (
              <>
                <span>•</span>
                <span>{brackets.weightClass}</span>
              </>
            )}
          </div>
          {tournament.status === 'completed' && (
            <div className="mt-2 inline-block px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold uppercase">
              Завершён
            </div>
          )}
        </div>

        {/* Champion */}
        {championStudent && (
          <GlassCard className="border border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 to-orange-500/10">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar name={championStudent.name} src={championStudent.avatar} size={48} />
                <Trophy size={16} className="text-yellow-400 absolute -top-1 -right-1" />
              </div>
              <div>
                <div className={`text-[10px] uppercase font-bold ${dark ? 'text-yellow-400/60' : 'text-yellow-600'}`}>Победитель</div>
                <div className="font-bold">{championStudent.name}</div>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Bracket */}
        <div>
          <h2 className={`text-sm uppercase font-bold mb-3 ${dark ? 'text-white/50' : 'text-gray-500'}`}>
            Сетка турнира
          </h2>
          <BracketView
            brackets={brackets}
            students={allStudents}
            canEdit={isTrainer && tournament.status !== 'completed'}
            onSelectWinner={handleSelectWinner}
          />
        </div>

        {/* Participants list */}
        <div>
          <h2 className={`text-sm uppercase font-bold mb-3 ${dark ? 'text-white/50' : 'text-gray-500'}`}>
            Участники ({brackets.participants?.length || 0})
          </h2>
          <div className="space-y-2">
            {(brackets.participants || []).map(pid => {
              const s = allStudents.find(st => st.id === pid)
              if (!s) return null
              return (
                <GlassCard key={pid} className="flex items-center gap-3">
                  <Avatar name={s.name} src={s.avatar} size={32} />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm truncate">{s.name}</div>
                  </div>
                  <span className={`text-xs ${dark ? 'text-white/30' : 'text-gray-400'}`}>
                    {s.weight ? s.weight + ' кг' : '—'}
                  </span>
                </GlassCard>
              )
            })}
          </div>
        </div>
      </div>
    </Layout>
  )
}
