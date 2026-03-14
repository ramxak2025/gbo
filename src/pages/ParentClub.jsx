import { useMemo, useState } from 'react'
import { Shield, MapPin, Calendar, Dumbbell, Building2, LogOut, Bell, ChevronRight, ChevronDown, Phone, Award, Trophy, Globe, Clock, Users, CreditCard, Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import GlassCard from '../components/GlassCard'
import Avatar from '../components/Avatar'
import { getSportLabel } from '../utils/sports'

const DAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

function isExpired(dateStr) {
  if (!dateStr) return true
  return new Date(dateStr) < new Date()
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

export default function ParentClub() {
  const { auth, logout } = useAuth()
  const { data } = useData()
  const { dark } = useTheme()
  const navigate = useNavigate()
  const [showOtherTrainers, setShowOtherTrainers] = useState(false)
  const [showBranches, setShowBranches] = useState(false)

  const parentInfo = auth.parent

  // Find ALL children for this parent
  const allChildren = useMemo(() => {
    if (!parentInfo?.phone) return [data.students.find(s => s.id === auth.studentId)].filter(Boolean)
    const parentRecords = (data.parents || []).filter(p => p.phone === parentInfo.phone)
    if (parentRecords.length === 0) return [data.students.find(s => s.id === auth.studentId)].filter(Boolean)
    const studentIds = [...new Set(parentRecords.map(p => p.studentId))]
    const children = studentIds.map(sid => data.students.find(s => s.id === sid)).filter(Boolean)
    return children.length > 0 ? children : [data.students.find(s => s.id === auth.studentId)].filter(Boolean)
  }, [data.parents, data.students, parentInfo, auth.studentId])

  // Get unique trainers for all children
  const childTrainers = useMemo(() => {
    const trainerIds = [...new Set(allChildren.map(c => c.trainerId))]
    return trainerIds.map(id => data.users.find(u => u.id === id)).filter(Boolean)
  }, [allChildren, data.users])

  // Get child's groups
  const childGroupsMap = useMemo(() => {
    const map = {}
    allChildren.forEach(child => {
      const sgIds = new Set(data.studentGroups.filter(sg => sg.studentId === child.id).map(sg => sg.groupId))
      if (child.groupId) sgIds.add(child.groupId)
      map[child.id] = data.groups.filter(g => sgIds.has(g.id))
    })
    return map
  }, [allChildren, data.studentGroups, data.groups])

  // Get club info
  const trainer = data.users.find(u => u.id === auth.userId)
  const club = trainer?.clubId ? (data.clubs || []).find(c => c.id === trainer.clubId) : null
  const clubBranches = club ? (data.branches || []).filter(b => b.clubId === club.id) : []

  // Get the child's trainer's branch
  const childBranchIds = new Set(childTrainers.map(t => t.branchId).filter(Boolean))

  // Other trainers in the same branch (not the child's trainer)
  const otherTrainersInBranch = useMemo(() => {
    if (!club) return []
    const childTrainerIds = new Set(childTrainers.map(t => t.id))
    const branchTrainers = data.users.filter(u =>
      u.role === 'trainer' && u.clubId === club.id && !childTrainerIds.has(u.id) &&
      (childBranchIds.size === 0 || childBranchIds.has(u.branchId))
    )
    return branchTrainers.map(t => {
      const groups = data.groups.filter(g => g.trainerId === t.id)
      return { ...t, groups }
    })
  }, [club, childTrainers, data.users, data.groups, childBranchIds])

  // Other branches (not the child's)
  const otherBranches = useMemo(() => {
    if (clubBranches.length <= 1) return []
    return clubBranches.filter(b => !childBranchIds.has(b.id))
  }, [clubBranches, childBranchIds])

  // Group branches by city
  const branchesByCity = useMemo(() => {
    const map = {}
    otherBranches.forEach(b => {
      const city = b.city || 'Другие'
      if (!map[city]) map[city] = []
      map[city].push(b)
    })
    return Object.entries(map)
  }, [otherBranches])

  return (
    <Layout>
      <PageHeader title="Клуб" logo />
      <div className="px-4 space-y-4 slide-in stagger pb-6">

        {/* Club Hero Card */}
        {club ? (
          <div className={`rounded-3xl p-5 relative overflow-hidden ${
            dark
              ? 'bg-gradient-to-br from-blue-600/12 via-indigo-500/8 to-purple-600/12 border border-white/[0.08]'
              : 'bg-gradient-to-br from-blue-50 via-white/90 to-purple-50 border border-white/70 shadow-[0_4px_24px_rgba(0,0,0,0.06)]'
          }`}>
            <div className={`absolute -top-10 -right-10 w-28 h-28 rounded-full ${dark ? 'bg-blue-500/5' : 'bg-blue-100/30'}`} />
            <div className="relative flex items-center gap-3.5">
              {club.logo ? (
                <img src={club.logo} alt={club.name} className="w-14 h-14 rounded-2xl object-cover shrink-0 ring-2 ring-white/10" />
              ) : (
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                  dark ? 'bg-gradient-to-br from-blue-500/20 to-indigo-500/20' : 'bg-gradient-to-br from-blue-100 to-indigo-100'
                }`}>
                  <Shield size={24} className={dark ? 'text-blue-400' : 'text-blue-600'} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-black truncate">{club.name}</h2>
                {club.city && (
                  <div className={`flex items-center gap-1 mt-0.5 ${dark ? 'text-white/40' : 'text-gray-500'}`}>
                    <MapPin size={11} /> <span className="text-[12px] font-medium">{club.city}</span>
                  </div>
                )}
              </div>
            </div>
            {club.sportTypes?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {club.sportTypes.map(st => (
                  <span key={st} className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase ${
                    dark ? 'bg-accent/12 text-accent-light' : 'bg-red-50 text-red-600'
                  }`}>{getSportLabel(st)}</span>
                ))}
              </div>
            )}
          </div>
        ) : trainer?.clubName ? (
          <GlassCard>
            <div className="flex items-center gap-3">
              <Shield size={20} className={dark ? 'text-blue-400' : 'text-blue-600'} />
              <div className="font-bold">{trainer.clubName}</div>
            </div>
          </GlassCard>
        ) : null}

        {/* ═══ Children's Trainers & Groups ═══ */}
        {allChildren.map(child => {
          const childTrainer = data.users.find(u => u.id === child.trainerId)
          const childGroups = childGroupsMap[child.id] || []
          const expired = isExpired(child.subscriptionExpiresAt)

          return (
            <div key={child.id} className="space-y-3">
              {allChildren.length > 1 && (
                <div className={`text-[10px] uppercase font-bold tracking-wider flex items-center gap-2 ${dark ? 'text-white/35' : 'text-gray-500'}`}>
                  <Star size={10} className="text-accent" />
                  {child.name}
                </div>
              )}

              {/* Trainer Card */}
              {childTrainer && (
                <div className={`rounded-3xl overflow-hidden ${
                  dark
                    ? 'bg-gradient-to-br from-purple-500/8 via-white/[0.03] to-indigo-500/8 border border-white/[0.08]'
                    : 'bg-white border border-gray-100 shadow-[0_2px_16px_rgba(0,0,0,0.05)]'
                }`}>
                  <div className="p-4">
                    <div className={`text-[9px] uppercase font-bold tracking-widest mb-3 ${dark ? 'text-white/25' : 'text-gray-400'}`}>Тренер</div>
                    <div className="flex items-center gap-3.5">
                      <div className="relative">
                        <Avatar name={childTrainer.name} src={childTrainer.avatar} size={56} />
                        {childTrainer.rank && (
                          <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${
                            dark ? 'bg-yellow-500/30' : 'bg-yellow-100'
                          }`}>
                            <Award size={11} className="text-yellow-500" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-black text-[15px]">{childTrainer.name}</h3>
                        {childTrainer.rank && (
                          <div className={`text-[11px] font-semibold mt-0.5 ${dark ? 'text-yellow-400/70' : 'text-yellow-600'}`}>
                            {childTrainer.rank}
                          </div>
                        )}
                        {childTrainer.sportType && (
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase ${
                            dark ? 'bg-accent/12 text-accent-light' : 'bg-red-50 text-red-600'
                          }`}>{getSportLabel(childTrainer.sportType)}</span>
                        )}
                      </div>
                    </div>

                    {/* Trainer contacts */}
                    <div className={`mt-3 pt-3 space-y-2 ${dark ? 'border-t border-white/[0.06]' : 'border-t border-gray-100'}`}>
                      {childTrainer.phone && (
                        <a href={`tel:${childTrainer.phone}`} className="flex items-center gap-2.5 press-scale">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${dark ? 'bg-green-500/12' : 'bg-green-50'}`}>
                            <Phone size={14} className="text-green-500" />
                          </div>
                          <span className={`text-[13px] font-semibold ${dark ? 'text-white/60' : 'text-gray-700'}`}>{childTrainer.phone}</span>
                        </a>
                      )}
                      {childTrainer.achievements && (
                        <div className="flex items-start gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${dark ? 'bg-yellow-500/12' : 'bg-yellow-50'}`}>
                            <Trophy size={14} className="text-yellow-500" />
                          </div>
                          <p className={`text-[12px] leading-relaxed pt-1 ${dark ? 'text-white/40' : 'text-gray-500'}`}>{childTrainer.achievements}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Child's groups */}
                  {childGroups.length > 0 && (
                    <div className={`px-4 pb-4 space-y-2 ${dark ? 'border-t border-white/[0.05]' : 'border-t border-gray-50'}`}>
                      <div className={`text-[9px] uppercase font-bold tracking-widest pt-3 ${dark ? 'text-white/25' : 'text-gray-400'}`}>
                        Группы
                      </div>
                      {childGroups.map(g => (
                        <GroupCard key={g.id} g={g} dark={dark} isMyGroup child={child} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Subscription info */}
              <div className={`rounded-2xl p-4 flex items-center justify-between ${
                expired
                  ? dark ? 'bg-red-500/8 border border-red-500/15' : 'bg-red-50/60 border border-red-100'
                  : dark ? 'bg-green-500/8 border border-green-500/15' : 'bg-green-50/60 border border-green-100'
              }`}>
                <div className="flex items-center gap-2.5">
                  <CreditCard size={16} className={expired ? 'text-red-400' : 'text-green-500'} />
                  <div>
                    <div className={`text-[12px] font-bold ${expired ? (dark ? 'text-red-400' : 'text-red-600') : (dark ? 'text-green-400' : 'text-green-600')}`}>
                      Абонемент {expired ? '— Истек' : '— Активен'}
                    </div>
                    <div className={`text-[10px] ${dark ? 'text-white/30' : 'text-gray-500'}`}>
                      {expired ? 'Истек' : 'Действует до'} {formatDate(child.subscriptionExpiresAt)}
                    </div>
                  </div>
                </div>
                {childGroups[0]?.subscriptionCost > 0 && (
                  <div className="text-right">
                    <div className={`text-[14px] font-black ${dark ? 'text-white/70' : 'text-gray-800'}`}>
                      {child.discount > 0
                        ? Math.round(childGroups[0].subscriptionCost * (1 - child.discount / 100)).toLocaleString('ru-RU')
                        : childGroups[0].subscriptionCost.toLocaleString('ru-RU')
                      } ₽
                    </div>
                    <div className={`text-[9px] ${dark ? 'text-white/25' : 'text-gray-400'}`}>в месяц</div>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* ═══ Other Trainers in Branch ═══ */}
        {otherTrainersInBranch.length > 0 && (
          <div>
            <button
              onClick={() => setShowOtherTrainers(!showOtherTrainers)}
              className={`w-full flex items-center justify-between py-2 mb-2 ${dark ? 'text-white/40' : 'text-gray-500'}`}
            >
              <span className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5">
                <Dumbbell size={11} /> Другие тренировки в филиале
              </span>
              <ChevronDown size={14} className={`transition-transform ${showOtherTrainers ? 'rotate-180' : ''}`} />
            </button>

            {showOtherTrainers && (
              <div className="space-y-3 animate-in">
                {otherTrainersInBranch.map(t => (
                  <div key={t.id} className={`rounded-2xl overflow-hidden ${
                    dark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white/50 border border-gray-100 shadow-sm'
                  }`}>
                    <div className="p-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={t.name} src={t.avatar} size={42} />
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-[13px]">{t.name}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {t.sportType && (
                              <span className={`text-[9px] font-bold uppercase px-1.5 py-px rounded ${dark ? 'bg-accent/10 text-accent-light' : 'bg-red-50 text-red-600'}`}>
                                {getSportLabel(t.sportType)}
                              </span>
                            )}
                            {t.rank && <span className={`text-[10px] ${dark ? 'text-yellow-400/60' : 'text-yellow-600'}`}>{t.rank}</span>}
                          </div>
                        </div>
                        {t.phone && (
                          <a href={`tel:${t.phone}`} className="press-scale">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${dark ? 'bg-green-500/10' : 'bg-green-50'}`}>
                              <Phone size={13} className="text-green-500" />
                            </div>
                          </a>
                        )}
                      </div>
                    </div>

                    {t.groups.length > 0 && (
                      <div className={`px-3.5 pb-3 space-y-1.5 ${dark ? 'border-t border-white/[0.04]' : 'border-t border-gray-50'}`}>
                        {t.groups.map(g => (
                          <GroupCard key={g.id} g={g} dark={dark} compact />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ Other Branches ═══ */}
        {branchesByCity.length > 0 && (
          <div>
            <button
              onClick={() => setShowBranches(!showBranches)}
              className={`w-full flex items-center justify-between py-2 mb-2 ${dark ? 'text-white/40' : 'text-gray-500'}`}
            >
              <span className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5">
                <Building2 size={11} /> Наши филиалы
              </span>
              <ChevronDown size={14} className={`transition-transform ${showBranches ? 'rotate-180' : ''}`} />
            </button>

            {showBranches && (
              <div className="space-y-4 animate-in">
                {branchesByCity.map(([city, branches]) => (
                  <div key={city}>
                    <div className={`text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${dark ? 'text-white/30' : 'text-gray-400'}`}>
                      <MapPin size={9} /> {city}
                    </div>
                    <div className="space-y-2">
                      {branches.map(b => (
                        <div key={b.id} className={`rounded-2xl p-3.5 ${
                          dark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white/50 border border-gray-100 shadow-sm'
                        }`}>
                          <div className="font-bold text-[13px]">{b.name}</div>
                          {b.address && (
                            <div className={`text-[11px] mt-1 flex items-center gap-1 ${dark ? 'text-white/30' : 'text-gray-500'}`}>
                              <MapPin size={9} /> {b.address}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Club Contacts */}
        {club && (club.phone || club.vk) && (
          <div>
            <div className={`text-[10px] uppercase font-bold tracking-wider mb-2 flex items-center gap-1.5 ${dark ? 'text-white/35' : 'text-gray-500'}`}>
              <Phone size={10} /> Контакты клуба
            </div>
            <div className={`rounded-2xl overflow-hidden ${dark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white/60 border border-gray-100 shadow-sm'}`}>
              <div className="p-4 space-y-3">
                {club.phone && (
                  <a href={`tel:${club.phone}`} className="flex items-center gap-3 press-scale">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${dark ? 'bg-green-500/12' : 'bg-green-50'}`}>
                      <Phone size={16} className="text-green-500" />
                    </div>
                    <div>
                      <div className="font-bold text-[13px]">{club.phone}</div>
                      <div className={`text-[9px] ${dark ? 'text-white/25' : 'text-gray-400'}`}>Позвонить</div>
                    </div>
                  </a>
                )}
                {club.vk && (
                  <a href={club.vk.startsWith('http') ? club.vk : `https://vk.com/${club.vk}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 press-scale">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${dark ? 'bg-blue-500/12' : 'bg-blue-50'}`}>
                      <Globe size={16} className="text-blue-500" />
                    </div>
                    <div>
                      <div className="font-bold text-[13px]">ВКонтакте</div>
                      <div className={`text-[9px] ${dark ? 'text-white/25' : 'text-gray-400'}`}>Страница клуба</div>
                    </div>
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="space-y-2 pt-1">
          <button onClick={() => navigate('/notifications')}
            className={`w-full py-3 rounded-2xl font-bold text-[13px] press-scale flex items-center gap-3 px-4 ${
              dark ? 'bg-white/[0.04] border border-white/[0.06] text-white' : 'bg-white/60 border border-gray-100 text-gray-900 shadow-sm'
            }`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${dark ? 'bg-blue-500/12' : 'bg-blue-50'}`}>
              <Bell size={15} className="text-blue-500" />
            </div>
            <span className="flex-1 text-left">Уведомления</span>
            <ChevronRight size={14} className={dark ? 'text-white/12' : 'text-gray-300'} />
          </button>
          <button onClick={logout}
            className={`w-full py-3 rounded-2xl font-bold text-[13px] press-scale flex items-center gap-3 px-4 ${
              dark ? 'bg-red-500/[0.06] border border-red-500/15 text-red-400' : 'bg-red-50/60 border border-red-100 text-red-500 shadow-sm'
            }`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${dark ? 'bg-red-500/12' : 'bg-red-100/60'}`}>
              <LogOut size={15} className="text-red-400" />
            </div>
            <span className="flex-1 text-left">Выйти</span>
          </button>
        </div>
      </div>
    </Layout>
  )
}

/* ═══ Group Card Component ═══ */
function GroupCard({ g, dark, isMyGroup, compact, child }) {
  const expired = child ? isExpired(child.subscriptionExpiresAt) : false

  return (
    <div className={`rounded-xl p-3 ${
      isMyGroup
        ? dark ? 'bg-accent/8 border border-accent/15' : 'bg-red-50/60 border border-red-100/60'
        : dark ? 'bg-white/[0.03] border border-white/[0.04]' : 'bg-gray-50/50 border border-gray-100/50'
    }`}>
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Dumbbell size={12} className={isMyGroup ? 'text-accent shrink-0' : dark ? 'text-white/20 shrink-0' : 'text-gray-400 shrink-0'} />
            <span className={`font-bold text-[13px] truncate ${dark ? 'text-white/80' : 'text-gray-800'}`}>{g.name}</span>
            {isMyGroup && (
              <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full shrink-0 ${
                dark ? 'bg-accent/15 text-accent-light' : 'bg-red-100 text-red-600'
              }`}>Ваша</span>
            )}
          </div>

          {/* Schedule */}
          {g.schedule && (
            <div className={`text-[11px] mt-1.5 flex items-center gap-1.5 ${dark ? 'text-white/35' : 'text-gray-500'}`}>
              <Clock size={10} className="shrink-0" />
              <span>{g.schedule}</span>
            </div>
          )}

          {/* Schedule days */}
          {g.scheduleDays?.length > 0 && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <Calendar size={10} className={dark ? 'text-white/25' : 'text-gray-400'} />
              <div className="flex gap-1">
                {DAYS_SHORT.map((day, i) => {
                  const active = g.scheduleDays.includes(i)
                  return (
                    <span key={i} className={`w-5 h-5 rounded-md flex items-center justify-center text-[8px] font-bold ${
                      active
                        ? dark ? 'bg-accent/15 text-accent-light' : 'bg-red-50 text-red-600'
                        : dark ? 'bg-white/[0.04] text-white/15' : 'bg-gray-50 text-gray-300'
                    }`}>{day}</span>
                  )
                })}
              </div>
              {g.timeFrom && (
                <span className={`text-[10px] font-semibold ${dark ? 'text-white/30' : 'text-gray-500'}`}>
                  {g.timeFrom}{g.timeTo ? `–${g.timeTo}` : ''}
                </span>
              )}
            </div>
          )}
        </div>

        {g.subscriptionCost > 0 && (
          <div className="text-right shrink-0 ml-2">
            <div className={`text-[13px] font-black ${dark ? 'text-white/65' : 'text-gray-800'}`}>
              {g.subscriptionCost.toLocaleString('ru-RU')} ₽
            </div>
            <div className={`text-[8px] uppercase ${dark ? 'text-white/20' : 'text-gray-400'}`}>в месяц</div>
          </div>
        )}
      </div>
    </div>
  )
}
