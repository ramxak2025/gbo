import { useMemo } from 'react'
import { Shield, MapPin, Calendar, Dumbbell, Building2, LogOut, Bell, ChevronRight, Phone, Award, Trophy, Globe, Clock, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import GlassCard from '../components/GlassCard'
import Avatar from '../components/Avatar'
import { getSportLabel } from '../utils/sports'

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

  // All trainers in this club
  const clubTrainers = useMemo(() => {
    if (!club) return trainer ? [trainer] : []
    return data.users.filter(u => u.role === 'trainer' && u.clubId === club.id)
  }, [club, data.users, trainer])

  // Group trainers by sport type
  const sportSections = useMemo(() => {
    const sections = []
    const sportSet = new Set()
    if (club?.sportTypes?.length) {
      club.sportTypes.forEach(st => sportSet.add(st))
    }
    clubTrainers.forEach(t => {
      const sports = t.sportTypes?.length ? t.sportTypes : t.sportType ? [t.sportType] : []
      sports.forEach(s => sportSet.add(s))
    })
    sportSet.forEach(sport => {
      const trainers = clubTrainers.filter(t => {
        const sports = t.sportTypes?.length ? t.sportTypes : t.sportType ? [t.sportType] : []
        return sports.includes(sport)
      })
      const groups = data.groups.filter(g => g.sportType === sport && trainers.some(t => t.id === g.trainerId))
      sections.push({ sport, trainers, groups })
    })
    // Add trainers without sport
    const noSportTrainers = clubTrainers.filter(t => {
      const sports = t.sportTypes?.length ? t.sportTypes : t.sportType ? [t.sportType] : []
      return sports.length === 0
    })
    if (noSportTrainers.length > 0) {
      const groups = data.groups.filter(g => !g.sportType && noSportTrainers.some(t => t.id === g.trainerId))
      sections.push({ sport: null, trainers: noSportTrainers, groups })
    }
    return sections
  }, [club, clubTrainers, data.groups])

  const clubAddress = club?.address || clubBranches[0]?.address || ''
  const clubCity = club?.city || ''
  const mapQuery = encodeURIComponent([clubAddress, clubCity].filter(Boolean).join(', '))

  return (
    <Layout>
      <PageHeader title="Клуб" logo />
      <div className="px-4 space-y-4 slide-in stagger">

        {/* Club Hero Card */}
        {club ? (
          <div className={`rounded-[24px] p-6 relative overflow-hidden ${
            dark
              ? 'bg-gradient-to-br from-blue-600/15 via-indigo-500/10 to-purple-600/15 border border-white/[0.08]'
              : 'bg-gradient-to-br from-blue-50 via-white/90 to-purple-50 border border-white/70 shadow-[0_8px_32px_rgba(0,0,0,0.08)]'
          }`}>
            <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full ${dark ? 'bg-blue-500/5' : 'bg-blue-100/30'}`} />
            <div className={`absolute -bottom-8 -left-8 w-24 h-24 rounded-full ${dark ? 'bg-purple-500/5' : 'bg-purple-100/30'}`} />
            <div className="relative">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-16 h-16 rounded-[20px] flex items-center justify-center ${
                  dark ? 'bg-gradient-to-br from-blue-500/25 to-indigo-500/25' : 'bg-gradient-to-br from-blue-100 to-indigo-100'
                }`}>
                  <Shield size={28} className={dark ? 'text-blue-400' : 'text-blue-600'} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-black">{club.name}</h2>
                  {clubCity && (
                    <div className={`flex items-center gap-1 mt-1 ${dark ? 'text-white/50' : 'text-gray-500'}`}>
                      <MapPin size={12} /> <span className="text-sm font-medium">{clubCity}</span>
                    </div>
                  )}
                </div>
              </div>
              {club.sportTypes?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {club.sportTypes.map(st => (
                    <span key={st} className={`px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wide ${
                      dark ? 'bg-accent/20 text-accent-light border border-accent/20' : 'bg-red-50 text-red-600 border border-red-100'
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

        {/* Sport Sections with Trainers and Groups */}
        {sportSections.map(section => (
          <div key={section.sport || 'other'}>
            <div className="flex items-center gap-2 mb-3">
              <Dumbbell size={14} className="text-accent" />
              <h3 className={`text-xs uppercase font-black tracking-wider ${dark ? 'text-white/50' : 'text-gray-600'}`}>
                {section.sport ? getSportLabel(section.sport) : 'Тренировки'}
              </h3>
            </div>

            {/* Trainers in this sport */}
            <div className="space-y-3">
              {section.trainers.map(t => {
                const trainerGroups = section.groups.filter(g => g.trainerId === t.id)
                return (
                  <div key={t.id} className={`rounded-[20px] overflow-hidden ${
                    dark
                      ? 'bg-gradient-to-br from-white/[0.04] to-white/[0.02] border border-white/[0.07]'
                      : 'bg-white/70 border border-white/60 shadow-[0_4px_16px_rgba(0,0,0,0.04)]'
                  }`}>
                    {/* Trainer header */}
                    <div className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar name={t.name || 'T'} src={t.avatar} size={52} />
                          {t.rank && (
                            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${
                              dark ? 'bg-yellow-500/30' : 'bg-yellow-100'
                            }`}>
                              <Award size={10} className="text-yellow-500" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-sm">{t.name}</div>
                          {t.rank && (
                            <div className={`text-[11px] font-semibold mt-0.5 ${dark ? 'text-yellow-400/80' : 'text-yellow-600'}`}>
                              {t.rank}
                            </div>
                          )}
                          {t.city && (
                            <div className={`text-[11px] flex items-center gap-1 mt-0.5 ${dark ? 'text-white/30' : 'text-gray-400'}`}>
                              <MapPin size={9} /> {t.city}
                            </div>
                          )}
                        </div>
                      </div>
                      {t.achievements && (
                        <div className={`mt-3 pt-3 ${dark ? 'border-t border-white/[0.06]' : 'border-t border-black/[0.05]'}`}>
                          <div className="flex items-start gap-2">
                            <Trophy size={12} className={`shrink-0 mt-0.5 ${dark ? 'text-yellow-400/60' : 'text-yellow-500'}`} />
                            <p className={`text-xs leading-relaxed ${dark ? 'text-white/40' : 'text-gray-500'}`}>{t.achievements}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Trainer's groups */}
                    {trainerGroups.length > 0 && (
                      <div className={`px-4 pb-4 space-y-2`}>
                        {trainerGroups.map(g => {
                          const isMyGroup = studentGroupIds.has(g.id)
                          return (
                            <div key={g.id} className={`rounded-[14px] p-3 ${
                              isMyGroup
                                ? dark ? 'bg-accent/10 border border-accent/20' : 'bg-red-50/80 border border-red-100'
                                : dark ? 'bg-white/[0.03] border border-white/[0.04]' : 'bg-gray-50/50 border border-gray-100/50'
                            }`}>
                              <div className="flex items-center justify-between">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm">{g.name}</span>
                                    {isMyGroup && (
                                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                                        dark ? 'bg-accent/20 text-accent-light' : 'bg-red-100 text-red-600'
                                      }`}>Ваша</span>
                                    )}
                                  </div>
                                  {g.schedule && (
                                    <div className={`text-[11px] mt-1 flex items-center gap-1 ${dark ? 'text-white/35' : 'text-gray-500'}`}>
                                      <Clock size={10} /> {g.schedule}
                                    </div>
                                  )}
                                </div>
                                {g.subscriptionCost > 0 && (
                                  <div className="text-right shrink-0">
                                    <div className="font-black text-sm">{g.subscriptionCost.toLocaleString('ru-RU')} ₽</div>
                                    <div className={`text-[10px] ${dark ? 'text-white/30' : 'text-gray-400'}`}>в месяц</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Branches */}
        {clubBranches.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Building2 size={14} className="text-cyan-500" />
              <h3 className={`text-xs uppercase font-black tracking-wider ${dark ? 'text-white/50' : 'text-gray-600'}`}>Филиалы</h3>
            </div>
            <div className="space-y-2">
              {clubBranches.map(b => (
                <GlassCard key={b.id}>
                  <div className="font-bold text-sm">{b.name}</div>
                  <div className={`text-xs flex items-center gap-1 mt-1 ${dark ? 'text-white/40' : 'text-gray-500'}`}>
                    {b.city && <><MapPin size={10} /> {b.city}</>}
                    {b.city && b.address && <span className="mx-1">·</span>}
                    {b.address && <span>{b.address}</span>}
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {/* Club Contacts */}
        {club && (club.phone || club.vk || club.address) && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Phone size={14} className="text-green-500" />
              <h3 className={`text-xs uppercase font-black tracking-wider ${dark ? 'text-white/50' : 'text-gray-600'}`}>Контакты</h3>
            </div>
            <div className={`rounded-[20px] overflow-hidden ${
              dark
                ? 'bg-white/[0.03] border border-white/[0.07]'
                : 'bg-white/70 border border-white/60 shadow-[0_4px_16px_rgba(0,0,0,0.04)]'
            }`}>
              <div className="p-4 space-y-3">
                {club.phone && (
                  <a href={`tel:${club.phone}`} className="flex items-center gap-3 press-scale">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${dark ? 'bg-green-500/15' : 'bg-green-50'}`}>
                      <Phone size={18} className="text-green-500" />
                    </div>
                    <div>
                      <div className="font-bold text-sm">{club.phone}</div>
                      <div className={`text-[10px] ${dark ? 'text-white/30' : 'text-gray-400'}`}>Позвонить</div>
                    </div>
                  </a>
                )}
                {club.vk && (
                  <a href={club.vk.startsWith('http') ? club.vk : `https://vk.com/${club.vk}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 press-scale">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${dark ? 'bg-blue-500/15' : 'bg-blue-50'}`}>
                      <Globe size={18} className="text-blue-500" />
                    </div>
                    <div>
                      <div className="font-bold text-sm">ВКонтакте</div>
                      <div className={`text-[10px] ${dark ? 'text-white/30' : 'text-gray-400'}`}>Страница клуба</div>
                    </div>
                  </a>
                )}
                {club.address && (
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${dark ? 'bg-orange-500/15' : 'bg-orange-50'}`}>
                      <MapPin size={18} className="text-orange-500" />
                    </div>
                    <div>
                      <div className="font-bold text-sm">{club.address}</div>
                      <div className={`text-[10px] ${dark ? 'text-white/30' : 'text-gray-400'}`}>Адрес</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Yandex Map */}
        {mapQuery && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={14} className="text-orange-500" />
              <h3 className={`text-xs uppercase font-black tracking-wider ${dark ? 'text-white/50' : 'text-gray-600'}`}>На карте</h3>
            </div>
            <div className={`rounded-[20px] overflow-hidden ${
              dark ? 'border border-white/[0.07]' : 'border border-white/60 shadow-[0_4px_16px_rgba(0,0,0,0.06)]'
            }`}>
              <iframe
                src={`https://yandex.ru/map-widget/v1/?text=${mapQuery}&z=15`}
                width="100%"
                height="220"
                frameBorder="0"
                allowFullScreen
                className="block"
                style={{ borderRadius: '20px' }}
              />
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
