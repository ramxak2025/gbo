import { useState } from 'react'
import { Users, Plus, Award, MapPin, Dumbbell, Send, Trophy } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import GlassCard from '../components/GlassCard'
import Avatar from '../components/Avatar'
import Modal from '../components/Modal'
import PhoneInput, { cleanPhone } from '../components/PhoneInput'
import { getSportLabel, SPORT_TYPES } from '../utils/sports'

function isExpired(dateStr) {
  if (!dateStr) return true
  return new Date(dateStr) < new Date()
}

export default function ClubTrainers() {
  const { auth } = useAuth()
  const { data } = useData()
  const { dark } = useTheme()
  const [showRequest, setShowRequest] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', city: '', sportTypes: [] })

  const user = data.users.find(u => u.id === auth.userId) || auth.user
  const club = user?.clubId ? (data.clubs || []).find(c => c.id === user.clubId) : null
  const trainers = club ? data.users.filter(u => u.role === 'trainer' && u.clubId === club.id) : []

  const handleSubmit = (e) => {
    e.preventDefault()
    // In a real app this would send a pending registration
    alert('Заявка на добавление тренера отправлена суперадмину на проверку')
    setForm({ name: '', phone: '', city: '', sportTypes: [] })
    setShowRequest(false)
  }

  const inputCls = `w-full px-4 py-3 rounded-[16px] text-base outline-none ${dark
    ? 'bg-white/[0.07] border border-white/[0.08] text-white placeholder-white/25 focus:border-purple-500/50'
    : 'bg-white/70 border border-white/60 text-gray-900 placeholder-gray-400 focus:border-purple-500 shadow-sm'
  }`

  return (
    <Layout>
      <PageHeader title="Тренеры">
        <button onClick={() => setShowRequest(true)} className="press-scale p-2">
          <Plus size={20} />
        </button>
      </PageHeader>

      <div className="px-4 space-y-3 slide-in">
        {trainers.length === 0 && (
          <div className="text-center py-8">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-3xl flex items-center justify-center ${dark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
              <Users size={28} className={dark ? 'text-blue-400/40' : 'text-blue-400'} />
            </div>
            <p className={`text-sm font-semibold mb-1 ${dark ? 'text-white/60' : 'text-gray-700'}`}>Нет тренеров</p>
            <p className={`text-xs ${dark ? 'text-white/25' : 'text-gray-400'}`}>Отправьте заявку на добавление тренера</p>
          </div>
        )}

        {trainers.map(t => {
          const tStudents = data.students.filter(s => s.trainerId === t.id)
          const tActive = tStudents.filter(s => !isExpired(s.subscriptionExpiresAt)).length
          const tGroups = data.groups.filter(g => g.trainerId === t.id)
          return (
            <GlassCard key={t.id}>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar name={t.name} src={t.avatar} size={48} />
                  {t.rank && (
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${dark ? 'bg-yellow-500/30' : 'bg-yellow-100'}`}>
                      <Award size={10} className="text-yellow-500" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm truncate">{t.name}</div>
                  {t.rank && (
                    <div className={`text-[11px] font-semibold ${dark ? 'text-yellow-400/80' : 'text-yellow-600'}`}>{t.rank}</div>
                  )}
                  <div className={`text-xs ${dark ? 'text-white/40' : 'text-gray-500'}`}>
                    {t.sportTypes?.map(st => getSportLabel(st)).join(', ') || getSportLabel(t.sportType)}
                  </div>
                  <div className={`text-[11px] mt-0.5 ${dark ? 'text-white/30' : 'text-gray-400'}`}>
                    {tStudents.length} учеников ({tActive} акт.) • {tGroups.length} групп
                  </div>
                </div>
              </div>
              {t.achievements && (
                <div className={`mt-2 pt-2 flex items-start gap-2 ${dark ? 'border-t border-white/[0.06]' : 'border-t border-black/[0.05]'}`}>
                  <Trophy size={11} className={`shrink-0 mt-0.5 ${dark ? 'text-yellow-400/50' : 'text-yellow-500'}`} />
                  <p className={`text-[11px] ${dark ? 'text-white/35' : 'text-gray-500'}`}>{t.achievements}</p>
                </div>
              )}
            </GlassCard>
          )
        })}
      </div>

      <Modal open={showRequest} onClose={() => setShowRequest(false)} title="Заявка на тренера">
        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="text" placeholder="ФИО тренера *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} required />
          <PhoneInput value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} className={inputCls} required />
          <input type="text" placeholder="Город" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className={inputCls} />
          <div>
            <div className={`text-xs uppercase font-semibold mb-2 ${dark ? 'text-white/40' : 'text-gray-500'}`}>Виды спорта</div>
            <div className="flex flex-wrap gap-2">
              {SPORT_TYPES.map(s => {
                const selected = form.sportTypes.includes(s.id)
                return (
                  <button key={s.id} type="button"
                    onClick={() => setForm(f => ({ ...f, sportTypes: selected ? f.sportTypes.filter(x => x !== s.id) : [...f.sportTypes, s.id] }))}
                    className={`px-3 py-2 rounded-2xl text-xs font-bold press-scale ${
                      selected ? 'bg-accent text-white' : dark ? 'bg-white/[0.06] text-white/50 border border-white/[0.06]' : 'bg-white/70 text-gray-500 border border-white/60'
                    }`}
                  >{s.label}</button>
                )
              })}
            </div>
          </div>
          <button type="submit" className="w-full py-3.5 rounded-[16px] bg-accent text-white font-bold press-scale flex items-center justify-center gap-2">
            <Send size={16} /> Отправить на проверку
          </button>
        </form>
      </Modal>
    </Layout>
  )
}
