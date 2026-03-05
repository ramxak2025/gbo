import { useState, useMemo } from 'react'
import { Camera, LogOut, Bell, MapPin, Shield, Award, Users, ChevronRight, Dumbbell, Calendar, Phone, CreditCard, Scale, Crown, Plus, UserMinus, TrendingUp } from 'lucide-react'
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
  const { data, updateStudent, updateTrainer, assignTrainerToClub, removeTrainerFromClub } = useData()
  const { dark } = useTheme()
  const navigate = useNavigate()
  const [showAddTrainer, setShowAddTrainer] = useState(false)

  const user = auth.user
  const student = auth.role === 'student' ? data.students.find(s => s.id === auth.studentId) : null
  const trainer = auth.role === 'student' ? data.users.find(u => u.id === auth.userId) : null
  const displayName = auth.role === 'student' ? student?.name : user?.name
  const avatarSrc = auth.role === 'student' ? student?.avatar : user?.avatar

  const myGroups = auth.role === 'trainer' ? data.groups.filter(g => g.trainerId === auth.userId) : []
  const myStudents = auth.role === 'trainer' ? data.students.filter(s => s.trainerId === auth.userId) : []

  // Head trainer admin data
  const isHeadTrainer = auth.role === 'trainer' && user?.isHeadTrainer && user?.clubId
  const myClub = isHeadTrainer ? (data.clubs || []).find(c => c.id === user.clubId) : null
  const clubTrainers = isHeadTrainer ? data.users.filter(u => u.role === 'trainer' && u.clubId === user.clubId) : []
  const availableTrainers = isHeadTrainer ? data.users.filter(u => u.role === 'trainer' && !u.clubId) : []

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

  const handleAddTrainerToClub = (trainerId) => {
    assignTrainerToClub(user.clubId, trainerId)
    setShowAddTrainer(false)
  }

  const handleRemoveTrainerFromClub = (trainerId) => {
    if (confirm('Убрать тренера из клуба?')) {
      removeTrainerFromClub(user.clubId, trainerId)
    }
  }

  return (
    <Layout>
      <PageHeader title="Профиль" />
      <div className="px-4 space-y-4 slide-in">

        {/* Hero Card */}
        <div className={`rounded-[28px] p-6 relative overflow-hidden ${
          dark
            ? 'bg-gradient-to-br from-purple-500/15 via-white/[0.04] to-accent/15 border border-white/[0.08]'
            : 'bg-gradient-to-br from-purple-50 via-white/80 to-red-50 border border-white/70 shadow-[0_8px_32px_rgba(0,0,0,0.06)]'
        }`}>
          <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full ${dark ? 'bg-purple-500/5' : 'bg-purple-100/40'}`} />
          <div className={`absolute -bottom-8 -left-8 w-24 h-24 rounded-full ${dark ? 'bg-accent/5' : 'bg-red-100/30'}`} />

          <div className="relative flex flex-col items-center text-center">
            <div className="relative">
              <div className={`p-1 rounded-full ${dark ? 'bg-gradient-to-br from-purple-500/30 to-accent/30' : 'bg-gradient-to-br from-purple-200 to-red-200'}`}>
                <div className={`rounded-full p-0.5 ${dark ? 'bg-[#1a1a2e]' : 'bg-white'}`}>
                  <Avatar name={displayName} src={avatarSrc} size={88} />
                </div>
              </div>
              <label className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-accent flex items-center justify-center cursor-pointer press-scale shadow-lg shadow-accent/30">
                <Camera size={14} className="text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </label>
            </div>

            <h2 className="text-xl font-black mt-4">{displayName}</h2>

            <div className="flex items-center gap-2 mt-2 flex-wrap justify-center">
              <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${
                auth.role === 'superadmin'
                  ? dark ? 'bg-purple-500/20 text-purple-300 border border-purple-500/20' : 'bg-purple-100 text-purple-600'
                  : auth.role === 'trainer'
                    ? dark ? 'bg-blue-500/20 text-blue-300 border border-blue-500/20' : 'bg-blue-100 text-blue-600'
                    : dark ? 'bg-green-500/20 text-green-300 border border-green-500/20' : 'bg-green-100 text-green-600'
              }`}>
                {auth.role === 'superadmin' ? 'Админ' : auth.role === 'trainer' ? 'Тренер' : 'Спортсмен'}
              </span>
              {isHeadTrainer && (
                <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide flex items-center gap-1 ${
                  dark ? 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/20' : 'bg-yellow-50 text-yellow-600 border border-yellow-200'
                }`}>
                  <Crown size={11} /> Главный тренер
                </span>
              )}
              {sportLabel && (
                <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase ${
                  dark ? 'bg-accent/15 text-accent-light border border-accent/20' : 'bg-red-50 text-red-600'
                }`}>{sportLabel}</span>
              )}
            </div>

            {(auth.role === 'trainer' || auth.role === 'student') && (
              <div className={`flex items-center gap-3 mt-3 ${dark ? 'text-white/40' : 'text-gray-500'}`}>
                {(auth.role === 'trainer' ? user?.clubName : trainer?.clubName) && (
                  <span className="text-xs font-medium flex items-center gap-1">
                    <Shield size={11} />
                    {auth.role === 'trainer' ? user?.clubName : trainer?.clubName}
                  </span>
                )}
                {(auth.role === 'trainer' ? user?.city : trainer?.city) && (
                  <span className="text-xs font-medium flex items-center gap-1">
                    <MapPin size={11} />
                    {auth.role === 'trainer' ? user?.city : trainer?.city}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ========= HEAD TRAINER ADMIN PANEL ========= */}
        {isHeadTrainer && myClub && (
          <>
            <div className={`rounded-[24px] p-5 relative overflow-hidden ${
              dark
                ? 'bg-gradient-to-br from-yellow-500/10 via-white/[0.03] to-amber-500/10 border border-yellow-500/20'
                : 'bg-gradient-to-br from-yellow-50 via-amber-50/50 to-orange-50 border border-yellow-200/60 shadow-[0_6px_24px_rgba(234,179,8,0.08)]'
            }`}>
              <div className={`absolute -top-10 -right-10 w-28 h-28 rounded-full ${dark ? 'bg-yellow-500/5' : 'bg-yellow-100/40'}`} />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center ${
                    dark ? 'bg-gradient-to-br from-yellow-500/20 to-amber-500/20' : 'bg-gradient-to-br from-yellow-100 to-amber-100'
                  }`}>
                    <Crown size={22} className={dark ? 'text-yellow-400' : 'text-yellow-600'} />
                  </div>
                  <div>
                    <div className={`text-[10px] uppercase font-bold tracking-wider ${dark ? 'text-yellow-400/60' : 'text-yellow-600/70'}`}>
                      Управление клубом
                    </div>
                    <div className="font-black text-base">{myClub.name}</div>
                  </div>
                </div>

                {clubStats && (
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { icon: Users, label: 'Тренеры', value: clubStats.trainers, color: 'text-blue-500' },
                      { icon: Award, label: 'Ученики', value: clubStats.students, color: 'text-accent' },
                      { icon: TrendingUp, label: 'Активных', value: clubStats.active, color: 'text-green-500' },
                      { icon: Dumbbell, label: 'Групп', value: clubStats.groups, color: 'text-purple-500' },
                    ].map(({ icon: Icon, label, value, color }) => (
                      <div key={label} className={`rounded-[12px] p-2 text-center ${dark ? 'bg-black/20' : 'bg-white/60'}`}>
                        <Icon size={13} className={`mx-auto mb-0.5 ${color}`} />
                        <div className="text-base font-black">{value}</div>
                        <div className={`text-[8px] uppercase font-semibold ${dark ? 'text-white/25' : 'text-gray-400'}`}>{label}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className={`text-xs uppercase font-bold ${dark ? 'text-white/40' : 'text-gray-500'}`}>
                  Тренеры клуба ({clubTrainers.length})
                </h3>
                <button onClick={() => setShowAddTrainer(true)} className="press-scale p-1">
                  <Plus size={18} className="text-accent" />
                </button>
              </div>
              <div className="space-y-2">
                {clubTrainers.map(t => {
                  const tStudents = data.students.filter(s => s.trainerId === t.id)
                  const tActive = tStudents.filter(s => !isExpired(s.subscriptionExpiresAt)).length
                  const isMe = t.id === auth.userId
                  return (
                    <GlassCard key={t.id} className={isMe ? 'border border-yellow-500/20' : ''}>
                      <div className="flex items-center gap-3">
                        <Avatar name={t.name} src={t.avatar} size={40} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm truncate">{t.name}</span>
                            {t.isHeadTrainer && <Crown size={11} className="text-yellow-400 shrink-0" />}
                            {isMe && <span className={`text-[9px] font-bold uppercase ${dark ? 'text-white/20' : 'text-gray-300'}`}>вы</span>}
                          </div>
                          <div className={`text-xs ${dark ? 'text-white/30' : 'text-gray-500'}`}>
                            {tStudents.length} уч. · {tActive} акт.
                          </div>
                        </div>
                        {!t.isHeadTrainer && (
                          <button onClick={() => handleRemoveTrainerFromClub(t.id)} className="press-scale p-1.5">
                            <UserMinus size={14} className="text-red-400" />
                          </button>
                        )}
                      </div>
                    </GlassCard>
                  )
                })}
              </div>
            </div>

            <button
              onClick={() => navigate(`/club/${user.clubId}`)}
              className={`w-full py-3.5 rounded-[20px] font-bold text-sm press-scale flex items-center gap-3 px-5 backdrop-blur-xl transition-all ${
                dark
                  ? 'bg-yellow-500/[0.08] border border-yellow-500/15 text-yellow-300 hover:bg-yellow-500/15'
                  : 'bg-yellow-50/80 border border-yellow-200 text-yellow-700 shadow-sm hover:bg-yellow-50'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${dark ? 'bg-yellow-500/15' : 'bg-yellow-100'}`}>
                <Shield size={17} className={dark ? 'text-yellow-400' : 'text-yellow-600'} />
              </div>
              <span className="flex-1 text-left">Управление клубом</span>
              <ChevronRight size={16} className={dark ? 'text-yellow-400/30' : 'text-yellow-400'} />
            </button>
          </>
        )}

        {/* Trainer Stats */}
        {auth.role === 'trainer' && trainerStats && (
          <div className="grid grid-cols-3 gap-2">
            <div className={`rounded-[20px] p-3 text-center backdrop-blur-xl ${
              dark ? 'bg-white/[0.05] border border-white/[0.07]' : 'bg-white/70 border border-white/60 shadow-sm'
            }`}>
              <Users size={18} className="mx-auto mb-1 text-accent" />
              <div className="text-xl font-black">{trainerStats.total}</div>
              <div className={`text-[10px] uppercase font-semibold ${dark ? 'text-white/30' : 'text-gray-400'}`}>Всего</div>
            </div>
            <div className={`rounded-[20px] p-3 text-center backdrop-blur-xl ${
              dark ? 'bg-white/[0.05] border border-white/[0.07]' : 'bg-white/70 border border-white/60 shadow-sm'
            }`}>
              <Award size={18} className="mx-auto mb-1 text-green-500" />
              <div className="text-xl font-black">{trainerStats.active}</div>
              <div className={`text-[10px] uppercase font-semibold ${dark ? 'text-white/30' : 'text-gray-400'}`}>Активных</div>
            </div>
            <div className={`rounded-[20px] p-3 text-center backdrop-blur-xl ${
              dark ? 'bg-white/[0.05] border border-white/[0.07]' : 'bg-white/70 border border-white/60 shadow-sm'
            }`}>
              <Dumbbell size={18} className="mx-auto mb-1 text-purple-500" />
              <div className="text-xl font-black">{trainerStats.groups}</div>
              <div className={`text-[10px] uppercase font-semibold ${dark ? 'text-white/30' : 'text-gray-400'}`}>Групп</div>
            </div>
          </div>
        )}

        {/* Student Info Cards */}
        {auth.role === 'student' && student && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className={`rounded-[20px] p-4 backdrop-blur-xl ${
                dark ? 'bg-white/[0.05] border border-white/[0.07]' : 'bg-white/70 border border-white/60 shadow-sm'
              }`}>
                <div className={`text-[10px] uppercase font-semibold mb-1.5 ${dark ? 'text-white/30' : 'text-gray-400'}`}>Группа</div>
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-purple-500" />
                  <span className="font-bold text-sm truncate">{group?.name || 'Без группы'}</span>
                </div>
              </div>
              <div className={`rounded-[20px] p-4 backdrop-blur-xl ${
                dark ? 'bg-white/[0.05] border border-white/[0.07]' : 'bg-white/70 border border-white/60 shadow-sm'
              }`}>
                <div className={`text-[10px] uppercase font-semibold mb-1.5 ${dark ? 'text-white/30' : 'text-gray-400'}`}>Абонемент</div>
                <div className="flex items-center gap-2">
                  <CreditCard size={16} className={expired ? 'text-red-400' : 'text-green-400'} />
                  <span className={`font-bold text-sm ${expired ? 'text-red-400' : ''}`}>
                    {expired ? 'Истёк' : formatDate(student.subscriptionExpiresAt)}
                  </span>
                </div>
              </div>
            </div>

            <div className={`rounded-[20px] overflow-hidden backdrop-blur-xl ${
              dark ? 'bg-white/[0.05] border border-white/[0.07]' : 'bg-white/70 border border-white/60 shadow-sm'
            }`}>
              {[
                { icon: Award, label: rankLabel || 'Пояс', value: student.belt || '—', color: 'text-accent' },
                { icon: Scale, label: 'Вес', value: student.weight ? `${student.weight} кг` : '—', color: 'text-blue-500' },
                { icon: Calendar, label: 'Дата рождения', value: formatDate(student.birthDate), color: 'text-purple-500' },
                { icon: Dumbbell, label: 'Тренируется с', value: formatDate(student.trainingStartDate || student.createdAt), color: 'text-green-500' },
              ].map(({ icon: Icon, label, value, color }, i) => (
                <div key={label} className={`flex items-center justify-between px-4 py-3.5 ${
                  i > 0 ? dark ? 'border-t border-white/[0.05]' : 'border-t border-black/[0.04]' : ''
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      dark ? 'bg-white/[0.06]' : 'bg-black/[0.03]'
                    }`}>
                      <Icon size={15} className={color} />
                    </div>
                    <span className={`text-sm ${dark ? 'text-white/50' : 'text-gray-500'}`}>{label}</span>
                  </div>
                  <span className="font-semibold text-sm">{value}</span>
                </div>
              ))}
            </div>

            {trainer && (
              <div className={`rounded-[20px] p-4 flex items-center gap-3 backdrop-blur-xl ${
                dark ? 'bg-white/[0.05] border border-white/[0.07]' : 'bg-white/70 border border-white/60 shadow-sm'
              }`}>
                <Avatar name={trainer.name || 'T'} src={trainer.avatar} size={44} />
                <div className="min-w-0 flex-1">
                  <div className={`text-[10px] uppercase font-semibold ${dark ? 'text-white/30' : 'text-gray-400'}`}>Мой тренер</div>
                  <div className="font-bold text-sm truncate">{trainer.name}</div>
                </div>
                <Shield size={18} className={dark ? 'text-white/15' : 'text-gray-200'} />
              </div>
            )}
          </>
        )}

        {user?.phone && (
          <div className={`rounded-[20px] p-4 flex items-center gap-3 backdrop-blur-xl ${
            dark ? 'bg-white/[0.05] border border-white/[0.07]' : 'bg-white/70 border border-white/60 shadow-sm'
          }`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${dark ? 'bg-white/[0.06]' : 'bg-black/[0.03]'}`}>
              <Phone size={15} className="text-accent" />
            </div>
            <span className={`text-sm ${dark ? 'text-white/50' : 'text-gray-500'}`}>Телефон</span>
            <span className="font-semibold text-sm ml-auto">{user.phone}</span>
          </div>
        )}

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

      {/* Add trainer to club modal (head trainer) */}
      <Modal open={showAddTrainer} onClose={() => setShowAddTrainer(false)} title="Добавить тренера в клуб">
        <div className="space-y-2">
          {availableTrainers.length === 0 ? (
            <p className={`text-center py-6 text-sm ${dark ? 'text-white/30' : 'text-gray-500'}`}>
              Нет свободных тренеров
            </p>
          ) : (
            availableTrainers.map(t => (
              <button key={t.id} onClick={() => handleAddTrainerToClub(t.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-[16px] press-scale transition-all text-left ${
                  dark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-white/60 border border-white/50'
                }`}
              >
                <Avatar name={t.name} src={t.avatar} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm truncate">{t.name}</div>
                  <div className={`text-xs ${dark ? 'text-white/30' : 'text-gray-500'}`}>
                    {t.sportTypes?.map(st => getSportLabel(st)).join(', ') || getSportLabel(t.sportType)}
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
