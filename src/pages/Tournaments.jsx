import { useNavigate } from 'react-router-dom'
import { Plus, Calendar, MapPin } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import GlassCard from '../components/GlassCard'

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

  return (
    <Layout>
      <PageHeader title="Турниры">
        {auth.role === 'superadmin' && (
          <button onClick={() => navigate('/add-tournament')} className="press-scale p-2">
            <Plus size={20} />
          </button>
        )}
      </PageHeader>

      <div className="px-4 space-y-3 slide-in">
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
                  dark ? 'bg-white/5' : 'bg-black/[0.03]'
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
        {sorted.length === 0 && (
          <p className={`text-center py-12 text-sm ${dark ? 'text-white/30' : 'text-gray-400'}`}>
            Нет турниров
          </p>
        )}
      </div>
    </Layout>
  )
}
