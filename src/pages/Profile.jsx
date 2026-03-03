import { Camera, LogOut, Bell, MapPin, Shield, Award, Users, ChevronRight, Dumbbell, Calendar, Phone, CreditCard, Scale } from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import { api } from '../utils/api'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import Avatar from '../components/Avatar'
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
  const { data, updateStudent, updateTrainer } = useData()
  const { dark } = useTheme()
  const navigate = useNavigate()

  const user = auth.user
  const student = auth.role === 'student' ? data.students.find(s => s.id === auth.studentId) : null
  const trainer = auth.role === 'student' ? data.users.find(u => u.id === auth.userId) : null
  const displayName = auth.role === 'student' ? student?.name : user?.name
  const avatarSrc = auth.role === 'student' ? student?.avatar : user?.avatar

  const myGroups = auth.role === 'trainer' ? data.groups.filter(g => g.trainerId === auth.userId) : []
  const myStudents = auth.role === 'trainer' ? data.students.filter(s => s.trainerId === auth.userId) : []

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
          {/* Decorative circles */}
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
              {sportLabel && (
                <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase ${
                  dark ? 'bg-accent/15 text-accent-light border border-accent/20' : 'bg-red-50 text-red-600'
                }`}>{sportLabel}</span>
              )}
            </div>

            {/* Club & City info */}
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
            {/* Group & Subscription row */}
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

            {/* Details */}
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

            {/* Trainer info */}
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

        {/* Shared Info */}
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

        {/* Actions */}
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
