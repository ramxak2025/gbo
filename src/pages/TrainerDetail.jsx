import { useParams, useNavigate } from 'react-router-dom'
import { Phone, Users, Trash2, Edit3, Dumbbell, MapPin, Key } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import PhoneInput, { formatPhone, cleanPhone } from '../components/PhoneInput'
import { SPORT_TYPES, getSportLabel, getRankLabel } from '../utils/sports'
import { useTheme } from '../context/ThemeContext'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import GlassCard from '../components/GlassCard'
import Avatar from '../components/Avatar'
import Modal from '../components/Modal'

export default function TrainerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { auth } = useAuth()
  const { data, updateTrainer, deleteTrainer, updateStudent } = useData()
  const { dark } = useTheme()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(null)

  const trainer = data.users.find(u => u.id === id)
  if (!trainer) {
    return (
      <Layout>
        <PageHeader title="Тренер" back />
        <div className="px-4 py-12 text-center">
          <p className={dark ? 'text-white/40' : 'text-gray-500'}>Тренер не найден</p>
        </div>
      </Layout>
    )
  }

  const students = data.students.filter(s => s.trainerId === id)
  const groups = data.groups.filter(g => g.trainerId === id)

  const startEdit = () => {
    setForm({ ...trainer, phone: formatPhone(trainer.phone || '') })
    setEditing(true)
  }

  const saveEdit = (e) => {
    e.preventDefault()
    const changes = {
      name: form.name,
      phone: cleanPhone(form.phone),
      clubName: form.clubName,
      city: form.city,
      sportType: form.sportType,
    }
    if (form.newPassword) changes.password = form.newPassword
    updateTrainer(id, changes)
    setEditing(false)
  }

  const handleDelete = () => {
    if (confirm(`Удалить тренера ${trainer.name} и все данные его клуба?`)) {
      deleteTrainer(id)
      navigate(-1)
    }
  }

  const inputCls = `
    w-full px-4 py-3 rounded-[16px] text-base outline-none
    ${dark
      ? 'bg-white/[0.07] border border-white/[0.08] text-white placeholder-white/25 focus:border-purple-500/50 focus:bg-white/[0.1]'
      : 'bg-white/70 border border-white/60 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] shadow-sm'
    }
  `

  return (
    <Layout>
      <PageHeader title="Тренер" back>
        {auth.role === 'superadmin' && (
          <>
            <button onClick={startEdit} className="press-scale p-2">
              <Edit3 size={18} />
            </button>
            <button onClick={handleDelete} className="press-scale p-2 text-red-400">
              <Trash2 size={18} />
            </button>
          </>
        )}
      </PageHeader>

      <div className="px-4 space-y-4 slide-in">
        <div className="flex flex-col items-center text-center">
          <Avatar name={trainer.name} src={trainer.avatar} size={72} />
          <h2 className="text-xl font-bold mt-3">{trainer.name}</h2>
          <p className={`text-sm ${dark ? 'text-white/40' : 'text-gray-500'}`}>{trainer.clubName}</p>
        </div>

        {trainer.phone && (
          <GlassCard className="flex items-center gap-3">
            <Phone size={16} className="text-accent" />
            <span className="text-sm">{trainer.phone}</span>
          </GlassCard>
        )}
        {trainer.sportType && (
          <GlassCard className="flex items-center gap-3">
            <Dumbbell size={16} className="text-accent" />
            <span className="text-sm">{getSportLabel(trainer.sportType)}</span>
          </GlassCard>
        )}
        {trainer.city && (
          <GlassCard className="flex items-center gap-3">
            <MapPin size={16} className="text-accent" />
            <span className="text-sm">{trainer.city}</span>
          </GlassCard>
        )}
        <GlassCard className="flex items-center gap-3">
          <Users size={16} className="text-accent" />
          <span className="text-sm">{students.length} учеников, {groups.length} групп</span>
        </GlassCard>
        {auth.role === 'superadmin' && trainer.plainPassword && (
          <GlassCard className="flex items-center gap-3">
            <Key size={16} className="text-yellow-400" />
            <span className={`text-sm ${dark ? 'text-white/50' : 'text-gray-500'}`}>Пароль: <span className="font-mono font-bold">{trainer.plainPassword}</span></span>
          </GlassCard>
        )}

        {groups.length > 0 && (
          <div>
            <h3 className={`text-sm uppercase font-bold mb-2 ${dark ? 'text-white/50' : 'text-gray-500'}`}>Группы</h3>
            {groups.map(g => (
              <GlassCard key={g.id} className="mb-2">
                <div className="font-semibold text-sm">{g.name}</div>
                <div className={`text-xs ${dark ? 'text-white/30' : 'text-gray-500'}`}>{g.schedule}</div>
              </GlassCard>
            ))}
          </div>
        )}

        {students.length > 0 && (
          <div>
            <h3 className={`text-sm uppercase font-bold mb-2 ${dark ? 'text-white/50' : 'text-gray-500'}`}>Спортсмены</h3>
            {students.map(s => (
              <GlassCard
                key={s.id}
                onClick={() => navigate(`/student/${s.id}`)}
                className="mb-2"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={s.name} src={s.avatar} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm truncate">{s.name}</div>
                    <div className={`text-xs ${dark ? 'text-white/30' : 'text-gray-500'}`}>{s.belt || '—'}</div>
                  </div>
                </div>
                {auth.role === 'superadmin' && (
                  <div className={`mt-1.5 pt-1.5 text-[10px] flex items-center gap-2 ${dark ? 'border-t border-white/[0.06] text-white/25' : 'border-t border-black/[0.05] text-gray-500'}`}>
                    <span>Тел: {s.phone}</span>
                    <span>•</span>
                    <span>Пароль: {s.plainPassword || '—'}</span>
                  </div>
                )}
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      <Modal open={editing} onClose={() => setEditing(false)} title="Редактировать">
        {form && (
          <form onSubmit={saveEdit} className="space-y-3">
            <input type="text" placeholder="ФИО" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} />
            <input type="text" placeholder="Клуб" value={form.clubName} onChange={e => setForm(f => ({ ...f, clubName: e.target.value }))} className={inputCls} />
            <div className="relative">
              <input type="text" placeholder="Город" value={form.city || ''} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className={inputCls} list="city-edit-list" />
              <datalist id="city-edit-list">
                {[...new Set(data.users.filter(u => u.city).map(u => u.city))].map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            <select value={form.sportType || ''} onChange={e => setForm(f => ({ ...f, sportType: e.target.value }))} className={inputCls}>
              <option value="">— Вид спорта —</option>
              {SPORT_TYPES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <PhoneInput value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} className={inputCls} />
            <input type="text" placeholder="Новый пароль (оставьте пустым)" value={form.newPassword || ''} onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))} className={inputCls} />
            <button type="submit" className="w-full py-3.5 rounded-[16px] bg-accent text-white font-bold press-scale">Сохранить</button>
          </form>
        )}
      </Modal>
    </Layout>
  )
}
