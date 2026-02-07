import { useParams, useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import GlassCard from '../components/GlassCard'

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export default function TournamentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { auth } = useAuth()
  const { data, deleteTournament } = useData()
  const { dark } = useTheme()

  const tournament = data.tournaments.find(t => t.id === id)
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

  const handleDelete = () => {
    if (confirm('Удалить турнир?')) {
      deleteTournament(tournament.id)
      navigate(-1)
    }
  }

  return (
    <Layout>
      <PageHeader title="Турнир" back>
        {auth.role === 'superadmin' && (
          <button onClick={handleDelete} className="press-scale p-2 text-red-400">
            <Trash2 size={18} />
          </button>
        )}
      </PageHeader>

      <div className="px-4 space-y-4 slide-in">
        {tournament.coverImage ? (
          <img
            src={tournament.coverImage}
            alt={tournament.title}
            className="w-full h-52 object-cover rounded-[24px]"
          />
        ) : (
          <div className={`w-full h-44 rounded-[24px] flex items-center justify-center ${
            dark ? 'bg-white/5' : 'bg-black/[0.03]'
          }`}>
            <span className="text-5xl font-black italic text-accent opacity-20">FIGHT</span>
          </div>
        )}

        <div>
          <h1 className="text-2xl font-black italic">{tournament.title}</h1>
        </div>

        <div className="flex flex-col gap-2">
          <GlassCard className="flex items-center gap-3">
            <Calendar size={18} className="text-accent shrink-0" />
            <span className="text-sm">{formatDate(tournament.date)}</span>
          </GlassCard>
          <GlassCard className="flex items-center gap-3">
            <MapPin size={18} className="text-accent shrink-0" />
            <span className="text-sm">{tournament.location}</span>
          </GlassCard>
        </div>

        {tournament.description && (
          <GlassCard>
            <h3 className={`text-xs uppercase font-bold mb-2 ${dark ? 'text-white/40' : 'text-gray-400'}`}>Описание</h3>
            <p className={`text-sm leading-relaxed whitespace-pre-line ${dark ? 'text-white/70' : 'text-gray-600'}`}>
              {tournament.description}
            </p>
          </GlassCard>
        )}
      </div>
    </Layout>
  )
}
