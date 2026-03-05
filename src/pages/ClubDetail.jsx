import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Shield, Users, Trash2, Plus, Crown, UserMinus, ChevronRight, MapPin, Award, Dumbbell, TrendingUp, Edit3 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import GlassCard from '../components/GlassCard'
import Modal from '../components/Modal'
import Avatar from '../components/Avatar'
import { getSportLabel } from '../utils/sports'

function isExpired(dateStr) {
  if (!dateStr) return true
  return new Date(dateStr) < new Date()
}

export default function ClubDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { auth } = useAuth()
  const { data, updateClub, deleteClub, assignTrainerToClub, removeTrainerFromClub } = useData()
  const { dark } = useTheme()

  const [showAddTrainer, setShowAddTrainer] = useState(false)
  const [showHeadPicker, setShowHeadPicker] = useState(false)

  const club = (data.clubs || []).find(c => c.id === id)
  const isSuperadmin = auth.role === 'superadmin'
  const isHead = auth.role === 'trainer' && auth.user?.isHeadTrainer && auth.user?.clubId === id

  if (!club) {
    return (
      <Layout>
        <PageHeader title="Клуб" back />
        <div className="px-4 py-12 text-center">
          <p className={dark ? 'text-white/40' : 'text-gray-500'}>Клуб не найден</p>
        </div>
      </Layout>
    )
  }

  const clubTrainers = data.users.filter(u => u.role === 'trainer' && u.clubId === id)
  const headTrainer = clubTrainers.find(t => t.isHeadTrainer)
  const availableTrainers = data.users.filter(u => u.role === 'trainer' && !u.clubId)

  // Stats
  const stats = useMemo(() => {
    const trainerIds = new Set(clubTrainers.map(t => t.id))
    const allStudents = data.students.filter(s => trainerIds.has(s.trainerId))
    const active = allStudents.filter(s => !isExpired(s.subscriptionExpiresAt)).length
    const allGroups = data.groups.filter(g => trainerIds.has(g.trainerId))
    return { trainers: clubTrainers.length, students: allStudents.length, active, groups: allGroups.length }
  }, [clubTrainers, data.students, data.groups])

  const handleDelete = () => {
    if (confirm('Удалить клуб? Все тренеры будут откреплены.')) {
      deleteClub(id)
      navigate(-1)
    }
  }

  const handleSetHead = (trainerId) => {
    updateClub(id, { headTrainerId: trainerId })
    setShowHeadPicker(false)
  }

  const handleRemoveHead = () => {
    updateClub(id, { headTrainerId: null })
    setShowHeadPicker(false)
  }

  const handleAddTrainer = (trainerId) => {
    assignTrainerToClub(id, trainerId)
    setShowAddTrainer(false)
  }

  const handleRemoveTrainer = (trainerId) => {
    if (confirm('Убрать тренера из клуба?')) {
      removeTrainerFromClub(id, trainerId)
    }
  }

  return (
    <Layout>
      <PageHeader title="Клуб" back>
        {isSuperadmin && (
          <button onClick={handleDelete} className="press-scale p-2 text-red-400">
            <Trash2 size={18} />
          </button>
        )}
      </PageHeader>

      <div className="px-4 space-y-4 slide-in">
        {/* Club header card */}
        <div className={`rounded-[28px] p-6 relative overflow-hidden ${
          dark
            ? 'bg-gradient-to-br from-blue-500/15 via-white/[0.04] to-purple-500/15 border border-white/[0.08]'
            : 'bg-gradient-to-br from-blue-50 via-white/80 to-purple-50 border border-white/70 shadow-[0_8px_32px_rgba(0,0,0,0.06)]'
        }`}>
          <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full ${dark ? 'bg-blue-500/5' : 'bg-blue-100/40'}`} />
          <div className="relative">
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-16 h-16 rounded-[20px] flex items-center justify-center ${
                dark ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20' : 'bg-gradient-to-br from-blue-100 to-purple-100'
              }`}>
                <Shield size={28} className={dark ? 'text-blue-400' : 'text-blue-600'} />
              </div>
              <div>
                <h2 className="text-xl font-black">{club.name}</h2>
                {club.city && (
                  <div className={`flex items-center gap-1 mt-0.5 ${dark ? 'text-white/40' : 'text-gray-500'}`}>
                    <MapPin size={12} /> <span className="text-xs font-medium">{club.city}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Sport types */}
            {club.sportTypes?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {club.sportTypes.map(st => (
                  <span key={st} className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                    dark ? 'bg-accent/15 text-accent-light border border-accent/20' : 'bg-red-50 text-red-600'
                  }`}>{getSportLabel(st)}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: Users, label: 'Тренеры', value: stats.trainers, color: 'text-blue-500' },
            { icon: Award, label: 'Ученики', value: stats.students, color: 'text-accent' },
            { icon: TrendingUp, label: 'Активных', value: stats.active, color: 'text-green-500' },
            { icon: Dumbbell, label: 'Групп', value: stats.groups, color: 'text-purple-500' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className={`rounded-[16px] p-2.5 text-center backdrop-blur-xl ${
              dark ? 'bg-white/[0.05] border border-white/[0.07]' : 'bg-white/70 border border-white/60 shadow-sm'
            }`}>
              <Icon size={16} className={`mx-auto mb-1 ${color}`} />
              <div className="text-lg font-black">{value}</div>
              <div className={`text-[9px] uppercase font-semibold ${dark ? 'text-white/30' : 'text-gray-400'}`}>{label}</div>
            </div>
          ))}
        </div>

        {/* Head trainer — tappable to change */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className={`text-xs uppercase font-bold ${dark ? 'text-white/40' : 'text-gray-500'}`}>Главный тренер</h3>
            {(isSuperadmin || isHead) && clubTrainers.length > 0 && (
              <button onClick={() => setShowHeadPicker(true)} className="press-scale p-1">
                <Edit3 size={14} className="text-accent" />
              </button>
            )}
          </div>
          {headTrainer ? (
            <GlassCard
              onClick={() => (isSuperadmin || isHead) && clubTrainers.length > 0 && setShowHeadPicker(true)}
              className={`flex items-center gap-3 ${(isSuperadmin || isHead) ? 'cursor-pointer' : ''}`}
            >
              <Avatar name={headTrainer.name} src={headTrainer.avatar} size={44} />
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm truncate">{headTrainer.name}</div>
                <div className={`text-xs ${dark ? 'text-white/30' : 'text-gray-500'}`}>
                  {headTrainer.sportTypes?.map(st => getSportLabel(st)).join(', ') || getSportLabel(headTrainer.sportType)}
                </div>
              </div>
              <Crown size={18} className="text-yellow-400 shrink-0" />
            </GlassCard>
          ) : (
            <GlassCard
              onClick={() => (isSuperadmin || isHead) && clubTrainers.length > 0 && setShowHeadPicker(true)}
              className={`text-center py-3 ${(isSuperadmin || isHead) && clubTrainers.length > 0 ? 'cursor-pointer' : ''}`}
            >
              <p className={`text-sm ${dark ? 'text-white/30' : 'text-gray-500'}`}>
                {clubTrainers.length > 0 ? 'Нажмите, чтобы назначить' : 'Сначала добавьте тренеров'}
              </p>
            </GlassCard>
          )}
        </div>

        {/* Trainers list */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className={`text-xs uppercase font-bold ${dark ? 'text-white/40' : 'text-gray-500'}`}>
              Тренеры ({clubTrainers.length})
            </h3>
            {(isSuperadmin || isHead) && (
              <button onClick={() => setShowAddTrainer(true)} className="press-scale p-1">
                <Plus size={18} className="text-accent" />
              </button>
            )}
          </div>
          <div className="space-y-2">
            {clubTrainers.map(t => {
              const tStudents = data.students.filter(s => s.trainerId === t.id)
              const tGroups = data.groups.filter(g => g.trainerId === t.id)
              return (
                <GlassCard key={t.id} onClick={() => isSuperadmin && navigate(`/trainer/${t.id}`)} className="cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Avatar name={t.name} src={t.avatar} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm truncate">{t.name}</span>
                        {t.isHeadTrainer && <Crown size={12} className="text-yellow-400 shrink-0" />}
                      </div>
                      <div className={`text-xs ${dark ? 'text-white/30' : 'text-gray-500'}`}>
                        {tStudents.length} учеников • {tGroups.length} групп
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {(isSuperadmin || isHead) && !t.isHeadTrainer && (
                        <button onClick={(e) => { e.stopPropagation(); handleRemoveTrainer(t.id) }} className="press-scale p-1.5">
                          <UserMinus size={14} className="text-red-400" />
                        </button>
                      )}
                      {isSuperadmin && <ChevronRight size={16} className={dark ? 'text-white/15' : 'text-gray-300'} />}
                    </div>
                  </div>
                </GlassCard>
              )
            })}
          </div>
        </div>
      </div>

      {/* Head trainer picker modal */}
      <Modal open={showHeadPicker} onClose={() => setShowHeadPicker(false)} title="Назначить главного тренера">
        <div className="space-y-2">
          {clubTrainers.map(t => {
            const isCurrentHead = t.isHeadTrainer
            return (
              <button
                key={t.id}
                onClick={() => !isCurrentHead && handleSetHead(t.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-[16px] press-scale transition-all text-left ${
                  isCurrentHead
                    ? dark
                      ? 'bg-yellow-500/10 border-2 border-yellow-500/30'
                      : 'bg-yellow-50 border-2 border-yellow-400/40'
                    : dark
                      ? 'bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08]'
                      : 'bg-white/60 border border-white/50 hover:bg-white/80'
                }`}
              >
                <Avatar name={t.name} src={t.avatar} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm truncate">{t.name}</div>
                  <div className={`text-xs ${dark ? 'text-white/30' : 'text-gray-500'}`}>
                    {t.sportTypes?.map(st => getSportLabel(st)).join(', ') || getSportLabel(t.sportType)}
                  </div>
                </div>
                {isCurrentHead ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[10px] font-bold uppercase ${dark ? 'text-yellow-400' : 'text-yellow-600'}`}>Главный</span>
                    <Crown size={16} className="text-yellow-400" />
                  </div>
                ) : (
                  <Crown size={16} className={dark ? 'text-white/15' : 'text-gray-200'} />
                )}
              </button>
            )
          })}

          {/* Remove head trainer option */}
          {headTrainer && (
            <button
              onClick={handleRemoveHead}
              className={`w-full py-3 rounded-[16px] text-sm font-medium press-scale mt-2 ${
                dark ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-red-50 text-red-500 border border-red-200'
              }`}
            >
              Снять главного тренера
            </button>
          )}
        </div>
      </Modal>

      {/* Add Trainer Modal */}
      <Modal open={showAddTrainer} onClose={() => setShowAddTrainer(false)} title="Добавить тренера в клуб">
        <div className="space-y-2">
          {availableTrainers.length === 0 ? (
            <p className={`text-center py-6 text-sm ${dark ? 'text-white/30' : 'text-gray-500'}`}>
              Нет свободных тренеров
            </p>
          ) : (
            availableTrainers.map(t => (
              <button key={t.id} onClick={() => handleAddTrainer(t.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-[16px] press-scale transition-all text-left ${
                  dark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-white/60 border border-white/50'
                }`}
              >
                <Avatar name={t.name} src={t.avatar} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm truncate">{t.name}</div>
                  <div className={`text-xs ${dark ? 'text-white/30' : 'text-gray-500'}`}>
                    {t.clubName || '—'} • {getSportLabel(t.sportType)}
                  </div>
                </div>
                <Plus size={16} className="text-accent shrink-0" />
              </button>
            ))
          )}
        </div>
      </Modal>
    </Layout>
  )
}
