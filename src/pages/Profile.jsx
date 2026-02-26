import { Camera, LogOut, Newspaper, Bell } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import { api } from '../utils/api'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import GlassCard from '../components/GlassCard'
import Avatar from '../components/Avatar'

export default function Profile() {
  const { auth, logout } = useAuth()
  const { data, updateStudent, updateTrainer, deleteNews } = useData()
  const { dark } = useTheme()
  const navigate = useNavigate()

  const user = auth.user
  const student = auth.student ? data.students.find(s => s.id === auth.studentId) : null
  const displayName = auth.role === 'student' ? student?.name : user?.name
  const displaySub = auth.role === 'student'
    ? user?.clubName
    : auth.role === 'superadmin'
      ? 'Владелец платформы'
      : user?.clubName

  const myGroups = auth.role === 'trainer' ? data.groups.filter(g => g.trainerId === auth.userId) : []
  const myNews = auth.role === 'trainer' ? data.news.filter(n => n.trainerId === auth.userId) : []

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

  const handleLogout = () => {
    logout()
  }

  const avatarSrc = auth.role === 'student' ? student?.avatar : user?.avatar

  return (
    <Layout>
      <PageHeader title="Профиль" />
      <div className="px-4 space-y-4 slide-in">
        {/* Avatar & Info */}
        <div className="flex flex-col items-center text-center pt-2">
          <div className="relative">
            <Avatar name={displayName} src={avatarSrc} size={80} />
            <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-accent flex items-center justify-center cursor-pointer press-scale">
              <Camera size={14} className="text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </label>
          </div>
          <h2 className="text-xl font-bold mt-3">{displayName}</h2>
          <p className={`text-sm ${dark ? 'text-white/40' : 'text-gray-400'}`}>{displaySub}</p>
          <span className={`mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase ${
            auth.role === 'superadmin'
              ? 'bg-purple-500/20 text-purple-400'
              : auth.role === 'trainer'
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-green-500/20 text-green-400'
          }`}>
            {auth.role === 'superadmin' ? 'Админ' : auth.role === 'trainer' ? 'Тренер' : 'Ученик'}
          </span>
        </div>

        {/* Info */}
        {user?.phone && (
          <GlassCard className="flex items-center justify-between">
            <span className={`text-sm ${dark ? 'text-white/40' : 'text-gray-400'}`}>Телефон</span>
            <span className="font-semibold text-sm">{user.phone}</span>
          </GlassCard>
        )}
        {/* Trainer: News list */}
        {auth.role === 'trainer' && myNews.length > 0 && (
          <div>
            <h2 className={`text-sm uppercase font-bold mb-3 ${dark ? 'text-white/50' : 'text-gray-500'}`}>Мои новости</h2>
            <div className="space-y-2">
              {myNews.slice().reverse().map(n => {
                const g = myGroups.find(g => g.id === n.groupId)
                return (
                  <GlassCard key={n.id} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-sm">{n.title}</div>
                      <div className={`text-xs ${dark ? 'text-white/30' : 'text-gray-400'}`}>
                        {n.groupId ? (g?.name || '—') : 'Все группы'} — {n.content?.slice(0, 60)}{n.content?.length > 60 ? '...' : ''}
                      </div>
                    </div>
                    <button onClick={() => deleteNews(n.id)} className="press-scale p-1 shrink-0">
                      <Newspaper size={14} className="text-red-400" />
                    </button>
                  </GlassCard>
                )
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2 pt-2">
          <button
            onClick={() => navigate('/notifications')}
            className={`w-full py-3.5 rounded-[16px] font-bold text-base press-scale flex items-center justify-center gap-2 ${
              dark ? 'bg-white/5 text-white' : 'bg-black/[0.03] text-gray-900'
            }`}
          >
            <Bell size={18} />
            Уведомления
          </button>
          <button
            onClick={handleLogout}
            className={`w-full py-3.5 rounded-[16px] font-bold text-base press-scale flex items-center justify-center gap-2 ${
              dark ? 'bg-white/5 text-white' : 'bg-black/[0.03] text-gray-900'
            }`}
          >
            <LogOut size={18} />
            Выйти
          </button>
        </div>
      </div>

    </Layout>
  )
}
