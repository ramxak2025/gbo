import { useMemo } from 'react'
import { Shield, MapPin, Calendar, Users, Dumbbell, Clock, Building2, User, LogOut, Bell, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import GlassCard from '../components/GlassCard'
import Avatar from '../components/Avatar'
import { getSportLabel } from '../utils/sports'

const DAY_LABELS = { 0: 'Вс', 1: 'Пн', 2: 'Вт', 3: 'Ср', 4: 'Чт', 5: 'Пт', 6: 'Сб' }

export default function ParentClub() {
  const { auth, logout } = useAuth()
  const { data } = useData()
  const { dark } = useTheme()
  const navigate = useNavigate()

  const student = data.students.find(s => s.id === auth.studentId)
  const trainer = data.users.find(u => u.id === auth.userId)
  const club = trainer?.clubId ? (data.clubs || []).find(c => c.id === trainer.clubId) : null

  // All groups the student belongs to
  const studentGroupIds = useMemo(() => {
    const sgIds = new Set(data.studentGroups.filter(sg => sg.studentId === auth.studentId).map(sg => sg.groupId))
    if (student?.groupId) sgIds.add(student.groupId)
    return sgIds
  }, [data.studentGroups, student, auth.studentId])

  const myGroups = data.groups.filter(g => studentGroupIds.has(g.id))
  const clubBranches = club ? (data.branches || []).filter(b => b.clubId === club.id) : []

  return (
    <Layout>
      <PageHeader title="Клуб" logo />
      <div className="px-4 space-y-4 slide-in stagger">

        {/* Club info */}
        {club ? (
          <div className={`rounded-[24px] p-5 relative overflow-hidden ${
            dark
              ? 'bg-gradient-to-br from-blue-500/15 via-white/[0.04] to-purple-500/15 border border-white/[0.08]'
              : 'bg-gradient-to-br from-blue-50 via-white/80 to-purple-50 border border-white/70 shadow-[0_8px_32px_rgba(0,0,0,0.06)]'
          }`}>
            <div className={`absolute -top-10 -right-10 w-28 h-28 rounded-full ${dark ? 'bg-blue-500/5' : 'bg-blue-100/40'}`} />
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-14 h-14 rounded-[18px] flex items-center justify-center ${
                  dark ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20' : 'bg-gradient-to-br from-blue-100 to-purple-100'
                }`}>
                  <Shield size={24} className={dark ? 'text-blue-400' : 'text-blue-600'} />
                </div>
                <div>
                  <h2 className="text-lg font-black">{club.name}</h2>
                  {club.city && (
                    <div className={`flex items-center gap-1 mt-0.5 ${dark ? 'text-white/40' : 'text-gray-500'}`}>
                      <MapPin size={12} /> <span className="text-xs font-medium">{club.city}</span>
                    </div>
                  )}
                </div>
              </div>
              {club.sportTypes?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {club.sportTypes.map(st => (
                    <span key={st} className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                      dark ? 'bg-accent/15 text-accent-light' : 'bg-red-50 text-red-600'
                    }`}>{getSportLabel(st)}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : trainer?.clubName ? (
          <GlassCard>
            <div className="flex items-center gap-3">
              <Shield size={20} className={dark ? 'text-blue-400' : 'text-blue-600'} />
              <div>
                <div className="font-bold">{trainer.clubName}</div>
                {trainer.city && (
                  <div className={`text-xs flex items-center gap-1 ${dark ? 'text-white/40' : 'text-gray-500'}`}>
                    <MapPin size={10} /> {trainer.city}
                  </div>
                )}
              </div>
            </div>
          </GlassCard>
        ) : (
          <GlassCard className="text-center py-4">
            <p className={`text-sm ${dark ? 'text-white/40' : 'text-gray-500'}`}>Информация о клубе недоступна</p>
          </GlassCard>
        )}

        {/* Branches */}
        {clubBranches.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Building2 size={14} className="text-cyan-500" />
              <h3 className={`text-xs uppercase font-bold ${dark ? 'text-white/40' : 'text-gray-500'}`}>Филиалы</h3>
            </div>
            <div className="space-y-2">
              {clubBranches.map(b => (
                <GlassCard key={b.id}>
                  <div className="font-bold text-sm">{b.name}</div>
                  <div className={`text-xs flex items-center gap-1 mt-0.5 ${dark ? 'text-white/40' : 'text-gray-500'}`}>
                    {b.city && <><MapPin size={10} /> {b.city}</>}
                    {b.city && b.address && <span>•</span>}
                    {b.address && <span>{b.address}</span>}
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {/* Trainer info */}
        {trainer && (
          <div>
            <h3 className={`text-xs uppercase font-bold mb-2 ${dark ? 'text-white/40' : 'text-gray-500'}`}>Тренер</h3>
            <GlassCard>
              <div className="flex items-center gap-3">
                <Avatar name={trainer.name || 'T'} src={trainer.avatar} size={48} />
                <div className="min-w-0 flex-1">
                  <div className="font-bold">{trainer.name}</div>
                  <div className={`text-xs ${dark ? 'text-white/40' : 'text-gray-500'}`}>
                    {trainer.sportTypes?.map(st => getSportLabel(st)).join(', ') || getSportLabel(trainer.sportType)}
                  </div>
                  {trainer.city && (
                    <div className={`text-xs flex items-center gap-1 mt-0.5 ${dark ? 'text-white/30' : 'text-gray-400'}`}>
                      <MapPin size={10} /> {trainer.city}
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {/* Schedule */}
        {myGroups.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={14} className="text-accent" />
              <h3 className={`text-xs uppercase font-bold ${dark ? 'text-white/40' : 'text-gray-500'}`}>Расписание</h3>
            </div>
            <div className="space-y-2">
              {myGroups.map(g => (
                <GlassCard key={g.id}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${dark ? 'bg-accent/15' : 'bg-red-100'}`}>
                      <Dumbbell size={18} className="text-accent" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-sm">{g.name}</div>
                      {g.schedule ? (
                        <div className={`text-xs mt-0.5 ${dark ? 'text-white/40' : 'text-gray-600'}`}>{g.schedule}</div>
                      ) : (
                        <div className={`text-xs mt-0.5 ${dark ? 'text-white/30' : 'text-gray-400'}`}>Расписание не указано</div>
                      )}
                      {g.subscriptionCost > 0 && (
                        <div className={`text-xs mt-0.5 ${dark ? 'text-white/30' : 'text-gray-400'}`}>
                          {g.subscriptionCost.toLocaleString('ru-RU')} ₽/мес
                        </div>
                      )}
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="space-y-2 pt-1">
          <button
            onClick={() => navigate('/notifications')}
            className={`w-full py-3.5 rounded-[20px] font-bold text-sm press-scale flex items-center gap-3 px-5 backdrop-blur-xl transition-all ${
              dark
                ? 'bg-white/[0.05] border border-white/[0.07] text-white hover:bg-white/[0.08]'
                : 'bg-white/70 border border-white/60 text-gray-900 shadow-sm hover:bg-white/80'
            }`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${dark ? 'bg-blue-500/15' : 'bg-blue-50'}`}>
              <Bell size={17} className="text-blue-500" />
            </div>
            <span className="flex-1 text-left">Уведомления</span>
            <ChevronRight size={16} className={dark ? 'text-white/15' : 'text-gray-300'} />
          </button>
          <button
            onClick={logout}
            className={`w-full py-3.5 rounded-[20px] font-bold text-sm press-scale flex items-center gap-3 px-5 backdrop-blur-xl transition-all ${
              dark
                ? 'bg-red-500/[0.08] border border-red-500/15 text-red-400 hover:bg-red-500/15'
                : 'bg-red-50/70 border border-red-100 text-red-500 shadow-sm hover:bg-red-50'
            }`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${dark ? 'bg-red-500/15' : 'bg-red-100/60'}`}>
              <LogOut size={17} className="text-red-400" />
            </div>
            <span className="flex-1 text-left">Выйти из аккаунта</span>
          </button>
        </div>

        <div className="h-4" />
      </div>
    </Layout>
  )
}
