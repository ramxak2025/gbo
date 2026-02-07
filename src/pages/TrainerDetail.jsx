import { useParams, useNavigate } from 'react-router-dom'
import { Phone, Mail, Users, Trash2, Edit3 } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
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
  const { data, updateTrainer, deleteTrainer } = useData()
  const { dark } = useTheme()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(null)

  const trainer = data.users.find(u => u.id === id)
  if (!trainer) {
    return (
      <Layout>
        <PageHeader title="Тренер" back />
        <div className="px-4 py-12 text-center">
          <p className={dark ? 'text-white/40' : 'text-gray-400'}>Тренер не найден</p>
        </div>
      </Layout>
    )
  }

  const students = data.students.filter(s => s.trainerId === id)
  const groups = data.groups.filter(g => g.trainerId === id)

  const startEdit = () => {
    setForm({ ...trainer })
    setEditing(true)
  }

  const saveEdit = (e) => {
    e.preventDefault()
    updateTrainer(id, {
      name: form.name,
      email: form.email,
      phone: form.phone,
      clubName: form.clubName,
    })
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
      ? 'bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-accent'
      : 'bg-black/[0.03] border border-black/[0.08] text-gray-900 placeholder-gray-400 focus:border-accent'
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
          <p className={`text-sm ${dark ? 'text-white/40' : 'text-gray-400'}`}>{trainer.clubName}</p>
        </div>

        {trainer.phone && (
          <GlassCard className="flex items-center gap-3">
            <Phone size={16} className="text-accent" />
            <span className="text-sm">{trainer.phone}</span>
          </GlassCard>
        )}
        {trainer.email && (
          <GlassCard className="flex items-center gap-3">
            <Mail size={16} className="text-accent" />
            <span className="text-sm">{trainer.email}</span>
          </GlassCard>
        )}

        <GlassCard className="flex items-center gap-3">
          <Users size={16} className="text-accent" />
          <span className="text-sm">{students.length} учеников, {groups.length} групп</span>
        </GlassCard>

        {groups.length > 0 && (
          <div>
            <h3 className={`text-sm uppercase font-bold mb-2 ${dark ? 'text-white/50' : 'text-gray-500'}`}>Группы</h3>
            {groups.map(g => (
              <GlassCard key={g.id} className="mb-2">
                <div className="font-semibold text-sm">{g.name}</div>
                <div className={`text-xs ${dark ? 'text-white/30' : 'text-gray-400'}`}>{g.schedule}</div>
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
                className="flex items-center gap-3 mb-2"
              >
                <Avatar name={s.name} src={s.avatar} size={36} />
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">{s.name}</div>
                  <div className={`text-xs ${dark ? 'text-white/30' : 'text-gray-400'}`}>{s.belt || '—'}</div>
                </div>
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
            <input type="email" placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputCls} />
            <input type="tel" placeholder="Телефон" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inputCls} />
            <button type="submit" className="w-full py-3.5 rounded-[16px] bg-accent text-white font-bold press-scale">Сохранить</button>
          </form>
        )}
      </Modal>
    </Layout>
  )
}
