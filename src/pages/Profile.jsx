import { useState, useMemo } from 'react'
import { Camera, LogOut, Bell, MapPin, Shield, Award, Users, ChevronRight, Dumbbell, Calendar, Phone, CreditCard, Scale, Crown, UserMinus, TrendingUp, Star, Activity, Zap, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import { api } from '../utils/api'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import Avatar from '../components/Avatar'
import GlassCard from '../components/GlassCard'
import Modal from '../components/Modal'
import { getSportLabel, getRankLabel } from '../utils/sports'

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function isExpired(dateStr) {
  if (!dateStr) return true
  return new Date(dateStr) < new Date()
}

export default function Profile() {
  const { auth, logout } = useAuth()
  const { data, updateStudent, updateTrainer, removeTrainerFromClub } = useData()
  const { dark } = useTheme()
  const navigate = useNavigate()
  const [fireConfirm, setFireConfirm] = useState(null)

  const authUser = auth.user
  const user = auth.role === 'trainer' ? (data.users.find(u => u.id === auth.userId) || authUser) : authUser
  const student = auth.role === 'student' ? data.students.find(s => s.id === auth.studentId) : null
  const trainer = auth.role === 'student' ? data.users.find(u => u.id === auth.userId) : null
  const displayName = auth.role === 'student' ? student?.name : user?.name
  const avatarSrc = auth.role === 'student' ? student?.avatar : user?.avatar

  const myGroups = auth.role === 'trainer' ? data.groups.filter(g => g.trainerId === auth.userId) : []
  const myStudents = auth.role === 'trainer' ? data.students.filter(s => s.trainerId === auth.userId) : []

  const isHeadTrainer = auth.role === 'trainer' && user?.isHeadTrainer && user?.clubId
  const myClub = isHeadTrainer ? (data.clubs || []).find(c => c.id === user.clubId) : null
  const clubTrainers = isHeadTrainer ? data.users.filter(u => u.role === 'trainer' && u.clubId === user.clubId) : []

  const clubStats = useMemo(() => {
    if (!isHeadTrainer) return null
    const trainerIds = new Set(clubTrainers.map(t => t.id))
    const allStudents = data.students.filter(s => trainerIds.has(s.trainerId))
    const active = allStudents.filter(s => !isExpired(s.subscriptionExpiresAt)).length
    const allGroups = data.groups.filter(g => trainerIds.has(g.trainerId))
    return { trainers: clubTrainers.length, students: allStudents.length, active, groups: allGroups.length }
  }, [isHeadTrainer, clubTrainers, data.students, data.groups])

  const trainerStats = useMemo(() => {
    if (auth.role !== 'trainer') return null
    const active = myStudents.filter(s => !isExpired(s.subscriptionExpiresAt)).length
    return { total: myStudents.length, active, groups: myGroups.length }
  }, [auth.role, myStudents, myGroups])

  const group = student ? data.groups.find(g => g.id === student.groupId) : null
  const expired = student ? isExpired(student.subscriptionExpiresAt) : false
  const sportLabel = getSportLabel(auth.role === 'student' ? trainer?.sportType : user?.sportType)
  const rankLabel = getRankLabel(auth.role === 'student' ? trainer?.sportType : user?.sportType)

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const url = await api.uploadFile(file)
      if (auth.role === 'student' && student) {
        updateStudent(student.id, { avatar: url })
      } else {
        await updateTrainer(auth.userId, { avatar: url })
      }
    } catch (err) {
      console.error('Upload failed:', err)
    }
  }

  const handleFireTrainer = (trainerId) => {
    removeTrainerFromClub(user.clubId, trainerId)
    setFireConfirm(null)
  }

  return (
    <Layout>
      <PageHeader title="Профиль" back={true} />
      <div className="px-4 space-y-4 slide-in">

        {/* === HERO PROFILE CARD === */}
        <div className={`rounded-[28px] relative overflow-hidden ${
          dark
            ? 'bg-gradient-to-br from-purple-600/20 via-white/[0.03] to-blue-500/15 border border-white/[0.08]'
            : 'bg-gradient-to-br from-purple-50 via-white/90 to-blue-50 border border-white/70 shadow-[0_8px_40px_rgba(0,0,0,0.06)]'
        }`}>
          {/* Decorative elements */}
          <div className={`absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl ${dark ? 'bg-purple-500/10' : 'bg-purple-200/40'}`} />
          <div className={`absolute -bottom-12 -left-12 w-32 h-32 rounded-full blur-2xl ${dark ? 'bg-blue-500/8' : 'bg-blue-100/50'}`} />
          <div className={`absolute top-1/2 right-8 w-20 h-20 rounded-full blur-2xl ${dark ? 'bg-accent/5' : 'bg-red-100/30'}`} />

          <div className="relative p-6 pb-5">
            <div className="flex items-start gap-4">
              {/* Avatar with gradient ring */}
              <div className="relative shrink-0">
                <div className={`p-[3px] rounded-full ${
                  isHeadTrainer
                    ? 'bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500'
                    : auth.role === 'trainer'
                      ? 'bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500'
                      : 'bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500'
                }`}>
                  <div className={`rounded-full p-[2px] ${dark ? 'bg-[#0a0a12]' : 'bg-white'}`}>
                    <Avatar name={displayName} src={avatarSrc} size={76} />
                  </div>
                </div>
                <label className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer press-scale shadow-lg ${
                  dark ? 'bg-white/10 backdrop-blur-xl border border-white/20' : 'bg-white border border-gray-200 shadow-md'
                }`}>
                  <Camera size={14} className={dark ? 'text-white/70' : 'text-gray-600'} />
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                </label>
                {isHeadTrainer && (
                  <div className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-500/30 bounce-in">
                    <Crown size={12} className="text-white" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 pt-1">
                <h2 className="text-xl font-black truncate">{displayName}</h2>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    auth.role === 'superadmin'
                      ? dark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-600'
                      : auth.role === 'trainer'
                        ? dark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-600'
                        : dark ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-600'
                  }`}>
                    {auth.role === 'superadmin' ? 'Админ' : auth.role === 'trainer' ? 'Тренер' : 'Спортсмен'}
                  </span>
                  {sportLabel && (
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      dark ? 'bg-accent/15 text-accent-light' : 'bg-red-50 text-red-600'
                    }`}>{sportLabel}</span>
                  )}
                </div>

                {(auth.role === 'trainer' || auth.role === 'student') && (
                  <div className={`flex items-center gap-3 mt-2 ${dark ? 'text-white/35' : 'text-gray-400'}`}>
                    {(auth.role === 'trainer' ? user?.clubName : trainer?.clubName) && (
                      <span className="text-[11px] font-medium flex items-center gap-1">
                        <Shield size={10} />
                        {auth.role === 'trainer' ? user?.clubName : trainer?.clubName}
                      </span>
                    )}
                    {(auth.role === 'trainer' ? user?.city : trainer?.city) && (
                      <span className="text-[11px] font-medium flex items-center gap-1">
                        <MapPin size={10} />
                        {auth.role === 'trainer' ? user?.city : trainer?.city}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Trainer quick stats bar */}
          {auth.role === 'trainer' && trainerStats && (
            <div className="px-6 pb-5 pt-1">
              <div className={`grid grid-cols-3 gap-2 rounded-[18px] p-3.5 ${
                dark ? 'bg-black/30 backdrop-blur-xl' : 'bg-white/50 backdrop-blur-xl'
              }`}>
                {[
                  { icon: Users, value: trainerStats.total, label: 'Учеников', gradient: 'from-blue-500 to-cyan-500' },
                  { icon: Zap, value: trainerStats.active, label: 'Активных', gradient: 'from-green-500 to-emerald-500' },
                  { icon: Dumbbell, value: trainerStats.groups, label: 'Групп', gradient: 'from-purple-500 to-violet-500' },
                ].map(({ icon: Icon, value, label, gradient }) => (
                  <div key={label} className="flex flex-col items-center gap-1.5">
                    <div className={`w-9 h-9 rounded-[12px] flex items-center justify-center bg-gradient-to-br ${gradient}`}>
                      <Icon size={15} className="text-white" />
                    </div>
                    <div className="text-lg font-black leading-none number-pop">{value}</div>
                    <div className={`text-[9px] uppercase font-semibold tracking-wide ${dark ? 'text-white/25' : 'text-gray-400'}`}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ========= HEAD TRAINER CLUB MANAGEMENT ========= */}
        {isHeadTrainer && myClub && (
          <>
            {/* Club Stats Dashboard */}
            <div className={`rounded-[24px] relative overflow-hidden ${
              dark
                ? 'bg-gradient-to-br from-amber-500/10 via-white/[0.02] to-yellow-600/10 border border-yellow-500/15'
                : 'bg-gradient-to-br from-amber-50 via-yellow-50/50 to-orange-50 border border-amber-200/40 shadow-[0_6px_28px_rgba(245,158,11,0.08)]'
            }`}>
              <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl ${dark ? 'bg-yellow-500/8' : 'bg-yellow-200/30'}`} />
              <div className="relative p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-11 h-11 rounded-[14px] flex items-center justify-center bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg shadow-yellow-500/25`}>
                    <Crown size={20} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-[9px] uppercase font-bold tracking-widest ${dark ? 'text-yellow-400/50' : 'text-amber-500/70'}`}>
                      Управление клубом
                    </div>
                    <div className="font-black text-base truncate">{myClub.name}</div>
                  </div>
                </div>

                {clubStats && (
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { icon: Users, label: 'Тренеры', value: clubStats.trainers, gradient: 'from-blue-500 to-cyan-500' },
                      { icon: Award, label: 'Ученики', value: clubStats.students, gradient: 'from-accent to-rose-500' },
                      { icon: TrendingUp, label: 'Активных', value: clubStats.active, gradient: 'from-green-500 to-emerald-500' },
                      { icon: Dumbbell, label: 'Групп', value: clubStats.groups, gradient: 'from-purple-500 to-violet-500' },
                    ].map(({ icon: Icon, label, value, gradient }) => (
                      <div key={label} className={`rounded-[14px] p-2.5 text-center ${dark ? 'bg-black/25' : 'bg-white/60'}`}>
                        <div className={`w-7 h-7 rounded-lg mx-auto mb-1 flex items-center justify-center bg-gradient-to-br ${gradient}`}>
                          <Icon size={13} className="text-white" />
                        </div>
                        <div className="text-lg font-black leading-none number-pop">{value}</div>
                        <div className={`text-[7px] uppercase font-bold mt-0.5 ${dark ? 'text-white/20' : 'text-gray-400'}`}>{label}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Club Trainers List */}
            <div>
              <h3 className={`text-[11px] uppercase font-bold tracking-wider mb-2.5 px-1 ${dark ? 'text-white/30' : 'text-gray-400'}`}>
                Тренеры клуба ({clubTrainers.length})
              </h3>
              <div className="space-y-2">
                {clubTrainers.map(t => {
                  const tStudents = data.students.filter(s => s.trainerId === t.id)
                  const tActive = tStudents.filter(s => !isExpired(s.subscriptionExpiresAt)).length
                  const tGroups = data.groups.filter(g => g.trainerId === t.id)
                  const isMe = t.id === auth.userId
                  return (
                    <div key={t.id} className={`rounded-[20px] p-4 backdrop-blur-xl transition-all ${
                      dark
                        ? `bg-white/[0.04] border ${isMe ? 'border-yellow-500/25 bg-yellow-500/[0.03]' : 'border-white/[0.06]'}`
                        : `bg-white/70 border ${isMe ? 'border-yellow-300 bg-yellow-50/30' : 'border-white/60'} shadow-sm`
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className={`p-[2px] rounded-full ${t.isHeadTrainer ? 'bg-gradient-to-br from-yellow-400 to-amber-500' : ''}`}>
                            <Avatar name={t.name} src={t.avatar} size={44} />
                          </div>
                          {t.isHeadTrainer && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-md">
                              <Crown size={10} className="text-white" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm truncate">{t.name}</span>
                            {isMe && (
                              <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                                dark ? 'bg-white/10 text-white/40' : 'bg-gray-100 text-gray-400'
                              }`}>вы</span>
                            )}
                          </div>
                          <div className={`flex items-center gap-2.5 mt-0.5 text-[11px] ${dark ? 'text-white/30' : 'text-gray-400'}`}>
                            <span className="flex items-center gap-0.5">
                              <Users size={9} /> {tStudents.length}
                            </span>
                            <span className="flex items-center gap-0.5">
                              <Activity size={9} /> {tActive} акт.
                            </span>
                            <span className="flex items-center gap-0.5">
                              <Dumbbell size={9} /> {tGroups.length} гр.
                            </span>
                          </div>
                        </div>
                        {!t.isHeadTrainer && (
                          <button
                            onClick={() => setFireConfirm(t)}
                            className={`p-2.5 rounded-xl press-scale transition-all ${
                              dark ? 'hover:bg-red-500/15' : 'hover:bg-red-50'
                            }`}
                          >
                            <UserMinus size={15} className="text-red-400" />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* Student Info Cards — Enhanced */}
        {auth.role === 'student' && student && (
          <>
            <div className="grid grid-cols-2 gap-2.5">
              <div className={`rounded-[22px] p-4 backdrop-blur-xl relative overflow-hidden ${
                dark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-white/60 border border-white/50 shadow-[0_2px_12px_rgba(0,0,0,0.04)]'
              }`}>
                <div className={`absolute -top-6 -right-6 w-16 h-16 rounded-full blur-2xl ${dark ? 'bg-purple-500/10' : 'bg-purple-100/40'}`} />
                <div className="relative">
                  <div className={`text-[10px] uppercase font-bold tracking-wider mb-2 ${dark ? 'text-white/30' : 'text-gray-400'}`}>Группа</div>
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-500 to-violet-600`}>
                      <Users size={14} className="text-white" />
                    </div>
                    <span className="font-bold text-sm truncate">{group?.name || 'Без группы'}</span>
                  </div>
                </div>
              </div>
              <div className={`rounded-[22px] p-4 backdrop-blur-xl relative overflow-hidden ${
                dark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-white/60 border border-white/50 shadow-[0_2px_12px_rgba(0,0,0,0.04)]'
              }`}>
                <div className={`absolute -top-6 -right-6 w-16 h-16 rounded-full blur-2xl ${
                  expired ? dark ? 'bg-red-500/10' : 'bg-red-100/40' : dark ? 'bg-green-500/10' : 'bg-green-100/40'
                }`} />
                <div className="relative">
                  <div className={`text-[10px] uppercase font-bold tracking-wider mb-2 ${dark ? 'text-white/30' : 'text-gray-400'}`}>Абонемент</div>
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br ${
                      expired ? 'from-red-500 to-rose-600' : 'from-green-500 to-emerald-600'
                    }`}>
                      <CreditCard size={14} className="text-white" />
                    </div>
                    <span className={`font-bold text-sm ${expired ? 'text-red-400' : ''}`}>
                      {expired ? 'Истёк' : formatDate(student.subscriptionExpiresAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className={`rounded-[22px] overflow-hidden backdrop-blur-xl ${
              dark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-white/60 border border-white/50 shadow-[0_2px_12px_rgba(0,0,0,0.04)]'
            }`}>
              {[
                { icon: Award, label: rankLabel || 'Пояс', value: student.belt || '—', gradient: 'from-accent to-rose-500' },
                { icon: Scale, label: 'Вес', value: student.weight ? `${student.weight} кг` : '—', gradient: 'from-blue-500 to-cyan-500' },
                { icon: Calendar, label: 'Дата рождения', value: formatDate(student.birthDate), gradient: 'from-purple-500 to-violet-500' },
                { icon: Dumbbell, label: 'Тренируется с', value: formatDate(student.trainingStartDate || student.createdAt), gradient: 'from-green-500 to-emerald-500' },
              ].map(({ icon: Icon, label, value, gradient }, i) => (
                <div key={label} className={`flex items-center justify-between px-4 py-3.5 ${
                  i > 0 ? dark ? 'border-t border-white/[0.05]' : 'border-t border-black/[0.04]' : ''
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br ${gradient}`}>
                      <Icon size={14} className="text-white" />
                    </div>
                    <span className={`text-sm ${dark ? 'text-white/50' : 'text-gray-500'}`}>{label}</span>
                  </div>
                  <span className="font-semibold text-sm">{value}</span>
                </div>
              ))}
            </div>

            {trainer && (
              <div className={`rounded-[22px] p-4 flex items-center gap-3 backdrop-blur-xl relative overflow-hidden ${
                dark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-white/60 border border-white/50 shadow-[0_2px_12px_rgba(0,0,0,0.04)]'
              }`}>
                <div className={`absolute -top-8 -right-8 w-20 h-20 rounded-full blur-2xl ${dark ? 'bg-blue-500/8' : 'bg-blue-100/30'}`} />
                <div className="relative flex items-center gap-3 flex-1">
                  <div className="p-[2px] rounded-full bg-gradient-to-br from-purple-500 to-blue-500">
                    <Avatar name={trainer.name || 'T'} src={trainer.avatar} size={44} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={`text-[10px] uppercase font-bold tracking-wider ${dark ? 'text-white/30' : 'text-gray-400'}`}>Мой тренер</div>
                    <div className="font-bold text-sm truncate">{trainer.name}</div>
                  </div>
                  <Shield size={18} className={dark ? 'text-white/15' : 'text-gray-200'} />
                </div>
              </div>
            )}
          </>
        )}

        {user?.phone && (
          <div className={`rounded-[22px] p-4 flex items-center gap-3 backdrop-blur-xl ${
            dark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-white/60 border border-white/50 shadow-[0_2px_12px_rgba(0,0,0,0.04)]'
          }`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br from-accent to-rose-500`}>
              <Phone size={14} className="text-white" />
            </div>
            <span className={`text-sm ${dark ? 'text-white/50' : 'text-gray-500'}`}>Телефон</span>
            <span className="font-semibold text-sm ml-auto">{user.phone}</span>
          </div>
        )}

        {/* Action Buttons — Enhanced */}
        <div className="space-y-2 pt-1">
          <button
            onClick={() => navigate('/notifications')}
            className={`w-full py-3.5 rounded-[22px] font-bold text-sm press-scale flex items-center gap-3 px-5 backdrop-blur-xl transition-all ${
              dark
                ? 'bg-white/[0.04] border border-white/[0.06] text-white hover:bg-white/[0.07]'
                : 'bg-white/60 border border-white/50 text-gray-900 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]'
            }`}
          >
            <div className={`w-9 h-9 rounded-[12px] flex items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-500`}>
              <Bell size={16} className="text-white" />
            </div>
            <span className="flex-1 text-left">Уведомления</span>
            <ChevronRight size={16} className={dark ? 'text-white/15' : 'text-gray-300'} />
          </button>
          <button
            onClick={logout}
            className={`w-full py-3.5 rounded-[22px] font-bold text-sm press-scale flex items-center gap-3 px-5 backdrop-blur-xl transition-all ${
              dark
                ? 'bg-red-500/[0.06] border border-red-500/15 text-red-400 hover:bg-red-500/[0.12]'
                : 'bg-red-50/70 border border-red-100 text-red-500 shadow-sm hover:bg-red-50'
            }`}
          >
            <div className={`w-9 h-9 rounded-[12px] flex items-center justify-center bg-gradient-to-br from-red-500 to-rose-600`}>
              <LogOut size={16} className="text-white" />
            </div>
            <span className="flex-1 text-left">Выйти из аккаунта</span>
          </button>
        </div>

        <div className="h-4" />
      </div>

      {/* Fire Trainer Confirmation Modal */}
      <Modal open={!!fireConfirm} onClose={() => setFireConfirm(null)} title="Уволить тренера">
        {fireConfirm && (
          <div className="space-y-4">
            <div className={`rounded-[20px] p-5 text-center ${
              dark ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-100'
            }`}>
              <div className="flex justify-center mb-3">
                <div className="p-[2px] rounded-full bg-gradient-to-br from-red-500 to-rose-600">
                  <Avatar name={fireConfirm.name} src={fireConfirm.avatar} size={56} />
                </div>
              </div>
              <div className="font-bold text-base">{fireConfirm.name}</div>
              <p className={`text-sm mt-2 ${dark ? 'text-white/50' : 'text-gray-500'}`}>
                Тренер станет свободным и сохранит свои группы и учеников
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setFireConfirm(null)}
                className={`py-3.5 rounded-[16px] font-bold text-sm press-scale ${
                  dark ? 'bg-white/[0.07] text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Отмена
              </button>
              <button
                onClick={() => handleFireTrainer(fireConfirm.id)}
                className="py-3.5 rounded-[16px] bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold text-sm press-scale shadow-lg shadow-red-500/25"
              >
                Уволить
              </button>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  )
}
