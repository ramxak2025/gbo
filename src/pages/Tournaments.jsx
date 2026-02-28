import { useNavigate } from 'react-router-dom'
import { Plus, Calendar, MapPin, Trophy, Swords, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import GlassCard from '../components/GlassCard'
import Avatar from '../components/Avatar'

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function Tournaments() {
  const { auth } = useAuth()
  const { data } = useData()
  const { dark } = useTheme()
  const navigate = useNavigate()

  const sorted = [...data.tournaments].sort((a, b) => new Date(a.date) - new Date(b.date))

  // Internal tournaments — trainers see own, students see their trainer's
  const myInternalTournaments = (data.internalTournaments || [])
    .filter(t => {
      if (auth.role === 'trainer') return t.trainerId === auth.userId
      if (auth.role === 'student') {
        const student = data.students.find(s => s.id === auth.studentId)
        return student && t.trainerId === student.trainerId
      }
      return true // superadmin sees all
    })
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))

  return (
    <Layout>
      <PageHeader title="Турниры">
        <div className="flex items-center gap-1">
          {auth.role === 'trainer' && (
            <button onClick={() => navigate('/create-internal-tournament')} className="press-scale p-2" title="Клубный турнир">
              <Swords size={20} />
            </button>
          )}
          {auth.role === 'superadmin' && (
            <button onClick={() => navigate('/add-tournament')} className="press-scale p-2">
              <Plus size={20} />
            </button>
          )}
        </div>
      </PageHeader>

      <div className="px-4 space-y-4 slide-in">
        {/* Internal tournaments */}
        {myInternalTournaments.length > 0 && (
          <div>
            <h2 className={`text-sm uppercase font-bold mb-3 flex items-center gap-2 ${dark ? 'text-white/50' : 'text-gray-500'}`}>
              <Swords size={14} className="text-accent" /> Клубные турниры
            </h2>
            <div className="space-y-2">
              {myInternalTournaments.map(t => {
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
                    className="border border-accent/20"
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
                        <div className={`flex items-center gap-2 mt-1 text-xs ${dark ? 'text-white/40' : 'text-gray-400'}`}>
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
              })}
            </div>
          </div>
        )}

        {/* Official tournaments */}
        {sorted.length > 0 && (
          <div>
            {myInternalTournaments.length > 0 && (
              <h2 className={`text-sm uppercase font-bold mb-3 flex items-center gap-2 ${dark ? 'text-white/50' : 'text-gray-500'}`}>
                <Trophy size={14} className="text-orange-400" /> Официальные турниры
              </h2>
            )}
            <div className="space-y-3">
              {sorted.map(t => {
                const isPast = new Date(t.date) < new Date()
                return (
                  <GlassCard
                    key={t.id}
                    onClick={() => navigate(`/tournaments/${t.id}`)}
                    className="overflow-hidden"
                  >
                    {t.coverImage && (
                      <img
                        src={t.coverImage}
                        alt={t.title}
                        className="w-full h-36 object-cover rounded-[16px] mb-3"
                      />
                    )}
                    {!t.coverImage && (
                      <div className={`w-full h-28 rounded-[16px] mb-3 flex items-center justify-center ${
                        dark ? 'bg-white/5' : 'bg-black/[0.04]'
                      }`}>
                        <span className="text-4xl font-black italic text-accent opacity-30">BJJ</span>
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-bold text-base truncate">{t.title}</h3>
                        <div className={`flex items-center gap-1 mt-1 text-xs ${dark ? 'text-white/40' : 'text-gray-400'}`}>
                          <Calendar size={12} />
                          <span>{formatDate(t.date)}</span>
                        </div>
                        <div className={`flex items-center gap-1 mt-0.5 text-xs ${dark ? 'text-white/40' : 'text-gray-400'}`}>
                          <MapPin size={12} />
                          <span className="truncate">{t.location}</span>
                        </div>
                      </div>
                      {isPast && (
                        <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          dark ? 'bg-white/10 text-white/40' : 'bg-black/[0.05] text-gray-400'
                        }`}>
                          Прошёл
                        </span>
                      )}
                    </div>
                  </GlassCard>
                )
              })}
            </div>
          </div>
        )}

        {sorted.length === 0 && myInternalTournaments.length === 0 && (
          <div className="text-center py-12">
            <Swords size={48} className={`mx-auto mb-3 ${dark ? 'text-white/10' : 'text-gray-200'}`} />
            <p className={`text-sm ${dark ? 'text-white/30' : 'text-gray-400'}`}>
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
