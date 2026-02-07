import { Camera, LogOut, RotateCcw, Newspaper, Plus } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import GlassCard from '../components/GlassCard'
import Avatar from '../components/Avatar'
import Modal from '../components/Modal'

export default function Profile() {
  const { auth, logout } = useAuth()
  const { data, resetAll, updateStudent, addNews, deleteNews, update } = useData()
  const { dark } = useTheme()
  const [showNews, setShowNews] = useState(false)
  const [newsForm, setNewsForm] = useState({ title: '', content: '', groupId: '' })

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

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      if (auth.role === 'student' && student) {
        updateStudent(student.id, { avatar: ev.target.result })
      } else {
        update(d => ({
          ...d,
          users: d.users.map(u => u.id === auth.userId ? { ...u, avatar: ev.target.result } : u)
        }))
      }
    }
    reader.readAsDataURL(file)
  }

  const handleAddNews = (e) => {
    e.preventDefault()
    if (!newsForm.title.trim() || !newsForm.groupId) return
    addNews({
      trainerId: auth.userId,
      groupId: newsForm.groupId,
      title: newsForm.title.trim(),
      content: newsForm.content.trim(),
    })
    setNewsForm({ title: '', content: '', groupId: myGroups[0]?.id || '' })
    setShowNews(false)
  }

  const handleReset = () => {
    if (confirm('Сбросить все данные? Это очистит всё приложение.')) {
      resetAll()
      logout()
    }
  }

  const handleLogout = () => {
    logout()
  }

  const inputCls = `
    w-full px-4 py-3 rounded-[16px] text-base outline-none
    ${dark
      ? 'bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-accent'
      : 'bg-black/[0.03] border border-black/[0.08] text-gray-900 placeholder-gray-400 focus:border-accent'
    }
  `

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
        {user?.email && auth.role !== 'student' && (
          <GlassCard className="flex items-center justify-between">
            <span className={`text-sm ${dark ? 'text-white/40' : 'text-gray-400'}`}>Email</span>
            <span className="font-semibold text-sm">{user.email}</span>
          </GlassCard>
        )}

        {/* Trainer: News management */}
        {auth.role === 'trainer' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className={`text-sm uppercase font-bold ${dark ? 'text-white/50' : 'text-gray-500'}`}>Мои новости</h2>
              <button
                onClick={() => { setNewsForm({ title: '', content: '', groupId: myGroups[0]?.id || '' }); setShowNews(true) }}
                className="text-accent text-xs font-semibold flex items-center gap-1 press-scale"
              >
                <Plus size={14} /> Добавить
              </button>
            </div>
            <div className="space-y-2">
              {myNews.slice().reverse().map(n => {
                const g = myGroups.find(g => g.id === n.groupId)
                return (
                  <GlassCard key={n.id} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-sm">{n.title}</div>
                      <div className={`text-xs ${dark ? 'text-white/30' : 'text-gray-400'}`}>
                        {g?.name || '—'} — {n.content?.slice(0, 60)}{n.content?.length > 60 ? '...' : ''}
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
            onClick={handleLogout}
            className={`w-full py-3.5 rounded-[16px] font-bold text-base press-scale flex items-center justify-center gap-2 ${
              dark ? 'bg-white/5 text-white' : 'bg-black/[0.03] text-gray-900'
            }`}
          >
            <LogOut size={18} />
            Выйти
          </button>
          <button
            onClick={handleReset}
            className="w-full py-3.5 rounded-[16px] font-bold text-base press-scale flex items-center justify-center gap-2 bg-red-500/10 text-red-400"
          >
            <RotateCcw size={18} />
            Сброс данных
          </button>
        </div>
      </div>

      {/* News Modal */}
      <Modal open={showNews} onClose={() => setShowNews(false)} title="Новая новость">
        <form onSubmit={handleAddNews} className="space-y-3">
          <select
            value={newsForm.groupId}
            onChange={e => setNewsForm(f => ({ ...f, groupId: e.target.value }))}
            className={inputCls}
          >
            <option value="">— Выбрать группу —</option>
            {myGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <input
            type="text"
            placeholder="Заголовок"
            value={newsForm.title}
            onChange={e => setNewsForm(f => ({ ...f, title: e.target.value }))}
            className={inputCls}
          />
          <textarea
            placeholder="Текст новости"
            value={newsForm.content}
            onChange={e => setNewsForm(f => ({ ...f, content: e.target.value }))}
            className={`${inputCls} min-h-[100px] resize-none`}
            rows={3}
          />
          <button type="submit" className="w-full py-3.5 rounded-[16px] bg-accent text-white font-bold press-scale">
            Опубликовать
          </button>
        </form>
      </Modal>
    </Layout>
  )
}
